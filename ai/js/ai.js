// ==========================================
// ⚙️ LOGIKA MESIN PENCARI JAWABAN (AI LOKAL + SUPABASE + GEMINI)
// ==========================================

// ✅ Kalau halaman ini dipulihkan dari Back-Forward Cache, paksa reload penuh
// biar tidak ada state/listener lama yang nyangkut (sering bikin chatbot "ngaco").
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.warn('Halaman dipulihkan dari bfcache — reload penuh...');
        window.location.reload();
    }
});

// Inisialisasi Supabase
const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

// ⚠️ PENTING: memanggil Gemini langsung dari browser membuat API key ini terlihat
// oleh siapa pun yang membuka DevTools / View Source. Sebaiknya pindahkan
// pemanggilan Gemini ke backend (misalnya Supabase Edge Function) yang menyimpan
// key sebagai secret, agar key tidak pernah terekspos di sisi client.
const GEMINI_API_KEY = "AQ.Ab8RN6JoOqkmlBDJxEMG_1SAYW_DLDEXlNpRoD_dqpB8f4BHEw";

if (!window.supabase) {
    console.error('Supabase SDK belum termuat di halaman Chatbot.');
}

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let databaseOSIS = { topics: [], smalltalk: [] };
let topikTerakhir = null;

// ==========================================
// 🔄 PENGGABUNGAN DATA (JSON LOKAL + SUPABASE)
// ==========================================
async function muatDatabase() {
    try {
        const localResponse = await fetch('js/database/database.json');
        const localData = await localResponse.json();

        if (localData.topics) databaseOSIS.topics.push(...localData.topics);
        if (localData.smalltalk) databaseOSIS.smalltalk.push(...localData.smalltalk);

        if (supabaseClient) {
            const { data: supaData, error } = await supabaseClient
                .from('chatbot_intents')
                .select('*');

            if (!error && supaData) {
                databaseOSIS.topics.push(...supaData);
            } else if (error) {
                console.error('Gagal memuat data dari Supabase:', error);
            }
        }

        console.log('Database AI siap! Total Topik:', databaseOSIS.topics.length, '| Total Smalltalk:', databaseOSIS.smalltalk.length);
    } catch (error) {
        console.error('Terjadi kesalahan saat memuat database:', error);
    }
}

muatDatabase();

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const typingIndicator = document.getElementById('typing-indicator-container');
let statusBerpikirEl = document.getElementById('status-berpikir');
if (typingIndicator && !statusBerpikirEl) {
    statusBerpikirEl = document.createElement('div');
    statusBerpikirEl.id = 'status-berpikir';
    statusBerpikirEl.className = 'status-berpikir';
    statusBerpikirEl.style.fontSize = '0.8em';
    statusBerpikirEl.style.opacity = '0.7';
    statusBerpikirEl.style.marginTop = '4px';
    typingIndicator.querySelector('.avatar-chat')?.insertAdjacentElement('afterend', statusBerpikirEl);
}

// ==========================================
// ⏱️ TIMER "AI SEDANG BERPIKIR"
// ==========================================
let waktuMulaiBerpikir = 0;
let intervalTimerBerpikir = null;
let teksStatusSaatIni = '';

function perbaruiTampilanStatus() {
    if (!statusBerpikirEl) return;
    if (waktuMulaiBerpikir) {
        const detik = ((performance.now() - waktuMulaiBerpikir) / 1000).toFixed(1);
        statusBerpikirEl.textContent = teksStatusSaatIni
            ? `${teksStatusSaatIni} (${detik}d)`
            : `${detik}d`;
    } else {
        statusBerpikirEl.textContent = teksStatusSaatIni;
    }
}

function tampilkanStatusBerpikir(teks) {
    teksStatusSaatIni = teks;
    perbaruiTampilanStatus();
}

function mulaiTimerBerpikir() {
    waktuMulaiBerpikir = performance.now();
    if (intervalTimerBerpikir) clearInterval(intervalTimerBerpikir);
    intervalTimerBerpikir = setInterval(perbaruiTampilanStatus, 100);
}

function hentikanTimerBerpikir() {
    if (intervalTimerBerpikir) clearInterval(intervalTimerBerpikir);
    const total = waktuMulaiBerpikir
        ? ((performance.now() - waktuMulaiBerpikir) / 1000).toFixed(1)
        : '0.0';
    intervalTimerBerpikir = null;
    waktuMulaiBerpikir = 0;
    teksStatusSaatIni = '';
    return total;
}

