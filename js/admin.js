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
gallery: document.getElementById('tab-gallery'),
whatwedo: document.getElementById('tab-whatwedo'),
chatbot: document.getElementById('tab-chatbot')
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
} else if (btn.dataset.tab === 'gallery') {
    loadGallery();
} else if (btn.dataset.tab === 'whatwedo') {
    loadWhatwedo();
} else if (btn.dataset.tab === 'chatbot') {
    loadIntents();
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

    /* ===================== GALERI SEKBID ===================== */
const galleryForm = document.getElementById('gallery-form');
const gallerySekbidSelect = document.getElementById('gallery-sekbid-select');
const galleryImagesInput = document.getElementById('gallery-images-input');
const galleryImagesPreviewWrap = document.getElementById('gallery-images-preview');
const galleryFormStatus = document.getElementById('gallery-form-status');
const gallerySubmitBtn = document.getElementById('gallery-submit-btn');
const galleryListEl = document.getElementById('admin-gallery-list');
const galleryRefreshBtn = document.getElementById('gallery-refresh-btn');
const galleryFilterSelect = document.getElementById('gallery-filter-select');

// Setiap item sekarang berupa { file, caption }
let newGalleryItems = [];

function renderGalleryImagesPreview() {
    galleryImagesPreviewWrap.innerHTML = '';
    newGalleryItems.forEach(function (item, idx) {
        const wrap = document.createElement('div');
        wrap.className = 'image-preview-item';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '4px';

        wrap.innerHTML =
            '<img src="' + URL.createObjectURL(item.file) + '" alt="Pratinjau">' +
            '<button type="button" class="image-preview-remove">✕</button>' +
            '<input type="text" class="gallery-caption-input" placeholder="Caption (opsional)" value="' + escapeHtml(item.caption) + '" style="font-size:0.8rem;padding:4px 6px;border:1px solid #cbd5e1;border-radius:4px;">';

        wrap.querySelector('.image-preview-remove').addEventListener('click', function () {
            newGalleryItems.splice(idx, 1);
            renderGalleryImagesPreview();
        });

        wrap.querySelector('.gallery-caption-input').addEventListener('input', function (e) {
            newGalleryItems[idx].caption = e.target.value;
        });

        galleryImagesPreviewWrap.appendChild(wrap);
    });
}

galleryImagesInput.addEventListener('change', function () {
    if (galleryImagesInput.files) {
        const newFiles = Array.from(galleryImagesInput.files).map(function (file) {
            return { file: file, caption: '' };
        });
        newGalleryItems = newGalleryItems.concat(newFiles);
        renderGalleryImagesPreview();
        galleryImagesInput.value = '';
    }
});

async function uploadGalleryImage(file) {
    const ext = file.name.split('.').pop();
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

    const { error } = await client.storage
        .from('sekbid-gallery')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = client.storage.from('sekbid-gallery').getPublicUrl(path);
    return data.publicUrl;
}

galleryForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const sekbidId = gallerySekbidSelect.value;
    if (!sekbidId) {
        galleryFormStatus.style.color = '#dc2626';
        galleryFormStatus.textContent = 'Pilih sekbid dulu.';
        return;
    }
    if (newGalleryItems.length === 0) {
        galleryFormStatus.style.color = '#dc2626';
        galleryFormStatus.textContent = 'Pilih minimal 1 foto.';
        return;
    }

    gallerySubmitBtn.disabled = true;
    galleryFormStatus.style.color = '#16a34a';
    galleryFormStatus.textContent = 'Mengunggah...';

    try {
        const rows = [];
        for (const item of newGalleryItems) {
            const url = await uploadGalleryImage(item.file);
            rows.push({
                sekbid_id: sekbidId,
                image_url: url,
                caption: item.caption.trim() || null
            });
        }

        const { error } = await client.from('sekbid_gallery').insert(rows);
        if (error) throw error;

        galleryFormStatus.textContent = 'Tersimpan.';
        newGalleryItems = [];
        renderGalleryImagesPreview();
        galleryForm.reset();
        loadGallery();
    } catch (err) {
        console.error(err);
        galleryFormStatus.style.color = '#dc2626';
        galleryFormStatus.textContent = 'Gagal mengunggah galeri.';
    } finally {
        gallerySubmitBtn.disabled = false;
    }
});

galleryRefreshBtn.addEventListener('click', loadGallery);
galleryFilterSelect.addEventListener('change', loadGallery);

