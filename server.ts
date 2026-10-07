import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));

// diurutkan dari prioritas tertinggi; model yang gagal dilewati otomatis
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
const apiKey = (process.env.GEMINI_API_KEY || '').trim();

const ai = apiKey
  ? new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
  : null;

if (!ai) {
  console.warn('GEMINI_API_KEY belum disetel. Fitur AI akan dialihkan ke mode cadangan.');
}

// Rate limiter: 20 req/menit per IP
const rateLimits = new Map<string, { count: number; reset: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, item] of rateLimits.entries()) {
    if (now > item.reset) rateLimits.delete(ip);
  }
}, 120_000).unref();

app.use('/api', (req, res, next) => {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').toString();
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.reset) {
    rateLimits.set(ip, { count: 1, reset: now + 60_000 });
    return next();
  }

  if (record.count >= 20) {
    return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar atau isi manual.' });
  }

  record.count += 1;
  next();
});

const exhaustedModels = new Set<string>();

// Helper eksekusi Gemini dengan fallback otomatis jika model utama sedang sibuk atau kehabisan kuota
async function runGeminiWithFallback(contents: any, systemInstruction: string, responseSchema: any, temperature = 0.1) {
  if (!ai) throw new Error('AI service offline');
  const models = [...GEMINI_MODELS.filter((m) => !exhaustedModels.has(m)), ...GEMINI_MODELS.filter((m) => exhaustedModels.has(m))];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction, temperature, responseMimeType: 'application/json', responseSchema },
      });
      if (res.text) {
        exhaustedModels.delete(model);
        return JSON.parse(res.text);
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${model} gagal (${err?.status || err?.message}), mencoba cadangan...`);
      if (err?.message?.includes('Quota exceeded') || err?.message?.includes('exceeded your current quota')) {
        exhaustedModels.add(model);
      }
      if (err?.status === 503 || err?.status === 429) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }
  }

  throw lastErr || new Error('Semua model AI gagal merespons');
}

// Analisis & ekstraksi data penawaran pinjaman dari teks atau foto
app.post('/api/analyze-offer', async (req, res) => {
  try {
    const { teks, text, fotoBase64, imageBase64, mimeType } = req.body || {};
    const inputTeks = teks || text;
    const inputFoto = fotoBase64 || imageBase64;

    if (!inputTeks && !inputFoto) {
      return res.status(400).json({ error: 'Harap sediakan teks atau gambar penawaran.' });
    }

    if (typeof inputTeks === 'string' && inputTeks.length > 4000) {
      return res.status(400).json({
        error: 'Teks penawaran terlalu panjang (maksimal 4.000 karakter). Silakan perpendek teks atau gunakan tab Isi Manual.',
      });
    }

    let effectiveMime = (mimeType || '').toLowerCase().trim();
    if (inputFoto && typeof inputFoto === 'string') {
      const match = inputFoto.match(/^data:([a-zA-Z0-9.+/-]+);base64,/i);
      if (match) effectiveMime = match[1].toLowerCase().trim();
    }
    if (effectiveMime === 'image/jpg' || !effectiveMime) effectiveMime = 'image/jpeg';

    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
    if (inputFoto && !ALLOWED_MIME.includes(effectiveMime)) {
      return res.status(400).json({
        error: 'Format gambar tidak didukung. Harap gunakan format gambar JPG, PNG, atau WebP.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Layanan pembaca otomatis sedang tidak aktif. Silakan masukkan angka penawaran langsung di tab Isi Manual.',
      });
    }

    const cleanBase64 = typeof inputFoto === 'string'
      ? inputFoto.replace(/^data:[a-zA-Z0-9.+/-]+;base64,/i, '').replace(/\s+/g, '')
      : '';
    const cleanText = typeof inputTeks === 'string' ? inputTeks.trim().replace(/[^\S\r\n]+/g, ' ') : '';

    const systemInstruction = `Kamu adalah ahli pembaca dokumen, brosur pasar, selebaran, dan tangkapan layar (screenshot) penawaran pinjaman mikro / UMKM di Indonesia.
Tugasmu: membaca dan mengekstrak data pinjaman secara akurat dan teliti.

Pedoman Ekstraksi:
1. Konversi satuan nominal Indonesia ke angka murni Rupiah (misal '5 jt' / '5 juta' / '5jt' -> 5000000; '100 rb' / '100rb' / '100k' -> 100000; '2,5 jt' -> 2500000; '46 rb' -> 46000).
2. pokok: jumlah pinjaman / plafon modal tertulis (angka bulat).
3. potonganDimuka: potongan admin / provisi / asuransi di awal yang memotong uang cair. Jika ada persentase, hitung dari pokok. Jika tidak ada potongan di depan, isi 0.
4. cicilan: nominal angsuran per kali bayar (angka bulat).
5. jumlahCicilan: berapa kali bayar (tenor). Jika tertulis '30 hari' dan setoran harian, isi 30. Jika '1 bulan' dengan setoran harian, isi 30.
6. frekuensi: salah satu dari 'harian', 'mingguan', atau 'bulanan'.
7. dendaPerHari: denda telat per hari dalam Rupiah jika tertulis, atau null jika tidak ada.
8. kolomTidakYakin: daftar nama kolom yang benar-benar tidak ditemukan (pilih dari: 'pokok', 'potonganDimuka', 'cicilan', 'jumlahCicilan', 'frekuensi', 'dendaPerHari').`;

    const parts: any[] = [];
    if (cleanBase64) {
      parts.push({ inlineData: { mimeType: effectiveMime, data: cleanBase64 } });
    }
    if (cleanText) {
      parts.push({ text: `Teks Penawaran Pinjaman:\n${cleanText}` });
    } else {
      parts.push({
        text: 'Teliti gambar atau foto brosur ini dengan seksama. Cari dan ekstrak seluruh data angka penawaran pinjaman: jumlah pinjaman (pokok), potongan admin di muka, nominal cicilan per kali bayar, berapa kali bayar (jumlah cicilan), frekuensi pembayaran (harian/mingguan/bulanan), dan denda telat per hari jika ada. Keluarkan format JSON yang ditentukan.',
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        pokok: { type: Type.NUMBER, description: 'Jumlah pinjaman tertulis dalam Rupiah (bilangan bulat)' },
        potonganDimuka: { type: Type.NUMBER, description: 'Potongan admin/asuransi di depan dalam Rupiah' },
        cicilan: { type: Type.NUMBER, description: 'Nominal per kali bayar dalam Rupiah' },
        jumlahCicilan: { type: Type.NUMBER, description: 'Berapa kali bayar' },
        frekuensi: { type: Type.STRING, description: "'harian', 'mingguan', atau 'bulanan'" },
        dendaPerHari: { type: Type.NUMBER, description: 'Denda keterlambatan per hari dalam Rupiah' },
        kolomTidakYakin: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Daftar nama kolom yang informasinya samar atau tidak ditemukan',
        },
      },
      required: ['kolomTidakYakin'],
    };

    const parsed = await runGeminiWithFallback({ parts }, systemInstruction, responseSchema, 0.1);
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/analyze-offer:', err?.message || err);
    return res.status(500).json({
      error: 'Gagal membaca penawaran secara otomatis. Silakan coba lagi atau masukkan angka langsung di tab Isi Manual.',
    });
  }
});

// Penjelasan hasil perhitungan pinjaman dalam bahasa awam
app.post('/api/explain-loan', async (req, res) => {
  try {
    const { hasil, penawaran } = req.body || {};
    if (!hasil || !penawaran) {
      return res.status(400).json({ error: 'Data perhitungan tidak lengkap. Harap sediakan data hasil dan penawaran.' });
    }

    const isValidNum = (n: any, allowZero = false) => typeof n === 'number' && Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    const valid =
      isValidNum(penawaran.pokok) &&
      isValidNum(penawaran.potonganDimuka ?? 0, true) &&
      isValidNum(penawaran.cicilan) &&
      isValidNum(penawaran.jumlahCicilan) &&
      Number.isInteger(penawaran.jumlahCicilan) &&
      isValidNum(hasil.diterima) &&
      isValidNum(hasil.totalBayar);

    if (!valid) {
      return res.status(400).json({
        error: 'Data perhitungan tidak valid. Nilai harus berupa angka positif dan jumlah cicilan harus bilangan bulat.',
      });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Layanan penjelasan AI belum aktif. Menggunakan penjelasan bawaan.' });
    }

    const systemInstruction = `Kamu penjelas penawaran pinjaman untuk orang berpendidikan SD. Kamu TIDAK menghitung. Kamu hanya menerima angka hasil hitungan dan menjelaskannya dalam 2-3 kalimat pendek, hangat, tanpa istilah keuangan. Sebut trik yang tampak (potongan di muka, bunga flat, cicilan harian, denda). Jangan menyuruh menerima atau menolak pinjaman. Jangan menyebut angka yang tidak ada di data. Keluarkan JSON: {penjelasan: string, tandaBahaya: string[]}.`;

    const userPrompt = `Data Hitungan Pinjaman:
- Pokok tertulis: Rp${penawaran.pokok.toLocaleString('id-ID')}
- Potongan di depan: Rp${(penawaran.potonganDimuka || 0).toLocaleString('id-ID')}
- Uang bersih yang diterima di tangan: Rp${hasil.diterima.toLocaleString('id-ID')}
- Cicilan: Rp${penawaran.cicilan.toLocaleString('id-ID')} setiap ${penawaran.frekuensi || 'kali'} sebanyak ${penawaran.jumlahCicilan} kali
- Total uang yang dikembalikan: Rp${hasil.totalBayar.toLocaleString('id-ID')}
- Uang lebih / selisih: Rp${hasil.biayaTotal.toLocaleString('id-ID')}
- Setiap pinjam Rp100.000 bayar lebih: Rp${Math.round(hasil.biayaPer100rb || 0).toLocaleString('id-ID')}
- Bunga per periode: ${(hasil.bungaPerPeriode * 100).toFixed(1)}% per ${penawaran.frekuensi || 'periode'}
- Denda jika telat: Rp${(penawaran.dendaPerHari || 0).toLocaleString('id-ID')} per hari

Tolong jelaskan secara jujur, hangat, dan sebutkan hal yang perlu ditanyakan pedagang.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        penjelasan: { type: Type.STRING, description: 'Penjelasan 2-3 kalimat pendek, hangat, tanpa istilah keuangan.' },
        tandaBahaya: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Daftar hal yang perlu ditanyakan atau diwaspadai pedagang.' },
      },
      required: ['penjelasan', 'tandaBahaya'],
    };

    const parsed = await runGeminiWithFallback(userPrompt, systemInstruction, responseSchema, 0.2);
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Error in /api/explain-loan:', err?.message || err);
    return res.status(500).json({ error: 'Gagal membuat penjelasan otomatis. Silakan coba lagi.' });
  }
});

// Vite middleware (dev) / static build (prod)
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Terang aktif di http://localhost:${PORT}`);
  });
}

startServer();