function jeda(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function bersihkanTeks(teks) {
    return teks
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

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

// ✅ DIPERBAIKI: toleransi typo sedikit dilonggarkan untuk kata pendek-menengah,
// supaya keyword seperti "proker", "ketua", "anggota" tetap match walau typo 1-2 huruf.
function kataMirip(kataUser, kataKunci) {
    if (kataUser === kataKunci) return true;
    if (kataUser.includes(kataKunci) || kataKunci.includes(kataUser)) return true;

    const toleransi = kataKunci.length <= 3 ? 1 : kataKunci.length <= 7 ? 2 : 3;
    return jarakLevenshtein(kataUser, kataKunci) <= toleransi;
}

// ✅ DIPERBAIKI: match hasil typo-tolerance (lewat kataMirip) sekarang diberi
// skor penuh (x2), sama seperti match persis. Sebelumnya match typo cuma
// dapat skor x1, sehingga sering jatuh di bawah AMBANG_MINIMUM_TOPIK dan
// dianggap "tidak ketemu" walaupun kataMirip sebenarnya sudah berhasil.
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

    return kataCocok === kataKunciList.length ? kataKunci.length * 2 : 0;
}

function skorSubstringKetat(teksUser, kataKunciMentah) {
    const kataKunci = bersihkanTeks(kataKunciMentah);
    if (!kataKunci) return 0;
    if (!teksUser.includes(kataKunci)) return 0;

    const polaKataUtuh = new RegExp(`(^|\\s)${kataKunci.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
    if (!polaKataUtuh.test(teksUser)) return 0;

    return kataKunci.length * 2;
}

const FIELD_KEYWORDS = {
    ketua: ['ketua', 'koordinator', 'pj', 'penanggung jawab', 'kepala'],
    anggota: ['anggota', 'member', 'siapa aja', 'siapa saja', 'personil'],
    syarat: ['syarat', 'ketentuan', 'requirement', 'kriteria'],
    proker: ['proker', 'program kerja', 'kegiatan', 'agenda', 'acara'],
    deskripsi: ['apa itu', 'tentang', 'penjelasan', 'deskripsi', 'maksudnya'],
};

// 🚫 Kata-kata umum yang sering muncul di banyak keyword topik sekaligus.
// Kalau sebuah keyword topik isinya CUMA kata-kata ini, jangan dipakai untuk
// mencocokkan — supaya pertanyaan yang sekadar menyebut nama sekolah/OSIS
// tidak "nyasar" ke topik yang salah.
const KATA_GENERIK = new Set([
    'smk', 'smkn', '1', 'satu', 'bantul', 'osis', 'sekolah',
    'di', 'apa', 'yang', 'ada', 'itu', 'ini', 'kak', 'dong', 'nih'
]);

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

// Ambang minimum skor supaya topik dianggap valid — mencegah kecocokan
// "kebetulan" dari kata generik dianggap sebagai jawaban yang benar.
const AMBANG_MINIMUM_TOPIK = 10;

function cariTopik(teksUser, kataUserList) {
    let topikTerbaik = null;
    let skorTerbaik = 0;
    let keywordTerbaik = null;

    (databaseOSIS.topics || []).forEach((topic) => {
        (topic.keywords || []).forEach((kk) => {
            const kkBersih = bersihkanTeks(kk);
            const kataKk = kkBersih.split(' ').filter(Boolean);
            const semuaGenerik = kataKk.length > 0 && kataKk.every((k) => KATA_GENERIK.has(k));
            if (semuaGenerik) return; // lewati keyword yang cuma berisi kata umum

            const skor = skorKecocokan(teksUser, kataUserList, kk);
            if (skor > skorTerbaik) {
                skorTerbaik = skor;
                topikTerbaik = topic;
                keywordTerbaik = kk;
            }
        });
    });

    // 🔍 Debug: lihat topik & keyword apa yang ke-match (atau null kalau tidak ada)
    console.log(
        'DEBUG cariTopik ->', teksUser,
        '=>', topikTerbaik ? topikTerbaik.id : null,
        '| keyword:', keywordTerbaik,
        '(skor:', skorTerbaik, ')'
    );

    if (skorTerbaik < AMBANG_MINIMUM_TOPIK) return null;
    return topikTerbaik;
}

function cariSmalltalk(teksUser) {
    let entriTerbaik = null;
    let skorTerbaik = 0;
    let keywordCocok = null;

    (databaseOSIS.smalltalk || []).forEach((entri) => {
        (entri.keywords || []).forEach((kk) => {
            const skor = skorSubstringKetat(teksUser, kk);
            if (skor > skorTerbaik) {
                skorTerbaik = skor;
                entriTerbaik = entri;
                keywordCocok = kk;
            }
        });
    });

    // 🔍 Debug: lihat keyword smalltalk apa yang ke-match (atau null kalau tidak ada)
    console.log('DEBUG cariSmalltalk ->', teksUser, '=> keyword:', keywordCocok, '(skor:', skorTerbaik, ')');

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
// Panggil Gemini langsung dari client
// ------------------------------------------
async function tanyaGeminiAI(pertanyaanUser) {
    // Gunakan model generasi baru yang aktif di list kamu
    const NAMA_MODEL = 'gemini-3.5-flash'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${NAMA_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `Kamu adalah OSIS-Bot, asisten AI resmi dari OSIS SMKN 1 Bantul.
jika ada siswa bertanya seputar SMK N 1 bantul Jawab pertanyaan siswa dengan ramah, informatif, dan membantu.
Gunakan bahasa yang santai namun tetap sopan khas anak sekolah/anak muda. (tidak hanya seputar organisasi OSIS, tapi juga seputar sekolah, kegiatan, dan info umum yang relevan).
Jika ada pertanyaan seputar sekolah atau OSIS yang tidak kamu ketahui pastinya, berikan arahan agar siswa mengirim komentar di beranda. (jangan ada text yang pake huruf yang bold ya)`;

    try {
        tampilkanStatusBerpikir('🧠 Bertanya ke AI...');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { parts: [{ text: `${systemPrompt}\n\nPertanyaan Siswa: ${pertanyaanUser}` }] }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Gemini API error (status ${response.status}):`, errorData);

            if (response.status === 429) {
                return "Maaf, kuota pesan AI harian sedang penuh. Coba lagi nanti atau gunakan pertanyaan seputar menu yang tersedia ya!";
            }

            return `Maaf, AI sedang mengalami kendala (kode ${response.status}). Coba lagi beberapa saat ya!`;
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Maaf, AI sedang kesulitan memproses jawaban. Coba tanya lagi ya!";
        }
    } catch (error) {
        console.error('Error Gemini API:', error);
        return "Oops, koneksi ke AI sedang bermasalah. Silakan coba beberapa saat lagi.";
    }
}

