document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       TUGAS UMUM → DAFTAR (LIST)
       Menunggu ph-loader.js mengisi #ph-tugas-umum,
       lalu memecah teks per baris menjadi <li>.
       ========================================= */
   function buatListTugasUmum(el) {
    const baris = el.textContent
        .split(/\r?\n|;|•/)
        .map(s => s.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
        .filter(Boolean);

    if (baris.length === 0) return;

    const wadah = document.createElement("div");
    wadah.id = "ph-tugas-umum";

    let ul = null;

    baris.forEach(text => {
        const adaHurufKecil = /[a-z]/.test(text);

        // Baris huruf kapital semua → sub judul
        if (!adaHurufKecil) {
            ul = null;
            const h3 = document.createElement("h3");
            h3.className = "tugas-umum-subjudul";
            h3.textContent = text;
            wadah.appendChild(h3);
            return;
        }

        // Baris biasa → poin daftar
        if (!ul) {
            ul = document.createElement("ul");
            ul.className = "tugas-umum-list";
            wadah.appendChild(ul);
        }
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
    });

    el.replaceWith(wadah);
}

    const observerTugasUmum = new MutationObserver(() => {
        const el = document.getElementById("ph-tugas-umum");
        if (!el || el.tagName !== "P") return;
        if (el.classList.contains("ph-empty") || !el.textContent.trim()) return;

        observerTugasUmum.disconnect();
        buatListTugasUmum(el);
    });

    observerTugasUmum.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class"]
    });

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

/* =========================================
   MOTTO → DAFTAR (LIST)
   Memecah teks per baris atau per kalimat
   menjadi <li>, setelah ph-loader.js mengisi data.
   ========================================= */
function buatListMotto(el) {
    const teks = el.textContent
        .replace(/[“”"]/g, "")
        .trim();
    
            const items = teks
        .split(/\r?\n|(?<=^|\s)-(?=\S)/)
        .map(s => s.trim())
        .filter(Boolean);

    if (items.length < 2) return;

    const ul = document.createElement("ul");
    ul.className = "motto-list";

    items.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
    });

    el.replaceWith(ul);
}

const observerMotto = new MutationObserver(() => {
    const el = document.querySelector(".motto-card-quote");
    if (!el || el.tagName !== "P" && el.tagName !== "DIV") return;
    if (!el.textContent.trim()) return;

    observerMotto.disconnect();
    buatListMotto(el);
});

observerMotto.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true
});