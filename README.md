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
assets/js/pet.js      Virtual pet: logika akuarium pixel dengan ikan cupang
assets/js/pet3d.js    Model 3D perangkat (three.js): badan plastik, tag nama logam, gerakan
assets/js/pet-fx.js   Suara tombol (Web Audio) dan efek partikel
assets/js/main.js     Navigasi dock, efek ketik di kartu, stiker drag, daftar isi studi kasus
assets/vendor/        three.js dan font 3D untuk tag nama
assets/img/           Gambar (sebagian besar masih placeholder, ganti dengan punyamu)
assets/fonts/         DM Sans, DM Mono, Instrument Serif
```

## Virtual pet

Perangkat 3D berbentuk "kucing oren" dengan ikan cupang pixel di layarnya. Perangkat ini ikut miring mengikuti kursor, mengambang pelan, gantungan kuncinya berayun, dan setiap tombol mengeluarkan suara serta efek partikel. Tiga tombol pink:

- **FEED**: menjatuhkan makanan, ikan berenang memakannya
- **PLAY**: mini game tebak-tebakan. Ikan sembunyi di balik batu, tebak keluar dari kiri atau kanan
- **SLEEP**: layar meredup dan ikan tidur (tekan lagi untuk **WAKE**)

Klik perangkatnya untuk mode layar penuh (keyboard: F, P, S, panah kiri/kanan, Esc). Tombol **sound on/off** ada di pojok kanan bawah.

Pengaturan yang bisa kamu ubah:

- **Nama di gantungan kunci**: teks di `<span class="pet-tag">` pada `index.html` (huruf a-z, A-Z, angka).
- **Warna perangkat 3D**: objek `mat` di `assets/js/pet3d.js` (misalnya `cap` untuk warna oranye).
- **Warna ikan**: `FISH_COLORS` di `assets/js/pet.js`.
- **Suara**: fungsi di `SOUNDS` pada `assets/js/pet-fx.js`.

Model 3D butuh WebGL dan server (GitHub Pages atau `npx serve .`). Kalau dibuka langsung dari file atau browsernya tidak mendukung WebGL, otomatis tampil versi 2D.

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

Jalankan server lokal (model 3D butuh server, kalau `index.html` dibuka langsung yang tampil versi 2D):

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
- 3D dengan [three.js](https://threejs.org/) (MIT License, lihat `assets/vendor/three/LICENSE`)
