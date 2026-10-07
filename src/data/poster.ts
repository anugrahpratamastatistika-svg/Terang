export interface PosterItem {
  id: number;
  judul: string;
  judulEn: string;
  teks: string;
  teksEn: string;
  bgGradient: string;
  illustrationType: 'biaya-pencairan' | 'kode-otp' | 'bunga-kecil' | 'cicilan-harian' | 'akses-kontak' | 'tanda-tangan';
  hasActionButton?: boolean;
}

export const DAFTAR_POSTER: PosterItem[] = [
  {
    id: 1,
    judul: 'Pencairan Minta Bayar Dulu? Curiga!',
    judulEn: 'Asked to Pay Before Disbursement? Suspicious!',
    teks: 'Waspadai yang minta uang dulu sebelum pinjaman cair. Minta alasannya tertulis dan jangan transfer dulu.',
    teksEn: 'Beware of anyone demanding fees before your loan is disbursed. Ask for written reasons and never transfer funds upfront.',
    bgGradient: 'from-[#14213D] via-[#1E2E52] to-[#0E172B]',
    illustrationType: 'biaya-pencairan',
  },
  {
    id: 2,
    judul: 'Jangan Kasih Kode OTP',
    judulEn: 'Never Share Your OTP Code',
    teks: 'Kode di SMS atau WhatsApp itu rahasia. Penipu memakainya untuk membobol akunmu.',
    teksEn: 'Codes sent via SMS or WhatsApp are confidential. Scammers use them to compromise your accounts.',
    bgGradient: 'from-[#14213D] via-[#241F3D] to-[#14213D]',
    illustrationType: 'kode-otp',
  },
  {
    id: 3,
    judul: 'Bunga Kecil Belum Tentu Murah',
    judulEn: 'Low Interest Is Not Always Cheap',
    teks: 'Tanya: uang yang saya terima berapa, dan yang harus saya bayar berapa?',
    teksEn: 'Always ask: how much cash do I actually receive, and how much must I pay back in total?',
    bgGradient: 'from-[#14213D] via-[#1B3545] to-[#14213D]',
    illustrationType: 'bunga-kecil',
  },
  {
    id: 4,
    judul: 'Cicilan Harian Itu Cepat Menumpuk',
    judulEn: 'Daily Payments Pile Up Rapidly',
    teks: 'Bayar sedikit tiap hari terasa ringan, tapi totalnya bisa jauh lebih besar.',
    teksEn: 'Paying a small amount each day feels light, but the cumulative total can be substantially higher.',
    bgGradient: 'from-[#14213D] via-[#2F291B] to-[#14213D]',
    illustrationType: 'cicilan-harian',
  },
  {
    id: 5,
    judul: 'Jangan Izinkan Akses Kontak dan Galeri',
    judulEn: 'Never Allow Access to Contacts & Gallery',
    teks: 'Pinjol berizin hanya boleh mengakses kamera, lokasi, dan mikrofon. Kalau minta kontak atau galeri, curiga.',
    teksEn: 'Licensed lenders are only allowed to access camera, location, and microphone. If they demand contacts or photo gallery, be suspicious.',
    bgGradient: 'from-[#14213D] via-[#331C24] to-[#14213D]',
    illustrationType: 'akses-kontak',
  },
  {
    id: 6,
    judul: 'Tidak Buru-buru, Tidak Tanda Tangan Dulu',
    judulEn: 'Do Not Rush, Do Not Sign Yet',
    teks: 'Penawaran yang menekan "harus hari ini" adalah tanda bahaya. Cek dulu di Terang.',
    teksEn: 'Offers that pressure you with "must sign today" are red flags. Always check the numbers in Terang first.',
    bgGradient: 'from-[#14213D] via-[#1A2E3B] to-[#14213D]',
    illustrationType: 'tanda-tangan',
    hasActionButton: true,
  },
];
