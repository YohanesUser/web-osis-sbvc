/* =========================================
   OPEN RECRUITMENT (PUBLIK) - Ambil data dari Supabase
   ========================================= */

(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    if (!window.supabase) {
        console.error('Supabase SDK belum termuat.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function formatTanggalIndo(isoDate) {
        if (!isoDate) return '';
        const d = new Date(isoDate + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const statusBadge = document.getElementById('oprec-status-badge');
    const statusText = document.getElementById('oprec-status-text');
    const titleEl = document.getElementById('oprec-title');
    const descEl = document.getElementById('oprec-description');
    const datesEl = document.getElementById('oprec-dates');
    const pamphletSection = document.getElementById('oprec-pamphlet-section');
    const pamphletImg = document.getElementById('oprec-pamphlet-img');
    const pamphletLink = document.getElementById('oprec-pamphlet-link');
    const reqSection = document.getElementById('oprec-req-section');
    const reqList = document.getElementById('oprec-req-list');
    const formNote = document.getElementById('oprec-form-note');
    const formBtn = document.getElementById('oprec-form-btn');
    const cpList = document.getElementById('oprec-cp-list');

    async function loadSettings() {
        const { data, error } = await client
            .from('oprec_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error || !data) {
            console.error(error);
            statusText.textContent = 'STATUS TIDAK DIKETAHUI';
            titleEl.textContent = 'Open Recruitment OSIS';
            descEl.textContent = 'Informasi belum tersedia saat ini. Silakan cek kembali nanti.';
            formNote.textContent = 'Formulir belum tersedia.';
            formBtn.textContent = 'Belum Tersedia';
            return;
        }

        renderSettings(data);
    }

    function renderSettings(s) {
        const isOpen = !!s.is_open;

        statusBadge.classList.toggle('closed', !isOpen);
        statusText.textContent = isOpen ? 'PENDAFTARAN DIBUKA' : 'PENDAFTARAN DITUTUP';

        titleEl.textContent = isOpen
            ? 'Open Recruitment OSIS'
            : 'Sampai Jumpa Tahun Depan!';

        descEl.textContent = s.description ||
            (isOpen
                ? 'Pendaftaran anggota baru OSIS sedang dibuka. Yuk bergabung!'
                : 'Pendaftaran anggota baru OSIS saat ini sudah ditutup.');

        if (s.tanggal_mulai || s.tanggal_selesai) {
            const mulai = formatTanggalIndo(s.tanggal_mulai);
            const selesai = formatTanggalIndo(s.tanggal_selesai);
            let text = '';
            if (mulai && selesai) text = 'Periode pendaftaran: ' + mulai + ' — ' + selesai;
            else if (mulai) text = 'Pendaftaran dibuka mulai ' + mulai;
            else if (selesai) text = 'Pendaftaran ditutup pada ' + selesai;
            datesEl.textContent = text;
            datesEl.classList.remove('hidden');
        } else {
            datesEl.classList.add('hidden');
        }

        if (s.pamphlet_url) {
            pamphletImg.src = s.pamphlet_url;
            pamphletLink.href = s.pamphlet_url;
            pamphletSection.classList.remove('hidden');
        } else {
            pamphletSection.classList.add('hidden');
        }

        if (Array.isArray(s.requirements) && s.requirements.length > 0) {
            reqList.innerHTML = s.requirements.map(function (r) {
                return '<li>' + escapeHtml(r) + '</li>';
            }).join('');
            reqSection.classList.remove('hidden');
        } else {
            reqSection.classList.add('hidden');
        }

        if (isOpen && s.form_url) {
            formNote.textContent = 'Klik tombol di bawah untuk mengisi formulir pendaftaran.';
            formBtn.href = s.form_url;
            formBtn.textContent = 'Daftar Sekarang';
            formBtn.classList.remove('btn-disabled');
            formBtn.removeAttribute('aria-disabled');
        } else {
            formNote.textContent = isOpen
                ? 'Formulir pendaftaran belum tersedia, silakan cek kembali nanti.'
                : 'Mohon maaf, periode pendaftaran open recruitment saat ini sudah ditutup. Pantau terus Instagram dan info sekolah untuk pembukaan pendaftaran periode berikutnya.';
            formBtn.removeAttribute('href');
            formBtn.textContent = isOpen ? 'Belum Tersedia' : 'Pendaftaran Ditutup';
            formBtn.classList.add('btn-disabled');
            formBtn.setAttribute('aria-disabled', 'true');
        }
    }

    async function loadContacts() {
        const { data, error } = await client
            .from('oprec_contacts')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error(error);
            cpList.innerHTML = '<p class="oprec-loading">Gagal memuat kontak.</p>';
            return;
        }

        renderContacts(data);
    }

    function renderContacts(items) {
        if (!items || items.length === 0) {
            cpList.innerHTML = '<p class="oprec-loading">Belum ada contact person.</p>';
            return;
        }

        cpList.innerHTML = items.map(function (c) {
            const phoneDigits = (c.phone || '').replace(/[^0-9]/g, '');
            const photo = c.photo_url || 'https://apwgipefbiszpeoyvfta.supabase.co/storage/v1/object/public/foto/logo-osis.jpg';
            return (
                '<a href="https://wa.me/' + escapeHtml(phoneDigits) + '" target="_blank" class="cp-card">' +
                    '<img src="' + escapeHtml(photo) + '" alt="' + escapeHtml(c.name) + '" class="cp-photo">' +
                    '<div class="cp-info">' +
                        '<strong>' + escapeHtml(c.name) + '</strong>' +
                        '<span class="wa-number">' +
                            '<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" class="wa-icon">' +
                            escapeHtml(c.phone || '') +
                        '</span>' +
                    '</div>' +
                '</a>'
            );
        }).join('');
    }

    loadSettings();
    loadContacts();
})();