async function cariJawabanAI(pertanyaan) {
    tampilkanStatusBerpikir('🤔 Membaca pertanyaanmu...');
    await jeda(400);

    const teksUser = bersihkanTeks(pertanyaan);
    const kataUserList = teksUser.split(' ').filter(Boolean);

    tampilkanStatusBerpikir('📚 Mengecek data OSIS...');
    await jeda(400);

    let topik = cariTopik(teksUser, kataUserList);
    const fieldDiminta = deteksiField(teksUser, kataUserList);

    if (!topik && fieldDiminta && topikTerakhir) {
        topik = topikTerakhir;
    }

    if (topik) {
        topikTerakhir = topik;
        const fields = topik.fields || {};

        tampilkanStatusBerpikir('✅ Menemukan info yang cocok...');
        await jeda(300);

        if (fieldDiminta && fields[fieldDiminta]) {
            return fields[fieldDiminta];
        }
        if (fields.default) {
            return fields.default;
        }
    }

    tampilkanStatusBerpikir('💬 Mengecek obrolan santai...');
    await jeda(300);

    const smalltalkJawaban = cariSmalltalk(teksUser);
    if (smalltalkJawaban) return smalltalkJawaban;

    return await tanyaGeminiAI(pertanyaan);
}

function appendMessage(sender, icon, text, waktuDetik) {
    const formattedText = text.replace(/\n/g, '<br>');
    const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(icon);
    const avatarContent = isImage
        ? `<img src="${icon}" alt="Avatar ${sender}">`
        : icon;

    const waktuHtml = waktuDetik
        ? `<div style="font-size:0.75em;opacity:0.6;margin-top:4px;">⏱️ ${waktuDetik} detik</div>`
        : '';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="avatar-chat">${avatarContent}</div>
        <div class="bubble">${formattedText}${waktuHtml}</div>
    `;
    chatMessages.appendChild(messageDiv);
}

chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;

    appendMessage('user', '👤', userText);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatMessages.appendChild(typingIndicator);
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    mulaiTimerBerpikir(); // ⏱️ mulai hitung waktu berpikir
    const aiReplyText = await cariJawabanAI(userText);
    const totalWaktu = hentikanTimerBerpikir(); // ⏱️ hentikan & ambil totalnya

    typingIndicator.style.display = 'none';
    appendMessage('ai', '/assets/logo-osis.png', aiReplyText, totalWaktu);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
