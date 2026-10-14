# Portfolio

Website portofolio product designer, terinspirasi dari struktur [cindyly.design](https://www.cindyly.design/): intro singkat, status "open to roles", kartu proyek, halaman studi kasus per proyek, dan halaman About.

Dibuat dengan HTML, CSS, dan JavaScript biasa. Tidak perlu install apa pun, dan bisa langsung di-host gratis di GitHub Pages.

## Lihat website

- **Live (GitHub Pages):** https://izzatiin.github.io/portofolio/
  (aktif setelah GitHub Pages dinyalakan, lihat bagian [Publish ke GitHub Pages](#publish-ke-github-pages))
- **Preview cepat (tanpa setting):** https://raw.githack.com/Izzatiin/portofolio/HEAD/index.html
  (layanan pihak ketiga yang menampilkan file langsung dari repo ini; perubahan baru bisa butuh beberapa menit untuk muncul)

## Struktur

```
index.html            Halaman utama (intro, daftar karya, ringkasan about, kontak)
about.html            Halaman About (bio, pengalaman, foto)
work/lintas.html      Contoh studi kasus 1
work/warungku.html    Contoh studi kasus 2
work/rawat.html       Contoh studi kasus 3
assets/css/style.css  Semua styling (warna & font ada di bagian TOKENS paling atas)
assets/js/main.js     Mode gelap/terang, animasi scroll, daftar isi studi kasus
assets/img/           Gambar (masih placeholder, ganti dengan punyamu)
assets/fonts/         Font Plus Jakarta Sans
```

## Yang perlu kamu ganti

Semua teks dan gambar sekarang masih **contoh**. Cari tulisan `GANTI` di file HTML untuk menemukan bagian yang perlu diubah.

1. **Nama**: ganti `Izzatiin` di semua file `.html`.
2. **Email**: ganti `youremail@example.com` dengan email kamu.
3. **LinkedIn**: ganti `https://www.linkedin.com/in/your-profile`.
4. **CV**: taruh file CV kamu di `assets/resume.pdf`.
5. **Foto & mockup**: timpa file di `assets/img/` dengan gambar kamu (pakai nama file yang sama supaya tidak perlu edit HTML). Ukuran yang disarankan tertulis di tiap gambar placeholder.
6. **Proyek**: edit isi `work/*.html` dengan studi kasusmu sendiri.

## Menambah proyek baru

1. Copy salah satu file di `work/`, misalnya `work/lintas.html` jadi `work/proyek-baru.html`.
2. Ganti judul, deskripsi, meta (Role, Timeline, Team, Tools), isi, dan gambarnya.
3. Di `index.html`, copy satu blok `<a class="project ...">` di dalam `work-grid`, lalu arahkan `href` ke file barunya.
4. Atur link "Next project" di bagian bawah tiap studi kasus supaya saling menyambung.

Kalau mau menandai proyek yang menang lomba, tambahkan tag berwarna di kartunya:

```html
<li class="tag-accent">1st Place, Hackathon 2026</li>
```

## Ganti warna atau font

Buka `assets/css/style.css`, lalu ubah variabel di bagian `TOKENS`:

- `--accent` untuk warna aksen (sekarang oranye bata)
- `--bg`, `--text`, `--muted` untuk warna dasar
- Warna mode gelap ada di blok `prefers-color-scheme: dark` dan `[data-theme="dark"]` tepat di bawahnya

## Melihat di komputer sendiri

Cukup buka `index.html` di browser. Atau jalankan server lokal:

```bash
npx serve .
```

## Publish ke GitHub Pages

1. Di GitHub, buka **Settings > Pages** (https://github.com/Izzatiin/portofolio/settings/pages).
2. Di **Build and deployment > Source**, pilih **Deploy from a branch**.
3. Di **Branch**, pilih branch tempat file ini berada (sekarang `claude/quirky-gauss-21hhpf`, atau `main` kalau nanti kamu pindahkan ke sana), folder `/ (root)`, lalu **Save**.
4. Tunggu 1-2 menit. Website akan tampil di `https://izzatiin.github.io/portofolio/`.

Setiap kali ada perubahan yang di-push ke branch itu, website akan ter-update otomatis.

## Kredit

- Font [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) oleh Tokotype (SIL Open Font License, lihat `assets/fonts/OFL.txt`)
- Ikon dari [Phosphor Icons](https://phosphoricons.com/) (MIT License)
