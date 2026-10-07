import { Hasil, Penawaran } from './finance';
import { formatRupiah } from './format';

export interface HasilEkstraksi {
  pokok: number | null;
  potonganDimuka: number | null;
  cicilan: number | null;
  jumlahCicilan: number | null;
  frekuensi: 'harian' | 'mingguan' | 'bulanan' | null;
  dendaPerHari: number | null;
  kolomTidakYakin: string[];
}

export interface PenjelasanHasil {
  penjelasan: string;
  tandaBahaya: string[];
}

const AI_TIMEOUT_MS = 20_000;

export async function ekstrakPenawaran(input: {
  teks?: string;
  fotoBase64?: string;
  mimeType?: string;
  lang?: 'ID' | 'EN';
}): Promise<HasilEkstraksi> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch('/api/analyze-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        teks: input.teks,
        fotoBase64: input.fotoBase64,
        mimeType: input.mimeType || 'image/jpeg',
        lang: input.lang || 'ID',
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membaca penawaran otomatis.');
    }

    const json = await res.json();
    const raw = json.data || {};
    const kolomTidakYakin: string[] = Array.isArray(raw.kolomTidakYakin) ? raw.kolomTidakYakin : [];

    const parseNum = (val: any, allowZero = false): number | null => {
      if (typeof val === 'number' && Number.isFinite(val)) {
        return (allowZero ? val >= 0 : val > 0) ? Math.round(val) : null;
      }
      if (typeof val === 'string') {
        const clean = val.replace(/[^\d]/g, '');
        if (!clean) return allowZero ? 0 : null;
        const n = parseInt(clean, 10);
        return !isNaN(n) && (allowZero ? n >= 0 : n > 0) ? n : null;
      }
      return null;
    };

    const parseFrekuensi = (val: any): 'harian' | 'mingguan' | 'bulanan' | null => {
      if (typeof val !== 'string') return null;
      const s = val.toLowerCase();
      if (s.includes('hari') || s.includes('day')) return 'harian';
      if (s.includes('minggu') || s.includes('week')) return 'mingguan';
      if (s.includes('bulan') || s.includes('month')) return 'bulanan';
      return null;
    };

    const hasil: HasilEkstraksi = {
      pokok: parseNum(raw.pokok, false),
      potonganDimuka: parseNum(raw.potonganDimuka, true),
      cicilan: parseNum(raw.cicilan, false),
      jumlahCicilan: parseNum(raw.jumlahCicilan, false),
      frekuensi: parseFrekuensi(raw.frekuensi),
      dendaPerHari: parseNum(raw.dendaPerHari, true),
      kolomTidakYakin,
    };

    const requiredKeys: (keyof HasilEkstraksi)[] = ['pokok', 'cicilan', 'jumlahCicilan', 'frekuensi'];
    for (const key of requiredKeys) {
      if (hasil[key] === null && !hasil.kolomTidakYakin.includes(key)) {
        hasil.kolomTidakYakin.push(key);
      }
    }

    return hasil;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (input.fotoBase64) throw error;
    return parseTextFallback(input.teks || '');
  }
}

export const analyzeOfferWithAI = ekstrakPenawaran;

export async function jelaskanHasil(
  hasil: Hasil,
  penawaran: Penawaran,
  lang: 'ID' | 'EN' = 'ID'
): Promise<PenjelasanHasil> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch('/api/explain-loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ hasil, penawaran, lang }),
    });

    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Gagal memuat penjelasan AI');

    const data = await res.json();
    if (data.data?.penjelasan && Array.isArray(data.data?.tandaBahaya)) {
      return { penjelasan: data.data.penjelasan, tandaBahaya: data.data.tandaBahaya };
    }
    if (data.explanation) {
      return { penjelasan: data.explanation, tandaBahaya: buatTandaBahayaFallback(hasil, penawaran, lang) };
    }
    throw new Error('Format respon tidak sesuai');
  } catch {
    clearTimeout(timeoutId);
    return buatPenjelasanFallback(hasil, penawaran, lang);
  }
}

function buatPenjelasanFallback(hasil: Hasil, penawaran: Penawaran, lang: 'ID' | 'EN'): PenjelasanHasil {
  const isEn = lang === 'EN';
  const diterima = formatRupiah(hasil.diterima);
  const totalBayar = formatRupiah(hasil.totalBayar);
  const biayaLebih = formatRupiah(hasil.biayaTotal);
  const cicilan = formatRupiah(penawaran.cicilan);

  const penjelasan = isEn
    ? `You receive ${diterima} in cash. But the total you must repay is ${totalBayar}. This means you are paying an extra ${biayaLebih} across ${penawaran.jumlahCicilan} payments of ${cicilan} (${penawaran.frekuensi}).`
    : `Uang bersih yang masuk ke kantongmu adalah ${diterima}. Tapi total uang yang harus kamu kembalikan mencapai ${totalBayar}. Artinya, kamu harus membayar lebih sebesar ${biayaLebih} lewat setoran ${cicilan} setiap ${penawaran.frekuensi}.`;

  return { penjelasan, tandaBahaya: buatTandaBahayaFallback(hasil, penawaran, lang) };
}

