import { Hasil, Penawaran } from './finance';

export const SCHEMA_KEY = 'terang.v2';
export const LEGACY_SCHEMA_KEY = 'terang.v1';

export interface ItemRiwayat {
  id: string;
  waktu: number;
  penawaran: {
    pokok: number;
    potonganDimuka: number;
    cicilan: number;
    jumlahCicilan: number;
    frekuensi: 'harian' | 'mingguan' | 'bulanan';
    dendaPerHari?: number;
    jenisPinjaman?: 'produktif' | 'konsumtif';
  };
  hasil: {
    diterima: number;
    totalBayar: number;
    biayaTotal: number;
    biayaPer100rb: number;
    bungaPerPeriode: number;
    bungaNominalTahunan: number;
    bungaEfektifTahunan: number;
    periodePerTahun: number;
    durasiHari: number;
  };
}

const memoryStore: Record<string, string> = {};

function getStorage(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {}
  return memoryStore[key] ?? null;
}

function setStorage(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStore[key] = value;
}

function removeStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {}
  delete memoryStore[key];
}

export function bersihkanDataLama(): void {
  removeStorage(LEGACY_SCHEMA_KEY);
}

bersihkanDataLama();

export function simpanCek(penawaran: Penawaran, hasil: Hasil): ItemRiwayat {
  const riwayat = daftarCek();
  const item: ItemRiwayat = {
    id: `cek_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    waktu: Date.now(),
    penawaran: {
      pokok: penawaran.pokok,
      potonganDimuka: penawaran.potonganDimuka || 0,
      cicilan: penawaran.cicilan,
      jumlahCicilan: penawaran.jumlahCicilan,
      frekuensi: penawaran.frekuensi,
      dendaPerHari: penawaran.dendaPerHari || 0,
      jenisPinjaman: penawaran.jenisPinjaman || 'produktif',
    },
    hasil: {
      diterima: hasil.diterima,
      totalBayar: hasil.totalBayar,
      biayaTotal: hasil.biayaTotal,
      biayaPer100rb: hasil.biayaPer100rb,
      bungaPerPeriode: hasil.bungaPerPeriode,
      bungaNominalTahunan: hasil.bungaNominalTahunan,
      bungaEfektifTahunan: hasil.bungaEfektifTahunan,
      periodePerTahun: hasil.periodePerTahun,
      durasiHari: hasil.durasiHari,
    },
  };

  const updated = [item, ...riwayat].slice(0, 50);
  setStorage(SCHEMA_KEY, JSON.stringify(updated));
  return item;
}

export function daftarCek(): ItemRiwayat[] {
  try {
    const raw = getStorage(SCHEMA_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    return list.filter((item): item is ItemRiwayat =>
      Boolean(
        item?.id &&
        item?.waktu &&
        typeof item?.penawaran?.pokok === 'number' &&
        typeof item?.hasil?.diterima === 'number'
      )
    );
  } catch {
    return [];
  }
}

export function hapusCek(id: string): void {
  const list = daftarCek().filter((item) => item.id !== id);
  setStorage(SCHEMA_KEY, JSON.stringify(list));
}

export function hapusSemuaCek(): void {
  removeStorage(SCHEMA_KEY);
}

export const hapusSemua = hapusSemuaCek;

export const CONTOH_PENAWARAN: Penawaran = {
  pokok: 1000000,
  potonganDimuka: 100000,
  cicilan: 46000,
  jumlahCicilan: 30,
  frekuensi: 'harian',
  dendaPerHari: 5000,
  jenisPinjaman: 'produktif',
};
