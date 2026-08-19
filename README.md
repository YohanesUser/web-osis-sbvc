# 🏫 Website OSIS SMKN 1 Bantul

<div align="center">

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![HTML](https://img.shields.io/badge/HTML-29.6%25-orange)
![CSS](https://img.shields.io/badge/CSS-55.4%25-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-15%25-yellow)

**Website resmi Organisasi Siswa Intra Sekolah (OSIS) SMK Negeri 1 Bantul**
periode 2026/2027 — wadah aspirasi, kreasi, dan inovasi seluruh siswa.

[🌐 Live Site](https://osissmkn1bantul.pages.dev) · [🐛 Laporkan Bug](../../issues) · [💡 Request Fitur](../../issues)

</div>

---

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur](#-fitur)
- [Struktur Folder](#️-struktur-folder)
- [Teknologi yang Digunakan](#️-teknologi-yang-digunakan)
- [Instalasi & Menjalankan Secara Lokal](#-instalasi--menjalankan-secara-lokal)
- [Deployment](#-deployment)
- [Navigasi Situs](#-navigasi-situs)
- [Cara Berkontribusi](#-cara-berkontribusi)
- [Roadmap](#️-roadmap)
- [Kontributor](#-kontributor)
- [Kontak & Media Sosial](#-kontak--media-sosial)
- [Lisensi](#-lisensi)

---

## 📋 Tentang Proyek

Website ini dibangun sebagai platform digital resmi OSIS SMK Negeri 1 Bantul untuk mendukung transparansi informasi, memudahkan pendaftaran anggota baru, serta menjadi sarana komunikasi antara pengurus OSIS dan seluruh siswa.

Proyek ini dikembangkan dan dikelola secara mandiri oleh pengurus/tim IT OSIS SMK Negeri 1 Bantul sebagai bagian dari program kerja divisi terkait.

## ✨ Fitur

- 🏠 **Beranda** — Informasi umum dan sambutan OSIS
- 🧑‍🤝‍🧑 **Struktur Organisasi** — Profil pengurus OSIS per divisi (sekbid)
- 📝 **Open Recruitment** — Sistem pendaftaran anggota baru terintegrasi Google Form
- 📢 **Pusat Info & Berita** — Pengumuman dan berita kegiatan terbaru
- 💬 **Sistem Komentar** — Interaksi siswa pada halaman berita/info
- 🖼️ **Galeri Dokumentasi** — Dokumentasi kegiatan per seksi bidang (sekbid)
- 🤖 **OSIS-Bot AI** — Chatbot AI untuk membantu siswa mencari informasi seputar OSIS
- 🔐 **Panel Admin** — Manajemen konten oleh pengurus
- 📱 **PWA Ready** — Dapat diinstal sebagai aplikasi (manifest.webmanifest)
- 🔍 **SEO Friendly** — Dilengkapi sitemap.xml dan robots.txt

## 🗂️ Struktur Folder

```text
web-osis-sbvc/
├── admin/                         # Panel admin & manajemen konten
├── ai/                            # Fitur OSIS-Bot AI
│   ├── js/
│   └── index.html
├── assets/                        # Aset gambar & dokumentasi
│   ├── dokumentasi-sekbid/
│   ├── foto-sampul-sekbid/
│   ├── foto-struktur/
│   ├── foto-sekolah.png
│   ├── kepala.jpeg
│   └── logo-osis.png
├── css/                           # Seluruh stylesheet halaman
│   ├── admin.css
│   ├── ai.css
│   ├── home.css
│   ├── info.css
│   ├── oprec.css
│   ├── sekbid.css
│   ├── struktur.css
│   └── style.css
├── info/                          # Halaman pusat informasi & pengumuman
│   └── index.html
├── js/                            # Script JavaScript utama & pendukung
│   ├── admin.js
│   ├── berita.js
│   ├── comment.js
│   ├── gallery-loader.js
│   ├── info.js
│   ├── main.js
│   ├── sekbid.js
│   └── whatwedo-loader.js
├── open-recruitment/             # Halaman open recruitment
│   └── index.html
├── struktur/                      # Halaman struktur organisasi & sekbid
├── 404.html                       # Halaman error kustom
├── google02304c37b289606a.html    # Verifikasi Google Search Console
├── index.html                     # Halaman utama (landing page)
├── manifest.webmanifest           # Konfigurasi PWA
├── robots.txt                     # Aturan crawler mesin pencari
├── sitemap.xml                    # Peta situs untuk SEO
└── README.md                      # Dokumentasi proyek
```

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| **HTML5** | Struktur & semantik halaman |
| **CSS3** | Styling, layout responsif, animasi |
| **JavaScript (Vanilla)** | Interaktivitas (navbar, komentar, galeri, dll) |
| **Cloudflare Pages** | Hosting & deployment otomatis |
| **Supabase Storage** | Penyimpanan gambar (logo, pamflet, foto CP, dokumentasi sekbid) |
| **Google Forms** | Formulir pendaftaran open recruitment |

## 🚀 Instalasi & Menjalankan Secara Lokal

### Prasyarat
- [Git](https://git-scm.com/) terinstal
- Browser modern (Chrome, Firefox, Edge, dll)
- (Opsional) Python atau Node.js untuk local server

### Langkah-langkah

1. **Clone repository**
```bash
   git clone https://github.com/YohanesUser/web-osis-sbvc.git
```

2. **Masuk ke folder proyek**
```bash
   cd web-osis-sbvc
```

3. **Jalankan secara lokal**

   Cara termudah — buka langsung file `index.html` di browser.

   Atau gunakan local server agar path relatif berjalan normal:
```bash
   # Menggunakan Python
   python -m http.server 8000

   # Menggunakan Node.js (npx)
   npx serve .
```

4. **Buka di browser**

http://localhost:8000


## 🌍 Deployment

Website ini di-deploy secara otomatis melalui **Cloudflare Pages** setiap kali ada perubahan (push) ke branch `main`.

- **Production URL:** https://osissmkn1bantul.pages.dev
- **Build command:** *(tidak ada — static site)*
- **Output directory:** `/` (root)

Setiap `git push` ke branch `main` akan otomatis memicu build & deploy baru.

## 📱 Navigasi Situs

| Halaman | Route | Deskripsi |
|---|---|---|
| Beranda | `/` | Halaman utama situs |
| Struktur | `/struktur` | Struktur organisasi & seksi bidang (sekbid) |
| Open Recruitment | `/open-recruitment` | Pendaftaran anggota baru |
| Info | `/info` | Pusat informasi, berita & pengumuman |
| AI | `/ai` | OSIS-Bot, asisten AI untuk siswa |
| Admin | `/admin` | Panel manajemen konten (khusus pengurus) |

## 🤝 Cara Berkontribusi

Kontribusi dari sesama pengurus/anggota OSIS sangat terbuka! Ikuti langkah berikut:

1. **Fork** repository ini
2. Buat branch baru untuk fitur/perbaikan kamu
```bash
   git checkout -b fitur/nama-fitur
```
3. Lakukan perubahan dan commit
```bash
   git add .
   git commit -m "Menambahkan: deskripsi singkat perubahan"
```
4. Push ke branch kamu
```bash
   git push origin fitur/nama-fitur
```
5. Buat **Pull Request** ke branch `main`

### Konvensi Commit
Gunakan awalan berikut agar riwayat commit rapi:
- `Menambahkan:` untuk fitur baru
- `Memperbaiki:` untuk bug fix
- `Update:` untuk perubahan konten/data
- `Refactor:` untuk perubahan struktur kode tanpa mengubah fungsi

## 🗺️ Roadmap

- [x] Halaman beranda & struktur organisasi
- [x] Sistem open recruitment
- [x] Integrasi OSIS-Bot AI
- [x] Sistem berita & komentar
- [x] Galeri dokumentasi sekbid
- [x] Sistem login untuk panel admin
- [ ] Halaman prestasi & penghargaan
- [ ] Mode gelap (dark mode)

## 👥 Kontributor

| Nama | Peran |
|---|---|
| **YohanesUser** (Yohanes_af_sr) | Pengembang & Pengelola Repository |

Ingin namamu masuk daftar ini? Lihat bagian [Cara Berkontribusi](#-cara-berkontribusi) di atas.

## 📞 Kontak & Media Sosial

- 📍 **Alamat:** Jl. Parangtritis Km 11, Sabdodadi, Bantul, D.I. Yogyakarta
- 📷 **Instagram:** [@osis.smkn1bantul](https://www.instagram.com/osis.smkn1bantul/)
- 🎵 **TikTok:** [@osissmkn1bantul](https://www.tiktok.com/@osissmkn1bantul)
- ▶️ **YouTube:** [OSIS SABAVOSCHO](https://www.youtube.com/@osissabavoscho6471/)

## 📄 Lisensi

Proyek ini dibuat untuk keperluan internal OSIS SMK Negeri 1 Bantul.
Seluruh hak cipta dilindungi © 2026 OSIS SMKN 1 Bantul, kecuali dinyatakan lain.

---

<div align="center">

**Dibuat dengan ❤️ oleh Pengurus OSIS SMK Negeri 1 Bantul**

</div>
