// ==========================================
// ⚙️ LOGIKA MESIN PENCARI JAWABAN (AI LOKAL + SUPABASE)
// ==========================================

// Inisialisasi Supabase
const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

if (!window.supabase) {
    console.error('Supabase SDK belum termuat di halaman Chatbot.');
}

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let databaseOSIS = { topics: [], smalltalk: [] };

// Konteks percakapan: bot "inget" topik terakhir yang dibahas
let topikTerakhir = null;

// ==========================================
// 🔄 PENGGABUNGAN DATA (JSON LOKAL + SUPABASE)
// ==========================================
async function muatDatabase() {
    try {
        // 1. Ambil data dari file lokal JSON
        const localResponse = await fetch('js/database/database.json');
        const localData = await localResponse.json();

        if (localData.topics) databaseOSIS.topics.push(...localData.topics);
        if (localData.smalltalk) databaseOSIS.smalltalk.push(...localData.smalltalk);

        // 2. Ambil data dari Supabase (jika SDK tersedia)
        if (supabaseClient) {
            const { data: supaData, error } = await supabaseClient
                .from('chatbot_intents')
                .select('*');

            if (!error && supaData) {
                // Karena struktur tabel Supabase sama (punya keywords & fields), 
                // kita bisa langsung gabungkan ke array topics!
                databaseOSIS.topics.push(...supaData);
            } else if (error) {
                console.error("Gagal memuat data dari Supabase:", error);
            }
        }

        console.log("Database AI siap! Total Topik:", databaseOSIS.topics.length);
    } catch (error) {
        console.error("Terjadi kesalahan saat memuat database:", error);
    }
}

// Jalankan fungsi muat database saat file diload
muatDatabase();

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const typingIndicator = document.getElementById('typing-indicator-container');

// ------------------------------------------
// Util: bersihkan teks
// ------------------------------------------
function bersihkanTeks(teks) {
    return teks
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ------------------------------------------
// Util: jarak Levenshtein (toleransi typo ringan)
// ------------------------------------------
function jarakLevenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const biaya = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + biaya
            );
        }
    }
    return dp[m][n];
}

function kataMirip(kataUser, kataKunci) {
    if (kataUser === kataKunci) return true;
    if (kataUser.includes(kataKunci) || kataKunci.includes(kataUser)) return true;

    // Kata pendek (≤4 huruf) butuh kemiripan HAMPIR persis (jarak ≤1)
    const toleransi = kataKunci.length <= 4 ? 1 : kataKunci.length <= 8 ? 2 : 3;
    return jarakLevenshtein(kataUser, kataKunci) <= toleransi;
}

// Skor kecocokan (fuzzy) — dipakai untuk TOPIK
function skorKecocokan(teksUser, kataUserList, kataKunciMentah) {
    const kataKunci = bersihkanTeks(kataKunciMentah);
    if (!kataKunci) return 0;

    if (teksUser.includes(kataKunci)) {
        return kataKunci.length * 2;
    }

    const kataKunciList = kataKunci.split(' ').filter(Boolean);
    let kataCocok = 0;
    kataKunciList.forEach((kk) => {
        if (kataUserList.some((ku) => kataMirip(ku, kk))) kataCocok++;
    });

    return kataCocok === kataKunciList.length ? kataKunci.length : 0;
}

