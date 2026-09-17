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

    /* --- Helper deteksi video (dipakai untuk kolom Sampul yang kini bisa foto/video) --- */
    function isVideoFile(file) {
        return !!(file && file.type && file.type.startsWith('video/'));
    }

    function isVideoUrl(url) {
        return !!url && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
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
    covers: document.getElementById('tab-covers'),
    oprec: document.getElementById('tab-oprec'),
    chatbot: document.getElementById('tab-chatbot'),
    profil: document.getElementById('tab-profil'),
    ph: document.getElementById('tab-ph')          // <-- BARU
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
} else if (btn.dataset.tab === 'covers') {
    loadCovers();
} else if (btn.dataset.tab === 'oprec') {
    loadOprecSettings();
    loadOprecContacts();
} else if (btn.dataset.tab === 'chatbot') {
    loadIntents();
} else if (btn.dataset.tab === 'profil') {
    loadProfil();
    loadAnggota();
} else if (btn.dataset.tab === 'ph') {            // <-- BARU
    loadPhProfil();
    loadPhMembers();
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

    /* --- Video Berita --- */
    const newsVideoInput = document.getElementById('news-video-input');
    const newsVideoPreviewWrap = document.getElementById('news-video-preview');

    let existingVideoUrl = null;
    let newVideoFile = null;

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
        existingVideoUrl = null;
        newVideoFile = null;
        renderCoverPreview();
        renderContentImagesPreview();
        renderVideoPreview();
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

/* ===================== COVER STRUKTUR (PH & SEKBID) ===================== */
const SLOT_LABELS = {
    'ph-ketua': 'PH — Ketua & Wakil',
    'ph-sekretaris': 'PH — Sekretaris',
    'ph-bendahara': 'PH — Bendahara',
    'sekbid-ketaqis': '1. Ketaqwaan Islam',
    'sekbid-ketaqris': '2. Ketaqwaan Kristen/Katolik',
    'sekbid-politik': '3. Politik & Kepemimpinan',
    'sekbid-belneg': '4. Bela Negara',
    'sekbid-kwu': '5. Kewirausahaan',
    'sekbid-apres': '6. Apresiasi Seni',
    'sekbid-jasmani': '7. Jasmani & Kesehatan'
};

const coversForm = document.getElementById('covers-form');
const coversSlugSelect = document.getElementById('covers-slug-select');
const coversImageInput = document.getElementById('covers-image-input');
const coversImagePreviewWrap = document.getElementById('covers-image-preview');
const coversFormStatus = document.getElementById('covers-form-status');
const coversSubmitBtn = document.getElementById('covers-submit-btn');
const coversListEl = document.getElementById('admin-covers-list');
const coversRefreshBtn = document.getElementById('covers-refresh-btn');

let newCoverImageFile = null;

function renderCoverImagePreview() {
    coversImagePreviewWrap.innerHTML = '';
    if (!newCoverImageFile) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + URL.createObjectURL(newCoverImageFile) + '" alt="Pratinjau">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newCoverImageFile = null;
        coversImageInput.value = '';
        renderCoverImagePreview();
    });

    coversImagePreviewWrap.appendChild(item);
}

coversImageInput.addEventListener('change', function () {
    if (coversImageInput.files && coversImageInput.files[0]) {
        newCoverImageFile = coversImageInput.files[0];
        renderCoverImagePreview();
    }
});

async function uploadCoverImage(file) {
    const ext = file.name.split('.').pop();
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

    const { error } = await client.storage
        .from('struktur-covers')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = client.storage.from('struktur-covers').getPublicUrl(path);
    return data.publicUrl;
}

coversForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const slug = coversSlugSelect.value;
    if (!slug) {
        coversFormStatus.style.color = '#dc2626';
        coversFormStatus.textContent = 'Pilih slot dulu.';
        return;
    }
    if (!newCoverImageFile) {
        coversFormStatus.style.color = '#dc2626';
        coversFormStatus.textContent = 'Pilih foto dulu.';
        return;
    }

    coversSubmitBtn.disabled = true;
    coversFormStatus.style.color = '#16a34a';
    coversFormStatus.textContent = 'Mengunggah...';

    try {
        const url = await uploadCoverImage(newCoverImageFile);

        const { error } = await client
            .from('struktur_covers')
            .upsert({ slug: slug, image_url: url, updated_at: new Date().toISOString() });

        if (error) throw error;

        coversFormStatus.textContent = 'Tersimpan.';
        newCoverImageFile = null;
        renderCoverImagePreview();
        coversForm.reset();
        loadCovers();
    } catch (err) {
        console.error(err);
        coversFormStatus.style.color = '#dc2626';
        coversFormStatus.textContent = 'Gagal mengunggah cover.';
    } finally {
        coversSubmitBtn.disabled = false;
    }
});

coversRefreshBtn.addEventListener('click', loadCovers);

