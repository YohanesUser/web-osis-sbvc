(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    const container = document.getElementById('galeri-dokumentasi');
    if (!container || !window.supabase) return;

    const sekbidId = container.dataset.sekbid;
    if (!sekbidId) return;

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function buildLightbox() {
        if (document.getElementById('galeri-lightbox')) return;

        const lb = document.createElement('div');
        lb.id = 'galeri-lightbox';
        lb.className = 'galeri-lightbox';
        lb.innerHTML =
            '<button class="galeri-lightbox-close" aria-label="Tutup">&times;</button>' +
            '<button class="galeri-lightbox-prev" aria-label="Sebelumnya">&#10094;</button>' +
            '<div class="galeri-lightbox-content">' +
                '<img src="" alt="">' +
                '<p class="galeri-lightbox-caption"></p>' +
            '</div>' +
            '<button class="galeri-lightbox-next" aria-label="Berikutnya">&#10095;</button>';
        document.body.appendChild(lb);

        lb.querySelector('.galeri-lightbox-close').addEventListener('click', closeLightbox);
        lb.addEventListener('click', function (e) {
            if (e.target === lb) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showLightboxIndex(currentIndex + 1);
            if (e.key === 'ArrowLeft') showLightboxIndex(currentIndex - 1);
        });
        lb.querySelector('.galeri-lightbox-next').addEventListener('click', function () {
            showLightboxIndex(currentIndex + 1);
        });
        lb.querySelector('.galeri-lightbox-prev').addEventListener('click', function () {
            showLightboxIndex(currentIndex - 1);
        });
    }

    let galleryData = [];
    let currentIndex = 0;

    function showLightboxIndex(idx) {
        if (galleryData.length === 0) return;
        currentIndex = (idx + galleryData.length) % galleryData.length;
        const item = galleryData[currentIndex];
        const lb = document.getElementById('galeri-lightbox');
        const img = lb.querySelector('img');
        const cap = lb.querySelector('.galeri-lightbox-caption');
        img.src = item.image_url;
        img.alt = item.caption || 'Dokumentasi';
        cap.textContent = item.caption || '';
        cap.style.display = item.caption ? 'block' : 'none';
    }

    function openLightbox(idx) {
        buildLightbox();
        showLightboxIndex(idx);
        document.getElementById('galeri-lightbox').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        const lb = document.getElementById('galeri-lightbox');
        if (lb) lb.classList.remove('open');
        document.body.style.overflow = '';
    }

    client
        .from('sekbid_gallery')
        .select('image_url, caption')
        .eq('sekbid_id', sekbidId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .then(function (res) {
            const data = res.data;
            const error = res.error;

            if (error) {
                console.error('Gagal memuat galeri:', error);
                container.innerHTML = '';
                return;
            }

            if (!data || data.length === 0) {
    container.innerHTML = `
        <div class="galeri-kosong">
            <p>Foto belum diunggah oleh anggota sekbid.</p>
        </div>
    `;
    return;
}

            galleryData = data;

            container.innerHTML = data
                .map(function (row, idx) {
                    const captionHtml = row.caption
                        ? '<figcaption>' + escapeHtml(row.caption) + '</figcaption>'
                        : '';
                    return '<figure class="galeri-item" data-idx="' + idx + '">' +
                        '<div class="galeri-item-img-wrap">' +
                            '<img src="' + row.image_url + '" alt="' + (row.caption ? escapeHtml(row.caption) : 'Dokumentasi ' + sekbidId) + '" loading="lazy">' +
                            '<div class="galeri-item-overlay"><span>🔍 Lihat</span></div>' +
                        '</div>' +
                        captionHtml +
                        '</figure>';
                })
                .join('');

            container.querySelectorAll('.galeri-item').forEach(function (fig) {
                fig.addEventListener('click', function () {
                    openLightbox(parseInt(fig.dataset.idx, 10));
                });
            });
        });
})();