// Skor kecocokan KETAT (substring persis saja) untuk smalltalk
function skorSubstringKetat(teksUser, kataKunciMentah) {
    const kataKunci = bersihkanTeks(kataKunciMentah);
    if (!kataKunci) return 0;
    if (!teksUser.includes(kataKunci)) return 0;

    const polaKataUtuh = new RegExp(`(^|\\s)${kataKunci.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
    if (!polaKataUtuh.test(teksUser)) return 0;

    return kataKunci.length * 2;
}

// ------------------------------------------
// Kata kunci Field
// ------------------------------------------
const FIELD_KEYWORDS = {
    ketua: ['ketua', 'koordinator', 'pj', 'penanggung jawab', 'kepala'],
    anggota: ['anggota', 'member', 'siapa aja', 'siapa saja', 'personil'],
    syarat: ['syarat', 'ketentuan', 'requirement', 'kriteria'],
    proker: ['proker', 'program kerja', 'kegiatan', 'agenda', 'acara'],
    deskripsi: ['apa itu', 'tentang', 'penjelasan', 'deskripsi', 'maksudnya'],
};

function deteksiField(teksUser, kataUserList) {
    let fieldTerbaik = null;
    let skorTerbaik = 0;

    for (const field in FIELD_KEYWORDS) {
        FIELD_KEYWORDS[field].forEach((kk) => {
            const skor = skorKecocokan(teksUser, kataUserList, kk);
            if (skor > skorTerbaik) {
                skorTerbaik = skor;
                fieldTerbaik = field;
            }
        });
    }
    return fieldTerbaik;
}

// Cari topik
function cariTopik(teksUser, kataUserList) {
    let topikTerbaik = null;
    let skorTerbaik = 0;

    (databaseOSIS.topics || []).forEach((topic) => {
        (topic.keywords || []).forEach((kk) => {
            const skor = skorKecocokan(teksUser, kataUserList, kk);
            if (skor > skorTerbaik) {
                skorTerbaik = skor;
                topikTerbaik = topic;
            }
        });
    });

    return topikTerbaik;
}

// Cari small talk
function cariSmalltalk(teksUser) {
    let entriTerbaik = null;
    let skorTerbaik = 0;

    (databaseOSIS.smalltalk || []).forEach((entri) => {
        (entri.keywords || []).forEach((kk) => {
            const skor = skorSubstringKetat(teksUser, kk);
            if (skor > skorTerbaik) {
                skorTerbaik = skor;
                entriTerbaik = entri;
            }
        });
    });

    if (!entriTerbaik) return null;
    const responses = entriTerbaik.responses || [];
    if (responses.length === 0) return null;
    return responses[Math.floor(Math.random() * responses.length)];
}

const FALLBACK_RESPONSES = [
    "Hmm, aku belum nemu jawaban yang pas buat itu. 😅 Coba tanya soal sekbid tertentu (misal 'ketaqis'), ketua, anggota, syarat, atau program kerja ya.",
    "Wah, itu di luar yang aku tahu nih. Coba tanya seputar struktur OSIS, sekbid, atau open recruitment, aku bakal bantu semaksimal mungkin!",
    "Belum ada di data aku soal itu. 🙏 Kamu bisa tanya misalnya 'ketua ketaqis', 'anggota sekbid 2', atau 'syarat daftar OSIS'.",
];

function fallbackAcak() {
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

// ------------------------------------------
// Fungsi utama AI
// ------------------------------------------
function cariJawabanAI(pertanyaan) {
    const teksUser = bersihkanTeks(pertanyaan);
    const kataUserList = teksUser.split(' ').filter(Boolean);

    let topik = cariTopik(teksUser, kataUserList);
    const fieldDiminta = deteksiField(teksUser, kataUserList);

    if (!topik && fieldDiminta && topikTerakhir) {
        topik = topikTerakhir;
    }

    if (topik) {
        topikTerakhir = topik;
        const fields = topik.fields || {};

        if (fieldDiminta && fields[fieldDiminta]) {
            return fields[fieldDiminta];
        }
        if (fields.default) {
            return fields.default;
        }
        return fallbackAcak();
    }

    const smalltalkJawaban = cariSmalltalk(teksUser);
    if (smalltalkJawaban) return smalltalkJawaban;

    return fallbackAcak();
}

// Logika ketika tombol kirim ditekan
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;

    appendMessage('user', '👤', userText);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatMessages.appendChild(typingIndicator); 
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        const aiReplyText = cariJawabanAI(userText);
        
        typingIndicator.style.display = 'none';
        appendMessage('ai', '/assets/logo-osis.png', aiReplyText);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500); 
});

// Fungsi untuk merender HTML balon chat
function appendMessage(sender, icon, text) {
    const formattedText = text.replace(/\n/g, '<br>');
    const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(icon);
    const avatarContent = isImage
        ? `<img src="${icon}" alt="Avatar ${sender}">`
        : icon;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="avatar-chat">${avatarContent}</div>
        <div class="bubble">${formattedText}</div>
    `;
    chatMessages.appendChild(messageDiv);
}