async function loadCovers() {
    coversListEl.innerHTML = '<p class="admin-loading">Memuat cover...</p>';

    const { data, error } = await client
        .from('struktur_covers')
        .select('*')
        .order('slug');

    if (error) {
        coversListEl.innerHTML = '<p class="admin-empty">Gagal memuat cover: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    renderCoversList(data);
}

function renderCoversList(items) {
    if (!items || items.length === 0) {
        coversListEl.innerHTML = '<p class="admin-empty">Belum ada cover di database — halaman struktur masih pakai gambar default di HTML.</p>';
        return;
    }

    coversListEl.innerHTML = '';

    items.forEach(function (c) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';
        card.innerHTML =
            '<img src="' + c.image_url + '" class="admin-news-thumb" alt="Cover">' +
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + escapeHtml(SLOT_LABELS[c.slug] || c.slug) + '</span>' +
                '<span class="admin-comment-date">' + formatTanggal(c.updated_at) + '</span>' +
            '</div>' +
            '<div class="admin-comment-actions">' +
                '<button type="button" class="btn-danger btn-cover-delete">Hapus (kembali ke default)</button>' +
            '</div>';

        coversListEl.appendChild(card);

        card.querySelector('.btn-cover-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus cover untuk "' + (SLOT_LABELS[c.slug] || c.slug) + '"? Halaman akan kembali ke gambar default.');
            if (!yakin) return;

            const { error } = await client.from('struktur_covers').delete().eq('slug', c.slug);
            if (error) {
                alert('Gagal menghapus.');
                return;
            }
            card.remove();
        });
    });
}

/* ===================== PROFIL SEKBID (Tugas Umum, Koordinator, Syarat) ===================== */
const profilForm = document.getElementById('profil-form');
const profilSekbidSelect = document.getElementById('profil-sekbid-select');
const profilTugasUmum = document.getElementById('profil-tugas-umum');
const profilKoorNama = document.getElementById('profil-koor-nama');
const profilKoorKelas = document.getElementById('profil-koor-kelas');
const profilKoorFotoInput = document.getElementById('profil-koor-foto-input');
const profilKoorFotoPreview = document.getElementById('profil-koor-foto-preview');
const profilSyaratInput = document.getElementById('profil-syarat-input');
const profilFormStatus = document.getElementById('profil-form-status');
const profilSubmitBtn = document.getElementById('profil-submit-btn');
const profilRefreshBtn = document.getElementById('profil-refresh-btn');

let existingKoorFotoUrl = null;
let newKoorFotoFile = null;

function renderKoorFotoPreview() {
    profilKoorFotoPreview.innerHTML = '';
    const url = newKoorFotoFile ? URL.createObjectURL(newKoorFotoFile) : existingKoorFotoUrl;
    if (!url) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + url + '" alt="Pratinjau foto koordinator">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newKoorFotoFile = null;
        existingKoorFotoUrl = null;
        profilKoorFotoInput.value = '';
        renderKoorFotoPreview();
    });

    profilKoorFotoPreview.appendChild(item);
}

profilKoorFotoInput.addEventListener('change', function () {
    if (profilKoorFotoInput.files && profilKoorFotoInput.files[0]) {
        newKoorFotoFile = profilKoorFotoInput.files[0];
        renderKoorFotoPreview();
    }
});

async function uploadProfilImage(file) {
    const ext = file.name.split('.').pop();
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

    const { error } = await client.storage
        .from('sekbid-profile')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = client.storage.from('sekbid-profile').getPublicUrl(path);
    return data.publicUrl;
}

function resetProfilFormFields() {
    profilTugasUmum.value = '';
    profilKoorNama.value = '';
    profilKoorKelas.value = '';
    profilSyaratInput.value = '';
    existingKoorFotoUrl = null;
    newKoorFotoFile = null;
    renderKoorFotoPreview();
}

async function loadProfilForSekbid(sekbidId) {
    profilFormStatus.textContent = '';
    if (!sekbidId) {
        resetProfilFormFields();
        return;
    }

    const { data, error } = await client
        .from('sekbid_profile')
        .select('*')
        .eq('sekbid_id', sekbidId)
        .maybeSingle();

    if (error) {
        console.error(error);
        profilFormStatus.style.color = '#dc2626';
        profilFormStatus.textContent = 'Gagal memuat profil.';
        return;
    }

    if (!data) {
        resetProfilFormFields();
        return;
    }

    profilTugasUmum.value = data.tugas_umum || '';
    profilKoorNama.value = data.koordinator_nama || '';
    profilKoorKelas.value = data.koordinator_kelas || '';
    profilSyaratInput.value = Array.isArray(data.syarat_bergabung) ? data.syarat_bergabung.join('\n') : '';
    existingKoorFotoUrl = data.koordinator_foto_url || null;
    newKoorFotoFile = null;
    renderKoorFotoPreview();
}

profilSekbidSelect.addEventListener('change', function () {
    loadProfilForSekbid(profilSekbidSelect.value);
});

profilRefreshBtn.addEventListener('click', function () {
    loadProfilForSekbid(profilSekbidSelect.value);
});

profilForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const sekbidId = profilSekbidSelect.value;
    if (!sekbidId) {
        profilFormStatus.style.color = '#dc2626';
        profilFormStatus.textContent = 'Pilih sekbid dulu.';
        return;
    }

    profilSubmitBtn.disabled = true;
    profilFormStatus.style.color = '#16a34a';
    profilFormStatus.textContent = 'Menyimpan...';

    try {
        let koorFotoUrl = existingKoorFotoUrl;
        if (newKoorFotoFile) {
            koorFotoUrl = await uploadProfilImage(newKoorFotoFile);
        }

        const syaratArray = profilSyaratInput.value
            .split('\n')
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });

        const payload = {
            sekbid_id: sekbidId,
            tugas_umum: profilTugasUmum.value.trim() || null,
            koordinator_nama: profilKoorNama.value.trim() || null,
            koordinator_kelas: profilKoorKelas.value.trim() || null,
            koordinator_foto_url: koorFotoUrl || null,
            syarat_bergabung: syaratArray,
            updated_at: new Date().toISOString()
        };

        const { error } = await client.from('sekbid_profile').upsert(payload);
        if (error) throw error;

        existingKoorFotoUrl = koorFotoUrl;
        newKoorFotoFile = null;
        renderKoorFotoPreview();

        profilFormStatus.style.color = '#16a34a';
        profilFormStatus.textContent = 'Tersimpan.';
    } catch (err) {
        console.error(err);
        profilFormStatus.style.color = '#dc2626';
        profilFormStatus.textContent = 'Gagal menyimpan profil.';
    } finally {
        profilSubmitBtn.disabled = false;
    }
});

