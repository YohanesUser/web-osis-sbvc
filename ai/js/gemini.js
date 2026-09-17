// functions/api/gemini.js
//
// Cloudflare Pages Function — endpoint: /api/gemini
// Tugas file ini: menerima pertanyaan dari browser (chat.js),
// lalu meneruskannya ke Gemini API menggunakan API key yang
// disimpan sebagai Environment Variable di Cloudflare (BUKAN di kode).
//
// Cara set env variable:
// Cloudflare Dashboard -> Workers & Pages -> (pilih project kamu)
// -> Settings -> Environment variables -> Add variable
//   Name  : GEMINI_API_KEY
//   Value : (API key Gemini yang BARU, hasil generate ulang)
// Lakukan untuk kedua environment: Production dan Preview.
// Setelah menambah/mengubah env variable, redeploy project.

export async function onRequestPost(context) {
    const { request, env } = context;

    // Pastikan key tersedia di server (tidak pernah dikirim ke client)
    if (!env.GEMINI_API_KEY) {
        return jsonResponse({ error: 'GEMINI_API_KEY belum diset di Cloudflare Pages.' }, 500);
    }

    let body;
    try {
        body = await request.json();
    } catch (err) {
        return jsonResponse({ error: 'Body request harus JSON.' }, 400);
    }

    const pertanyaan = (body && typeof body.pertanyaan === 'string') ? body.pertanyaan.trim() : '';
    if (!pertanyaan) {
        return jsonResponse({ error: 'Field "pertanyaan" wajib diisi.' }, 400);
    }

    // Batas panjang sederhana, biar tidak disalahgunakan untuk spam token
    if (pertanyaan.length > 2000) {
        return jsonResponse({ error: 'Pertanyaan terlalu panjang.' }, 400);
    }

    const systemPrompt = `Kamu adalah OSIS-Bot, asisten AI resmi dari OSIS SMKN 1 Bantul.
Jawab pertanyaan siswa dengan ramah, informatif, dan membantu.
Gunakan bahasa yang santai namun tetap sopan khas anak sekolah/anak muda.
Jika ada pertanyaan seputar sekolah atau OSIS yang tidak kamu ketahui pastinya, berikan arahan agar siswa menghubungi pengurus OSIS via Instagram @osis.smkn1bantul.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    try {
        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: `${systemPrompt}\n\nPertanyaan Siswa: ${pertanyaan}` }
                        ]
                    }
                ]
            })
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('Gemini API error:', geminiRes.status, errText);
            return jsonResponse({ error: 'Gagal menghubungi Gemini API.' }, 502);
        }

        const data = await geminiRes.json();
        const teksJawaban = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!teksJawaban) {
            return jsonResponse({ error: 'Gemini tidak mengembalikan jawaban.' }, 502);
        }

        return jsonResponse({ jawaban: teksJawaban }, 200);
    } catch (err) {
        console.error('Error saat memanggil Gemini:', err);
        return jsonResponse({ error: 'Koneksi ke Gemini bermasalah.' }, 500);
    }
}

// Tolak method selain POST (opsional tapi rapi)
export async function onRequestGet() {
    return jsonResponse({ error: 'Gunakan method POST.' }, 405);
}

function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}