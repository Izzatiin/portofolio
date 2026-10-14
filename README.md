# Portfolio

Website portofolio product designer, terinspirasi dari [cindyly.design](https://www.cindyly.design/): virtual pet interaktif di halaman depan, dock ala macOS (works / quests / profile), judul serif miring, label monospace, sticker board, dan halaman studi kasus dengan daftar isi di samping.

Dibuat dengan HTML, CSS, dan JavaScript biasa. Tidak perlu install apa pun, dan bisa langsung di-host gratis di GitHub Pages.

## Lihat website

- **Live (GitHub Pages):** https://izzatiin.github.io/portofolio/
  (aktif setelah GitHub Pages dinyalakan, lihat bagian [Publish ke GitHub Pages](#publish-ke-github-pages))
- **Preview cepat (tanpa setting):** https://raw.githack.com/Izzatiin/portofolio/HEAD/index.html
  (layanan pihak ketiga yang menampilkan file langsung dari repo ini; perubahan baru bisa butuh beberapa menit untuk muncul)

## Struktur

```
index.html            Halaman utama: hero + virtual pet, works, quests, profile (pindah lewat dock)
work/lintas.html      Contoh studi kasus 1
work/warungku.html    Contoh studi kasus 2
work/rawat.html       Contoh studi kasus 3
assets/css/style.css  Semua styling (warna & font di bagian TOKENS paling atas)
assets/js/pet.js      Virtual pet: akuarium pixel dengan ikan cupang
assets/js/main.js     Navigasi dock, efek ketik di kartu, stiker drag, daftar isi studi kasus
assets/img/           Gambar (sebagian besar masih placeholder, ganti dengan punyamu)
assets/fonts/         DM Sans, DM Mono, Instrument Serif
```

## Virtual pet

Perangkat berbentuk "kucing oren" dengan ikan cupang pixel di layarnya. Tiga tombol pink:

- **FEED**: menjatuhkan makanan, ikan berenang memakannya
- **PLAY**: mini game tebak-tebakan. Ikan sembunyi di balik batu, tebak keluar dari kiri atau kanan
- **SLEEP**: layar meredup dan ikan tidur (tekan lagi untuk **WAKE**)

Klik layar atau tombol panah di kiri bawah perangkat untuk mode layar penuh (keyboard: F, P, S, panah kiri/kanan, Esc).

Mau ganti warna perangkat? Ubah `--cap`, `--cap-dark`, dan `--cap-light` di bagian `.pet` pada `style.css`. Nama di gantungan kunci ada di `<span class="pet-tag">` pada `index.html`. Warna ikan ada di `FISH_COLORS` pada `pet.js`.

## Yang perlu kamu ganti

Semua teks dan gambar sekarang masih **contoh**. Cari tulisan `GANTI` di file HTML untuk menemukan bagian yang perlu diubah.

1. **Nama**: ganti `Izzatiin` / `izzatiin` di semua file `.html`.
2. **Email**: ganti `youremail@example.com`.
3. **LinkedIn**: ganti `https://www.linkedin.com/in/your-profile`.
4. **CV**: taruh file CV kamu di `assets/resume.pdf`.
5. **Hero**: teks `I design for` / `people.` dan baris `recently: ...` di `index.html`.
6. **Foto**: timpa `assets/img/profile.jpg` (juga dipakai sebagai ikon profile di dock), `about-1.jpg`, dan `about-2.jpg`. Pakai nama file yang sama supaya tidak perlu edit HTML.
7. **Proyek (works)**: kartu di bagian `WORKS` pada `index.html`, cover di `assets/img/work/`, dan isi studi kasus di `work/*.html`. Teks yang "diketik" di cover kartu ada di atribut `data-type` (pisahkan kalimat dengan `|`).
8. **Quests**: gambar proyek sampingan di `assets/img/quests/`, nama file di judul tiap jendela, dan daftar `to do:`.
9. **Pojok bawah**: `Built with care & fueled by es teh` dan `Last updated 10/26`.

## Menambah proyek baru

1. Copy salah satu file di `work/`, misalnya `work/lintas.html` jadi `work/proyek-baru.html`, lalu ganti isinya.
2. Di `index.html`, copy satu blok `<a class="work-card" ...>` di dalam `works-grid` dan arahkan `href` ke file barunya.
3. Pilih status di kartu: `badge--building` (kuning), `badge--shipped` (hijau), atau `badge--concept` (biru). Untuk penghargaan, misalnya:

```html
<span class="badge">🏆 1st Place</span>
```

## Ganti warna atau font

Buka `assets/css/style.css`, lalu ubah variabel di bagian `TOKENS`:

- `--accent` untuk warna aksen (link, tab aktif di dock, daftar isi)
- `--bg` untuk warna latar (kertas grafik)
- `--sans`, `--serif`, `--mono` untuk font

## Melihat di komputer sendiri

Cukup buka `index.html` di browser. Atau jalankan server lokal:

```bash
npx serve .
```

## Publish ke GitHub Pages

1. Di GitHub, buka **Settings > Pages** (https://github.com/Izzatiin/portofolio/settings/pages).
2. Di **Build and deployment > Source**, pilih **Deploy from a branch**.
3. Di **Branch**, pilih branch utama repo ini, folder `/ (root)`, lalu **Save**.
4. Tunggu 1-2 menit. Website akan tampil di `https://izzatiin.github.io/portofolio/`.

Setiap kali ada perubahan yang di-push ke branch itu, website akan ter-update otomatis.

## Kredit

- Desain terinspirasi dari portofolio [Cindy Ly](https://www.cindyly.design/)
- Font [DM Sans](https://github.com/googlefonts/dm-fonts), [DM Mono](https://github.com/googlefonts/dm-mono), dan [Instrument Serif](https://github.com/Instrument/instrument-serif) (SIL Open Font License, lihat `assets/fonts/`)
- Ikon dari [Phosphor Icons](https://phosphoricons.com/) (MIT License)
