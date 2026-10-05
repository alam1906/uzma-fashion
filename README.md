# Uzma Fashion — Grand Opening

Website launching satu halaman dengan arah editorial, visual fashion, dan animasi scroll GSAP. Tiga kartu brand dan tiga promo dikembangkan dari [website Uzma](https://uzma.onlytest.my.id), dengan revisi konten dan tanggal acara dari client.

## Menjalankan

```sh
bun install
bun run dev
```

```sh
bun run check
bun run lint
bun run build
bun run test:browser
```

Tes browser memakai Playwright Chromium. Jika browser belum tersedia, jalankan `bunx playwright install chromium`. Tes membangun dan menjalankan preview sementara di port 4187.

Hasil produksi berupa situs statis di `build/`. Perintah `bun run preview` menjalankan preview lokal.

## Deployment GitHub Actions → GHCR → Dokploy

Workflow [deploy.yml](.github/workflows/deploy.yml) berjalan saat ada push ke `main` atau dijalankan manual. GitHub Actions membangun image dari [Dockerfile](Dockerfile), menjalankan pemeriksaan dan build SvelteKit, lalu mengirim dua tag ke GHCR: `ghcr.io/<owner>/<repo>:latest` dan `ghcr.io/<owner>/<repo>:sha-<commit>`. Image akhir hanya berisi Nginx dan situs statis; server Dokploy tidak membangun source. Rute `/health` tersedia untuk health check.

1. Push proyek ini ke repo GitHub dengan branch `main`. Karena folder proyek lokal ini belum terhubung ke Git, buat atau hubungkan repo sebelum push.
2. Jalankan workflow sekali untuk menerbitkan image ke GHCR. Selama ketiga secret Dokploy belum diisi, workflow hanya menerbitkan image dan mencatat bahwa deployment dilewati.
3. Di Dokploy, buat **Application**, pilih source **Docker**, isi image `ghcr.io/<owner>/<repo>:latest` (huruf kecil), registry `ghcr.io`, dan port internal **80**. Hubungkan domain pada port 80. Bila package GHCR privat, isi username GitHub dan token yang dapat membaca package (`read:packages`) di pengaturan registry Dokploy. Untuk package publik, kredensial registry tidak diperlukan.
4. Tambahkan repository secrets di GitHub: `DOKPLOY_URL` (alamat dasar instance Dokploy, misalnya `https://dokploy.example.com`), `DOKPLOY_API_KEY` (API key dari profil Dokploy), dan `DOKPLOY_APPLICATION_ID` (ID Application yang menggunakan image tadi). Jalankan ulang workflow. Setelah image selesai di-push, workflow memanggil API Dokploy untuk melakukan deploy.

Workflow hanya memastikan permintaan deployment diterima API; cek status deployment dan `/health` pada domain setelah rollout. Konfigurasi remote GitHub dan Dokploy belum dibuat dari workspace ini.

## Stack

- SvelteKit **3.0.0-next.30**, Svelte **5.57.1**.
- Tailwind CSS **4.3.3** dengan plugin Vite.
- GSAP **3.15.0**, ScrollTrigger, dan ScrollSmoother.
- Vite **8.3.1**, Bun **1.4.0**.

Versi diperiksa langsung di npm saat implementasi. SvelteKit 3 masih prerelease; adapter-static menggunakan `4.0.0-next.4`. TypeScript 6.0.3 mengikuti peer dependency SvelteKit 3 saat ini. Versi dependency dikunci di `package.json` dan `bun.lock`.

## Konten dan perilaku

Data yang dapat diedit berada di `src/lib/data/event.ts`. Tanggal acara menggunakan zona waktu eksplisit: **8 Oktober 2026, 10.00 WIB**. Countdown dimulai di browser agar tidak menyebabkan perbedaan SSR dan berhenti ketika acara dimulai.

Alamat, peta, kontak, serta akun sosial belum tersedia di website sumber, sehingga tidak ditambahkan sebagai data rekaan. Jika nanti tersedia, masukkan data sebenarnya sebelum menambahkan CTA lokasi atau kontak.

Animasi utama di `src/lib/motion/landing.ts`:

- Desktop memakai [ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/). Perangkat sentuh memakai scroll native agar konten tetap berada dalam alur dokumen saat bilah browser muncul/hilang; seluruh animasi GSAP tetap aktif.
- Refresh halaman selalu kembali ke atas dan posisi awal hero. Khusus reload, hash menu dihapus sebelum browser memulihkan scroll, lalu posisi yang dipulihkan SvelteKit direset melalui [`afterNavigate`](https://svelte.dev/docs/kit/$app-navigation#afterNavigate) sebelum animasi diinisialisasi. Klik menu dan navigasi riwayat biasa tidak direset oleh aturan reload ini.
- Pembuka desktop dan mobile: latar sutra navy dan mutiara tanpa model atau logo tercetak. Artwork portrait untuk mobile dan landscape untuk desktop dipilih lewat `<picture>`. Logo navbar asli menjadi elemen terpisah dan awalnya tepat di tengah banner. Saat fullscreen pada desktop, Grand Opening di kiri dan logo di kanan, keduanya tepat di tengah vertikal dengan margin luar kiri–kanan yang sama. Pada mobile, logo berada di atas Grand Opening, dan seluruh grup konten berada di tengah horizontal maupun vertikal. Perpindahan mengikuti timeline ekspansi yang sama. Banner membesar sampai memenuhi viewport, lalu tetap dipin saat section Welcome naik menutupinya. Ukuran pin memakai viewport besar yang stabil (`lvh`); perhitungan ulang dilakukan saat ukuran layout berubah, seperti rotasi layar, bukan hanya saat bilah browser berubah. [Referensi ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).
- Cerita: teks muncul mengikuti scroll dan foto bergerak dengan parallax ringan.
- Koleksi: tiga kartu bertumpuk, dengan teks di kiri dan gambar di kanan pada desktop. Tombol panah, Home, dan End dapat digunakan ketika area koleksi difokuskan.
- Promo: tiga panel bergantian dari kanan lalu kiri sesuai referensi, diikuti ketentuan promo. Judul dan deskripsi kartu koleksi maupun panel promo mulai text reveal bersama setelah minimal 70% area kartu/panel terlihat di viewport, dengan [SplitText](https://gsap.com/docs/v3/Plugins/SplitText/) yang mengikuti perubahan lebar teks tanpa mengubah warna atau tata letak.
- Countdown: empat dial beraksen rose gold pada latar ocean blue, angka berganti lembut, reveal berurutan, dan orbit mutiara yang berhenti ketika section/tab tidak terlihat. Dua kolom pada ponsel; tanggal 8 Oktober 2026 pukul 10.00 WIB tetap tampil tanpa JavaScript. Animasi mengikuti reduced-motion menggunakan [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) dan [context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/). Versi sebelum perombakan tersimpan di tag lokal `checkpoint-before-countdown-redesign-2026-10-03` (`08839ddfca02c936da7987d3f56913a75dcb0428`); pulihkan hanya perubahan terkait bila diperlukan.
- Footer: copyright “© 2026 UZMA FASHION” pada latar rose menjadi penutup ringkas dalam alur dokumen, tanpa section Coming Soon, tinggi fullscreen, translasi footer, atau koreksi posisi per-frame. Animasi hero, koleksi, dan promo tetap dipertahankan.
- Batas scroll mobile memakai `overscroll-behavior-y: none` pada root agar momentum tidak memantulkan halaman dan membuka latar kosong setelah footer. Ini juga menonaktifkan gesture pull-to-refresh bawaan; scroll biasa dan perubahan bilah browser tetap native. [Referensi Chrome](https://developer.chrome.com/blog/overscroll-behavior).
- Reduced motion menonaktifkan smoothing, pinning, dan animasi nonesensial. Konten dirender secara statis dan tetap terbaca tanpa JavaScript.

Lifecycle memakai [`gsap.context()`](<https://gsap.com/docs/v3/GSAP/gsap.context()/>) dan [`gsap.matchMedia()`](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>); semua animasi, pin, listener, dan timer dibersihkan saat komponen dilepas atau kondisi media berubah. [Referensi ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

Gaya koleksi hingga footer dipisahkan dalam `src/lib/styles/reference-sections.css`. Bagian ini memakai font sistem yang sama dengan website referensi. Hero dan Welcome mempertahankan revisi sebelumnya.

Foto butik, detail mutiara, dan voucher berasal dari website Uzma. Ilustrasi parfum dan hijab premium dibuat dengan imagegen bawaan. Dua gambar promo memakai nuansa rose gold dan ocean blue, dengan varian WebP 480/800 piksel; [prompt dan catatan aset promo](docs/visual-assets/offers-luxury-promo.prompt.txt). Font Cormorant Garamond dan Manrope disajikan lokal, beserta lisensi OFL di `static/fonts/`.

Hero tanpa model diedit memakai imagegen bawaan. Master latar bersih disimpan di `static/images/uzma-hero-scene.png` dan `static/images/uzma-hero-scene-desktop.png`; varian WebP dipakai website. Logo asli `logo-uzma-transparent.png` tidak diubah atau dicetak pada artwork. Teks undangan dan tanggal tetap HTML dari data acara. [Prompt dan catatan latar bersih](docs/visual-assets/uzma-hero-scene.prompt.txt). Draft dengan logo tercetak tidak lagi dipakai hero.
