(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    const slug = document.body.dataset.otonom;
    const $ = id => document.getElementById(id);

    const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');
    const paragraphs = t => (t || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function buildNav(hasTugas, hasGaleri) {
        const nav = $('otonom-nav');
        const items = [['#pengertian', 'Pengertian']];
        if (hasTugas) items.push(['#tugas', 'Tugas']);
        if (hasGaleri) items.push(['#galeri', 'Galeri']);
        items.forEach(([href, label]) => {
            const a = el('a', '', label);
            a.href = href;
            nav.appendChild(a);
        });
    }

    function setupLightbox(fotos) {
        const lb = $('lightbox');
        let cur = 0;
        let lastFocus = null;
        let touchX = null;

        function show(i) {
            cur = (i + fotos.length) % fotos.length;
            const f = fotos[cur];
            $('lb-img').src = safeUrl(f.image_url);
            $('lb-img').alt = f.caption || '';
            $('lb-caption').textContent = f.caption || '';
            $('lb-counter').textContent = (cur + 1) + ' / ' + fotos.length;
        }
        function open(i) {
            lastFocus = document.activeElement;
            show(i);
            lb.classList.add('open');
            lb.setAttribute('aria-hidden', 'false');
            document.body.classList.add('lightbox-open');
            $('lb-close').focus();
        }
        function close() {
            lb.classList.remove('open');
            lb.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('lightbox-open');
            if (lastFocus) lastFocus.focus();
        }
        const prev = () => show(cur - 1);
        const next = () => show(cur + 1);

        $('lb-close').addEventListener('click', close);
        $('lb-prev').addEventListener('click', prev);
        $('lb-next').addEventListener('click', next);
        lb.addEventListener('click', e => {
            if (e.target === lb || e.target.classList.contains('lightbox-figure')) close();
        });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        });
        lb.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) dx > 0 ? prev() : next();
            touchX = null;
        });

        return open;
    }

    function render(d) {
        const title = d.hero_title || '';
        document.title = title + ' - OSIS SMKN 1 Bantul';

        $('hero-badge').textContent = d.badge || 'Organisasi Otonom';
        $('hero-title').textContent = title;
        $('hero-sub').textContent = d.hero_subtitle || '';

        // Pengertian
        $('pengertian-title').textContent = 'Apa itu ' + title + '?';
        const box = $('pengertian-box');
        paragraphs(d.pengertian_text).forEach(t => box.appendChild(el('p', '', t)));

        // Tugas
        const tugas = (Array.isArray(d.tugas_list) ? d.tugas_list : []).filter(t => t && (t.title || t.text));
        const hasTugas = tugas.length > 0;
        $('tugas').hidden = !hasTugas;
        if (hasTugas) {
            $('tugas-title').textContent = 'Tugas ' + title;
            $('tugas-sub').textContent = d.tugas_subtitle || '';
            const list = $('tugas-list');
            tugas.forEach((t, i) => {
                const card = el('div', 'tugas-card');
                card.appendChild(el('div', 'tugas-num', String(i + 1).padStart(2, '0')));
                const body = el('div', 'tugas-body');
                if (t.title) body.appendChild(el('h3', '', t.title));
                body.appendChild(el('p', '', t.text || ''));
                card.appendChild(body);
                list.appendChild(card);
            });
        }

        // Galeri
        const fotos = (Array.isArray(d.galeri_list) ? d.galeri_list : []).filter(f => safeUrl(f.image_url));
        const hasGaleri = fotos.length > 0;
        $('galeri').hidden = !hasGaleri;
        $('galeri-sub').textContent = d.galeri_subtitle || '';
        $('galeri-count').textContent = fotos.length;

        if (hasGaleri) {
            const open = setupLightbox(fotos);
            const grid = $('foto-grid');
            fotos.forEach((f, i) => {
                const cap = f.caption || '';
                const fig = el('figure', 'foto-item');
                const btn = el('button', 'foto-btn');
                btn.type = 'button';
                btn.setAttribute('aria-label', 'Perbesar foto: ' + (cap || 'Foto kegiatan'));
                const img = el('img');
                img.src = safeUrl(f.image_url);
                img.alt = cap || 'Foto kegiatan';
                img.loading = 'lazy';
                img.decoding = 'async';
                const zoom = el('span', 'foto-zoom-icon', '+');
                zoom.setAttribute('aria-hidden', 'true');
                btn.append(img, zoom);
                btn.addEventListener('click', () => open(i));
                fig.appendChild(btn);
                if (cap) fig.appendChild(el('figcaption', 'foto-caption', cap));
                grid.appendChild(fig);
            });
        }

        buildNav(hasTugas, hasGaleri);
    }

    async function init() {
        if (!slug) return;
        if (!window.supabase) {
            $('otonom-status').textContent = 'Gagal memuat konten.';
            return;
        }
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await client
            .from('otonom_pages')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (error || !data) {
            $('otonom-status').textContent = 'Konten belum tersedia.';
            return;
        }
        render(data);
    }

    init();
})();