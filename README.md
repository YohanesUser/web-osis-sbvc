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
web-osis/
├── admin/                         # Panel admin & manajemen konten
│   └── index.html                 # [Dari ZIP] Halaman utama admin
├── ai/                            # Fitur OSIS-Bot AI
│   ├── js/                        # Script pendukung AI
│   │   ├── ai.js                  # [Dari ZIP] Logika utama AI
│   │   └── database/              # Database lokal AI
│   │       └── database.json      # [Dari ZIP] Data/pengetahuan AI
│   └── index.html                 # [Dari ZIP] Interface UI OSIS-Bot AI
├── assets/                                # Seluruh aset media & gambar
│   ├── dokumentasi-sekbid/                # Dokumentasi kegiatan per sekbid
│   │   ├── apres/                         # Foto kegiatan sekbid Apresiasi & Seni
│   │   ├── belneg/                        # Foto kegiatan sekbid Bela Negara
│   │   │   └── tks.png                    # Foto kegiatan
│   │   ├── jasmani/                       # Foto kegiatan sekbid Jasmani & Olahraga
│   │   │   └── tks.png                    # Foto kegiatan
│   │   ├── ketaqis/                       # Foto kegiatan sekbid Ketakwaan Islam
│   │   │   ├── ilham.jpeg                 # Dokumentasi/foto kegiatan
│   │   │   └── tks.png                    # Foto kegiatan
│   │   ├── ketaqris/                      # Foto kegiatan sekbid Ketakwaan Kristen/Katholik
│   │   ├── kwu/                           # Foto kegiatan sekbid Kewirausahaan
│   │   └── politik/                       # Foto kegiatan sekbid Pembinaan Politik & Bangsa
│   ├── foto-sampul-sekbid/                # Gambar banner/sampul sekbid
│   ├── foto-struktur/                     # Foto pengurus & pembina
│   ├── foto-sekolah.png                   # Gambar utama halaman sekolah
│   ├── kepala.jpeg                        # Foto Kepala Sekolah
│   └── logo-osis.png                      # Logo resmi OSIS
├── css/                           # Seluruh stylesheet (Modular CSS)
│   ├── admin.css                  # Style khusus panel admin
│   ├── ai.css                     # Style khusus widget/halaman AI
│   ├── home.css                   # Style khusus landing page
│   ├── info.css                   # Style pusat informasi
│   ├── oprec.css                  # Style halaman recruitment
│   ├── sekbid.css                 # Style halaman sekbid
│   ├── struktur.css               # Style diagram/kartu struktur
│   └── style.css                  # Style global / reset
├── info/                          # Pusat Informasi & Pengumuman
│   └── index.html                 # Halaman pusat informasi
├── js/                            # Script JavaScript Utama & Loader
│   ├── admin.js                   # Logika antarmuka admin
│   ├── berita.js                  # Handler berita/pengumuman
│   ├── comment.js                 # Handler sistem komentar
│   ├── gallery-loader.js          # Dynamic loader galeri
│   ├── info.js                    # Handler halaman info
│   ├── main.js                    # Script global / interaksi dasar
│   ├── sekbid.js                  # Handler filter & data sekbid
│   └── whatwedo-loader.js         # Loader program kerja
├── open-recruitment/              # Halaman Pendaftaran / Oprec
│   └── index.html                 # Halaman form/info oprec
├── struktur/                              # Halaman Struktur Organisasi, Sekbid, & PH
│   ├── 1-ketaqis/                         # Sekbid 1: Ketakwaan Islam
│   │   ├── index.html                     # Halaman detail Sekbid 1
│   │   └── style.css                      # Style khusus Sekbid 1
│   ├── 2-ketaqris/                        # Sekbid 2: Ketakwaan Kristen/Katholik
│   │   ├── index.html                     # Halaman detail Sekbid 2
│   │   └── style.css                      # Style khusus Sekbid 2
│   ├── 3-politik/                         # Sekbid 3: Pembinaan Politik & Bangsa
│   │   ├── index.html                     # Halaman detail Sekbid 3
│   │   └── style.css                      # Style khusus Sekbid 3
│   ├── 4-belneg/                          # Sekbid 4: Bela Negara
│   │   ├── index.html                     # Halaman detail Sekbid 4
│   │   └── style.css                      # Style khusus Sekbid 4
│   ├── 5-kwu/                             # Sekbid 5: Kewirausahaan
│   │   ├── index.html                     # Halaman detail Sekbid 5
│   │   └── style.css                      # Style khusus Sekbid 5
│   ├── 6-apres/                           # Sekbid 6: Apresiasi & Seni
│   │   ├── index.html                     # Halaman detail Sekbid 6
│   │   └── style.css                      # Style khusus Sekbid 6
│   ├── 7-jasmani/                         # Sekbid 7: Jasmani & Olahraga
│   │   ├── index.html                     # Halaman detail Sekbid 7
│   │   └── style.css                      # Style khusus Sekbid 7
│   ├── ph/                                # Pengurus Harian
│   │   ├── bendahara/                     # Divisi Bendahara
│   │   │   ├── index.html                 # Halaman detail Bendahara
│   │   │   ├── main.js                    # Script khusus Bendahara
│   │   │   └── style.css                  # Style khusus Bendahara
│   │   ├── ketua/                         # Divisi Ketua OSIS
│   │   │   ├── index.html                 # Halaman detail Ketua
│   │   │   ├── main.js                    # Script khusus Ketua
│   │   │   └── style.css                  # Style khusus Ketua
│   │   └── sekretaris/                    # Divisi Sekretaris
│   │       ├── index.html                 # Halaman detail Sekretaris
│   │       └── style.css                  # Style khusus Sekretaris
│   └── index.html                         # Halaman utama grafik & daftar struktur
├── 404.html                       # [Dari ZIP] Halaman error kustom
├── google02304c37b289606a.html     # Verifikasi Google Search Console
├── index.html                     # Halaman utama (landing page)
├── manifest.webmanifest           # Konfigurasi PWA (Progressive Web App)
├── robots.txt                     # Aturan crawler mesin pencari
├── sitemap.xml                    # Peta situs untuk SEO
└── README.md                      # Dokumentasi & panduan proyek
ubah bagian strukturnya
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