function loadProfil() {
    // Dipanggil saat tab "Profil Sekbid" dibuka.
    if (profilSekbidSelect.value) {
        loadProfilForSekbid(profilSekbidSelect.value);
    }
}

/* ===================== ANGGOTA TIM SEKBID ===================== */
const anggotaForm = document.getElementById('anggota-form');
const anggotaSekbidSelect = document.getElementById('anggota-sekbid-select');
const anggotaNama = document.getElementById('anggota-nama');
const anggotaKelas = document.getElementById('anggota-kelas');
const anggotaRole = document.getElementById('anggota-role');
const anggotaFotoInput = document.getElementById('anggota-foto-input');
const anggotaFotoPreview = document.getElementById('anggota-foto-preview');
const anggotaSort = document.getElementById('anggota-sort');
const anggotaFormStatus = document.getElementById('anggota-form-status');
const anggotaSubmitBtn = document.getElementById('anggota-submit-btn');
const anggotaCancelBtn = document.getElementById('anggota-cancel-btn');
const anggotaListEl = document.getElementById('admin-anggota-list');
const anggotaFilterSelect = document.getElementById('anggota-filter-select');

let editingAnggotaId = null;
let existingAnggotaFotoUrl = null;
let newAnggotaFotoFile = null;

function renderAnggotaFotoPreview() {
    anggotaFotoPreview.innerHTML = '';
    const url = newAnggotaFotoFile ? URL.createObjectURL(newAnggotaFotoFile) : existingAnggotaFotoUrl;
    if (!url) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + url + '" alt="Pratinjau foto anggota">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newAnggotaFotoFile = null;
        existingAnggotaFotoUrl = null;
        anggotaFotoInput.value = '';
        renderAnggotaFotoPreview();
    });

    anggotaFotoPreview.appendChild(item);
}

anggotaFotoInput.addEventListener('change', function () {
    if (anggotaFotoInput.files && anggotaFotoInput.files[0]) {
        newAnggotaFotoFile = anggotaFotoInput.files[0];
        renderAnggotaFotoPreview();
    }
});

function resetAnggotaForm() {
    editingAnggotaId = null;
    anggotaForm.reset();
    anggotaRole.value = 'Anggota';
    anggotaSort.value = 0;
    existingAnggotaFotoUrl = null;
    newAnggotaFotoFile = null;
    renderAnggotaFotoPreview();
    anggotaSubmitBtn.textContent = 'Tambah Anggota';
    anggotaCancelBtn.classList.add('hidden');
    anggotaFormStatus.textContent = '';
}

anggotaCancelBtn.addEventListener('click', resetAnggotaForm);
anggotaFilterSelect.addEventListener('change', loadAnggota);

anggotaForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const sekbidId = anggotaSekbidSelect.value;
    if (!sekbidId) {
        anggotaFormStatus.style.color = '#dc2626';
        anggotaFormStatus.textContent = 'Pilih sekbid dulu.';
        return;
    }

    anggotaSubmitBtn.disabled = true;
    anggotaFormStatus.style.color = '#16a34a';
    anggotaFormStatus.textContent = 'Menyimpan...';

    try {
        let fotoUrl = existingAnggotaFotoUrl;
        if (newAnggotaFotoFile) {
            fotoUrl = await uploadProfilImage(newAnggotaFotoFile);
        }

        const payload = {
            sekbid_id: sekbidId,
            nama: anggotaNama.value.trim(),
            kelas: anggotaKelas.value.trim() || null,
            role: anggotaRole.value.trim() || 'Anggota',
            foto_url: fotoUrl || null,
            sort_order: parseInt(anggotaSort.value, 10) || 0
        };

        let error;
        if (editingAnggotaId) {
            ({ error } = await client.from('sekbid_anggota').update(payload).eq('id', editingAnggotaId));
        } else {
            ({ error } = await client.from('sekbid_anggota').insert(payload));
        }

        if (error) throw error;

        anggotaFormStatus.style.color = '#16a34a';
        anggotaFormStatus.textContent = 'Tersimpan.';
        resetAnggotaForm();
        loadAnggota();
    } catch (err) {
        console.error(err);
        anggotaFormStatus.style.color = '#dc2626';
        anggotaFormStatus.textContent = 'Gagal menyimpan.';
    } finally {
        anggotaSubmitBtn.disabled = false;
    }
});

