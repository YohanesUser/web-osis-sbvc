/* =========================================
   BERANDA ADMIN - OSIS SMKN 1 Bantul
   ========================================= */

(function () {
    const STATS_ENDPOINT = null; // isi dengan URL Edge Function server-stats jika sudah dibuat

    const dashboardPanel = document.getElementById('tab-dashboard');
    if (!dashboardPanel) return;

    const refreshBtn = document.getElementById('dashboard-refresh-btn');
    const adminEmailEl = document.getElementById('admin-email');

    function getClient() {
        return window.__sbClient || null;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function setMeter(id, percent) {
        const el = document.getElementById(id);
        if (!el) return;
        const p = Math.min(100, Math.max(0, Number(percent) || 0));
        el.style.width = p + '%';
        el.classList.remove('warn', 'danger');
        if (p >= 90) el.classList.add('danger');
        else if (p >= 70) el.classList.add('warn');
    }

    function greetingByHour() {
        const h = new Date().getHours();
        if (h < 11) return 'Selamat pagi';
        if (h < 15) return 'Selamat siang';
        if (h < 18) return 'Selamat sore';
        return 'Selamat malam';
    }

    function renderWelcome() {
        const email = ((adminEmailEl && adminEmailEl.textContent) || '').split('@')[0];
        setText('welcome-text', greetingByHour() + (email ? ', ' + email : ', Admin') + ' 👋');
        setText('welcome-time', new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }));
    }

    async function loadCounts(client) {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const [newsRes, commentRes] = await Promise.all([
            client.from('news').select('id', { count: 'exact', head: true }),
            client.from('comments').select('id', { count: 'exact', head: true }).gte('created_at', since)
        ]);
        setText('stat-news', newsRes.count ?? '-');
        setText('stat-comments', commentRes.count ?? '-');
    }

    async function loadDbStatus(client) {
        const t0 = performance.now();
        const ping = await client.from('news').select('id', { head: true, count: 'exact' }).limit(1);
        const latency = Math.round(performance.now() - t0);
        setText('stat-db', ping.error ? 'Gangguan' : 'Normal · ' + latency + ' ms');
    }

    async function loadServerStats(client) {
        if (!STATS_ENDPOINT) {
            setText('stat-visitors', '-');
            setText('stat-cpu', 'Belum tersedia');
            setText('stat-ram', 'Belum tersedia');
            return;
        }
        try {
            const { data: { session } } = await client.auth.getSession();
            const res = await fetch(STATS_ENDPOINT, {
                headers: { Authorization: 'Bearer ' + session.access_token }
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const s = await res.json();
            setText('stat-visitors', s.activeVisitors ?? '-');
            setText('stat-cpu', (s.cpu ?? '-') + '%');
            setText('stat-ram', (s.ram ?? '-') + '%');
            setMeter('meter-cpu', s.cpu);
            setMeter('meter-ram', s.ram);
        } catch (err) {
            console.error(err);
            setText('stat-cpu', 'Gagal');
            setText('stat-ram', 'Gagal');
        }
    }

    async function loadDashboard() {
        const client = getClient();
        renderWelcome();
        if (!client) {
            console.error('Supabase client belum siap.');
            return;
        }
        try {
            await Promise.all([loadCounts(client), loadDbStatus(client), loadServerStats(client)]);
        } catch (err) {
            console.error(err);
        }
        setText('stats-updated', 'Diperbarui ' +
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }

    if (refreshBtn) refreshBtn.addEventListener('click', loadDashboard);

    // Dipanggil dari admin.js setelah login berhasil
    window.loadDashboard = loadDashboard;
})();