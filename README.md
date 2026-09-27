# Uzma Fashion — Grand Opening

Website launching satu halaman dengan arah editorial, foto lokal, dan animasi scroll GSAP. Data acara, empat koleksi, dan tiga promo mengikuti [website Uzma](https://uzma.onlytest.my.id), diperiksa 28 September 2026.

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

Data yang dapat diedit berada di `src/lib/data/event.ts`. Tanggal acara menggunakan zona waktu eksplisit: **25 Oktober 2026, 10.00 WIB**. Countdown dimulai di browser agar tidak menyebabkan perbedaan SSR dan berhenti ketika acara dimulai.

Alamat, peta, kontak, serta akun sosial belum tersedia di website sumber, sehingga tidak ditambahkan sebagai data rekaan. Jika nanti tersedia, masukkan data sebenarnya sebelum menambahkan CTA lokasi atau kontak.

Animasi utama di `src/lib/motion/landing.ts`:

- Scroll halaman memakai [ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/), dengan smoothing lebih ringan pada perangkat sentuh.
- Pembuka desktop dan mobile: foto portrait membesar sampai memenuhi viewport, lalu tetap dipin saat section Welcome naik menutupinya. Foto awal dan teks menyesuaikan layar kecil; ukuran animasi dihitung ulang saat viewport berubah. Pinning menjaga posisi hero di dalam konten ScrollSmoother yang ditransformasi.
- Cerita: teks muncul mengikuti scroll dan foto bergerak dengan parallax ringan.
- Koleksi: empat kartu bertumpuk, dengan teks di kiri dan gambar di kanan pada desktop. Susunan, warna, ukuran, dan tipografi mengikuti website referensi. Tombol panah, Home, dan End dapat digunakan ketika area koleksi difokuskan.
- Promo: tiga panel bergantian dari kanan lalu kiri sesuai referensi, diikuti ketentuan promo dan countdown berkotak.
- Footer: “Coming Soon” pada latar rose, terbuka dari balik section countdown. Footer tetap berada di luar konten ScrollSmoother agar posisinya fixed terhadap viewport.
- Reduced motion menonaktifkan smoothing, pinning, dan animasi nonesensial. Konten dirender secara statis dan tetap terbaca tanpa JavaScript.

Lifecycle memakai [`gsap.context()`](<https://gsap.com/docs/v3/GSAP/gsap.context()/>) dan [`gsap.matchMedia()`](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>); semua animasi, pin, listener, dan timer dibersihkan saat komponen dilepas atau kondisi media berubah. [Referensi ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

Gaya koleksi hingga footer dipisahkan dalam `src/lib/styles/reference-sections.css`. Bagian ini memakai font sistem yang sama dengan website referensi. Hero dan Welcome mempertahankan revisi sebelumnya.

Foto berasal dari website Uzma. Font Cormorant Garamond dan Manrope disajikan lokal, beserta lisensi OFL di `static/fonts/`.