async function loadAnggota() {
    anggotaListEl.innerHTML = '<p class="admin-loading">Memuat anggota...</p>';

    let query = client.from('sekbid_anggota').select('*').order('sekbid_id').order('sort_order', { ascending: true });
    if (anggotaFilterSelect.value) {
        query = query.eq('sekbid_id', anggotaFilterSelect.value);
    }

    const { data, error } = await query;

    if (error) {
        anggotaListEl.innerHTML = '<p class="admin-empty">Gagal memuat anggota: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    const uniqueIds = Array.from(new Set((data || []).map(function (d) { return d.sekbid_id; })));
    const currentFilter = anggotaFilterSelect.value;
    anggotaFilterSelect.innerHTML = '<option value="">Semua Sekbid</option>' +
        uniqueIds.map(function (id) { return '<option value="' + escapeHtml(id) + '">' + escapeHtml(id) + '</option>'; }).join('');
    anggotaFilterSelect.value = currentFilter;

    renderAnggotaList(data);
}

function renderAnggotaList(items) {
    if (!items || items.length === 0) {
        anggotaListEl.innerHTML = '<p class="admin-empty">Belum ada anggota.</p>';
        return;
    }

    anggotaListEl.innerHTML = '';

    items.forEach(function (a) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';

        const thumb = a.foto_url
            ? '<img src="' + a.foto_url + '" class="admin-news-thumb" style="max-height:140px;" alt="Foto">'
            : '';

        card.innerHTML =
            thumb +
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + escapeHtml(a.nama) + '</span>' +
                '<span class="admin-comment-date">' + escapeHtml(a.sekbid_id) + ' &middot; urutan ' + a.sort_order + '</span>' +
            '</div>' +
            '<p style="font-size:0.88rem;color:#334155;">' + escapeHtml(a.kelas || '-') + ' &middot; ' + escapeHtml(a.role || 'Anggota') + '</p>' +
            '<div class="admin-comment-actions">' +
                '<button type="button" class="btn-danger btn-anggota-delete">Hapus</button>' +
                '<button type="button" class="btn-secondary btn-anggota-edit">Edit</button>' +
            '</div>';

        anggotaListEl.appendChild(card);

        card.querySelector('.btn-anggota-edit').addEventListener('click', function () {
            editingAnggotaId = a.id;
            anggotaSekbidSelect.value = a.sekbid_id;
            anggotaNama.value = a.nama;
            anggotaKelas.value = a.kelas || '';
            anggotaRole.value = a.role || 'Anggota';
            anggotaSort.value = a.sort_order || 0;
            existingAnggotaFotoUrl = a.foto_url || null;
            newAnggotaFotoFile = null;
            renderAnggotaFotoPreview();

            anggotaSubmitBtn.textContent = 'Simpan Perubahan';
            anggotaCancelBtn.classList.remove('hidden');
            anggotaForm.scrollIntoView({ behavior: 'smooth' });
        });

        card.querySelector('.btn-anggota-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus anggota "' + a.nama + '"?');
            if (!yakin) return;

            const { error } = await client.from('sekbid_anggota').delete().eq('id', a.id);
            if (error) {
                alert('Gagal menghapus.');
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

/* ===================== OPEN RECRUITMENT ===================== */
const oprecSettingsForm = document.getElementById('oprec-settings-form');
const oprecIsOpen = document.getElementById('oprec-is-open');
const oprecDescriptionInput = document.getElementById('oprec-description-input');
const oprecTanggalMulai = document.getElementById('oprec-tanggal-mulai');
const oprecTanggalSelesai = document.getElementById('oprec-tanggal-selesai');
const oprecFormUrl = document.getElementById('oprec-form-url');
const oprecRequirementsInput = document.getElementById('oprec-requirements-input');
const oprecPamphletInput = document.getElementById('oprec-pamphlet-input');
const oprecPamphletPreview = document.getElementById('oprec-pamphlet-preview');
const oprecSettingsStatus = document.getElementById('oprec-settings-status');
const oprecSettingsSubmitBtn = document.getElementById('oprec-settings-submit-btn');
const oprecRefreshBtn = document.getElementById('oprec-refresh-btn');

let existingPamphletUrl = null;
let newPamphletFile = null;

function renderPamphletPreview() {
    oprecPamphletPreview.innerHTML = '';
    const url = newPamphletFile ? URL.createObjectURL(newPamphletFile) : existingPamphletUrl;
    if (!url) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + url + '" alt="Pratinjau pamflet">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newPamphletFile = null;
        existingPamphletUrl = null;
        oprecPamphletInput.value = '';
        renderPamphletPreview();
    });

    oprecPamphletPreview.appendChild(item);
}

oprecPamphletInput.addEventListener('change', function () {
    if (oprecPamphletInput.files && oprecPamphletInput.files[0]) {
        newPamphletFile = oprecPamphletInput.files[0];
        renderPamphletPreview();
    }
});

async function uploadOprecAsset(file) {
    const ext = file.name.split('.').pop();
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

    const { error } = await client.storage
        .from('oprec-assets')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = client.storage.from('oprec-assets').getPublicUrl(path);
    return data.publicUrl;
}

async function loadOprecSettings() {
    oprecSettingsStatus.textContent = '';

    const { data, error } = await client
        .from('oprec_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    if (error) {
        console.error(error);
        oprecSettingsStatus.style.color = '#dc2626';
        oprecSettingsStatus.textContent = 'Gagal memuat pengaturan.';
        return;
    }

    if (!data) {
        // Belum ada baris settings — biarkan form kosong, akan dibuat saat pertama kali disimpan.
        return;
    }

    oprecIsOpen.checked = !!data.is_open;
    oprecDescriptionInput.value = data.description || '';
    oprecTanggalMulai.value = data.tanggal_mulai || '';
    oprecTanggalSelesai.value = data.tanggal_selesai || '';
    oprecFormUrl.value = data.form_url || '';
    oprecRequirementsInput.value = Array.isArray(data.requirements) ? data.requirements.join('\n') : '';

    existingPamphletUrl = data.pamphlet_url || null;
    newPamphletFile = null;
    renderPamphletPreview();
}

oprecRefreshBtn.addEventListener('click', function () {
    loadOprecSettings();
    loadOprecContacts();
});

oprecSettingsForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    oprecSettingsSubmitBtn.disabled = true;
    oprecSettingsStatus.style.color = '#16a34a';
    oprecSettingsStatus.textContent = 'Menyimpan...';

    try {
        let pamphletUrl = existingPamphletUrl;
        if (newPamphletFile) {
            pamphletUrl = await uploadOprecAsset(newPamphletFile);
        }

        const requirements = oprecRequirementsInput.value
            .split('\n')
            .map(function (r) { return r.trim(); })
            .filter(function (r) { return r.length > 0; });

        const payload = {
            id: 1,
            is_open: oprecIsOpen.checked,
            description: oprecDescriptionInput.value.trim() || null,
            tanggal_mulai: oprecTanggalMulai.value || null,
            tanggal_selesai: oprecTanggalSelesai.value || null,
            form_url: oprecFormUrl.value.trim() || null,
            requirements: requirements,
            pamphlet_url: pamphletUrl || null,
            updated_at: new Date().toISOString()
        };

        const { error } = await client.from('oprec_settings').upsert(payload);
        if (error) throw error;

        existingPamphletUrl = pamphletUrl;
        newPamphletFile = null;
        renderPamphletPreview();

        oprecSettingsStatus.style.color = '#16a34a';
        oprecSettingsStatus.textContent = 'Tersimpan.';
    } catch (err) {
        console.error(err);
        oprecSettingsStatus.style.color = '#dc2626';
        oprecSettingsStatus.textContent = 'Gagal menyimpan pengaturan.';
    } finally {
        oprecSettingsSubmitBtn.disabled = false;
    }
});

