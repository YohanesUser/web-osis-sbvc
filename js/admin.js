/* =========================================
   PANEL ADMIN (SUPABASE) - OSIS SMKN 1 Bantul
   ========================================= */

(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    if (!window.supabase) {
        console.error('Supabase SDK belum termuat.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    /* ===================== ELEMEN LOGIN ===================== */
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    const dashboard = document.getElementById('dashboard');
    const adminEmailEl = document.getElementById('admin-email');
    const logoutBtn = document.getElementById('logout-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const listEl = document.getElementById('admin-comment-list');

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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function showDashboard(session) {
        loginScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');
        adminEmailEl.textContent = session.user.email || '';
        loadComments();
    }

    function showLogin() {
        dashboard.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }

    client.auth.getSession().then(function (res) {
        const session = res.data.session;
        if (session) {
            showDashboard(session);
        } else {
            showLogin();
        }
    });

    client.auth.onAuthStateChange(function (_event, session) {
        if (session) {
            showDashboard(session);
        } else {
            showLogin();
        }
    });

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        loginError.textContent = '';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Memeriksa...';

        const { data, error } = await client.auth.signInWithPassword({
            email: loginEmail.value.trim(),
            password: loginPassword.value
        });

        loginBtn.disabled = false;
        loginBtn.textContent = 'Masuk';

        if (error) {
            loginError.textContent = 'Email atau kata sandi salah.';
            return;
        }

        loginPassword.value = '';
        showDashboard(data.session);
    });

    logoutBtn.addEventListener('click', async function () {
        await client.auth.signOut();
    });

    refreshBtn.addEventListener('click', loadComments);

    /* ===================== TAB SWITCHING ===================== */
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const tabPanels = {
        comments: document.getElementById('tab-comments'),
        news: document.getElementById('tab-news'),
        chatbot: document.getElementById('tab-chatbot') // TAMBAHAN: Tab Chatbot
    };

    tabButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabButtons.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');

            Object.keys(tabPanels).forEach(function (key) {
                tabPanels[key].classList.toggle('hidden', key !== btn.dataset.tab);
            });

            if (btn.dataset.tab === 'news') {
                loadNews();
            } else if (btn.dataset.tab === 'chatbot') {
                loadIntents(); // TAMBAHAN: Load data bot saat tab diklik
            }
        });
    });

    /* ===================== KOMENTAR SISWA ===================== */
    async function loadComments() {
        listEl.innerHTML = '<p class="admin-loading">Memuat komentar...</p>';

        const { data, error } = await client
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            listEl.innerHTML = '<p class="admin-empty">Gagal memuat komentar: ' + escapeHtml(error.message) + '</p>';
            return;
        }

        renderCommentList(data);
    }

    function renderCommentList(comments) {
        if (!comments || comments.length === 0) {
            listEl.innerHTML = '<p class="admin-empty">Belum ada komentar masuk.</p>';
            return;
        }

        listEl.innerHTML = '';

        comments.forEach(function (c) {
            const card = document.createElement('div');
            card.className = 'admin-comment-card';
            card.dataset.id = c.id;
            card.dataset.originalMessage = c.message;
            card.dataset.originalReply = c.admin_reply || '';

            card.innerHTML =
                '<div class="admin-comment-head">' +
                    '<span class="admin-comment-name">' + escapeHtml(c.name) + '</span>' +
                    '<span class="admin-comment-date">Dikirim ' + formatTanggal(c.created_at) + '</span>' +
                '</div>' +

                '<div class="admin-field-label">Isi Komentar</div>' +
                '<textarea class="admin-message-textarea">' + escapeHtml(c.message) + '</textarea>' +

                '<div class="admin-field-label">Balasan Admin (opsional)</div>' +
                '<textarea class="admin-reply-textarea" placeholder="Tulis balasan untuk siswa ini...">' + escapeHtml(c.admin_reply || '') + '</textarea>' +

                '<div class="admin-comment-actions">' +
                    '<span class="admin-save-status"></span>' +
                    '<button type="button" class="btn-danger btn-delete">Hapus</button>' +
                    '<button type="button" class="btn-primary btn-save">Simpan</button>' +
                '</div>';

            listEl.appendChild(card);

            const saveBtn = card.querySelector('.btn-save');
            const deleteBtn = card.querySelector('.btn-delete');
            const statusEl = card.querySelector('.admin-save-status');
            const messageArea = card.querySelector('.admin-message-textarea');
            const replyArea = card.querySelector('.admin-reply-textarea');

            saveBtn.addEventListener('click', async function () {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Menyimpan...';
                statusEl.textContent = '';

                const newMessage = messageArea.value.trim();
                const newReply = replyArea.value.trim();
                const messageChanged = newMessage !== card.dataset.originalMessage;
                const replyChanged = newReply !== card.dataset.originalReply;

                const payload = {
                    message: newMessage,
                    admin_reply: newReply || null,
                    updated_at: new Date().toISOString()
                };

                if (messageChanged) {
                    payload.is_edited = true;
                }

                if (replyChanged && newReply) {
                    payload.replied_at = new Date().toISOString();
                }

                const { error } = await client
                    .from('comments')
                    .update(payload)
                    .eq('id', c.id);

                saveBtn.disabled = false;
                saveBtn.textContent = 'Simpan';

                if (error) {
                    statusEl.style.color = '#dc2626';
                    statusEl.textContent = 'Gagal menyimpan.';
                    return;
                }

                card.dataset.originalMessage = newMessage;
                card.dataset.originalReply = newReply;
                statusEl.style.color = '#16a34a';
                statusEl.textContent = 'Tersimpan.';
            });

            deleteBtn.addEventListener('click', async function () {
                const yakin = confirm('Hapus komentar dari ' + c.name + '? Tindakan ini tidak bisa dibatalkan.');
                if (!yakin) return;

                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Menghapus...';

                const { error } = await client
                    .from('comments')
                    .delete()
                    .eq('id', c.id);

                if (error) {
                    alert('Gagal menghapus komentar.');
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = 'Hapus';
                    return;
                }

                card.remove();
                if (!listEl.querySelector('.admin-comment-card')) {
                    listEl.innerHTML = '<p class="admin-empty">Belum ada komentar masuk.</p>';
                }
            });
        });
    }

    /* ===================== KELOLA BERITA ===================== */
    const newsForm = document.getElementById('news-form');
    const newsCategory = document.getElementById('news-category');
    const newsTitle = document.getElementById('news-title');
    const newsContent = document.getElementById('news-content');
    const newsPublished = document.getElementById('news-published');
    const newsFormStatus = document.getElementById('news-form-status');
    const newsSubmitBtn = document.getElementById('news-submit-btn');
    const newsCancelBtn = document.getElementById('news-cancel-btn');
    const newsListEl = document.getElementById('admin-news-list');
    const newsRefreshBtn = document.getElementById('news-refresh-btn');

    const coverInput = document.getElementById('news-cover-input');
    const coverPreviewWrap = document.getElementById('news-cover-preview');
    const contentImagesInput = document.getElementById('news-content-images-input');
    const contentImagesPreviewWrap = document.getElementById('news-content-images-preview');

    let editingNewsId = null;
    let existingCoverUrl = null;
    let newCoverFile = null;
    let existingContentImages = [];
    let newContentImageFiles = [];

    function resetNewsForm() {
        editingNewsId = null;
        newsForm.reset();
        newsPublished.checked = true;
        newsSubmitBtn.textContent = 'Tambah Berita';
        newsCancelBtn.classList.add('hidden');
        newsFormStatus.textContent = '';

        existingCoverUrl = null;
        newCoverFile = null;
        existingContentImages = [];
        newContentImageFiles = [];
        renderCoverPreview();
        renderContentImagesPreview();
    }

    function renderCoverPreview() {
        coverPreviewWrap.innerHTML = '';
        const url = newCoverFile ? URL.createObjectURL(newCoverFile) : existingCoverUrl;
        if (!url) return;

        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML =
            '<img src="' + url + '" alt="Pratinjau sampul">' +
            '<button type="button" class="image-preview-remove">✕</button>';

        item.querySelector('.image-preview-remove').addEventListener('click', function () {
            newCoverFile = null;
            existingCoverUrl = null;
            coverInput.value = '';
            renderCoverPreview();
        });

        coverPreviewWrap.appendChild(item);
    }

    coverInput.addEventListener('change', function () {
        if (coverInput.files && coverInput.files[0]) {
            newCoverFile = coverInput.files[0];
            renderCoverPreview();
        }
    });

    function renderContentImagesPreview() {
        contentImagesPreviewWrap.innerHTML = '';

        existingContentImages.forEach(function (url, idx) {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML =
                '<img src="' + url + '" alt="Gambar isi">' +
                '<button type="button" class="image-preview-remove">✕</button>';
            item.querySelector('.image-preview-remove').addEventListener('click', function () {
                existingContentImages.splice(idx, 1);
                renderContentImagesPreview();
            });
            contentImagesPreviewWrap.appendChild(item);
        });

        newContentImageFiles.forEach(function (file, idx) {
            const item = document.createElement('div');
            item.className = 'image-preview-item';
            item.innerHTML =
                '<img src="' + URL.createObjectURL(file) + '" alt="Gambar isi baru">' +
                '<button type="button" class="image-preview-remove">✕</button>';
            item.querySelector('.image-preview-remove').addEventListener('click', function () {
                newContentImageFiles.splice(idx, 1);
                renderContentImagesPreview();
            });
            contentImagesPreviewWrap.appendChild(item);
        });
    }

    contentImagesInput.addEventListener('change', function () {
        if (contentImagesInput.files) {
            newContentImageFiles = newContentImageFiles.concat(Array.from(contentImagesInput.files));
            renderContentImagesPreview();
            contentImagesInput.value = '';
        }
    });

    async function uploadNewsImage(file) {
        const ext = file.name.split('.').pop();
        const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

        const { error } = await client.storage
            .from('news-images')
            .upload(path, file, { upsert: false });

        if (error) throw error;

        const { data } = client.storage.from('news-images').getPublicUrl(path);
        return data.publicUrl;
    }

    newsCancelBtn.addEventListener('click', resetNewsForm);
    newsRefreshBtn.addEventListener('click', loadNews);

    newsForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        newsSubmitBtn.disabled = true;
        newsFormStatus.style.color = '#16a34a';
        newsFormStatus.textContent = 'Mengunggah gambar & menyimpan...';

        try {
            let coverUrl = existingCoverUrl;
            if (newCoverFile) {
                coverUrl = await uploadNewsImage(newCoverFile);
            }

            let contentImageUrls = existingContentImages.slice();
            for (const file of newContentImageFiles) {
                const url = await uploadNewsImage(file);
                contentImageUrls.push(url);
            }

            const payload = {
                category: newsCategory.value.trim(),
                title: newsTitle.value.trim(),
                content: newsContent.value.trim(),
                is_published: newsPublished.checked,
                cover_image_url: coverUrl || null,
                content_images: contentImageUrls,
                updated_at: new Date().toISOString()
            };

            let error;
            if (editingNewsId) {
                ({ error } = await client.from('news').update(payload).eq('id', editingNewsId));
            } else {
                ({ error } = await client.from('news').insert(payload));
            }

            if (error) throw error;

            newsFormStatus.style.color = '#16a34a';
            newsFormStatus.textContent = 'Tersimpan.';
            resetNewsForm();
            loadNews();
        } catch (err) {
            console.error(err);
            newsFormStatus.style.color = '#dc2626';
            newsFormStatus.textContent = 'Gagal menyimpan berita.';
        } finally {
            newsSubmitBtn.disabled = false;
        }
    });

    async function loadNews() {
        newsListEl.innerHTML = '<p class="admin-loading">Memuat berita...</p>';

        const { data, error } = await client
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            newsListEl.innerHTML = '<p class="admin-empty">Gagal memuat berita: ' + escapeHtml(error.message) + '</p>';
            return;
        }

        renderNewsList(data);
    }

    function renderNewsList(items) {
        if (!items || items.length === 0) {
            newsListEl.innerHTML = '<p class="admin-empty">Belum ada berita.</p>';
            return;
        }

        newsListEl.innerHTML = '';

        items.forEach(function (n) {
            const card = document.createElement('div');
            card.className = 'admin-comment-card';

            const thumb = n.cover_image_url
                ? '<img src="' + n.cover_image_url + '" class="admin-news-thumb" alt="Sampul">'
                : '';

            card.innerHTML =
                thumb +
                '<div class="admin-comment-head">' +
                    '<span class="admin-comment-name">' + escapeHtml(n.title) + '</span>' +
                    '<span class="admin-comment-date">' + formatTanggal(n.created_at) + '</span>' +
                '</div>' +
                '<p style="font-size:0.85rem;color:#64748b;margin:0 0 4px;">' +
                    'Kategori: ' + escapeHtml(n.category) + ' &middot; ' +
                    (n.is_published ? '<span style="color:#16a34a;">Terbit</span>' : '<span style="color:#dc2626;">Draft</span>') +
                    ' &middot; ' + ((n.content_images || []).length) + ' gambar isi' +
                '</p>' +
                '<p style="font-size:0.88rem;color:#334155;">' + escapeHtml(n.content) + '</p>' +
                '<div class="admin-comment-actions">' +
                    '<button type="button" class="btn-danger btn-news-delete">Hapus</button>' +
                    '<button type="button" class="btn-secondary btn-news-edit">Edit</button>' +
                '</div>';

            newsListEl.appendChild(card);

            card.querySelector('.btn-news-edit').addEventListener('click', function () {
                editingNewsId = n.id;
                newsCategory.value = n.category;
                newsTitle.value = n.title;
                newsContent.value = n.content;
                newsPublished.checked = n.is_published;

                existingCoverUrl = n.cover_image_url || null;
                newCoverFile = null;
                existingContentImages = (n.content_images || []).slice();
                newContentImageFiles = [];
                renderCoverPreview();
                renderContentImagesPreview();

                newsSubmitBtn.textContent = 'Simpan Perubahan';
                newsCancelBtn.classList.remove('hidden');
                newsForm.scrollIntoView({ behavior: 'smooth' });
            });

            card.querySelector('.btn-news-delete').addEventListener('click', async function () {
                const yakin = confirm('Hapus berita "' + n.title + '"?');
                if (!yakin) return;

                const { error } = await client.from('news').delete().eq('id', n.id);
                if (error) {
                    alert('Gagal menghapus berita.');
                    return;
                }
                loadNews();
            });
        });
    }

    /* ===================== KELOLA CHATBOT ===================== */
    const intentForm = document.getElementById('intent-form');
    const intentIdInput = document.getElementById('intent-id');
    const intentKeywordsInput = document.getElementById('intent-keywords');
    const fieldDefaultInput = document.getElementById('field-default');
    const fieldKetuaInput = document.getElementById('field-ketua');
    const fieldAnggotaInput = document.getElementById('field-anggota');
    const intentListEl = document.getElementById('intent-list');
    const btnCancelIntent = document.getElementById('btn-cancel-intent');
    const intentFormTitle = document.getElementById('form-title');

    // Supaya fungsi bisa dipanggil dari atribut onclick di HTML
    window.loadIntents = loadIntents;
    window.resetIntentForm = resetIntentForm;

    async function loadIntents() {
        intentListEl.innerHTML = '<p class="admin-loading">Memuat data chatbot...</p>';

        const { data, error } = await client
            .from('chatbot_intents')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error(error);
            intentListEl.innerHTML = '<p class="admin-empty" style="color:red">Gagal memuat data.</p>';
            return;
        }

        if (!data || data.length === 0) {
            intentListEl.innerHTML = '<p class="admin-empty">Belum ada data chatbot.</p>';
            return;
        }

        intentListEl.innerHTML = '';

        data.forEach(function (item) {
            const card = document.createElement('div');
            card.className = 'admin-comment-card';

            const keywordsText = Array.isArray(item.keywords) ? item.keywords.join(', ') : '';

            card.innerHTML = 
                '<div class="admin-comment-head">' +
                    '<span class="admin-comment-name">ID: <code>' + escapeHtml(item.id) + '</code></span>' +
                '</div>' +
                '<p style="font-size:0.85rem; color:#64748b; margin: 0 0 10px;"><b>Keywords:</b> ' + escapeHtml(keywordsText) + '</p>' +
                '<div class="admin-field-label">Jawaban Default:</div>' +
                '<p style="font-size:0.88rem; color:#334155; background:#f8fafc; padding:10px; border-radius:4px; margin-bottom:10px;">' + 
                    escapeHtml(item.fields?.default || '-') + 
                '</p>' +
                '<div class="admin-comment-actions">' +
                    '<button type="button" class="btn-danger btn-intent-delete">Hapus</button>' +
                    '<button type="button" class="btn-secondary btn-intent-edit">Edit</button>' +
                '</div>';
            
            intentListEl.appendChild(card);

            // Fungsi Edit
            card.querySelector('.btn-intent-edit').addEventListener('click', function () {
                intentFormTitle.innerText = 'Edit Data Bot (' + item.id + ')';
                intentIdInput.value = item.id;
                intentIdInput.readOnly = true; // ID tidak bisa diganti jika sedang diedit
                intentIdInput.style.backgroundColor = '#e2e8f0';

                intentKeywordsInput.value = keywordsText;
                fieldDefaultInput.value = item.fields?.default || '';
                fieldKetuaInput.value = item.fields?.ketua || '';
                fieldAnggotaInput.value = item.fields?.anggota || '';

                btnCancelIntent.classList.remove('hidden');
                intentForm.querySelector('button[type="submit"]').textContent = 'Simpan Perubahan';
                intentForm.scrollIntoView({ behavior: 'smooth' });
            });

            // Fungsi Delete
            card.querySelector('.btn-intent-delete').addEventListener('click', async function () {
                const yakin = confirm('Yakin ingin menghapus data bot ID: ' + item.id + '?');
                if (!yakin) return;

                const { error } = await client.from('chatbot_intents').delete().eq('id', item.id);
                if (error) {
                    alert('Gagal menghapus data.');
                    return;
                }
                loadIntents();
            });
        });
    }

    intentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = intentIdInput.value.trim();
        const rawKeywords = intentKeywordsInput.value;
        const keywordsArray = rawKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

        const fieldsObj = {
            default: fieldDefaultInput.value.trim(),
            ketua: fieldKetuaInput.value.trim(),
            anggota: fieldAnggotaInput.value.trim()
        };

        const submitBtn = intentForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';

        // Menggunakan upsert (Update/Insert)
        const { error } = await client
            .from('chatbot_intents')
            .upsert([{
                id: id,
                keywords: keywordsArray,
                fields: fieldsObj
            }]);

        submitBtn.disabled = false;

        if (error) {
            console.error('Gagal menyimpan:', error);
            alert('Gagal menyimpan data ke database.');
        } else {
            alert('Data chatbot berhasil disimpan!');
            resetIntentForm();
            loadIntents();
        }
    });

    function resetIntentForm() {
        intentFormTitle.innerText = 'Tambah Data Bot Baru';
        intentForm.reset();
        intentIdInput.readOnly = false;
        intentIdInput.style.backgroundColor = '';
        btnCancelIntent.classList.add('hidden');
        intentForm.querySelector('button[type="submit"]').textContent = 'Simpan ke Database';
    }

})();