(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    const container = document.getElementById('whatwedo-dokumentasi');
    if (!container || !window.supabase) return;

    const sekbidId = container.dataset.sekbid;
    if (!sekbidId) return;

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    client
        .from('sekbid_whatwedo')
        .select('icon, title, description')
        .eq('sekbid_id', sekbidId)
        .order('sort_order', { ascending: true })
        .then(function (res) {
            const data = res.data;
            const error = res.error;

            if (error) {
                console.error('Gagal memuat what we do:', error);
                return;
            }

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="color:#888;font-size:0.9rem;">Belum ada program kerja yang diunggah oleh sekbid.</p>';
                return;
            }

            container.innerHTML = data
                .map(function (item) {
                    return '<div class="whatwedo-item">' +
                        '<span class="whatwedo-icon">' + (item.icon ? escapeHtml(item.icon) : '📌') + '</span>' +
                        '<div>' +
                            '<h3>' + escapeHtml(item.title) + '</h3>' +
                            (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '') +
                        '</div>' +
                    '</div>';
                })
                .join('');
        });
})();