/* --- Contact Person Open Recruitment --- */
const oprecCpForm = document.getElementById('oprec-cp-form');
const oprecCpName = document.getElementById('oprec-cp-name');
const oprecCpPhone = document.getElementById('oprec-cp-phone');
const oprecCpSort = document.getElementById('oprec-cp-sort');
const oprecCpPhotoInput = document.getElementById('oprec-cp-photo-input');
const oprecCpPhotoPreview = document.getElementById('oprec-cp-photo-preview');
const oprecCpFormStatus = document.getElementById('oprec-cp-form-status');
const oprecCpSubmitBtn = document.getElementById('oprec-cp-submit-btn');
const oprecCpCancelBtn = document.getElementById('oprec-cp-cancel-btn');
const oprecCpListEl = document.getElementById('admin-oprec-cp-list');

let editingCpId = null;
let existingCpPhotoUrl = null;
let newCpPhotoFile = null;

function renderCpPhotoPreview() {
    oprecCpPhotoPreview.innerHTML = '';
    const url = newCpPhotoFile ? URL.createObjectURL(newCpPhotoFile) : existingCpPhotoUrl;
    if (!url) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + url + '" alt="Pratinjau foto">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newCpPhotoFile = null;
        existingCpPhotoUrl = null;
        oprecCpPhotoInput.value = '';
        renderCpPhotoPreview();
    });

    oprecCpPhotoPreview.appendChild(item);
}

oprecCpPhotoInput.addEventListener('change', function () {
    if (oprecCpPhotoInput.files && oprecCpPhotoInput.files[0]) {
        newCpPhotoFile = oprecCpPhotoInput.files[0];
        renderCpPhotoPreview();
    }
});

function resetOprecCpForm() {
    editingCpId = null;
    oprecCpForm.reset();
    oprecCpSort.value = 0;
    existingCpPhotoUrl = null;
    newCpPhotoFile = null;
    renderCpPhotoPreview();
    oprecCpSubmitBtn.textContent = 'Tambah Contact Person';
    oprecCpCancelBtn.classList.add('hidden');
    oprecCpFormStatus.textContent = '';
}

oprecCpCancelBtn.addEventListener('click', resetOprecCpForm);

oprecCpForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    oprecCpSubmitBtn.disabled = true;
    oprecCpFormStatus.style.color = '#16a34a';
    oprecCpFormStatus.textContent = 'Menyimpan...';

    try {
        let photoUrl = existingCpPhotoUrl;
        if (newCpPhotoFile) {
            photoUrl = await uploadOprecAsset(newCpPhotoFile);
        }

        const payload = {
            name: oprecCpName.value.trim(),
            phone: oprecCpPhone.value.trim(),
            sort_order: parseInt(oprecCpSort.value, 10) || 0,
            photo_url: photoUrl || null
        };

        let error;
        if (editingCpId) {
            ({ error } = await client.from('oprec_contacts').update(payload).eq('id', editingCpId));
        } else {
            ({ error } = await client.from('oprec_contacts').insert(payload));
        }

        if (error) throw error;

        oprecCpFormStatus.style.color = '#16a34a';
        oprecCpFormStatus.textContent = 'Tersimpan.';
        resetOprecCpForm();
        loadOprecContacts();
    } catch (err) {
        console.error(err);
        oprecCpFormStatus.style.color = '#dc2626';
        oprecCpFormStatus.textContent = 'Gagal menyimpan.';
    } finally {
        oprecCpSubmitBtn.disabled = false;
    }
});

