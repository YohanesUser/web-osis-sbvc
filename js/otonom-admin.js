(function () {
    const client = window.__sbClient;
    const panel = document.getElementById('tab-otonom');
    if (!client || !panel) return;

    const $ = id => document.getElementById(id);
    const sel = $('ot-slug-select');
    const form = $('ot-form');
    const status = $('ot-status');
    const submitBtn = $('ot-submit-btn');
    const tugasWrap = $('ot-tugas-rows');
    const galeriWrap = $('ot-galeri-rows');

    let tugasRows = [];
    let galeriRows = [];

    const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');

    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function labeled(text, node) {
        const w = el('div');
        w.append(el('div', 'admin-field-label', text), node);
        return w;
    }
    function textInput(value, placeholder, onInput) {
        const i = el('input');
        i.type = 'text';
        i.value = value || '';
        i.placeholder = placeholder || '';
        i.style.width = '100%';
        i.addEventListener('input', e => onInput(e.target.value));
        return i;
    }
    function textArea(value, placeholder, onInput) {
        const t = el('textarea');
        t.value = value || '';
        t.placeholder = placeholder || '';
        t.style.width = '100%';
        t.rows = 3;
        t.addEventListener('input', e => onInput(e.target.value));
        return t;
    }
    function rowActions(list, i, rerender) {
        const bar = el('div', 'admin-comment-actions');
        const mk = (label, fn, cls) => {
            const b = el('button', cls || 'btn-secondary', label);
            b.type = 'button';
            b.addEventListener('click', fn);
            return b;
        };
        bar.append(
            mk('↑', () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; rerender(); } }),
            mk('↓', () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; rerender(); } }),
            mk('Hapus', () => { list.splice(i, 1); rerender(); }, 'btn-danger')
        );
        return bar;
    }

    /* ---------- Daftar tugas ---------- */
    function renderTugas() {
        tugasWrap.innerHTML = '';
        if (!tugasRows.length) tugasWrap.appendChild(el('p', 'admin-empty', 'Belum ada tugas.'));
        tugasRows.forEach((r, i) => {
            const card = el('div', 'admin-comment-card');
            card.append(
                labeled('Judul (opsional)', textInput(r.title, 'Contoh: Pembukuan Keuangan', v => r.title = v)),
                labeled('Deskripsi', textArea(r.text, 'Penjelasan tugas...', v => r.text = v)),
                rowActions(tugasRows, i, renderTugas)
            );
            tugasWrap.appendChild(card);
        });
    }

    /* ---------- Daftar foto galeri (link imgbb) ---------- */
    function renderGaleri() {
        galeriWrap.innerHTML = '';
        if (!galeriRows.length) galeriWrap.appendChild(el('p', 'admin-empty', 'Belum ada foto.'));
        galeriRows.forEach((r, i) => {
            const card = el('div', 'admin-comment-card');

            const thumb = el('img', 'admin-news-thumb');
            thumb.alt = 'Pratinjau';
            if (safeUrl(r.image_url)) thumb.src = r.image_url;

            const warn = el('p');
            warn.style.cssText = 'font-size:0.8rem;color:#b45309;margin:4px 0;';
            const updateThumb = () => {
                thumb.src = safeUrl(r.image_url);
                warn.textContent = (r.image_url && !/ibb\.co/i.test(r.image_url))
                    ? 'Link ini bukan dari imgbb. Pastikan link bisa dibuka.'
                    : '';
            };

            const urlInput = textInput(r.image_url, 'https://i.ibb.co.com/...', v => { r.image_url = v.trim(); updateThumb(); });
            updateThumb();

            card.append(
                thumb,
                labeled('Link foto (imgbb)', urlInput),
                warn,
                labeled('Caption', textInput(r.caption, 'Nama kegiatan', v => r.caption = v)),
                rowActions(galeriRows, i, renderGaleri)
            );
            galeriWrap.appendChild(card);
        });
    }

    $('ot-tugas-add').addEventListener('click', () => {
        tugasRows.push({ title: '', text: '' });
        renderTugas();
    });
    $('ot-galeri-add').addEventListener('click', () => {
        galeriRows.push({ image_url: '', caption: '' });
        renderGaleri();
    });

    /* ---------- Isi form ---------- */
    function fill(d) {
        $('ot-badge').value = d.badge || 'Organisasi Otonom';
        $('ot-hero-title').value = d.hero_title || '';
        $('ot-hero-sub').value = d.hero_subtitle || '';
        $('ot-pengertian').value = d.pengertian_text || '';
        $('ot-tugas-sub').value = d.tugas_subtitle || '';
        $('ot-galeri-sub').value = d.galeri_subtitle || '';

        tugasRows = (Array.isArray(d.tugas_list) ? d.tugas_list : [])
            .map(t => ({ title: t.title || '', text: t.text || '' }));
        galeriRows = (Array.isArray(d.galeri_list) ? d.galeri_list : [])
            .map(g => ({ image_url: g.image_url || '', caption: g.caption || '' }));

        renderTugas();
        renderGaleri();
    }

    /* ---------- Muat data sesuai halaman yang dipilih ---------- */
    async function loadSelected() {
        status.textContent = '';
        const slug = sel.value;
        if (!slug) { fill({}); return; }

        const { data, error } = await client
            .from('otonom_pages')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (error) {
            console.error('otonom load error:', error);
            status.style.color = '#dc2626';
            status.textContent = 'Gagal memuat: ' + error.message;
            return;
        }
        if (!data) {
            console.warn('otonom: baris untuk slug', slug, 'tidak ditemukan');
            status.style.color = '#b45309';
            status.textContent = 'Data untuk "' + slug + '" tidak ditemukan di database.';
            fill({});
            return;
        }
        fill(data);
    }

    sel.addEventListener('change', loadSelected);
    $('ot-refresh-btn').addEventListener('click', loadSelected);

    /* ---------- Simpan ---------- */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const slug = sel.value;
        if (!slug) {
            status.style.color = '#dc2626';
            status.textContent = 'Pilih halaman dulu.';
            return;
        }

        const payload = {
            slug: slug,
            badge: $('ot-badge').value.trim() || 'Organisasi Otonom',
            hero_title: $('ot-hero-title').value.trim(),
            hero_subtitle: $('ot-hero-sub').value.trim() || null,
            pengertian_text: $('ot-pengertian').value.trim() || null,
            tugas_subtitle: $('ot-tugas-sub').value.trim() || null,
            tugas_list: tugasRows
                .filter(r => r.title.trim() || r.text.trim())
                .map(r => ({ title: r.title.trim() || null, text: r.text.trim() })),
            galeri_subtitle: $('ot-galeri-sub').value.trim() || null,
            galeri_list: galeriRows
                .filter(r => safeUrl(r.image_url.trim()))
                .map(r => ({ image_url: r.image_url.trim(), caption: r.caption.trim() || null })),
            updated_at: new Date().toISOString()
        };

        submitBtn.disabled = true;
        status.style.color = '#16a34a';
        status.textContent = 'Menyimpan...';

        const { error } = await client.from('otonom_pages').upsert(payload);
        submitBtn.disabled = false;

        if (error) {
            console.error('otonom save error:', error);
            status.style.color = '#dc2626';
            status.textContent = 'Gagal menyimpan: ' + error.message;
            return;
        }
        status.style.color = '#16a34a';
        status.textContent = 'Tersimpan.';
    });

    /* ---------- Tampilkan / sembunyikan panel saat tab diklik ---------- */
    document.querySelectorAll('.admin-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const on = btn.dataset.tab === 'otonom';
            panel.classList.toggle('hidden', !on);
            if (on) loadSelected();
        });
    });
})();