async function loadGallery() {
    galleryListEl.innerHTML = '<p class="admin-loading">Memuat galeri...</p>';

    let query = client.from('sekbid_gallery').select('*').order('sekbid_id').order('created_at', { ascending: false });
    if (galleryFilterSelect.value) {
        query = query.eq('sekbid_id', galleryFilterSelect.value);
    }

    const { data, error } = await query;

    if (error) {
        galleryListEl.innerHTML = '<p class="admin-empty">Gagal memuat galeri: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    const uniqueIds = Array.from(new Set((data || []).map(function (d) { return d.sekbid_id; })));
    const currentFilter = galleryFilterSelect.value;
    galleryFilterSelect.innerHTML = '<option value="">Semua Sekbid</option>' +
        uniqueIds.map(function (id) { return '<option value="' + escapeHtml(id) + '">' + escapeHtml(id) + '</option>'; }).join('');
    galleryFilterSelect.value = currentFilter;

    renderGalleryList(data);
}

function renderGalleryList(items) {
    if (!items || items.length === 0) {
        galleryListEl.innerHTML = '<p class="admin-empty">Belum ada foto galeri.</p>';
        return;
    }

    galleryListEl.innerHTML = '';

    items.forEach(function (g) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';
        card.innerHTML =
            '<img src="' + g.image_url + '" class="admin-news-thumb" alt="Dokumentasi">' +
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + escapeHtml(g.sekbid_id) + '</span>' +
                '<span class="admin-comment-date">' + formatTanggal(g.created_at) + '</span>' +
            '</div>' +
            '<div class="admin-field-label">Caption</div>' +
            '<input type="text" class="gallery-caption-edit" value="' + escapeHtml(g.caption || '') + '" placeholder="Caption (opsional)" style="width:100%;padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;margin-bottom:8px;">' +
            '<div class="admin-comment-actions">' +
                '<span class="admin-save-status"></span>' +
                '<button type="button" class="btn-danger btn-gallery-delete">Hapus</button>' +
                '<button type="button" class="btn-primary btn-gallery-save">Simpan Caption</button>' +
            '</div>';

        galleryListEl.appendChild(card);

        const statusEl = card.querySelector('.admin-save-status');

        card.querySelector('.btn-gallery-save').addEventListener('click', async function () {
            const newCaption = card.querySelector('.gallery-caption-edit').value.trim();
            const { error } = await client
                .from('sekbid_gallery')
                .update({ caption: newCaption || null })
                .eq('id', g.id);

            if (error) {
                statusEl.style.color = '#dc2626';
                statusEl.textContent = 'Gagal menyimpan.';
                return;
            }
            statusEl.style.color = '#16a34a';
            statusEl.textContent = 'Tersimpan.';
        });

        card.querySelector('.btn-gallery-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus foto ini dari galeri "' + g.sekbid_id + '"?');
            if (!yakin) return;

            const { error } = await client.from('sekbid_gallery').delete().eq('id', g.id);
            if (error) {
                alert('Gagal menghapus foto.');
                return;
            }
            card.remove();
        });
    });
}

/* ===================== WHAT WE DO ===================== */
const whatwedoForm = document.getElementById('whatwedo-form');
const whatwedoSekbidSelect = document.getElementById('whatwedo-sekbid-select');
const whatwedoIcon = document.getElementById('whatwedo-icon');
const whatwedoTitle = document.getElementById('whatwedo-title');
const whatwedoDescription = document.getElementById('whatwedo-description');
const whatwedoSort = document.getElementById('whatwedo-sort');
const whatwedoFormStatus = document.getElementById('whatwedo-form-status');
const whatwedoSubmitBtn = document.getElementById('whatwedo-submit-btn');
const whatwedoCancelBtn = document.getElementById('whatwedo-cancel-btn');
const whatwedoListEl = document.getElementById('admin-whatwedo-list');
const whatwedoRefreshBtn = document.getElementById('whatwedo-refresh-btn');
const whatwedoFilterSelect = document.getElementById('whatwedo-filter-select');

let editingWhatwedoId = null;

function resetWhatwedoForm() {
    editingWhatwedoId = null;
    whatwedoForm.reset();
    whatwedoSort.value = 0;
    whatwedoSubmitBtn.textContent = 'Tambah Program';
    whatwedoCancelBtn.classList.add('hidden');
    whatwedoFormStatus.textContent = '';
}

whatwedoCancelBtn.addEventListener('click', resetWhatwedoForm);
whatwedoRefreshBtn.addEventListener('click', loadWhatwedo);
whatwedoFilterSelect.addEventListener('change', loadWhatwedo);

whatwedoForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const sekbidId = whatwedoSekbidSelect.value;
    if (!sekbidId) {
        whatwedoFormStatus.style.color = '#dc2626';
        whatwedoFormStatus.textContent = 'Pilih sekbid dulu.';
        return;
    }

    whatwedoSubmitBtn.disabled = true;
    whatwedoFormStatus.style.color = '#16a34a';
    whatwedoFormStatus.textContent = 'Menyimpan...';

    const payload = {
        sekbid_id: sekbidId,
        icon: whatwedoIcon.value.trim() || null,
        title: whatwedoTitle.value.trim(),
        description: whatwedoDescription.value.trim() || null,
        sort_order: parseInt(whatwedoSort.value, 10) || 0
    };

    let error;
    if (editingWhatwedoId) {
        ({ error } = await client.from('sekbid_whatwedo').update(payload).eq('id', editingWhatwedoId));
    } else {
        ({ error } = await client.from('sekbid_whatwedo').insert(payload));
    }

    whatwedoSubmitBtn.disabled = false;

    if (error) {
        console.error(error);
        whatwedoFormStatus.style.color = '#dc2626';
        whatwedoFormStatus.textContent = 'Gagal menyimpan.';
        return;
    }

    whatwedoFormStatus.style.color = '#16a34a';
    whatwedoFormStatus.textContent = 'Tersimpan.';
    resetWhatwedoForm();
    loadWhatwedo();
});

async function loadWhatwedo() {
    whatwedoListEl.innerHTML = '<p class="admin-loading">Memuat data...</p>';

    let query = client.from('sekbid_whatwedo').select('*').order('sekbid_id').order('sort_order', { ascending: true });
    if (whatwedoFilterSelect.value) {
        query = query.eq('sekbid_id', whatwedoFilterSelect.value);
    }

    const { data, error } = await query;

    if (error) {
        whatwedoListEl.innerHTML = '<p class="admin-empty">Gagal memuat data: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    const uniqueIds = Array.from(new Set((data || []).map(function (d) { return d.sekbid_id; })));
    const currentFilter = whatwedoFilterSelect.value;
    whatwedoFilterSelect.innerHTML = '<option value="">Semua Sekbid</option>' +
        uniqueIds.map(function (id) { return '<option value="' + escapeHtml(id) + '">' + escapeHtml(id) + '</option>'; }).join('');
    whatwedoFilterSelect.value = currentFilter;

    renderWhatwedoList(data);
}

function renderWhatwedoList(items) {
    if (!items || items.length === 0) {
        whatwedoListEl.innerHTML = '<p class="admin-empty">Belum ada program kerja.</p>';
        return;
    }

    whatwedoListEl.innerHTML = '';

    items.forEach(function (w) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';
        card.innerHTML =
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + (w.icon ? w.icon + ' ' : '') + escapeHtml(w.title) + '</span>' +
                '<span class="admin-comment-date">' + escapeHtml(w.sekbid_id) + ' &middot; urutan ' + w.sort_order + '</span>' +
            '</div>' +
            '<p style="font-size:0.88rem;color:#334155;">' + escapeHtml(w.description || '-') + '</p>' +
            '<div class="admin-comment-actions">' +
                '<button type="button" class="btn-danger btn-whatwedo-delete">Hapus</button>' +
                '<button type="button" class="btn-secondary btn-whatwedo-edit">Edit</button>' +
            '</div>';

        whatwedoListEl.appendChild(card);

        card.querySelector('.btn-whatwedo-edit').addEventListener('click', function () {
            editingWhatwedoId = w.id;
            whatwedoSekbidSelect.value = w.sekbid_id;
            whatwedoIcon.value = w.icon || '';
            whatwedoTitle.value = w.title;
            whatwedoDescription.value = w.description || '';
            whatwedoSort.value = w.sort_order || 0;

            whatwedoSubmitBtn.textContent = 'Simpan Perubahan';
            whatwedoCancelBtn.classList.remove('hidden');
            whatwedoForm.scrollIntoView({ behavior: 'smooth' });
        });

        card.querySelector('.btn-whatwedo-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus program "' + w.title + '"?');
            if (!yakin) return;

            const { error } = await client.from('sekbid_whatwedo').delete().eq('id', w.id);
            if (error) {
                alert('Gagal menghapus.');
                return;
            }
            card.remove();
        });
    });
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