async function loadOprecContacts() {
    oprecCpListEl.innerHTML = '<p class="admin-loading">Memuat contact person...</p>';

    const { data, error } = await client
        .from('oprec_contacts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        oprecCpListEl.innerHTML = '<p class="admin-empty">Gagal memuat: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    renderOprecCpList(data);
}

function renderOprecCpList(items) {
    if (!items || items.length === 0) {
        oprecCpListEl.innerHTML = '<p class="admin-empty">Belum ada contact person.</p>';
        return;
    }

    oprecCpListEl.innerHTML = '';

    items.forEach(function (c) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';

        const thumb = c.photo_url
            ? '<img src="' + c.photo_url + '" class="admin-news-thumb" style="max-height:120px;width:120px;border-radius:50%;" alt="Foto">'
            : '';

        card.innerHTML =
            thumb +
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + escapeHtml(c.name) + '</span>' +
                '<span class="admin-comment-date">urutan ' + c.sort_order + '</span>' +
            '</div>' +
            '<p style="font-size:0.88rem;color:#334155;">' + escapeHtml(c.phone) + '</p>' +
            '<div class="admin-comment-actions">' +
                '<button type="button" class="btn-danger btn-oprec-cp-delete">Hapus</button>' +
                '<button type="button" class="btn-secondary btn-oprec-cp-edit">Edit</button>' +
            '</div>';

        oprecCpListEl.appendChild(card);

        card.querySelector('.btn-oprec-cp-edit').addEventListener('click', function () {
            editingCpId = c.id;
            oprecCpName.value = c.name;
            oprecCpPhone.value = c.phone;
            oprecCpSort.value = c.sort_order || 0;
            existingCpPhotoUrl = c.photo_url || null;
            newCpPhotoFile = null;
            renderCpPhotoPreview();

            oprecCpSubmitBtn.textContent = 'Simpan Perubahan';
            oprecCpCancelBtn.classList.remove('hidden');
            oprecCpForm.scrollIntoView({ behavior: 'smooth' });
        });

        card.querySelector('.btn-oprec-cp-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus contact person "' + c.name + '"?');
            if (!yakin) return;

            const { error } = await client.from('oprec_contacts').delete().eq('id', c.id);
            if (error) {
                alert('Gagal menghapus.');
                return;
            }
            card.remove();
        });
    });
}

    /* --- Preview & upload sampul (kini bisa foto ATAU video) --- */
    function renderCoverPreview() {
        coverPreviewWrap.innerHTML = '';
        const url = newCoverFile ? URL.createObjectURL(newCoverFile) : existingCoverUrl;
        if (!url) return;

        const isVideo = newCoverFile ? isVideoFile(newCoverFile) : isVideoUrl(existingCoverUrl);

        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML =
            (isVideo
                ? '<video src="' + url + '" muted loop autoplay playsinline></video>'
                : '<img src="' + url + '" alt="Pratinjau sampul">') +
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

    /* --- Preview & upload video berita (video "isi", terpisah dari sampul) --- */
    function renderVideoPreview() {
        newsVideoPreviewWrap.innerHTML = '';
        const url = newVideoFile ? URL.createObjectURL(newVideoFile) : existingVideoUrl;
        if (!url) return;

        const item = document.createElement('div');
        item.className = 'image-preview-item';
        item.innerHTML =
            '<video src="' + url + '" controls style="width:100%;max-height:180px;border-radius:8px;"></video>' +
            '<button type="button" class="image-preview-remove">✕</button>';

        item.querySelector('.image-preview-remove').addEventListener('click', function () {
            newVideoFile = null;
            existingVideoUrl = null;
            newsVideoInput.value = '';
            renderVideoPreview();
        });

        newsVideoPreviewWrap.appendChild(item);
    }

    newsVideoInput.addEventListener('change', function () {
        if (newsVideoInput.files && newsVideoInput.files[0]) {
            newVideoFile = newsVideoInput.files[0];
            renderVideoPreview();
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

    async function uploadNewsVideo(file) {
        const ext = file.name.split('.').pop();
        const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

        const { error } = await client.storage
            .from('news-videos')
            .upload(path, file, { upsert: false });

        if (error) throw error;

        const { data } = client.storage.from('news-videos').getPublicUrl(path);
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
                // Sampul kini boleh foto atau video — upload ke bucket sesuai jenis filenya.
                coverUrl = isVideoFile(newCoverFile)
                    ? await uploadNewsVideo(newCoverFile)
                    : await uploadNewsImage(newCoverFile);
            }

            let contentImageUrls = existingContentImages.slice();
            for (const file of newContentImageFiles) {
                const url = await uploadNewsImage(file);
                contentImageUrls.push(url);
            }

            let videoUrl = existingVideoUrl;
            if (newVideoFile) {
                newsFormStatus.textContent = 'Mengunggah video...';
                videoUrl = await uploadNewsVideo(newVideoFile);
            }

            const payload = {
                category: newsCategory.value.trim(),
                title: newsTitle.value.trim(),
                content: newsContent.value.trim(),
                is_published: newsPublished.checked,
                cover_image_url: coverUrl || null,
                content_images: contentImageUrls,
                video_url: videoUrl || null,
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
                ? (isVideoUrl(n.cover_image_url)
                    ? '<video src="' + n.cover_image_url + '" class="admin-news-thumb" muted loop autoplay playsinline></video>'
                    : '<img src="' + n.cover_image_url + '" class="admin-news-thumb" alt="Sampul">')
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
                    (n.video_url ? ' &middot; 🎬 ada video' : '') +
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
                existingVideoUrl = n.video_url || null;
                newVideoFile = null;
                renderCoverPreview();
                renderContentImagesPreview();
                renderVideoPreview();

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

    
    /* ===================== PENGURUS HARIAN (PH) ===================== */
const PH_GROUP_LABELS = {
    ketua: 'Ketua & Wakil',
    sekretaris: 'Sekretaris',
    bendahara: 'Bendahara'
};

/* --- Elemen: profil grup --- */
const phProfilForm      = document.getElementById('ph-profil-form');
const phGroupSelect     = document.getElementById('ph-group-select');
const phHeroTitle       = document.getElementById('ph-hero-title');
const phHeroSubtitle    = document.getElementById('ph-hero-subtitle');
const phTugasUmum       = document.getElementById('ph-tugas-umum');
const phTugasListInput  = document.getElementById('ph-tugas-list-input');
const phProfilStatus    = document.getElementById('ph-profil-status');
const phProfilSubmitBtn = document.getElementById('ph-profil-submit-btn');
const phRefreshBtn      = document.getElementById('ph-refresh-btn');

/* --- Elemen: anggota --- */
const phMemberForm        = document.getElementById('ph-member-form');
const phMemberGroupSelect = document.getElementById('ph-member-group-select');
const phMemberLabel       = document.getElementById('ph-member-label');
const phMemberNama        = document.getElementById('ph-member-nama');
const phMemberKelas       = document.getElementById('ph-member-kelas');
const phMemberMotto       = document.getElementById('ph-member-motto');
const phMemberFotoInput   = document.getElementById('ph-member-foto-input');
const phMemberFotoPreview = document.getElementById('ph-member-foto-preview');
const phMemberSort        = document.getElementById('ph-member-sort');
const phMemberStatus      = document.getElementById('ph-member-status');
const phMemberSubmitBtn   = document.getElementById('ph-member-submit-btn');
const phMemberCancelBtn   = document.getElementById('ph-member-cancel-btn');
const phMemberFilter      = document.getElementById('ph-member-filter-select');
const phMemberListEl      = document.getElementById('admin-ph-member-list');

let editingPhMemberId   = null;
let existingPhFotoUrl   = null;
let newPhFotoFile       = null;

/* --- Upload foto PH ke bucket "ph-profile" --- */
async function uploadPhImage(file) {
    const ext  = file.name.split('.').pop();
    const path = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

    const { error } = await client.storage
        .from('ph-profile')
        .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = client.storage.from('ph-profile').getPublicUrl(path);
    return data.publicUrl;
}

/* ---------- PROFIL GRUP ---------- */
function resetPhProfilFields() {
    phHeroTitle.value      = '';
    phHeroSubtitle.value   = '';
    phTugasUmum.value      = '';
    phTugasListInput.value = '';
}

async function loadPhProfilForGroup(groupSlug) {
    phProfilStatus.textContent = '';
    if (!groupSlug) {
        resetPhProfilFields();
        return;
    }

    const { data, error } = await client
        .from('ph_profile')
        .select('*')
        .eq('group_slug', groupSlug)
        .maybeSingle();

    if (error) {
        console.error(error);
        phProfilStatus.style.color = '#dc2626';
        phProfilStatus.textContent = 'Gagal memuat profil PH.';
        return;
    }

    if (!data) {
        resetPhProfilFields();
        return;
    }

    phHeroTitle.value      = data.hero_title || '';
    phHeroSubtitle.value   = data.hero_subtitle || '';
    phTugasUmum.value      = data.tugas_umum || '';
    phTugasListInput.value = Array.isArray(data.tugas_list) ? data.tugas_list.join('\n') : '';
}

phGroupSelect.addEventListener('change', function () {
    loadPhProfilForGroup(phGroupSelect.value);
});

phProfilForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const groupSlug = phGroupSelect.value;
    if (!groupSlug) {
        phProfilStatus.style.color = '#dc2626';
        phProfilStatus.textContent = 'Pilih grup dulu.';
        return;
    }

    phProfilSubmitBtn.disabled = true;
    phProfilStatus.style.color = '#16a34a';
    phProfilStatus.textContent = 'Menyimpan...';

    const tugasArray = phTugasListInput.value
        .split('\n')
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });

    const payload = {
        group_slug:    groupSlug,
        hero_title:    phHeroTitle.value.trim() || null,
        hero_subtitle: phHeroSubtitle.value.trim() || null,
        tugas_umum:    phTugasUmum.value.trim() || null,
        tugas_list:    tugasArray,
        updated_at:    new Date().toISOString()
    };

    const { error } = await client.from('ph_profile').upsert(payload);

    phProfilSubmitBtn.disabled = false;

    if (error) {
        console.error(error);
        phProfilStatus.style.color = '#dc2626';
        phProfilStatus.textContent = 'Gagal menyimpan profil PH.';
        return;
    }

    phProfilStatus.style.color = '#16a34a';
    phProfilStatus.textContent = 'Tersimpan.';
});

function loadPhProfil() {
    if (phGroupSelect.value) {
        loadPhProfilForGroup(phGroupSelect.value);
    }
}

/* ---------- ANGGOTA PH ---------- */
function renderPhFotoPreview() {
    phMemberFotoPreview.innerHTML = '';
    const url = newPhFotoFile ? URL.createObjectURL(newPhFotoFile) : existingPhFotoUrl;
    if (!url) return;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML =
        '<img src="' + url + '" alt="Pratinjau foto PH">' +
        '<button type="button" class="image-preview-remove">✕</button>';

    item.querySelector('.image-preview-remove').addEventListener('click', function () {
        newPhFotoFile     = null;
        existingPhFotoUrl = null;
        phMemberFotoInput.value = '';
        renderPhFotoPreview();
    });

    phMemberFotoPreview.appendChild(item);
}

phMemberFotoInput.addEventListener('change', function () {
    if (phMemberFotoInput.files && phMemberFotoInput.files[0]) {
        newPhFotoFile = phMemberFotoInput.files[0];
        renderPhFotoPreview();
    }
});

function resetPhMemberForm() {
    editingPhMemberId = null;
    phMemberForm.reset();
    phMemberSort.value = 0;
    existingPhFotoUrl  = null;
    newPhFotoFile      = null;
    renderPhFotoPreview();
    phMemberSubmitBtn.textContent = 'Tambah Anggota PH';
    phMemberCancelBtn.classList.add('hidden');
    phMemberStatus.textContent = '';
}

phMemberCancelBtn.addEventListener('click', resetPhMemberForm);
phMemberFilter.addEventListener('change', loadPhMembers);

phRefreshBtn.addEventListener('click', function () {
    loadPhProfilForGroup(phGroupSelect.value);
    loadPhMembers();
});

phMemberForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const groupSlug = phMemberGroupSelect.value;
    if (!groupSlug) {
        phMemberStatus.style.color = '#dc2626';
        phMemberStatus.textContent = 'Pilih grup dulu.';
        return;
    }

    phMemberSubmitBtn.disabled = true;
    phMemberStatus.style.color = '#16a34a';
    phMemberStatus.textContent = 'Menyimpan...';

    try {
        let fotoUrl = existingPhFotoUrl;
        if (newPhFotoFile) {
            fotoUrl = await uploadPhImage(newPhFotoFile);
        }

        const payload = {
            group_slug: groupSlug,
            label:      phMemberLabel.value.trim() || null,
            nama:       phMemberNama.value.trim(),
            kelas:      phMemberKelas.value.trim() || null,
            motto:      phMemberMotto.value.trim() || null,
            foto_url:   fotoUrl || null,
            sort_order: parseInt(phMemberSort.value, 10) || 0
        };

        let error;
        if (editingPhMemberId) {
            ({ error } = await client.from('ph_members').update(payload).eq('id', editingPhMemberId));
        } else {
            ({ error } = await client.from('ph_members').insert(payload));
        }

        if (error) throw error;

        phMemberStatus.style.color = '#16a34a';
        phMemberStatus.textContent = 'Tersimpan.';
        resetPhMemberForm();
        loadPhMembers();
    } catch (err) {
        console.error(err);
        phMemberStatus.style.color = '#dc2626';
        phMemberStatus.textContent = 'Gagal menyimpan anggota PH.';
    } finally {
        phMemberSubmitBtn.disabled = false;
    }
});

