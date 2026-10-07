// Ambang batas evaluasi risiko pinjaman mikro berdasarkan SEOJK No. 19/SEOJK.06/2025 (Romawi XIV)
export const TANGGAL_CEK = '4 Oktober 2026';
export const HARI_ENAM_BULAN = 180;

export type JenisPinjaman = 'produktif' | 'konsumtif';
export type RiskLevel = 'AMAN' | 'WASPADA' | 'BAHAYA';

// Batas maksimum manfaat ekonomi per hari kalender dari nilai pendanaan
const BATAS_OJK = {
  produktif: {
    plafonMaks: 50_000_000,
    kecilTenorPendek: 0.00275,
    kecilTenorPanjang: 0.001,
    besar: 0.001,
  },
  konsumtif: {
    tenorPendek: 0.003,
    tenorPanjang: 0.002,
  },
};

export interface AmbangOjk {
  batas: number;
  amanMaks: number;
  waspadaMaks: number;
  jenis: JenisPinjaman;
  tenorPendek: boolean;
  batasPersenTeks: string;
}

export function ambangOjk(jenis: JenisPinjaman, pokok: number, durasiHari: number): AmbangOjk {
  const tenorPendek = durasiHari <= HARI_ENAM_BULAN;
  let batas: number;

  if (jenis === 'konsumtif') {
    batas = tenorPendek ? BATAS_OJK.konsumtif.tenorPendek : BATAS_OJK.konsumtif.tenorPanjang;
  } else {
    if (pokok > BATAS_OJK.produktif.plafonMaks) {
      batas = BATAS_OJK.produktif.besar;
    } else {
      batas = tenorPendek ? BATAS_OJK.produktif.kecilTenorPendek : BATAS_OJK.produktif.kecilTenorPanjang;
    }
  }

  const amanMaks = batas / 2;
  const waspadaMaks = batas;
  const batasPersenTeks = `${(batas * 100).toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  })}%`;

  return { batas, amanMaks, waspadaMaks, jenis, tenorPendek, batasPersenTeks };
}

export interface EvaluasiDendaOjk {
  persenPerHari: number;
  melebihiBatas: boolean;
}

export function formatPersenOjk(desimal: number): string {
  return (desimal * 100).toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  });
}

export function cekDendaOjk(dendaPerHari: number, pokok: number, batas: number): EvaluasiDendaOjk {
  if (pokok <= 0 || dendaPerHari <= 0) {
    return { persenPerHari: 0, melebihiBatas: false };
  }
  const persenPerHari = dendaPerHari / pokok;
  return { persenPerHari, melebihiBatas: persenPerHari > batas };
}

export const BENCHMARK = {
  negara: 'ID',
  sumber: 'SEOJK No. 19/SEOJK.06/2025',
  sumberLengkap: 'SEOJK No. 19/SEOJK.06/2025 tentang Penyelenggaraan LPBBTI (31 Juli 2025)',
  tanggalCek: TANGGAL_CEK,
  hariEnamBulan: HARI_ENAM_BULAN,
};

export function hitungBiayaPerHari(biayaTotal: number, pokok: number, durasiHari: number): number {
  if (pokok <= 0 || durasiHari <= 0) return 0;
  return biayaTotal / pokok / durasiHari;
}

export function tentukanRisiko(biayaPerHari: number, batasOjk: number): RiskLevel {
  const amanMaks = batasOjk / 2;
  if (biayaPerHari <= amanMaks) return 'AMAN';
  if (biayaPerHari <= batasOjk) return 'WASPADA';
  return 'BAHAYA';
}

export function konversiKeBungaPerHari(bungaPerPeriode: number, frekuensi: 'harian' | 'mingguan' | 'bulanan'): number {
  switch (frekuensi) {
    case 'harian':
      return bungaPerPeriode;
    case 'mingguan':
      return bungaPerPeriode / 7;
    case 'bulanan':
      return bungaPerPeriode / 30;
    default:
      return bungaPerPeriode;
  }
}

export function tentukanRisikoDariPenawaran(
  biayaTotal: number,
  pokok: number,
  durasiHari: number,
  jenis: JenisPinjaman = 'produktif'
): RiskLevel {
  const biayaPerHari = hitungBiayaPerHari(biayaTotal, pokok, durasiHari);
  const ambang = ambangOjk(jenis, pokok, durasiHari);
  return tentukanRisiko(biayaPerHari, ambang.batas);
}

export interface RiskEvaluation {
  level: RiskLevel;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ringColor: string;
  shortDesc: string;
  advice: string;
}

export const RISK_CONFIG: Record<RiskLevel, RiskEvaluation> = {
  AMAN: {
    level: 'AMAN',
    label: 'AMAN',
    badgeBg: 'bg-[#2E9E6B]/10',
    badgeText: 'text-[#2E9E6B]',
    badgeBorder: 'border-[#2E9E6B]/30',
    ringColor: '#2E9E6B',
    shortDesc: 'Biaya harian di bawah setengah batas OJK untuk pinjol berizin. Ini aturan internal Terang, bukan jaminan.',
    advice: 'Biaya harian di bawah setengah batas OJK untuk pinjol berizin. Ini aturan internal Terang, bukan jaminan.',
  },
  WASPADA: {
    level: 'WASPADA',
    label: 'WASPADA',
    badgeBg: 'bg-[#F28C28]/10',
    badgeText: 'text-[#F28C28]',
    badgeBorder: 'border-[#F28C28]/30',
    ringColor: '#F28C28',
    shortDesc: 'Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.',
    advice: 'Biaya harian di antara setengah batas dan batas OJK untuk pinjol berizin.',
  },
  BAHAYA: {
    level: 'BAHAYA',
    label: 'BAHAYA',
    badgeBg: 'bg-[#D62839]/10',
    badgeText: 'text-[#D62839]',
    badgeBorder: 'border-[#D62839]/30',
    ringColor: '#D62839',
    shortDesc: 'Biaya harian sangat tinggi, melebihi batas resmi pinjol berizin OJK.',
    advice: 'Uang lebih yang dikembalikan sangat besar, melebihi batas resmi pinjol berizin OJK. Ada risiko beban keuangan berlebih.',
  },
};
