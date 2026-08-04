document.addEventListener("DOMContentLoaded", function () {
    /* =========================================
       ANIMASI MASUK SAAT SCROLL
       ========================================= */
    const fotoSelectors = [
        ".pengurus-photo-wrap",
        ".koordinator-photo-wrap",
        ".anggota-tim-card img",
        ".galeri-strip img",
        ".next-bidang-photo"
    ].join(", ");

    const kontenSelectors = [
        ".pengurus-info",
        ".koordinator-label, .koordinator-name, .koordinator-kelas",
        ".tugas-content-wrapper",
        ".motto-card",
        ".pengalaman-card",
        ".whatwedo-item",
        ".anggota-tim-head"
    ].join(", ");

    document.querySelectorAll(fotoSelectors).forEach((el, i) => {
        el.classList.add("reveal-right");
        el.style.setProperty("--reveal-delay", (i % 4) * 0.1 + "s");
    });

    document.querySelectorAll(kontenSelectors).forEach((el, i) => {
        el.classList.add("reveal-up");
        el.style.setProperty("--reveal-delay", (i % 4) * 0.1 + "s");
    });

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    document.querySelectorAll(".reveal-right, .reveal-up").forEach((el) => {
        revealObserver.observe(el);
    });

    /* =========================================
       LIGHTBOX — klik foto untuk lihat versi besar
       ========================================= */
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox-overlay";
    lightbox.innerHTML =
        '<button class="lightbox-close" aria-label="Tutup">&times;</button>' +
        '<img src="" alt="Pratinjau gambar">';
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector("img");
    const lightboxClose = lightbox.querySelector(".lightbox-close");

    function bukaLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || "";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function tutupLightbox() {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
    }

    document
        .querySelectorAll(
            ".pengurus-photo-wrap img, .koordinator-photo-wrap img, .anggota-tim-card img, .galeri-strip img"
        )
        .forEach((img) => {
            img.classList.add("lb-clickable");
            img.addEventListener("click", () => bukaLightbox(img.src, img.alt));
        });

    lightboxClose.addEventListener("click", tutupLightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) tutupLightbox();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") tutupLightbox();
    });
});