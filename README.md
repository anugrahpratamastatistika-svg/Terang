# Terang — Kalkulator Transparansi Pinjaman Mikro & Pedagang Pasar

> **"Menyalakan lampu pada angka yang disembunyikan."**

Terang adalah aplikasi web mobile-first yang dirancang khusus untuk pedagang pasar tradisional dan pelaku mikro UMKM di Indonesia. Terang membongkar biaya sebenarnya di balik penawaran pinjaman (bank keliling, koperasi mingguan, pinjol harian) agar pedagang terhindar dari jebakan bunga predatory dan potongan di depan.

---

## Prinsip Inti Aplikasi
1. **Dihitung Murni dengan Kode, Bukan AI**:
   Semua perhitungan matematika finansial (bunga majemuk, suku bunga efektif tahunan/APR, metode bisection) dihitung secara deterministik oleh fungsi murni TypeScript (`src/lib/finance.ts`), BUKAN dihitung oleh AI/LLM.
2. **AI Hanya sebagai Pembaca & Penjelas**:
   AI hanya membaca teks atau foto penawaran lalu menyusun penjelasan dengan bahasa sederhana. Modelnya adalah Gemini, dan daftar model yang dicoba berurutan ada di `GEMINI_MODELS` pada `server.ts`.
3. **Privasi Perangkat**:
   Riwayat cek hanya tersimpan di perangkat ini (`localStorage` dengan skema `terang.v2`). Kami tidak meminta login, KTP, atau identitas pribadi. Jika memakai fitur Baca Otomatis, teks atau foto penawaran dikirim lewat server aplikasi ke layanan AI Google semata-mata untuk dibaca. Pengguna diingatkan untuk menutup nama dan nomor pribadi sebelum mengunggah.

---

## Penggunaan AI
- **Google Gemini (bagian dari produk)**: membaca teks atau foto penawaran dan menyusun penjelasan sederhana. Daftar modelnya ada di `GEMINI_MODELS` pada `server.ts`.
- **Perhitungan keuangan**: semua angka (selisih biaya, denda, bunga efektif, batas OJK) dihitung kode TypeScript tanpa AI.
- **Alat bantu AI selama pengembangan**: rincian lengkap ada pada AI Usage Declaration di Proposal Ringkas SIFest Digital Innovation Challenge 2026 (Bab 8).

---

## Keterbatasan
- **Bukan Nasihat Hukum atau Keuangan**: Patokan perbandingan OJK (SEOJK No. 19/SEOJK.06/2025) hanya berlaku untuk pinjol berizin resmi dan bukan merupakan nasihat hukum.
- **Kategori AMAN**: Label AMAN adalah aturan internal Terang (biaya harian di bawah setengah batas OJK), bukan merupakan jaminan atau rekomendasi kelayakan kredit.
- **Verifikasi Angka Wajib**: Pembacaan otomatis foto atau teks oleh AI dapat salah membaca dokumen buram, tulisan tangan, atau selebaran kusut. Pengguna selalu diberikan kesempatan memeriksa dan mengoreksi angka di layar Konfirmasi sebelum kalkulasi dilakukan.
- **Fitur Suara (TTS)**: Pembacaan suara audio menggunakan Web Speech API bawaan peramban (browser), sehingga kualitas aksen dan ketersediaan suara bergantung pada peramban dan perangkat yang digunakan pengguna.

---

## ⚖️ Batas OJK yang Dipakai

Batas manfaat ekonomi harian diselaraskan dengan ketentuan resmi **SEOJK No. 19/SEOJK.06/2025** (ditetapkan 31 Juli 2025, Romawi XIV).

| Jenis Pinjaman | Nilai Pinjaman (Plafon) | Tenor | Batas Maksimum OJK per Hari |
| :--- | :--- | :--- | :--- |
| **Produktif** | Sampai Rp50.000.000 | Tenor sampai 6 bulan | **0,275%** (`0.00275`) |
| **Produktif** | Sampai Rp50.000.000 | Tenor di atas 6 bulan | **0,1%** (`0.001`) |
| **Produktif** | Di atas Rp50.000.000 | Semua tenor | **0,1%** (`0.001`) |
| **Konsumtif** | Semua nilai pinjaman | Tenor sampai 6 bulan | **0,3%** (`0.003`) |
| **Konsumtif** | Semua nilai pinjaman | Tenor di atas 6 bulan | **0,2%** (`0.002`) |