function buatTandaBahayaFallback(hasil: Hasil, penawaran: Penawaran, lang: 'ID' | 'EN'): string[] {
  const isEn = lang === 'EN';
  const items: string[] = [];

  if (penawaran.potonganDimuka > 0) {
    items.push(
      isEn
        ? `There is an upfront deduction of ${formatRupiah(penawaran.potonganDimuka)}. You do not receive the full written principal.`
        : `Ada potongan di awal sebesar ${formatRupiah(penawaran.potonganDimuka)}. Kamu tidak menerima utuh sesuai pinjaman tertulis.`
    );
  }
  if (penawaran.frekuensi === 'harian') {
    items.push(
      isEn
        ? `Mandatory daily payment of ${formatRupiah(penawaran.cicilan)}. Make sure daily business profit covers this without eating capital.`
        : `Setoran wajib harian ${formatRupiah(penawaran.cicilan)}. Pastikan ada sisa laba bersih setiap hari agar modal dagangan tidak terpakai.`
    );
  }
  if (hasil.biayaPer100rb >= 30000) {
    items.push(
      isEn
        ? `The extra cost is substantial (for every Rp100,000 you pay ${formatRupiah(Math.round(hasil.biayaPer100rb))} extra).`
        : `Biaya lebih cukup berat (tiap Rp100.000 kamu bayar lebih ${formatRupiah(Math.round(hasil.biayaPer100rb))}).`
    );
  }
  if (penawaran.dendaPerHari && penawaran.dendaPerHari > 0) {
    items.push(
      isEn
        ? `Late fee is ${formatRupiah(penawaran.dendaPerHari)} per day. If trade slows down for 3 days, penalties pile up rapidly.`
        : `Denda telat ${formatRupiah(penawaran.dendaPerHari)} per hari. Jika dagangan sepi 3 hari berturut-turut, denda akan cepat menumpuk.`
    );
  } else if (!isEn) {
    items.push('Tanyakan apakah ada denda tambahan jika setoran terlambat dibayar.');
  }

  return items;
}

function parseTextFallback(text: string): HasilEkstraksi {
  const result: HasilEkstraksi = {
    pokok: null,
    potonganDimuka: null,
    cicilan: null,
    jumlahCicilan: null,
    frekuensi: null,
    dendaPerHari: null,
    kolomTidakYakin: [],
  };

  if (!text) {
    result.kolomTidakYakin = ['pokok', 'cicilan', 'jumlahCicilan', 'frekuensi'];
    return result;
  }

  const clean = text.toLowerCase();

  const pokokMatch = clean.match(/(?:pinjam|plafon|cair|dana|pokok|loan)\s*(?:rp|sebesar)?\s*([\d.,]+(?:\s*(?:juta|jt|ribu|rb))?)/i);
  if (pokokMatch?.[1]) result.pokok = parseIndonesianAmount(pokokMatch[1]);
  else result.kolomTidakYakin.push('pokok');

  const potongMatch = clean.match(/(?:potong|admin|biaya\s*admin|asuransi|fee|cut)\s*(?:rp)?\s*([\d.,]+(?:\s*(?:juta|jt|ribu|rb))?)/i);
  if (potongMatch?.[1]) result.potonganDimuka = parseIndonesianAmount(potongMatch[1]);

  const cicilMatch = clean.match(/(?:cicil|angsur|setor|bayar|installment)\s*(?:rp)?\s*([\d.,]+(?:\s*(?:juta|jt|ribu|rb))?)/i);
  if (cicilMatch?.[1]) result.cicilan = parseIndonesianAmount(cicilMatch[1]);
  else result.kolomTidakYakin.push('cicilan');

  const tenorMatch = clean.match(/(\d+)\s*(?:kali|x|hari|minggu|bulan|days|times)/i);
  if (tenorMatch?.[1]) result.jumlahCicilan = parseInt(tenorMatch[1], 10);
  else result.kolomTidakYakin.push('jumlahCicilan');

  if (clean.includes('harian') || clean.includes('hari') || clean.includes('daily')) {
    result.frekuensi = 'harian';
  } else if (clean.includes('mingguan') || clean.includes('minggu') || clean.includes('weekly')) {
    result.frekuensi = 'mingguan';
  } else if (clean.includes('bulanan') || clean.includes('bulan') || clean.includes('monthly')) {
    result.frekuensi = 'bulanan';
  } else {
    result.kolomTidakYakin.push('frekuensi');
  }

  return result;
}

function parseIndonesianAmount(str: string): number {
  const cleanStr = str.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  let num = parseFloat(cleanStr) || 0;
  if (/juta|jt|million/i.test(str)) num *= 1_000_000;
  else if (/ribu|rb|thousand/i.test(str)) num *= 1_000;
  return Math.round(num);
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, lang: 'ID' | 'EN' = 'ID', onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[#*_`]/g, '')
    .replace(/Rp\s*([\d.]+)/g, '$1 rupiah')
    .trim();

  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance.lang = lang === 'EN' ? 'en-US' : 'id-ID';
  currentUtterance.rate = 0.92;
  currentUtterance.pitch = 1.0;

  const reset = () => {
    currentUtterance = null;
    onEnd?.();
  };

  currentUtterance.onend = reset;
  currentUtterance.onerror = reset;

  window.speechSynthesis.speak(currentUtterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}
