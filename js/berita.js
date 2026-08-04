/* =========================================
   BERANDA - Tampilkan 2 berita terbaru dari Supabase
   (Sumber data sama dengan halaman /info)
   ========================================= */

(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    if (!window.supabase) {
        console.error('Supabase SDK belum termuat.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const gridEl = document.getElementById('berita-grid');

    if (!gridEl) return;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function formatTanggal(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function potongTeks(str, maks) {
        if (!str) return '';
        if (str.length <= maks) return str;
        return str.slice(0, maks).trim() + '...';
    }

    async function loadBerandaNews() {
        const { data, error } = await client
            .from('news')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(2);

        if (error) {
            gridEl.innerHTML = '<p class="comment-empty">Gagal memuat berita.</p>';
            console.error(error);
            return;
        }

        renderBerandaNews(data);
    }

    function renderBerandaNews(items) {
        if (!items || items.length === 0) {
            gridEl.innerHTML = '<p class="comment-empty">Belum ada berita.</p>';
            return;
        }

        gridEl.innerHTML = items.map(function (n) {
            const cover = n.cover_image_url
                ? '<img src="' + n.cover_image_url + '" alt="' + escapeHtml(n.title) + '" class="berita-card-cover">'
                : '';

            return (
                '<div class="berita-card">' +
                    cover +
                    '<div class="berita-date">' + formatTanggal(n.created_at) + '</div>' +
                    '<h3>' + escapeHtml(n.title) + '</h3>' +
                    '<p>' + escapeHtml(potongTeks(n.content, 140)) + '</p>' +
                    '<a href="/info" class="berita-link">Baca Selengkapnya →</a>' +
                '</div>'
            );
        }).join('');
    }
    // ============ LIGHTBOX FULLSCREEN ============
    function openImageLightbox(src) {
    const lightbox = document.createElement('div');
    lightbox.className = 'img-lightbox';
    lightbox.innerHTML = `
        <button class="img-lightbox-close" aria-label="Tutup">✕</button>
        <img src="${src}" alt="Gambar penuh">
    `;
    document.body.appendChild(lightbox);

    const close = () => lightbox.remove();
    lightbox.addEventListener('click', close);
    lightbox.querySelector('img').addEventListener('click', (e) => e.stopPropagation());
    lightbox.querySelector('.img-lightbox-close').addEventListener('click', close);
    }

    // Delegasi klik untuk cover & galeri (works meski elemen dibuat dinamis)
    document.addEventListener('click', (e) => {
    if (e.target.matches('.news-modal-cover, .news-modal-gallery-img')) {
        openImageLightbox(e.target.src);
    }
    });

    loadBerandaNews();

    
})();