### Rumus Biaya per Hari (Tanpa Denda)
Biaya harian diukur murni dari selisih bunga dan potongan di muka terhadap pokok pinjaman, tanpa memasukkan denda keterlambatan:
$$\text{biayaPerHari} = \frac{\text{biayaTotal}}{\text{pokok} \times \text{durasiHari}}$$

- **Catatan Tenor 6 Bulan**: Durasi 6 bulan ditetapkan secara terstandar sebagai **180 hari** kalender (`HARI_ENAM_BULAN = 180`).
- **Lokasi Logika**: Fungsi penentuan batas dan meter risiko berada di `src/config/benchmarks.ts` melalui fungsi `ambangOjk(jenis, pokok, durasiHari)`.
- **Pengingat Evaluasi Berkala**: Otoritas Jasa Keuangan (OJK) dapat mengevaluasi dan menyesuaikan batas manfaat ekonomi ini secara berkala. Pengguna disarankan selalu mengonfirmasi dengan dokumen resmi SEOJK terbaru.

---

## 📐 Penjelasan Rumus Finansial (`src/lib/finance.ts`)

### 1. Uang Bersih Diterima
$$\text{diterima} = \text{pokok} - \text{potonganDimuka}$$

### 2. Total Pembayaran
$$\text{totalBayar} = \text{cicilan} \times \text{jumlahCicilan}$$

### 3. Total Biaya Tambahan (Uang Lebih)
$$\text{biayaTotal} = \text{totalBayar} - \text{diterima}$$

### 4. Beban Biaya per Rp100.000 Pinjaman
$$\text{biayaPer100rb} = \left(\frac{\text{biayaTotal}}{\text{diterima}}\right) \times 100.000$$

### 5. Suku Bunga Efektif per Periode ($r$) — Metode Bisection
Suku bunga periodik $r$ dicari secara numerik dengan menyelesaikan persamaan nilai tunai anuitas:
$$\text{diterima} = \sum_{t=1}^{n} \frac{\text{cicilan}}{(1 + r)^t}$$
Metode numerik **Bisection** dijalankan pada interval $[0, 5]$ dengan toleransi konvergensi $10^{-10}$ dan batas maksimal 200 iterasi.

### 6. Bunga Nominal Tahunan & Bunga Efektif Tahunan (APR)
- **Bunga Nominal Tahunan**:
  $$\text{bungaNominalTahunan} = r \times \text{periodePerTahun}$$
  *(Harian: 365, Mingguan: 52, Bulanan: 12)*
- **Bunga Efektif Tahunan**:
  $$\text{bungaEfektifTahunan} = (1 + r)^{\text{periodePerTahun}} - 1$$

### 7. Simulasi Keterlambatan Setoran
$$\text{denda} = \text{dendaPerHari} \times \text{hariTelat}$$
$$\text{totalBaru} = \text{totalBayar} + \text{denda}$$

---

## 📁 Struktur Folder Proyek

