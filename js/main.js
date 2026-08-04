document.addEventListener("DOMContentLoaded", function () {
    // 1. Logika Menu Navigasi Aktif (Dark Mode Oval)
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
        const linkPath = link.getAttribute("href");
        
        if (currentPath === linkPath || (linkPath !== "/" && currentPath.startsWith(linkPath))) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // 2. Logika Animasi Reveal (Fade In saat di-scroll)
    function revealElement() {
        const reveals = document.querySelectorAll(".reveal");
        
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 50; // Jarak trigger animasi

            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add("active");
            }
        }
    }

    const hamburger = document.getElementById("hamburger-menu");
    const navMenu = document.getElementById("nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", function () {
            // Menambah/menghapus class 'active' pada menu
            navMenu.classList.toggle("active");
        });
    }

    // Jalankan saat halaman pertama kali dimuat
    revealElement();
    
    // Jalankan setiap kali pengunjung melakukan scroll
    window.addEventListener("scroll", revealElement);
});