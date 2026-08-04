/* =========================================
   FITUR KOMENTAR (SUPABASE) - OSIS SMKN 1 Bantul
   Komentar disimpan di database Supabase supaya
   bisa dilihat oleh semua pengunjung, dan bisa
   diedit / dibalas lewat panel admin.
   ========================================= */

// TODO: Ganti dua nilai ini dengan milikmu sendiri.
// Ambil dari Supabase Dashboard > Settings > API
const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

(function () {
    if (!window.supabase) {
        console.error('Supabase SDK belum termuat. Pastikan script supabase-js ditaruh sebelum comment.js');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const form = document.getElementById('comment-form');
    const nameInput = document.getElementById('comment-name');
    const textInput = document.getElementById('comment-text');
    const listEl = document.getElementById('comment-list');
    const submitBtn = form ? form.querySelector('.comment-submit') : null;

    if (!form || !listEl) return;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTanggal(iso) {
        const date = new Date(iso);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function renderComments(comments) {
        if (!comments || comments.length === 0) {
            listEl.innerHTML = '<p class="comment-empty">Belum ada komentar. Jadilah yang pertama menulis!</p>';
            return;
        }

        listEl.innerHTML = comments
            .map(function (c) {
                const editedBadge = c.is_edited
                    ? '<span class="comment-edited-badge">(diedit)</span>'
                    : '';

                const replyBlock = c.admin_reply
                    ? (
                        '<div class="comment-reply">' +
                            '<div class="comment-reply-head">' +
                                '<span class="comment-reply-badge">Balasan OSIS</span>' +
                                (c.replied_at ? '<span class="comment-item-date">' + formatTanggal(c.replied_at) + '</span>' : '') +
                            '</div>' +
                            '<p class="comment-reply-text">' + escapeHtml(c.admin_reply) + '</p>' +
                        '</div>'
                    )
                    : '';

                return (
                    '<div class="comment-item">' +
                        '<div class="comment-item-head">' +
                            '<span class="comment-item-name">' + escapeHtml(c.name) + ' ' + editedBadge + '</span>' +
                            '<span class="comment-item-date">' + formatTanggal(c.created_at) + '</span>' +
                        '</div>' +
                        '<p class="comment-item-text">' + escapeHtml(c.message) + '</p>' +
                        replyBlock +
                    '</div>'
                );
            })
            .join('');
    }

    async function loadComments() {
        listEl.innerHTML = '<p class="comment-empty">Memuat komentar...</p>';

        const { data, error } = await client
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Gagal memuat komentar:', error);
            listEl.innerHTML = '<p class="comment-empty">Gagal memuat komentar. Coba muat ulang halaman.</p>';
            return;
        }

        renderComments(data);
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = nameInput.value.trim();
        const message = textInput.value.trim();
        if (!name || !message) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Mengirim...';
        }

        const { error } = await client
            .from('comments')
            .insert([{ name: name, message: message }]);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Komentar';
        }

        if (error) {
            console.error('Gagal mengirim komentar:', error);
            alert('Komentar gagal terkirim. Coba lagi sebentar lagi.');
            return;
        }

        form.reset();
        loadComments();
    });

    loadComments();
})();