```
.
├── server.ts                 # Backend Express: proxy Gemini API & Vite middleware
├── src/
│   ├── components/           # Komponen UI modular
│   │   ├── AboutModal.tsx    # Modal Tentang Terang (cara kerja, privasi, disclaimer)
│   │   ├── Button.tsx        # Tombol aksesibel (WCAG AA, min-h 48px, focus ring)
│   │   ├── Card.tsx          # Kartu kontainer
│   │   ├── Coachmark.tsx     # Petunjuk singkat pada layar tertentu
│   │   ├── Disclaimer.tsx    # Teks disclaimer edukasi hukum
│   │   ├── ErrorBoundary.tsx # Pelindung dari layar putih
│   │   ├── Header.tsx        # Header (menu, audio, info, bahasa ID/EN)
│   │   ├── IntroScreen.tsx   # Layar pembuka singkat
│   │   ├── NavDrawer.tsx     # Menu samping
│   │   ├── PosterCarousel.tsx        # Carousel poster edukasi di Beranda
│   │   └── PosterIllustrations.tsx   # Ilustrasi SVG poster
│   ├── config/
│   │   └── benchmarks.ts     # Ambang batas risiko resmi (SEOJK No. 19/SEOJK.06/2025)
│   ├── data/
│   │   └── poster.ts         # Teks poster edukasi (ID dan EN)
│   ├── lib/
│   │   ├── ai.ts             # Integrasi Gemini API & Web Speech API (TTS)
│   │   ├── finance.ts        # Fungsi murni perhitungan finansial & bisection
│   │   ├── finance.test.ts   # Pengujian unit Vitest (10 tes)
│   │   ├── format.ts         # Pemformat Rupiah & Persen standar Indonesia
│   │   ├── image.ts          # Kompresi gambar unggahan (maksimal 1280px)
│   │   └── storage.ts        # Penyimpanan lokal offline (skema 'terang.v2')
│   ├── pages/
│   │   ├── Home.tsx          # Beranda & pengantar
│   │   ├── Input.tsx         # Masukkan penawaran (Tempel Teks, Foto, Manual)
│   │   ├── Confirm.tsx       # Konfirmasi & koreksi angka sebelum hitung
│   │   ├── Reveal.tsx        # Layar pembongkaran biaya (Animasi, kartu, gauge)
│   │   ├── Late.tsx          # Simulasi risiko telat bayar (slider 0-30 hari)
│   │   ├── Compare.tsx       # Sandingkan 2 penawaran (kolom A & B, centang hijau)
│   │   └── History.tsx       # Riwayat perhitungan tersimpan di perangkat
│   ├── i18n.ts               # Kamus multibahasa lengkap (Indonesia & Inggris)
│   ├── App.tsx               # State router utama & transisi layar
│   └── main.tsx              # Entry point aplikasi React
├── package.json
└── vite.config.ts
```

---

## 📋 Prasyarat
- **Node.js**: Versi `22.12.0` atau lebih baru.
- Periksa versi Node.js yang terpasang di komputer Anda:
  ```bash
  node -v
  ```
  *(Jika menggunakan nvm, jalankan `nvm use` untuk beralih ke versi yang ditentukan di `.nvmrc`)*

---

## 🚀 Cara Menjalankan Proyek

> **PENTING**: Proyek ini menggunakan **npm** sebagai satu-satunya manajer paket (*package manager*) resmi dengan berkas `package-lock.json`. Seluruh instalasi dan eksekusi skrip wajib menggunakan **npm** (jangan gunakan bun, yarn, atau pnpm).

1. **Instalasi Dependensi**:
   Instal seluruh pustaka dependensi resmi menggunakan **npm**:
   ```bash
   npm install
   ```

2. **Konfigurasi Lingkungan**:
   Buat file `.env` di direktori utama proyek berisi:
   ```env
   GEMINI_API_KEY=kunci_api_gemini_anda
   ```

3. **Menjalankan Server Pengembangan (Dev Server)**:
   ```bash
   npm run dev
   ```

4. **Buka di Peramban**:
   Akses `http://localhost:3000`

5. **Menjalankan Pengujian Unit (Vitest)**:
   ```bash
   npm test
   ```

> 💡 **Catatan Penanganan Masalah Jaringan**:  
> Jika `npm install` gagal dengan kendala jaringan seperti `ECONNRESET`:
> - Ganti koneksi jaringan (misalnya beralih ke hotspot HP/ponsel).
> - Matikan VPN atau proxy lokal yang sedang aktif.
> - Jangan simpan atau jalankan proyek di folder cloud syncing seperti OneDrive, Dropbox, atau Google Drive karena sistem file virtual dapat mengunci penulisan berkas `node_modules`.

### Build untuk Produksi
```bash
npm run build
npm start
```
