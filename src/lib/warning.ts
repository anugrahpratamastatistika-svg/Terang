import type { Penawaran, Hasil } from './finance';
import type { RiskLevel } from '../config/benchmarks';

export interface Peringatan {
  judul: string;
  keterangan: string;
  tingkat: 'info' | 'waspada' | 'bahaya';
}

export function cekPeringatan(
  penawaran: Penawaran,
  hasil: Hasil,
  risiko: RiskLevel
): Peringatan[] {
  const peringatan: Peringatan[] = [];

  if (penawaran.potonganDimuka > 0) {
    peringatan.push({
      judul: 'Ada Potongan di Dimuka',
      keterangan:
        'Uang yang diterima lebih kecil daripada jumlah pinjaman yang tercatat. Hal ini dapat mempengaruhi jumlah cicilan yang harus dibayarkan. Periksa kembali biaya potongannya.',
      tingkat: 'waspada',
    });
  }

  if (risiko === 'BAHAYA') {
    peringatan.push({
      judul: 'Biaya harian melewati batas pembanding',
      keterangan:
        'Biaya harian penawaran ini melebihi batas pembanding yang digunakan Terang untuk pinjaman sejenisnya.',
      tingkat: 'bahaya',
    });
  }

  if (penawaran.frekuensi === 'harian') {
    peringatan.push({
      judul: 'Cicilan dibayar setiap hari',
      keterangan:
        'Pastikan pemasukan harian cukup untuk membayar cicilan tanpa mengganggu kebutuhan usaha.',
      tingkat: 'info',
    });
  }

  if (penawaran.dendaPerHari == null) {
    peringatan.push({
      judul: 'Denda belum dicantumkan',
      keterangan:
        'Periksa perjanjian pinjaman untuk memastikan apakah ada denda keterlambatan.',
      tingkat: 'info',
    });
  }

  peringatan.push({
    judul: 'Periksa isi perjanjian',
    keterangan:
      'Pastikan biaya tambahan, jadwal pembayaran, dan ketentuan keterlambatan sudah dipahami.',
    tingkat: 'info',
  });

  return peringatan;
}