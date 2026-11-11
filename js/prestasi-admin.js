(function () {
    const client = window.__sbClient;
    if (!client) return;

    const BUCKET = 'prestasi-foto';
    const $ = function (id) { return document.getElementById(id); };

    const panel = $('tab-prestasi');
    const form = $('prestasi-form');
    const listEl = $('admin-prestasi-list');
    const statusEl = $('prestasi-form-status');
    const submitBtn = $('prestasi-submit-btn');
    const cancelBtn = $('prestasi-cancel-btn');
    const fotoInput = $('prestasi-foto-input');
    const fotoPreview = $('prestasi-foto-preview');

    // Mapping id input form -> kolom database
    const FIELDS = {
        'prestasi-judul': 'judul',
        'prestasi-kategori': 'kategori',
        'prestasi-nama': 'nama_siswa',
        'prestasi-kelas': 'kelas',
        'prestasi-tingkat': 'tingkat',
        'prestasi-tahun': 'tahun',
        'prestasi-juara': 'juara',
        'prestasi-deskripsi': 'deskripsi',
        'prestasi-sort': 'sort_order'
    };

    let editingId = null;
    let existingFotoUrl = null;
    let newFotoFile = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function setStatus(msg, ok) {
        statusEl.style.color = ok ? '#16a34a' : '#dc2626';
        statusEl.textContent = msg;
    }

    /* ---------- Upload ---------- */
    async function uploadFoto(file) {
        const ext = file.name.split('.').pop();
        const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
        const { error } = await client.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (error) throw error;
        return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    /* ---------- Preview foto cover ---------- */
    function renderFotoPreview() {
        fotoPreview.innerHTML = '';
        const url = newFotoFile ? URL.createObjectURL(newFotoFile) : existingFotoUrl;
        if (!url) return;

        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML = '<img src="' + esc(url) + '" alt="Pratinjau"><button type="button" class="image-preview-remove">✕</button>';
        item.querySelector('button').addEventListener('click', function () {
            newFotoFile = null;
            existingFotoUrl = null;
            fotoInput.value = '';
            renderFotoPreview();
        });
        fotoPreview.appendChild(item);
    }

    fotoInput.addEventListener('change', function () {
        if (fotoInput.files && fotoInput.files[0]) {
            newFotoFile = fotoInput.files[0];
            renderFotoPreview();
        }
    });

    /* ---------- Galeri foto & video per prestasi ---------- */
    const galeriBox = document.createElement('div');
    galeriBox.id = 'prestasi-galeri-box';
    galeriBox.className = 'news-form-card';
    galeriBox.style.display = 'none';
    galeriBox.innerHTML =
        '<div class="admin-field-label">Galeri Foto & Video Lomba</div>' +
        '<input type="file" id="galeri-input" accept="image/*,video/*" multiple>' +
        '<div id="galeri-preview" class="image-preview-wrap"></div>' +
        '<div class="admin-comment-actions">' +
            '<span id="galeri-status" class="admin-save-status"></span>' +
            '<button type="button" id="galeri-upload-btn" class="btn-primary">Unggah ke Galeri</button>' +
        '</div>' +
        '<div id="galeri-existing" class="admin-comment-list"></div>';
    form.parentNode.insertBefore(galeriBox, form.nextSibling);

    let galeriPrestasiId = null;
    let galeriNewFiles = [];

    const galeriInput = $('galeri-input');
    const galeriPreview = $('galeri-preview');
    const galeriStatus = $('galeri-status');
    const galeriUploadBtn = $('galeri-upload-btn');
    const galeriExisting = $('galeri-existing');

    function renderGaleriPreview() {
        galeriPreview.innerHTML = '';
        galeriNewFiles.forEach(function (file, idx) {
            const isVid = file.type.startsWith('video/');
            const url = URL.createObjectURL(file);
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML =
                (isVid
                    ? '<video src="' + url + '" muted style="width:100%;height:100px;object-fit:cover;"></video>'
                    : '<img src="' + url + '" alt="Pratinjau">') +
                '<button type="button" class="image-preview-remove">✕</button>';
            item.querySelector('button').addEventListener('click', function () {
                galeriNewFiles.splice(idx, 1);
                renderGaleriPreview();
            });
            galeriPreview.appendChild(item);
        });
    }

    galeriInput.addEventListener('change', function () {
        galeriNewFiles = galeriNewFiles.concat(Array.from(galeriInput.files || []));
        galeriInput.value = '';
        renderGaleriPreview();
    });

    async function loadGaleriExisting() {
        galeriExisting.innerHTML = '<p class="admin-loading">Memuat galeri...</p>';
        const { data, error } = await client
            .from('prestasi_galeri')
            .select('*')
            .eq('prestasi_id', galeriPrestasiId)
            .order('sort_order', { ascending: true });

        if (error) {
            galeriExisting.innerHTML = '<p class="admin-empty">Gagal memuat: ' + esc(error.message) + '</p>';
            return;
        }
        if (!data || data.length === 0) {
            galeriExisting.innerHTML = '<p class="admin-empty">Belum ada foto/video galeri.</p>';
            return;
        }

        galeriExisting.innerHTML = '';
        data.forEach(function (g) {
            const isVid = g.media_type === 'video';
            const card = document.createElement('div');
            card.className = 'admin-comment-card';
            card.innerHTML =
                (isVid
                    ? '<video src="' + esc(g.image_url) + '" class="admin-news-thumb" controls playsinline></video>'
                    : '<img src="' + esc(g.image_url) + '" class="admin-news-thumb" alt="Galeri">') +
                '<div class="admin-comment-actions">' +
                    '<button type="button" class="btn-danger">Hapus</button>' +
                '</div>';
            card.querySelector('button').addEventListener('click', async function () {
                if (!confirm('Hapus file ini dari galeri?')) return;
                const { error } = await client.from('prestasi_galeri').delete().eq('id', g.id);
                if (error) return alert('Gagal menghapus file.');
                loadGaleriExisting();
            });
            galeriExisting.appendChild(card);
        });
    }

    function openGaleriFor(id) {
        galeriBox.style.display = '';
        galeriPrestasiId = id;
        galeriNewFiles = [];
        renderGaleriPreview();
        loadGaleriExisting();
    }

    function closeGaleri() {
        galeriBox.style.display = 'none';
        galeriPrestasiId = null;
        galeriNewFiles = [];
        renderGaleriPreview();
    }

    galeriUploadBtn.addEventListener('click', async function () {
        if (!galeriPrestasiId) {
            galeriStatus.style.color = '#dc2626';
            galeriStatus.textContent = 'Simpan prestasi dulu.';
            return;
        }
        if (galeriNewFiles.length === 0) {
            galeriStatus.style.color = '#dc2626';
            galeriStatus.textContent = 'Pilih foto/video dulu.';
            return;
        }

        galeriUploadBtn.disabled = true;
        const total = galeriNewFiles.length;
        let berhasil = 0;

        try {
            const { data: existing } = await client
                .from('prestasi_galeri')
                .select('id')
                .eq('prestasi_id', galeriPrestasiId);
            let order = existing ? existing.length : 0;

            for (const file of galeriNewFiles) {
                galeriStatus.style.color = '#16a34a';
                galeriStatus.textContent = 'Mengunggah ' + (berhasil + 1) + ' dari ' + total + '...';

                const url = await uploadFoto(file);
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

                const { error } = await client.from('prestasi_galeri').insert({
                    prestasi_id: galeriPrestasiId,
                    image_url: url,
                    media_type: mediaType,
                    sort_order: order++
                });
                if (error) throw error;
                berhasil++;
            }

            galeriNewFiles = [];
            renderGaleriPreview();
            galeriStatus.style.color = '#16a34a';
            galeriStatus.textContent = 'Tersimpan ' + berhasil + ' file.';
            loadGaleriExisting();
        } catch (err) {
            console.error(err);
            galeriStatus.style.color = '#dc2626';
            galeriStatus.textContent = 'Gagal mengunggah (' + berhasil + ' dari ' + total + ' berhasil). ' + (err.message || '');
            loadGaleriExisting();
        } finally {
            galeriUploadBtn.disabled = false;
        }
    });

    /* ---------- Reset & isi form ---------- */
    function resetForm() {
        editingId = null;
        existingFotoUrl = null;
        newFotoFile = null;
        form.reset();
        $('prestasi-published').checked = true;
        $('prestasi-sort').value = 0;
        renderFotoPreview();
        submitBtn.textContent = 'Tambah Prestasi';
        cancelBtn.classList.add('hidden');
        closeGaleri();
    }

    function fillForm(p) {
        Object.keys(FIELDS).forEach(function (inputId) {
            const v = p[FIELDS[inputId]];
            $(inputId).value = v == null ? '' : v;
        });
        $('prestasi-published').checked = !!p.is_published;
        editingId = p.id;
        existingFotoUrl = p.foto_url || null;
        newFotoFile = null;
        renderFotoPreview();
        submitBtn.textContent = 'Simpan Perubahan';
        cancelBtn.classList.remove('hidden');
        openGaleriFor(p.id);
        form.scrollIntoView({ behavior: 'smooth' });
    }

    /* ---------- Simpan prestasi ---------- */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        submitBtn.disabled = true;
        setStatus('Menyimpan...', true);

        try {
            let fotoUrl = existingFotoUrl;
            if (newFotoFile) fotoUrl = await uploadFoto(newFotoFile);

            const tahun = parseInt($('prestasi-tahun').value, 10);
            const payload = {
                judul: $('prestasi-judul').value.trim(),
                kategori: $('prestasi-kategori').value,
                nama_siswa: $('prestasi-nama').value.trim() || null,
                kelas: $('prestasi-kelas').value.trim() || null,
                tingkat: $('prestasi-tingkat').value.trim() || null,
                tahun: isNaN(tahun) ? null : tahun,
                juara: $('prestasi-juara').value.trim() || null,
                deskripsi: $('prestasi-deskripsi').value.trim() || null,
                foto_url: fotoUrl || null,
                is_published: $('prestasi-published').checked,
                sort_order: parseInt($('prestasi-sort').value, 10) || 0,
                updated_at: new Date().toISOString()
            };

            const wasNew = !editingId;
            const req = editingId
                ? client.from('prestasi').update(payload).eq('id', editingId)
                : client.from('prestasi').insert(payload).select().single();

            const { data: saved, error } = await req;
            if (error) throw error;

            const savedId = saved && saved.id ? saved.id : null;
            resetForm();

            if (wasNew && savedId) {
                openGaleriFor(savedId);
                setStatus('Prestasi tersimpan. Sekarang tambahkan galeri di bawah.', true);
            } else {
                setStatus('Tersimpan.', true);
            }
            loadList();
        } catch (err) {
            console.error(err);
            setStatus('Gagal menyimpan: ' + (err.message || 'error'), false);
        } finally {
            submitBtn.disabled = false;
        }
    });

    /* ---------- Daftar prestasi ---------- */
    async function loadList() {
        listEl.innerHTML = '<p class="admin-loading">Memuat data...</p>';

        const { data, error } = await client
            .from('prestasi')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('tahun', { ascending: false });

        if (error) {
            listEl.innerHTML = '<p class="admin-empty">Gagal memuat: ' + esc(error.message) + '</p>';
            return;
        }
        if (!data || data.length === 0) {
            listEl.innerHTML = '<p class="admin-empty">Belum ada data prestasi.</p>';
            return;
        }

        listEl.innerHTML = '';
        data.forEach(function (p) {
            const card = document.createElement('div');
            card.className = 'admin-comment-card';
            card.innerHTML =
                (p.foto_url ? '<img src="' + esc(p.foto_url) + '" class="admin-news-thumb" alt="Foto">' : '') +
                '<div class="admin-comment-head">' +
                    '<span class="admin-comment-name">' + esc(p.judul) + '</span>' +
                    '<span class="admin-comment-date">' + esc(p.kategori) + ' &middot; ' +
                        (p.is_published
                            ? '<span style="color:#16a34a;">Tampil</span>'
                            : '<span style="color:#dc2626;">Disembunyikan</span>') +
                    '</span>' +
                '</div>' +
                '<p style="font-size:0.88rem;color:#334155;">' +
                    esc(p.nama_siswa || '-') + ' &middot; ' + esc(p.kelas || '-') + ' &middot; ' +
                    esc(p.tingkat || '-') + ' &middot; ' + esc(p.tahun || '-') + ' &middot; ' +
                    esc(p.juara || '-') +
                '</p>' +
                '<div class="admin-comment-actions">' +
                    '<button type="button" class="btn-secondary" data-act="toggle">' +
                        (p.is_published ? 'Sembunyikan' : 'Tampilkan') + '</button>' +
                    '<button type="button" class="btn-secondary" data-act="edit">Edit</button>' +
                    '<button type="button" class="btn-danger" data-act="delete">Hapus</button>' +
                '</div>';

            card.addEventListener('click', async function (e) {
                const act = e.target.dataset.act;
                if (!act) return;

                if (act === 'edit') {
                    fillForm(p);
                    return;
                }

                if (act === 'toggle') {
                    const { error } = await client.from('prestasi')
                        .update({ is_published: !p.is_published }).eq('id', p.id);
                    if (error) return alert('Gagal mengubah status.');
                    loadList();
                    return;
                }

                if (act === 'delete') {
                    if (!confirm('Hapus prestasi "' + p.judul + '"?')) return;
                    const { error } = await client.from('prestasi').delete().eq('id', p.id);
                    if (error) return alert('Gagal menghapus.');
                    loadList();
                }
            });

            listEl.appendChild(card);
        });
    }

    /* ---------- Wiring tab ---------- */
    document.querySelectorAll('.admin-tab-btn').forEach(function (b) {
        b.addEventListener('click', function () {
            const isMe = b.dataset.tab === 'prestasi';
            panel.classList.toggle('hidden', !isMe);
            if (isMe) loadList();
        });
    });

    cancelBtn.addEventListener('click', resetForm);
    $('prestasi-refresh-btn').addEventListener('click', loadList);
})();