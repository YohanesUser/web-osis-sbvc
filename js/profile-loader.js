// ==========================================
// PROFIL SEKBID — Tugas Umum, Cover, Koordinator, Anggota, Syarat Bergabung
// Ambil data dari Supabase, isi ke halaman detail sekbid.
// Taruh file ini di /js/profile-loader.js dan panggil dengan:
//   <script src="/js/profile-loader.js" defer></script>
// Halaman butuh atribut data-sekbid-profile="<id_sekbid>" di elemen
// pembungkus (disarankan di <body>), dan beberapa id berikut (opsional,
// dicek satu-satu — kalau elemen tidak ada, bagian itu dilewati):
//   #bidang-hero-photo     -> <img> foto sampul/hero
//   #tugas-umum-text       -> <p> teks tugas umum
//   #koordinator-foto      -> <img> foto koordinator
//   #koordinator-nama      -> <h2>/elemen nama koordinator
//   #koordinator-kelas     -> elemen kelas koordinator
//   #syarat-list           -> <ol>/<ul> daftar syarat bergabung
//   #anggota-tim-grid      -> wadah kartu anggota
//   #anggota-tim-count     -> teks "Terdiri dari 1 Koordinator dan N Anggota"
// ==========================================
(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', async function () {
        const root = document.querySelector('[data-sekbid-profile]');
        if (!root || !window.supabase) return;

        const sekbidId = root.dataset.sekbidProfile;
        if (!sekbidId) return;

        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // --- 1. Foto sampul/hero (dari tabel struktur_covers, slug: sekbid-<id>) ---
        try {
            const { data: cover } = await client
                .from('struktur_covers')
                .select('image_url')
                .eq('slug', 'sekbid-' + sekbidId)
                .maybeSingle();

            const heroImg = document.getElementById('bidang-hero-photo');
            if (heroImg && cover && cover.image_url) {
                heroImg.src = cover.image_url;
            }
        } catch (err) {
            console.error('Gagal memuat cover sekbid:', err);
        }

        // --- 2. Profil: tugas umum, koordinator, syarat bergabung ---
        try {
            const { data: profil, error } = await client
                .from('sekbid_profile')
                .select('*')
                .eq('sekbid_id', sekbidId)
                .maybeSingle();

            if (error) throw error;

            if (profil) {
                const tugasEl = document.getElementById('tugas-umum-text');
                if (tugasEl && profil.tugas_umum) {
                    tugasEl.textContent = profil.tugas_umum;
                }

                const koorFotoEl = document.getElementById('koordinator-foto');
                if (koorFotoEl && profil.koordinator_foto_url) {
                    koorFotoEl.src = profil.koordinator_foto_url;
                }

                const koorNamaEl = document.getElementById('koordinator-nama');
                if (koorNamaEl && profil.koordinator_nama) {
                    koorNamaEl.textContent = profil.koordinator_nama;
                }

                const koorKelasEl = document.getElementById('koordinator-kelas');
                if (koorKelasEl && profil.koordinator_kelas) {
                    koorKelasEl.textContent = 'Kelas: ' + profil.koordinator_kelas;
                }

                const syaratList = document.getElementById('syarat-list');
                if (syaratList && Array.isArray(profil.syarat_bergabung) && profil.syarat_bergabung.length > 0) {
                    syaratList.innerHTML = profil.syarat_bergabung
                        .map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; })
                        .join('');
                }
            }
        } catch (err) {
            console.error('Gagal memuat profil sekbid:', err);
        }

        // --- 3. Anggota tim ---
        try {
            const { data: anggota, error } = await client
                .from('sekbid_anggota')
                .select('*')
                .eq('sekbid_id', sekbidId)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            const grid = document.getElementById('anggota-tim-grid');
            if (grid && anggota && anggota.length > 0) {
                grid.innerHTML = anggota.map(function (a) {
                    return (
                        '<div class="anggota-tim-card">' +
                            '<img src="' + escapeHtml(a.foto_url || '') + '" alt="Foto ' + escapeHtml(a.nama) + '">' +
                            '<h3>' + escapeHtml(a.nama) + '</h3>' +
                            '<span class="anggota-tim-kelas">Kelas: ' + escapeHtml(a.kelas || '-') + '</span>' +
                            '<span class="anggota-tim-role">' + escapeHtml(a.role || 'Anggota') + '</span>' +
                        '</div>'
                    );
                }).join('');

                // Kartu baru ini tidak otomatis dapat animasi reveal & lightbox
                // dari sekbid.js (karena dibuat setelah sekbid.js jalan duluan).
                // Pasang ulang lightbox manual di sini kalau helper-nya tersedia.
                if (typeof window.openLightbox === 'function') {
                    grid.querySelectorAll('img').forEach(function (img) {
                        img.classList.add('lb-clickable');
                        img.addEventListener('click', function () {
                            window.openLightbox(img.src, img.alt);
                        });
                    });
                }
            }

            const countEl = document.getElementById('anggota-tim-count');
            if (countEl && anggota) {
                countEl.textContent = 'Terdiri dari 1 Koordinator dan ' + anggota.length + ' Anggota';
            }
        } catch (err) {
            console.error('Gagal memuat anggota tim sekbid:', err);
        }
    });
})();