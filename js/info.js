/* =========================================
   HALAMAN INFO - Ambil berita dari Supabase
   ========================================= */

(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    if (!window.supabase) {
        console.error('Supabase SDK belum termuat.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const gridEl = document.getElementById('news-grid');
    const filterEl = document.getElementById('news-filter');

    const modal = document.getElementById('news-modal');
    const modalBackdrop = document.getElementById('news-modal-backdrop');
    const modalClose = document.getElementById('news-modal-close');
    const modalCoverWrap = document.getElementById('news-modal-cover-wrap');
    const modalCoverBg = document.getElementById('news-modal-cover-bg');
    const modalCover = document.getElementById('news-modal-cover');
    const modalCategory = document.getElementById('news-modal-category');
    const modalDate = document.getElementById('news-modal-date');
    const modalTitle = document.getElementById('news-modal-title');
    const modalContent = document.getElementById('news-modal-content');
    const modalGallery = document.getElementById('news-modal-gallery');

    let allNews = [];
    let activeCategory = 'Semua';

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

    /* ===================== SKELETON LOADING ===================== */
    function renderSkeleton() {
        let html = '';
        for (let i = 0; i < 4; i++) {
            html +=
                '<div class="news-card skeleton-card">' +
                    '<div class="skeleton-line skeleton-badge"></div>' +
                    '<div class="skeleton-line skeleton-title"></div>' +
                    '<div class="skeleton-line skeleton-title short"></div>' +
                    '<div class="skeleton-line skeleton-text"></div>' +
                    '<div class="skeleton-line skeleton-text"></div>' +
                '</div>';
        }
        gridEl.innerHTML = html;
    }

    /* ===================== FILTER KATEGORI ===================== */
    function renderFilter() {
        const categories = ['Semua'].concat(
            Array.from(new Set(allNews.map(function (n) { return n.category; })))
        );

        filterEl.innerHTML = categories.map(function (cat) {
            const active = cat === activeCategory ? ' active' : '';
            return '<button type="button" class="filter-chip' + active + '" data-cat="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        }).join('');

        filterEl.querySelectorAll('.filter-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                activeCategory = btn.dataset.cat;
                renderFilter();
                renderNews();
            });
        });
    }

    /* ===================== RENDER KARTU BERITA ===================== */
    function renderNews() {
        const items = activeCategory === 'Semua'
            ? allNews
            : allNews.filter(function (n) { return n.category === activeCategory; });

        if (items.length === 0) {
            gridEl.innerHTML = '<p class="admin-empty">Belum ada berita untuk kategori ini.</p>';
            return;
        }

        gridEl.innerHTML = items.map(function (n, index) {
            const isLatest = index === 0 && activeCategory === 'Semua';
            const latestTag = isLatest ? '<span class="latest-tag">Terbaru</span>' : '';
            const cardClass = isLatest ? 'news-card news-card-latest' : 'news-card';
            const cover = n.cover_image_url
                ? '<div class="news-card-cover-wrap">' +
                    '<img src="' + n.cover_image_url + '" class="news-card-cover-bg" alt="">' +
                    '<img src="' + n.cover_image_url + '" class="news-card-cover" alt="' + escapeHtml(n.title) + '">' +
                  '</div>'
                : '';

            return (
                '<div class="' + cardClass + '" data-id="' + n.id + '">' +
                    cover +
                    latestTag +
                    '<div class="news-meta">' +
                        '<span class="news-category" data-cat="' + escapeHtml(n.category) + '">' + escapeHtml(n.category) + '</span>' +
                        '<span>' + formatTanggal(n.created_at) + '</span>' +
                    '</div>' +
                    '<h3>' + escapeHtml(n.title) + '</h3>' +
                    '<p>' + escapeHtml(potongTeks(n.content, 130)) + '</p>' +
                    '<button type="button" class="read-more">Baca Selengkapnya →</button>' +
                '</div>'
            );
        }).join('');

        gridEl.querySelectorAll('.news-card').forEach(function (card) {
            const btn = card.querySelector('.read-more');
            if (btn) {
                btn.addEventListener('click', function () {
                    openModal(card.dataset.id);
                });
            }
        });
    }

    /* ===================== MODAL ===================== */
    function openModal(id) {
        const n = allNews.find(function (item) { return String(item.id) === String(id); });
        if (!n) return;

        if (n.cover_image_url) {
            modalCoverBg.src = n.cover_image_url;
            modalCover.src = n.cover_image_url;
            modalCoverWrap.classList.remove('hidden');
        } else {
            modalCoverWrap.classList.add('hidden');
            modalCoverBg.removeAttribute('src');
            modalCover.removeAttribute('src');
        }

        modalCategory.textContent = n.category;
        modalCategory.dataset.cat = n.category;
        modalDate.textContent = formatTanggal(n.created_at);
        modalTitle.textContent = n.title;
        modalContent.textContent = n.content;

        const images = n.content_images || [];
        if (images.length > 0) {
            modalGallery.innerHTML = images.map(function (url) {
                return '<div class="news-modal-gallery-item">' +
                            '<img src="' + url + '" alt="" class="news-modal-gallery-bg">' +
                            '<img src="' + url + '" alt="Gambar berita" class="news-modal-gallery-img">' +
                       '</div>';
            }).join('');
            modalGallery.classList.remove('hidden');
        } else {
            modalGallery.innerHTML = '';
            modalGallery.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    modalBackdrop.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    /* ===================== LOAD DATA ===================== */
    async function loadNews() {
        renderSkeleton();

        const { data, error } = await client
            .from('news')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (error) {
            gridEl.innerHTML = '<p class="admin-empty">Gagal memuat berita.</p>';
            console.error(error);
            return;
        }

        allNews = data || [];
        renderFilter();
        renderNews();
    }

    /* ===================== LIGHTBOX FULLSCREEN ===================== */
    function openImageLightbox(src) {
        const lightbox = document.createElement('div');
        lightbox.className = 'img-lightbox';
        lightbox.innerHTML =
            '<button class="img-lightbox-close" aria-label="Tutup">✕</button>' +
            '<img src="' + src + '" alt="Gambar penuh">';
        document.body.appendChild(lightbox);

        const close = () => lightbox.remove();
        lightbox.addEventListener('click', close);
        lightbox.querySelector('img').addEventListener('click', function (e) { e.stopPropagation(); });
        lightbox.querySelector('.img-lightbox-close').addEventListener('click', close);
    }

    document.addEventListener('click', function (e) {
        if (e.target.matches('.news-card-cover, .news-modal-cover, .news-modal-gallery-img')) {
            openImageLightbox(e.target.src);
        }
    });

    loadNews();
})();