async function loadPhMembers() {
    phMemberListEl.innerHTML = '<p class="admin-loading">Memuat anggota PH...</p>';

    let query = client.from('ph_members')
        .select('*')
        .order('group_slug', { ascending: true })
        .order('sort_order', { ascending: true });

    if (phMemberFilter.value) {
        query = query.eq('group_slug', phMemberFilter.value);
    }

    const { data, error } = await query;

    if (error) {
        phMemberListEl.innerHTML = '<p class="admin-empty">Gagal memuat: ' + escapeHtml(error.message) + '</p>';
        return;
    }

    renderPhMemberList(data);
}

function renderPhMemberList(items) {
    if (!items || items.length === 0) {
        phMemberListEl.innerHTML = '<p class="admin-empty">Belum ada anggota PH.</p>';
        return;
    }

    phMemberListEl.innerHTML = '';

    items.forEach(function (m) {
        const card = document.createElement('div');
        card.className = 'admin-comment-card';

        const thumb = m.foto_url
            ? '<img src="' + m.foto_url + '" class="admin-news-thumb" style="max-height:140px;" alt="Foto">'
            : '';

        card.innerHTML =
            thumb +
            '<div class="admin-comment-head">' +
                '<span class="admin-comment-name">' + escapeHtml(m.nama) + '</span>' +
                '<span class="admin-comment-date">' +
                    escapeHtml(PH_GROUP_LABELS[m.group_slug] || m.group_slug) +
                    ' &middot; urutan ' + m.sort_order +
                '</span>' +
            '</div>' +
            '<p style="font-size:0.88rem;color:#334155;">' +
                escapeHtml(m.label || '-') + ' &middot; ' + escapeHtml(m.kelas || '-') +
            '</p>' +
            (m.motto ? '<p style="font-size:0.85rem;color:#64748b;font-style:italic;">“' + escapeHtml(m.motto) + '”</p>' : '') +
            '<div class="admin-comment-actions">' +
                '<button type="button" class="btn-danger btn-ph-delete">Hapus</button>' +
                '<button type="button" class="btn-secondary btn-ph-edit">Edit</button>' +
            '</div>';

        phMemberListEl.appendChild(card);

        card.querySelector('.btn-ph-edit').addEventListener('click', function () {
            editingPhMemberId            = m.id;
            phMemberGroupSelect.value    = m.group_slug;
            phMemberLabel.value          = m.label || '';
            phMemberNama.value           = m.nama;
            phMemberKelas.value          = m.kelas || '';
            phMemberMotto.value          = m.motto || '';
            phMemberSort.value           = m.sort_order || 0;
            existingPhFotoUrl            = m.foto_url || null;
            newPhFotoFile                = null;
            renderPhFotoPreview();

            phMemberSubmitBtn.textContent = 'Simpan Perubahan';
            phMemberCancelBtn.classList.remove('hidden');
            phMemberForm.scrollIntoView({ behavior: 'smooth' });
        });

        card.querySelector('.btn-ph-delete').addEventListener('click', async function () {
            const yakin = confirm('Hapus anggota PH "' + m.nama + '"?');
            if (!yakin) return;

            const { error } = await client.from('ph_members').delete().eq('id', m.id);
            if (error) {
                alert('Gagal menghapus.');
                return;
            }
            card.remove();
        });
    });
}

})();
