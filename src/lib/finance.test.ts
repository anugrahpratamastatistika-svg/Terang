import { describe, it, expect } from 'vitest';
import {
  Penawaran,
  validasiPenawaran,
  hitungDiterima,
  hitungTotalBayar,
  hitungBungaPerPeriode,
  hitungSemua,
  simulasiTelat,
  bandingkan,
} from './finance';
import { formatRupiah, formatPersen } from './format';
import {
  BENCHMARK,
  tentukanRisiko,
  konversiKeBungaPerHari,
  tentukanRisikoDariPenawaran,
  RISK_CONFIG,
  TANGGAL_CEK,
  ambangOjk,
  cekDendaOjk,
  formatPersenOjk,
} from '../config/benchmarks';
import { translations } from '../i18n';
import {
  simpanCek,
  daftarCek,
  hapusCek,
  hapusSemua,
  SCHEMA_KEY,
  LEGACY_SCHEMA_KEY,
  bersihkanDataLama,
  CONTOH_PENAWARAN,
} from './storage';

describe('src/lib/finance.ts — Perhitungan Finansial Terang', () => {
  // Kasus uji WAJIB 1:
  // pokok 1.000.000, potongan 100.000, cicilan 46.000 x 30 harian
  it('Kasus Wajib 1: Pinjaman pasar 1jt potongan 100rb, cicil 46rb x 30 hari', () => {
    const penawaran: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    const hasil = hitungSemua(penawaran);

    // Diterima: 900.000
    expect(hasil.diterima).toBe(900000);

    // Total bayar: 1.380.000
    expect(hasil.totalBayar).toBe(1380000);

    // Biaya total: 480.000
    expect(hasil.biayaTotal).toBe(480000);

    // Biaya per 100rb: (480.000 / 900.000) * 100.000 = 53333.33... (mendekati 53.333)
    expect(hasil.biayaPer100rb).toBeCloseTo(53333.33, 0);

    // Bunga per periode kira-kira 0,03 (toleransi 0,001)
    expect(hasil.bungaPerPeriode).toBeGreaterThanOrEqual(0.029);
    expect(hasil.bungaPerPeriode).toBeLessThanOrEqual(0.032);
    expect(Math.abs(hasil.bungaPerPeriode - 0.03)).toBeLessThan(0.002);

    // Durasi hari & periode per tahun
    expect(hasil.periodePerTahun).toBe(365);
    expect(hasil.durasiHari).toBe(30);
  });

  // Kasus uji WAJIB 2:
  // pinjaman tanpa bunga dan tanpa potongan (cicilan x n = pokok): r mendekati 0
  it('Kasus Wajib 2: Pinjaman tanpa bunga dan tanpa potongan, r mendekati 0', () => {
    const pokok = 1000000;
    const cicilan = 100000;
    const n = 10;
    const diterima = 1000000;

    const r = hitungBungaPerPeriode(diterima, cicilan, n);
    expect(r).toBeCloseTo(0, 5);
    expect(r).toBe(0);
  });

  // Kasus uji WAJIB 3:
  // input tidak valid (nol, negatif, totalBayar <= diterima) menghasilkan error validasi
  it('Kasus Wajib 3: Input tidak valid menghasilkan error validasi', () => {
    // 1. Pokok <= 0
    const errPokokNol = validasiPenawaran({
      pokok: 0,
      potonganDimuka: 0,
      cicilan: 50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });
    expect(errPokokNol).toContain('Pokok pinjaman harus lebih besar dari 0.');

    // 2. Cicilan negatif
    const errCicilanNegatif = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: -50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });
    expect(errCicilanNegatif).toContain('Cicilan per kali bayar harus lebih besar dari 0.');

    // 3. Jumlah cicilan bukan bilangan bulat
    const errJumlahDesimal = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 50000,
      jumlahCicilan: 10.5,
      frekuensi: 'harian',
    });
    expect(errJumlahDesimal).toContain('Jumlah cicilan harus berupa bilangan bulat.');

    // 4. Potongan >= pokok
    const errPotonganLebih = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 1000000,
      cicilan: 50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });
    expect(errPotonganLebih).toContain('Potongan di muka tidak boleh sama dengan atau melebihi pokok pinjaman.');

    // 5. totalBayar <= diterima ("Penawaran ini tidak masuk akal. Cek lagi angkanya.")
    const errTotalKurang = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 80000,
      jumlahCicilan: 10, // Total bayar 800.000 <= diterima 1.000.000
      frekuensi: 'harian',
    });
    expect(errTotalKurang).toContain('Penawaran ini tidak masuk akal. Cek lagi angkanya.');

    // 6. Total bayar tepat sama dengan diterima
    const errTotalSama = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 100000,
      jumlahCicilan: 10, // Total bayar 1.000.000 == diterima 1.000.000
      frekuensi: 'harian',
    });
    expect(errTotalSama).toContain('Penawaran ini tidak masuk akal. Cek lagi angkanya.');
  });

  // Kasus uji WAJIB 4:
  // simulasiTelat dengan dendaPerHari 5.000 dan hariTelat 10 menghasilkan denda 50.000
  it('Kasus Wajib 4: simulasiTelat dendaPerHari 5.000 dan hariTelat 10 menghasilkan denda 50.000', () => {
    const penawaran: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
      dendaPerHari: 5000,
    };

    const hasilTelat = simulasiTelat(penawaran, 10);

    expect(hasilTelat.denda).toBe(50000);
    expect(hasilTelat.tambahanBiaya).toBe(50000);
    expect(hasilTelat.totalBaru).toBe(1380000 + 50000); // 1.430.000
  });

  // Kasus uji tambahan: fungsi bandingkan(a, b)
  it('Membandingkan dua penawaran dan menentukan yang lebih murah', () => {
    // Penawaran A: pinjam 1jt potongan 100rb (terima 900rb), cicil 46rb x 30 = 1.380.000 (biayaTotal 480rb)
    const penawaranA: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    // Penawaran B: pinjam 1jt tanpa potongan (terima 1jt), cicil 37rb x 30 = 1.110.000 (biayaTotal 110rb)
    const penawaranB: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 37000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    const hasilKomparasi = bandingkan(penawaranA, penawaranB);

    // Penawaran B jauh lebih murah
    expect(hasilKomparasi.lebihMurah).toBe('b');
    expect(hasilKomparasi.biayaPer100rbB).toBeLessThan(hasilKomparasi.biayaPer100rbA);
    expect(hasilKomparasi.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(hasilKomparasi.penjelasan).toContain('Penawaran B lebih hemat');
  });

  // Kasus uji format: formatRupiah dan formatPersen
  it('Format helper bekerja dengan benar', () => {
    expect(formatRupiah(1380000)).toBe('Rp1.380.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(-50000)).toBe('-Rp50.000');

    expect(formatPersen(0.03, 1)).toBe('3,0%');
    expect(formatPersen(0.0301, 2)).toBe('3,01%');
    expect(formatPersen(25.5, 1)).toBe('25,5%');
  });

  // Kasus uji Benchmark Risiko OJK
  it('Evaluasi risiko berdasarkan ambang BENCHMARK', () => {
    // 1. Pengecekan ambangOjk per kategori, plafon, dan tenor
    expect(ambangOjk('produktif', 1_000_000, 30).batas).toBe(0.00275);
    expect(ambangOjk('produktif', 50_000_000, 180).batas).toBe(0.00275);
    expect(ambangOjk('produktif', 5_000_000, 181).batas).toBe(0.001);
    expect(ambangOjk('produktif', 50_000_001, 30).batas).toBe(0.001);

    expect(ambangOjk('konsumtif', 1_000_000, 30).batas).toBe(0.003);
    expect(ambangOjk('konsumtif', 1_000_000, 181).batas).toBe(0.002);

    // 2. Evaluasi tenorPendek (<= 180 hari)
    expect(ambangOjk('produktif', 1_000_000, 179).tenorPendek).toBe(true);
    expect(ambangOjk('produktif', 1_000_000, 181).tenorPendek).toBe(false);

    // 3. amanMaks = batas/2 dan waspadaMaks = batas
    const ambangProd = ambangOjk('produktif', 1_000_000, 30);
    expect(ambangProd.amanMaks).toBe(ambangProd.batas / 2);
    expect(ambangProd.waspadaMaks).toBe(ambangProd.batas);

    // 4. tentukanRisiko(x, batas): AMAN di <= batas/2, WASPADA di antara batas/2 dan batas, BAHAYA di atas batas
    const batas = 0.00275;
    expect(tentukanRisiko(batas / 2 * 0.5, batas)).toBe('AMAN');
    expect(tentukanRisiko(batas / 2, batas)).toBe('AMAN');
    expect(tentukanRisiko(batas * 0.75, batas)).toBe('WASPADA');
    expect(tentukanRisiko(batas, batas)).toBe('WASPADA');
    expect(tentukanRisiko(batas * 1.01, batas)).toBe('BAHAYA');
    expect(tentukanRisiko(batas * 2, batas)).toBe('BAHAYA');

    // 5. Pengecekan tentukanRisikoDariPenawaran
    expect(tentukanRisikoDariPenawaran(480000, 1000000, 30)).toBe('BAHAYA'); // contoh pasar 1,6% per hari
    expect(tentukanRisikoDariPenawaran(280000, 5000000, 360)).toBe('AMAN'); // bulanan Rp5 juta x 12
    expect(tentukanRisikoDariPenawaran(400000, 2000000, 56)).toBe('BAHAYA'); // mingguan Rp2 juta x 8
    expect(tentukanRisikoDariPenawaran(60000, 1000000, 30)).toBe('WASPADA');
    expect(tentukanRisikoDariPenawaran(30000, 1000000, 30, 'konsumtif')).toBe('AMAN');

    // 6. Metadata benchmark dan i18n
    expect(BENCHMARK.sumber).toBe('SEOJK No. 19/SEOJK.06/2025');
    expect(translations.ID.aboutCategoryNote).toContain('SEOJK No. 19/SEOJK.06/2025');
    expect(translations.EN.aboutCategoryNote).toContain('SEOJK No. 19/SEOJK.06/2025');

    // Verifikasi teks deskripsi status WASPADA resmi
    expect(RISK_CONFIG.WASPADA.shortDesc).toBe('Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.');
    expect(RISK_CONFIG.WASPADA.advice).toBe('Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.');
    expect(translations.ID.descWaspada).toBe('Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.');
    expect(translations.EN.descWaspada).toBe('Daily cost is between half of the limit and the OJK limit for licensed online lenders.');
  });

  // Kasus uji Evaluasi Denda OJK (SEOJK No. 19/SEOJK.06/2025)
  it('Evaluasi batas denda keterlambatan OJK dengan cekDendaOjk', () => {
    // denda 5.000 pada pokok 1.000.000 dengan batas 0.00275 melebihi batas (0,5%)
    const hasil1 = cekDendaOjk(5000, 1000000, 0.00275);
    expect(hasil1.persenPerHari).toBe(0.005);
    expect(hasil1.melebihiBatas).toBe(true);
    expect(formatPersenOjk(hasil1.persenPerHari)).toBe('0,5');

    // denda 2.000 tidak melebihi (0,2%)
    const hasil2 = cekDendaOjk(2000, 1000000, 0.00275);
    expect(hasil2.persenPerHari).toBe(0.002);
    expect(hasil2.melebihiBatas).toBe(false);
    expect(formatPersenOjk(hasil2.persenPerHari)).toBe('0,2');

    // pokok 0 tidak error
    expect(() => cekDendaOjk(5000, 0, 0.00275)).not.toThrow();
    const hasilPokokNol = cekDendaOjk(5000, 0, 0.00275);
    expect(hasilPokokNol.persenPerHari).toBe(0);
    expect(hasilPokokNol.melebihiBatas).toBe(false);
  });

  // Kasus uji Storage terang.v2
  it('Storage simpanCek, daftarCek, hapusCek, hapusSemua dengan skema terang.v2 dan bersihkanDataLama', () => {
    expect(SCHEMA_KEY).toBe('terang.v2');
    expect(LEGACY_SCHEMA_KEY).toBe('terang.v1');

    // Pastikan fungsi bersihkanDataLama dapat dipanggil dengan aman tanpa error
    expect(() => bersihkanDataLama()).not.toThrow();

    hapusSemua();
    expect(daftarCek().length).toBe(0);

    const hasilContoh = hitungSemua(CONTOH_PENAWARAN);
    const item = simpanCek(CONTOH_PENAWARAN, hasilContoh);

    expect(item.id).toBeDefined();
    expect(item.penawaran.pokok).toBe(1000000);
    expect(item.penawaran.potonganDimuka).toBe(100000);
    expect(item.hasil.diterima).toBe(900000);
    expect(item.hasil.totalBayar).toBe(1380000);

    // Verifikasi daftarCek membaca data yang tersimpan
    const daftar = daftarCek();
    expect(daftar.length).toBe(1);
    expect(daftar[0].id).toBe(item.id);

    // Hapus satu item
    hapusCek(item.id);
    expect(daftarCek().length).toBe(0);

    // Tambah dua lalu hapusSemua
    simpanCek(CONTOH_PENAWARAN, hasilContoh);
    simpanCek(CONTOH_PENAWARAN, hasilContoh);
    expect(daftarCek().length).toBe(2);

    hapusSemua();
    expect(daftarCek().length).toBe(0);
  });

  // Kasus uji Bandingkan 2 Penawaran (bandingkan)
  it('Fungsi bandingkan() mengevaluasi A lebih murah, B lebih murah, dan hampir sama', () => {
    // Penawaran Murah (A): pokok 1.000.000, tanpa potongan, cicil 110.000 x 10 kali (biaya total 100.000, biayaPer100rb = 10.000)
    const penawaranMurah: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 110000,
      jumlahCicilan: 10,
      frekuensi: 'bulanan',
    };

    // Penawaran Mahal (B): pokok 1.000.000, potongan 100.000, cicil 46.000 x 30 kali (biaya total 480.000, biayaPer100rb = 53.333)
    const penawaranMahal: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    // Kasus 1: A lebih murah dibanding B
    const resA = bandingkan(penawaranMurah, penawaranMahal);
    expect(resA.lebihMurah).toBe('a');
    expect(resA.biayaPer100rbA).toBeLessThan(resA.biayaPer100rbB);
    expect(resA.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(resA.penjelasan).toContain('Penawaran A lebih hemat');

    // Kasus 2: B lebih murah dibanding A (dibalik)
    const resB = bandingkan(penawaranMahal, penawaranMurah);
    expect(resB.lebihMurah).toBe('b');
    expect(resB.biayaPer100rbB).toBeLessThan(resB.biayaPer100rbA);
    expect(resB.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(resB.penjelasan).toContain('Penawaran B lebih hemat');

      // Kasus uji WAJIB 3
  it('Kasus Wajib 3: Input tidak valid menghasilkan error validasi', () => {
    const errPokokNol = validasiPenawaran({
      pokok: 0,
      potonganDimuka: 0,
      cicilan: 50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });

    expect(errPokokNol).toContain(
      'Pokok pinjaman harus lebih besar dari 0.'
    );

    const errCicilanNegatif = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: -50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });

    expect(errCicilanNegatif).toContain(
      'Cicilan per kali bayar harus lebih besar dari 0.'
    );

    const errJumlahDesimal = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 50000,
      jumlahCicilan: 10.5,
      frekuensi: 'harian',
    });

    expect(errJumlahDesimal).toContain(
      'Jumlah cicilan harus berupa bilangan bulat.'
    );

    const errPotonganLebih = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 1000000,
      cicilan: 50000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });

    expect(errPotonganLebih).toContain(
      'Potongan di muka tidak boleh sama dengan atau melebihi pokok pinjaman.'
    );

    const errTotalKurang = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 80000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });

    expect(errTotalKurang).toContain(
      'Total pembayaran lebih kecil daripada uang yang diterima. Periksa kembali angka cicilan, jumlah pembayaran, dan potongan.'
    );

    const errTotalSama = validasiPenawaran({
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 100000,
      jumlahCicilan: 10,
      frekuensi: 'harian',
    });

    expect(errTotalSama).toHaveLength(0);
  });

  // Kasus uji WAJIB 4
  it('Kasus Wajib 4: simulasiTelat menghasilkan denda 50.000', () => {
    const penawaran: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
      dendaPerHari: 5000,
    };

    const hasilTelat = simulasiTelat(penawaran, 10);

    expect(hasilTelat.denda).toBe(50000);
    expect(hasilTelat.tambahanBiaya).toBe(50000);
    expect(hasilTelat.totalBaru).toBe(1430000);
  });

  // Pengujian perbandingan dua penawaran
  it('Membandingkan dua penawaran dan menentukan yang lebih murah', () => {
    const penawaranA: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    const penawaranB: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 37000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    const hasilKomparasi = bandingkan(penawaranA, penawaranB);

    expect(hasilKomparasi.lebihMurah).toBe('b');
    expect(hasilKomparasi.biayaPer100rbB).toBeLessThan(
      hasilKomparasi.biayaPer100rbA
    );
    expect(hasilKomparasi.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(hasilKomparasi.penjelasan).toContain(
      'Penawaran B lebih hemat'
    );
  });

  // Pengujian format
  it('Format helper bekerja dengan benar', () => {
    expect(formatRupiah(1380000)).toBe('Rp1.380.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(-50000)).toBe('-Rp50.000');

    expect(formatPersen(0.03, 1)).toBe('3,0%');
    expect(formatPersen(0.0301, 2)).toBe('3,01%');
    expect(formatPersen(25.5, 1)).toBe('25,5%');
  });

  // Pengujian benchmark risiko OJK
  it('Evaluasi risiko berdasarkan ambang BENCHMARK', () => {
    expect(ambangOjk('produktif', 1000000, 30).batas).toBe(0.00275);
    expect(ambangOjk('produktif', 50000000, 180).batas).toBe(0.00275);
    expect(ambangOjk('produktif', 5000000, 181).batas).toBe(0.001);
    expect(ambangOjk('produktif', 50000001, 30).batas).toBe(0.001);

    expect(ambangOjk('konsumtif', 1000000, 30).batas).toBe(0.003);
    expect(ambangOjk('konsumtif', 1000000, 181).batas).toBe(0.002);

    expect(ambangOjk('produktif', 1000000, 179).tenorPendek).toBe(true);
    expect(ambangOjk('produktif', 1000000, 181).tenorPendek).toBe(false);

    const ambangProd = ambangOjk('produktif', 1000000, 30);

    expect(ambangProd.amanMaks).toBe(ambangProd.batas / 2);
    expect(ambangProd.waspadaMaks).toBe(ambangProd.batas);

    const batas = 0.00275;

    expect(tentukanRisiko(batas / 2 * 0.5, batas)).toBe('AMAN');
    expect(tentukanRisiko(batas / 2, batas)).toBe('AMAN');
    expect(tentukanRisiko(batas * 0.75, batas)).toBe('WASPADA');
    expect(tentukanRisiko(batas, batas)).toBe('WASPADA');
    expect(tentukanRisiko(batas * 1.01, batas)).toBe('BAHAYA');
    expect(tentukanRisiko(batas * 2, batas)).toBe('BAHAYA');

    expect(tentukanRisikoDariPenawaran(480000, 1000000, 30)).toBe('BAHAYA');
    expect(tentukanRisikoDariPenawaran(280000, 5000000, 360)).toBe('AMAN');
    expect(tentukanRisikoDariPenawaran(400000, 2000000, 56)).toBe('BAHAYA');
    expect(tentukanRisikoDariPenawaran(60000, 1000000, 30)).toBe('WASPADA');
    expect(tentukanRisikoDariPenawaran(30000, 1000000, 30, 'konsumtif')).toBe('AMAN');

    expect(BENCHMARK.sumber).toBe('SEOJK No. 19/SEOJK.06/2025');
    expect(translations.ID.aboutCategoryNote).toContain('SEOJK No. 19/SEOJK.06/2025');
    expect(translations.EN.aboutCategoryNote).toContain('SEOJK No. 19/SEOJK.06/2025');

    expect(RISK_CONFIG.WASPADA.shortDesc).toBe(
      'Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.'
    );
    expect(RISK_CONFIG.WASPADA.advice).toBe(
      'Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.'
    );
    expect(translations.ID.descWaspada).toBe(
      'Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.'
    );
    expect(translations.EN.descWaspada).toBe(
      'Daily cost is between half of the limit and the OJK limit for licensed online lenders.'
    );
  });

  // Pengujian batas denda OJK
  it('Evaluasi batas denda keterlambatan OJK dengan cekDendaOjk', () => {
    const hasil1 = cekDendaOjk(5000, 1000000, 0.00275);

    expect(hasil1.persenPerHari).toBe(0.005);
    expect(hasil1.melebihiBatas).toBe(true);
    expect(formatPersenOjk(hasil1.persenPerHari)).toBe('0,5');

    const hasil2 = cekDendaOjk(2000, 1000000, 0.00275);

    expect(hasil2.persenPerHari).toBe(0.002);
    expect(hasil2.melebihiBatas).toBe(false);
    expect(formatPersenOjk(hasil2.persenPerHari)).toBe('0,2');

    expect(() => cekDendaOjk(5000, 0, 0.00275)).not.toThrow();

    const hasilPokokNol = cekDendaOjk(5000, 0, 0.00275);

    expect(hasilPokokNol.persenPerHari).toBe(0);
    expect(hasilPokokNol.melebihiBatas).toBe(false);
  });

  // Pengujian storage
  it('Storage simpanCek, daftarCek, hapusCek, hapusSemua dengan skema terang.v2 dan bersihkanDataLama', () => {
    expect(SCHEMA_KEY).toBe('terang.v2');
    expect(LEGACY_SCHEMA_KEY).toBe('terang.v1');

    expect(() => bersihkanDataLama()).not.toThrow();

    hapusSemua();

    expect(daftarCek().length).toBe(0);

    const hasilContoh = hitungSemua(CONTOH_PENAWARAN);
    const item = simpanCek(CONTOH_PENAWARAN, hasilContoh);

    expect(item.id).toBeDefined();
    expect(item.penawaran.pokok).toBe(1000000);
    expect(item.penawaran.potonganDimuka).toBe(100000);
    expect(item.hasil.diterima).toBe(900000);
    expect(item.hasil.totalBayar).toBe(1380000);

    const daftar = daftarCek();

    expect(daftar.length).toBe(1);
    expect(daftar[0].id).toBe(item.id);

    hapusCek(item.id);

    expect(daftarCek().length).toBe(0);

    simpanCek(CONTOH_PENAWARAN, hasilContoh);
    simpanCek(CONTOH_PENAWARAN, hasilContoh);

    expect(daftarCek().length).toBe(2);

    hapusSemua();

    expect(daftarCek().length).toBe(0);
  });

  // Pengujian perbandingan dua penawaran
  it('Fungsi bandingkan() mengevaluasi A lebih murah, B lebih murah, dan hampir sama', () => {
    const penawaranMurah: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 110000,
      jumlahCicilan: 10,
      frekuensi: 'bulanan',
    };

    const penawaranMahal: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 100000,
      cicilan: 46000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
    };

    const resA = bandingkan(penawaranMurah, penawaranMahal);

    expect(resA.lebihMurah).toBe('a');
    expect(resA.biayaPer100rbA).toBeLessThan(resA.biayaPer100rbB);
    expect(resA.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(resA.penjelasan).toContain('Penawaran A lebih hemat');

    const resB = bandingkan(penawaranMahal, penawaranMurah);

    expect(resB.lebihMurah).toBe('b');
    expect(resB.biayaPer100rbB).toBeLessThan(resB.biayaPer100rbA);
    expect(resB.selisihBiayaPer100rb).toBeGreaterThan(0);
    expect(resB.penjelasan).toContain('Penawaran B lebih hemat');

    const penawaranSetara1: Penawaran = {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 110000,
      jumlahCicilan: 10,
      frekuensi: 'bulanan',
    };

    const penawaranSetara2: Penawaran = {
      pokok: 2000000,
      potonganDimuka: 0,
      cicilan: 220000,
      jumlahCicilan: 10,
      frekuensi: 'bulanan',
    };

    const resSama = bandingkan(penawaranSetara1, penawaranSetara2);

    expect(resSama.lebihMurah).toBe('sama');
    expect(resSama.selisihBiayaPer100rb).toBeCloseTo(0, 2);
    expect(resSama.penjelasan).toContain(
      'Kedua penawaran memiliki beban biaya relatif yang seimbang'
    );
  });
});
