(function () {
    const SUPABASE_URL = 'https://apwgipefbiszpeoyvfta.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2dpcGVmYmlzenBlb3l2ZnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjU0MDcsImV4cCI6MjEwMTEwMTQwN30.JiO5Cq4KYZYU92seDkg8u-YDoqoLw7qzsY2MPKQIQlk';

    if (!window.supabase) return;
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.addEventListener('DOMContentLoaded', async function () {
        const { data, error } = await client
            .from('struktur_covers')
            .select('slug, image_url');

        if (error || !data) return; // gagal fetch -> biarkan gambar default tampil

        const map = {};
        data.forEach(function (row) {
            map[row.slug] = row.image_url;
        });

        document.querySelectorAll('[data-cover-slug]').forEach(function (el) {
            const url = map[el.dataset.coverSlug];
            if (!url) return; // belum ada cover di DB -> tetap pakai default

            const img = el.querySelector('img');
            if (img) {
                img.src = url; // kartu PH
            } else {
                el.style.backgroundImage = "url('" + url + "')"; // kartu Sekbid
            }
        });
    });
})();