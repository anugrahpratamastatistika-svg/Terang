export type Frekuensi = 'harian' | 'mingguan' | 'bulanan';
export type JenisPinjaman = 'produktif' | 'konsumtif';

export interface Penawaran {
  pokok: number;
  potonganDimuka: number;
  cicilan: number;
  jumlahCicilan: number;
  frekuensi: Frekuensi;
  dendaPerHari?: number;
  jenisPinjaman?: JenisPinjaman;
}

export interface Hasil {
  diterima: number;
  totalBayar: number;
  biayaTotal: number;
  biayaPer100rb: number;
  bungaPerPeriode: number;
  bungaNominalTahunan: number;
  bungaEfektifTahunan: number;
  periodePerTahun: number;
  durasiHari: number;
}

export interface HasilPerbandingan {
  lebihMurah: 'a' | 'b' | 'sama';
  biayaPer100rbA: number;
  biayaPer100rbB: number;
  selisihBiayaPer100rb: number;
  selisihRupiahTernormalisasi: number;
  penjelasan: string;
}

export function validasiPenawaran(p: Penawaran): string[] {
  const errors: string[] = [];

  if (p.pokok <= 0) errors.push('Pokok pinjaman harus lebih besar dari 0.');
  if (p.cicilan <= 0) errors.push('Cicilan per kali bayar harus lebih besar dari 0.');

  if (p.jumlahCicilan <= 0) {
    errors.push('Jumlah cicilan harus lebih besar dari 0.');
  } else if (!Number.isInteger(p.jumlahCicilan)) {
    errors.push('Jumlah cicilan harus berupa bilangan bulat.');
  }

  if (p.potonganDimuka < 0) {
    errors.push('Potongan di muka tidak boleh bernilai negatif.');
  } else if (p.potonganDimuka >= p.pokok) {
    errors.push('Potongan di muka tidak boleh sama dengan atau melebihi pokok pinjaman.');
  }

  const diterima = p.pokok - (p.potonganDimuka || 0);
  const totalBayar = p.cicilan * p.jumlahCicilan;
  if (totalBayar <= diterima) {
    errors.push('Penawaran ini tidak masuk akal. Cek lagi angkanya.');
  }

  return errors;
}

export function hitungDiterima(p: Penawaran): number {
  return p.pokok - (p.potonganDimuka || 0);
}

export function hitungTotalBayar(p: Penawaran): number {
  return p.cicilan * p.jumlahCicilan;
}

export function hitungBungaPerPeriode(diterima: number, cicilan: number, jumlahCicilan: number): number {
  if (diterima <= 0 || cicilan <= 0 || jumlahCicilan <= 0) {
    throw new Error('Nilai diterima, cicilan, dan jumlahCicilan harus bernilai positif.');
  }

  const totalBayar = cicilan * jumlahCicilan;
  if (Math.abs(totalBayar - diterima) < 1e-10) return 0;
  if (totalBayar < diterima) {
    throw new Error('Total pembayaran lebih kecil dari uang diterima, tidak ada suku bunga positif.');
  }

  const f = (r: number) => {
    if (r === 0) return totalBayar - diterima;
    return cicilan * ((1 - Math.pow(1 + r, -jumlahCicilan)) / r) - diterima;
  };

  let low = 0;
  let high = 5;

  if (Math.abs(f(low)) <= 1e-10) return 0;
  if (f(high) > 0) {
    throw new Error('Metode bisection tidak konvergen pada rentang [0, 5]: suku bunga efektif melebihi 500% per periode.');
  }

  const maxIter = 200;
  const tol = 1e-10;

  for (let iter = 0; iter < maxIter; iter++) {
    const mid = (low + high) / 2;
    const fMid = f(mid);

    if (Math.abs(fMid) < tol || (high - low) / 2 < tol) {
      return mid;
    }

    if (fMid > 0) low = mid;
    else high = mid;
  }

  const finalRate = (low + high) / 2;
  if (Math.abs(f(finalRate)) > 1e-5) {
    throw new Error(`Metode bisection tidak konvergen setelah ${maxIter} iterasi.`);
  }

  return finalRate;
}

export function hitungSemua(p: Penawaran): Hasil {
  const errors = validasiPenawaran(p);
  if (errors.length > 0) {
    throw new Error(`Penawaran tidak valid: ${errors.join(' ')}`);
  }

  const diterima = hitungDiterima(p);
  const totalBayar = hitungTotalBayar(p);
  const biayaTotal = totalBayar - diterima;
  const biayaPer100rb = (biayaTotal / diterima) * 100_000;

  const periodePerTahun = p.frekuensi === 'harian' ? 365 : p.frekuensi === 'mingguan' ? 52 : 12;
  const durasiHari = p.frekuensi === 'harian' ? p.jumlahCicilan : p.frekuensi === 'mingguan' ? p.jumlahCicilan * 7 : p.jumlahCicilan * 30;

  const bungaPerPeriode = hitungBungaPerPeriode(diterima, p.cicilan, p.jumlahCicilan);
  const bungaNominalTahunan = bungaPerPeriode * periodePerTahun;
  const bungaEfektifTahunan = Math.pow(1 + bungaPerPeriode, periodePerTahun) - 1;

  return {
    diterima,
    totalBayar,
    biayaTotal,
    biayaPer100rb,
    bungaPerPeriode,
    bungaNominalTahunan,
    bungaEfektifTahunan,
    periodePerTahun,
    durasiHari,
  };
}

export function simulasiTelat(p: Penawaran, hariTelat: number): { denda: number; totalBaru: number; tambahanBiaya: number } {
  const hari = Math.max(0, hariTelat);
  const dendaPerHari = Math.max(0, p.dendaPerHari ?? 0);
  const denda = dendaPerHari * hari;
  const totalBaru = hitungTotalBayar(p) + denda;

  return {
    denda,
    totalBaru,
    tambahanBiaya: denda,
  };
}

export function bandingkan(a: Penawaran, b: Penawaran): HasilPerbandingan {
  const hasilA = hitungSemua(a);
  const hasilB = hitungSemua(b);

  const biayaPer100rbA = hasilA.biayaPer100rb;
  const biayaPer100rbB = hasilB.biayaPer100rb;
  const selisihBiayaPer100rb = Math.abs(biayaPer100rbA - biayaPer100rbB);

  const biayaBNormal = (biayaPer100rbB / 100_000) * hasilA.diterima;
  const selisihRupiahTernormalisasi = Math.abs(hasilA.biayaTotal - biayaBNormal);

  let lebihMurah: 'a' | 'b' | 'sama';
  let penjelasan = '';

  if (biayaPer100rbA < biayaPer100rbB - 0.01) {
    lebihMurah = 'a';
    penjelasan = `Penawaran A lebih hemat Rp${Math.round(selisihBiayaPer100rb).toLocaleString('id-ID')} per setiap Rp100.000 uang yang Anda terima.`;
  } else if (biayaPer100rbB < biayaPer100rbA - 0.01) {
    lebihMurah = 'b';
    penjelasan = `Penawaran B lebih hemat Rp${Math.round(selisihBiayaPer100rb).toLocaleString('id-ID')} per setiap Rp100.000 uang yang Anda terima.`;
  } else {
    lebihMurah = 'sama';
    penjelasan = 'Kedua penawaran memiliki beban biaya relatif yang seimbang per nominal uang diterima.';
  }

  return {
    lebihMurah,
    biayaPer100rbA,
    biayaPer100rbB,
    selisihBiayaPer100rb,
    selisihRupiahTernormalisasi: Math.round(selisihRupiahTernormalisasi),
    penjelasan,
  };
}
