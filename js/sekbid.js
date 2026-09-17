// ==========================================
// 🎬 ANIMASI HALAMAN DETAIL SEKBID
// - Foto (koordinator, anggota tim, galeri): muncul dari kanan ke kiri
// - Judul, deskripsi, motto, kartu pengalaman, whatwedo-item: fade-up
// - Semua animasi jalan bertahap (stagger), bukan barengan
// ==========================================
document.addEventListener("DOMContentLoaded", function () {

    // Observer bersama untuk semua elemen yang dianimasikan lewat scroll.
    // Begitu elemen masuk layar, class "is-visible" ditambahkan (memicu
    // animasi di sekbid.css), lalu observer berhenti mengamati elemen itu
    // supaya animasi cuma jalan sekali.
    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -40px 0px",
        }
    );

    // Helper: cari elemen di dalam tiap "root" (biasanya satu section),
    // kasih class animasi + delay bertahap (stagger) yang dihitung ULANG
    // per root — jadi tiap section mulai stagger-nya dari 0 lagi saat
    // dia masuk layar, bukan nyambung dari section sebelumnya.
    function setupReveal(rootSelector, itemSelector, directionClass, options = {}) {
        const { startDelay = 0, step = 0.1, maxDelay = 0.5 } = options;

        document.querySelectorAll(rootSelector).forEach((root) => {
            const items = root.querySelectorAll(itemSelector);

            items.forEach((el, index) => {
                el.classList.add(directionClass);
                const delay = Math.min(startDelay + index * step, maxDelay);
                el.style.setProperty("--reveal-delay", `${delay}s`);
                observer.observe(el);
            });
        });
    }

    // --- FOTO: kanan ke kiri ---
    setupReveal(".koordinator-section", ".koordinator-photo-wrap img", "reveal-right");
    setupReveal(".galeri-strip", "img", "reveal-right", { step: 0.1, maxDelay: 0.4 });

    // --- TUGAS UMUM: fade up ---
    setupReveal(".tugas-section", ".tugas-grid h2, .tugas-grid p", "reveal-up");

    // --- KOORDINATOR: teks & kartu fade up ---
    setupReveal(
        ".koordinator-section",
        ".koordinator-label, .koordinator-name, .koordinator-kelas, .motto-card, .pengalaman-card",
        "reveal-up"
    );

    // --- ANGGOTA TIM: judul section fade up ---
    setupReveal(".anggota-tim-head", "*", "reveal-up", { step: 0.08, maxDelay: 0.3 });

    // --- ANGGOTA TIM: tiap kartu anggota (foto kanan-kiri, teks fade up
    //     menyusul dengan sedikit jeda supaya foto muncul duluan) ---
    document.querySelectorAll(".anggota-tim-card").forEach((card, cardIndex) => {
        const cardBaseDelay = Math.min(cardIndex * 0.15, 0.45);

        const img = card.querySelector("img");
        if (img) {
            img.classList.add("reveal-right");
            img.style.setProperty("--reveal-delay", `${cardBaseDelay}s`);
            observer.observe(img);
        }

        const textItems = card.querySelectorAll("h3, .anggota-tim-kelas, .anggota-tim-role, .motto-card, .pengalaman-card");
        textItems.forEach((el, i) => {
            el.classList.add("reveal-up");
            el.style.setProperty("--reveal-delay", `${cardBaseDelay + 0.15 + i * 0.08}s`);
            observer.observe(el);
        });
    });

    // --- WHAT WE DO: judul, intro, dan tiap item fade up ---
    setupReveal(
        ".whatwedo-section",
        ".whatwedo-heading h2, .whatwedo-intro, .whatwedo-item",
        "reveal-up",
        { step: 0.09, maxDelay: 0.45 }
    );

    // --- TEASER BIDANG BERIKUTNYA: fade up ---
    setupReveal(".next-bidang-content", "h2, p, .btn-next-bidang", "reveal-up", { step: 0.12 });

    // ==========================================
    // 🔍 LIGHTBOX — klik foto untuk lihat full
    // ==========================================
    (function initLightbox() {
        // Buat elemen overlay sekali saja, ditambahkan ke body
        const overlay = document.createElement("div");
        overlay.className = "lightbox-overlay";
        overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Tutup">&times;</button>
            <img src="" alt="">
        `;
        document.body.appendChild(overlay);

        const overlayImg = overlay.querySelector("img");
        const closeBtn = overlay.querySelector(".lightbox-close");

        function openLightbox(src, alt) {
            overlayImg.src = src;
            overlayImg.alt = alt || "";
            overlay.classList.add("is-open");
            document.body.style.overflow = "hidden"; // kunci scroll di belakang
        }

        function closeLightbox() {
            overlay.classList.remove("is-open");
            document.body.style.overflow = "";
        }

        // Diekspos secara global supaya elemen yang dimuat belakangan lewat
        // Supabase (mis. kartu anggota dari profile-loader.js) bisa pakai
        // lightbox yang sama tanpa perlu bikin overlay baru.
        window.openLightbox = openLightbox;

        // Tutup saat klik tombol X, klik area gelap, atau tekan Escape
        closeBtn.addEventListener("click", closeLightbox);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeLightbox();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeLightbox();
        });

        // Pasang listener ke SEMUA foto konten yang SUDAH ADA di halaman ini
        // saat load pertama (foto yang dimuat belakangan via Supabase perlu
        // dipasangi listener sendiri oleh loader masing-masing — lihat
        // profile-loader.js dan gallery-loader.js).
        const selectors = [
            ".bidang-hero-photo",
            ".koordinator-photo-wrap img",
            ".anggota-tim-card img",
            ".galeri-strip img",
            ".next-bidang-photo"
        ].join(", ");

        document.querySelectorAll(selectors).forEach((img) => {
            img.classList.add("lb-clickable");
            img.addEventListener("click", () => openLightbox(img.src, img.alt));
        });
    })();
});