/* ==========================================================
   PH LOADER — mengisi halaman Ketua / Sekretaris / Bendahara
   dari Supabase (ph_profile, ph_members, struktur_covers).

   Selama data di database belum ada, SEMUA teks diisi
   "Belum ada data" dan semua gambar memakai placeholder
   "Belum ada gambar". Tidak ada lagi konten statis di HTML.

   Cara pakai di halaman PH:
     <body data-ph-group="bendahara">   -> 'ketua' | 'sekretaris' | 'bendahara'

   Elemen yang diisi otomatis (semua opsional):
     #ph-hero-photo      <img> cover hero
     #ph-hero-title      <h1>
     #ph-hero-subtitle   <p>
     #ph-tugas-judul     <h2> judul blok rincian tugas
     #ph-tugas-umum      <p>  paragraf tugas umum
     .ph-tugas-list      <ul>/<ol> daftar tugas (boleh lebih dari satu)
     #ph-members         container kartu pengurus
   ========================================================== */
(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    const TEKS_KOSONG = 'Belum ada data';

    /* Placeholder gambar (SVG inline, tidak perlu file di server) */
    function placeholderImg(w, h, teks) {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
                '<rect width="100%" height="100%" fill="#e2e8f0"/>' +
                '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
                      'font-family="Segoe UI, Arial, sans-serif" font-size="' + Math.round(w / 22) + '" fill="#94a3b8">' +
                    teks +
                '</text>' +
            '</svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    const PH_PLACEHOLDER_HERO  = placeholderImg(1200, 600, 'Belum ada gambar');
    const PH_PLACEHOLDER_FOTO  = placeholderImg(600, 800, 'Belum ada gambar');

    const group = document.body.dataset.phGroup;
    if (!group) return;

    if (!window.supabase) {
        console.error('Supabase SDK belum termuat di halaman PH.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    /* Isi teks; kalau kosong tampilkan "Belum ada data" dengan gaya redup */
    function setText(el, value) {
        if (!el) return;
        const isi = (value || '').toString().trim();
        if (isi) {
            el.textContent = isi;
            el.classList.remove('ph-empty');
        } else {
            el.textContent = TEKS_KOSONG;
            el.classList.add('ph-empty');
        }
    }

    function setImage(el, url, fallback) {
        if (!el) return;
        if (url) {
            el.src = url;
            el.classList.remove('ph-empty-img');
        } else {
            el.src = fallback;
            el.classList.add('ph-empty-img');
        }
    }

    /* --- Observer untuk animasi elemen yang dimuat belakangan --- */
    const revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    function reveal(el, directionClass, delay) {
        el.classList.add(directionClass);
        el.style.setProperty('--reveal-delay', (delay || 0) + 's');
        revealObserver.observe(el);
    }

    function bindLightbox(img) {
        if (img.classList.contains('ph-empty-img')) return;  // placeholder tidak perlu dibuka
        img.classList.add('lb-clickable');
        img.addEventListener('click', function () {
            if (typeof window.openLightbox === 'function') {
                window.openLightbox(img.src, img.alt);
            }
        });
    }

    /* ============ 1. COVER HERO (tabel struktur_covers) ============ */
    async function loadCover() {
        const heroImg = document.getElementById('ph-hero-photo');
        if (!heroImg) return;

        const { data, error } = await client
            .from('struktur_covers')
            .select('image_url')
            .eq('slug', 'ph-' + group)
            .maybeSingle();

        if (error) console.error(error);
        setImage(heroImg, (!error && data) ? data.image_url : null, PH_PLACEHOLDER_HERO);
    }

    /* ============ 2. PROFIL GRUP (hero teks + tugas) ============ */
    async function loadProfile() {
        const titleEl  = document.getElementById('ph-hero-title');
        const subEl    = document.getElementById('ph-hero-subtitle');
        const judulEl  = document.getElementById('ph-tugas-judul');
        const tugasEl  = document.getElementById('ph-tugas-umum');
        const listEls  = document.querySelectorAll('.ph-tugas-list');

        const { data, error } = await client
            .from('ph_profile')
            .select('*')
            .eq('group_slug', group)
            .maybeSingle();

        if (error) console.error(error);

        const profil = (!error && data) ? data : {};

        setText(titleEl, profil.hero_title);
        setText(subEl,   profil.hero_subtitle);
        setText(judulEl, profil.hero_title);
        setText(tugasEl, profil.tugas_umum);

        const list = Array.isArray(profil.tugas_list) ? profil.tugas_list : [];
        listEls.forEach(function (ul) {
            if (list.length > 0) {
                ul.innerHTML = list.map(function (t) {
                    return '<li>' + escapeHtml(t) + '</li>';
                }).join('');
            } else {
                ul.innerHTML = '<li class="ph-empty">' + TEKS_KOSONG + '</li>';
            }
        });
    }

    /* ============ 3. ANGGOTA PH ============ */
    async function loadMembers() {
        const wrap = document.getElementById('ph-members');
        if (!wrap) return;

        const { data, error } = await client
            .from('ph_members')
            .select('*')
            .eq('group_slug', group)
            .order('sort_order', { ascending: true });

        if (error) console.error(error);

        const items = (!error && data) ? data : [];
        wrap.innerHTML = '';

        /* Database masih kosong -> tampilkan satu kartu "Belum ada data" */
        if (items.length === 0) {
            const kosong = document.createElement('section');
            kosong.className = 'pengurus-section';
            kosong.innerHTML =
                '<div class="koordinator-deco-dots"></div>' +
                '<div class="pengurus-grid">' +
                    '<div class="pengurus-photo-wrap">' +
                        '<img class="ph-empty-img" src="' + PH_PLACEHOLDER_FOTO + '" alt="Belum ada gambar">' +
                    '</div>' +
                    '<div class="pengurus-info">' +
                        '<p class="pengurus-label ph-empty">' + TEKS_KOSONG + '</p>' +
                        '<h2 class="pengurus-name ph-empty">' + TEKS_KOSONG + '</h2>' +
                        '<p class="pengurus-kelas ph-empty">' + TEKS_KOSONG + '</p>' +
                    '</div>' +
                '</div>';
            wrap.appendChild(kosong);
            return;
        }

        items.forEach(function (m, index) {
            const isAlt = index % 2 === 1;   // selang-seling: latar & posisi foto

            const section = document.createElement('section');
            section.className = 'pengurus-section' + (isAlt ? ' is-alt' : '');

            const deco = isAlt
                ? '<div class="koordinator-deco-stripes"></div>'
                : '<div class="koordinator-deco-dots"></div>';

            const punyaFoto = !!m.foto_url;
            const fotoSrc   = punyaFoto ? m.foto_url : PH_PLACEHOLDER_FOTO;

            const nama  = (m.nama  || '').trim();
            const label = (m.label || '').trim();
            const kelas = (m.kelas || '').trim();
            const motto = (m.motto || '').trim();

            section.innerHTML =
                deco +
                '<div class="pengurus-grid' + (isAlt ? ' reverse' : '') + '">' +
                    '<div class="pengurus-photo-wrap">' +
                        '<img class="' + (punyaFoto ? '' : 'ph-empty-img') + '" src="' + fotoSrc + '" ' +
                             'alt="' + escapeHtml(nama || 'Belum ada gambar') + '">' +
                    '</div>' +
                    '<div class="pengurus-info">' +
                        '<p class="pengurus-label' + (label ? '' : ' ph-empty') + '">' +
                            escapeHtml(label || TEKS_KOSONG) + '</p>' +
                        '<h2 class="pengurus-name' + (nama ? '' : ' ph-empty') + '">' +
                            escapeHtml(nama || TEKS_KOSONG) + '</h2>' +
                        '<p class="pengurus-kelas' + (kelas ? '' : ' ph-empty') + '">' +
                            (kelas ? 'Kelas: ' + escapeHtml(kelas) : TEKS_KOSONG) + '</p>' +
                        (motto
                            ? '<div class="motto-card" style="margin-top:18px;">“' + escapeHtml(motto) + '”</div>'
                            : '') +
                    '</div>' +
                '</div>';

            wrap.appendChild(section);

            const img = section.querySelector('.pengurus-photo-wrap img');
            reveal(img, 'reveal-right', 0);
            bindLightbox(img);

            section.querySelectorAll('.pengurus-label, .pengurus-name, .pengurus-kelas, .motto-card')
                .forEach(function (el, i) {
                    reveal(el, 'reveal-up', 0.15 + i * 0.08);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadCover();
        loadProfile();
        loadMembers();
    });
})();