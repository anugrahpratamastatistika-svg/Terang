import React from 'react';

interface IllustrationProps {
  type: 'biaya-pencairan' | 'kode-otp' | 'bunga-kecil' | 'cicilan-harian' | 'akses-kontak' | 'tanda-tangan';
}

export const PosterIllustration: React.FC<IllustrationProps> = ({ type }) => {
  switch (type) {
    case 'biaya-pencairan':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi amplop uang dengan tanda seru merah dan tangan yang menyetop"
        >
          {/* Latar lingkaran aksen lembut */}
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />
          
          {/* Amplop Uang */}
          <rect x="25" y="45" width="56" height="38" rx="4" fill="#FFF9EC" stroke="#FCA311" strokeWidth="2.5" />
          <path d="M25 47 L53 67 L81 47" fill="none" stroke="#FCA311" strokeWidth="2.5" strokeLinecap="round" />
          {/* Lembaran uang keluar dari amplop */}
          <rect x="33" y="32" width="40" height="20" rx="3" fill="#2E9E6B" />
          <circle cx="53" cy="42" r="4" fill="#FFF9EC" />

          {/* Tangan penolak / tanda stop */}
          <circle cx="78" cy="42" r="18" fill="#D62839" />
          <rect x="74" y="32" width="8" height="20" rx="4" fill="#FFF9EC" />
          {/* Tanda seru di samping */}
          <circle cx="78" cy="42" r="14" fill="#D62839" />
          <line x1="78" y1="35" x2="78" y2="43" stroke="#FFF9EC" strokeWidth="3" strokeLinecap="round" />
          <circle cx="78" cy="48" r="1.5" fill="#FFF9EC" />
        </svg>
      );

    case 'kode-otp':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi ponsel dengan kolom kode 6 digit dan gembok terkunci"
        >
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />

          {/* Ponsel */}
          <rect x="34" y="20" width="52" height="80" rx="8" fill="#14213D" stroke="#FFF9EC" strokeWidth="2.5" />
          <rect x="38" y="28" width="44" height="60" rx="4" fill="#FFF9EC" />
          
          {/* 6 Titik Digit Kode OTP Rahasia */}
          <g fill="#14213D">
            <circle cx="44" cy="42" r="2.5" />
            <circle cx="50" cy="42" r="2.5" />
            <circle cx="56" cy="42" r="2.5" />
            <circle cx="64" cy="42" r="2.5" />
            <circle cx="70" cy="42" r="2.5" />
            <circle cx="76" cy="42" r="2.5" />
          </g>

          {/* Gembok Keamanan Merah/Kuning */}
          <rect x="48" y="60" width="24" height="18" rx="3" fill="#D62839" />
          <path d="M53 60 V53 C53 48.5 67 48.5 67 53 V60" fill="none" stroke="#FCA311" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="68" r="2.5" fill="#FFF9EC" />
        </svg>
      );

    case 'bunga-kecil':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi dua tumpukan uang: kecil uang diterima, besar uang dibayar, dengan tanda tanya"
        >
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />

          {/* Tumpukan Kiri: Uang Diterima (Kecil) */}
          <ellipse cx="38" cy="80" rx="16" ry="6" fill="#2E9E6B" />
          <rect x="22" y="70" width="32" height="10" fill="#2E9E6B" />
          <ellipse cx="38" cy="70" rx="16" ry="6" fill="#FFF9EC" />
          <text x="38" y="96" fill="#FFF9EC" fontSize="8" fontWeight="bold" textAnchor="middle">Terima</text>

          {/* Tumpukan Kanan: Uang Dibayar (Besar & Menjulang) */}
          <ellipse cx="80" cy="80" rx="18" ry="6.5" fill="#D62839" />
          <rect x="62" y="44" width="36" height="36" fill="#D62839" />
          <ellipse cx="80" cy="44" rx="18" ry="6.5" fill="#FCA311" />
          <text x="80" y="96" fill="#FCA311" fontSize="8" fontWeight="bold" textAnchor="middle">Bayar</text>

          {/* Tanda Tanya Aksen Kuning */}
          <circle cx="60" cy="30" r="11" fill="#FCA311" />
          <text x="60" y="35" fill="#14213D" fontSize="14" fontWeight="900" textAnchor="middle">?</text>
        </svg>
      );

    case 'cicilan-harian':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi kalender harian dengan koin-koin menumpuk ke atas"
        >
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />

          {/* Lembar Kalender */}
          <rect x="24" y="32" width="46" height="48" rx="6" fill="#FFF9EC" stroke="#FCA311" strokeWidth="2.5" />
          <rect x="24" y="32" width="46" height="14" rx="4" fill="#D62839" />
          <circle cx="34" cy="27" r="2.5" fill="#FCA311" />
          <circle cx="60" cy="27" r="2.5" fill="#FCA311" />
          <text x="47" y="66" fill="#14213D" fontSize="18" fontWeight="900" textAnchor="middle">30</text>

          {/* Tangga Koin Menumpuk Tinggi */}
          <g fill="#FCA311">
            <ellipse cx="82" cy="74" rx="12" ry="5" />
            <ellipse cx="82" cy="65" rx="12" ry="5" />
            <ellipse cx="82" cy="56" rx="12" ry="5" />
            <ellipse cx="82" cy="47" rx="12" ry="5" fill="#F28C28" />
            <ellipse cx="82" cy="38" rx="12" ry="5" fill="#FFF9EC" />
          </g>

          {/* Panah Merah Naik */}
          <path d="M96 68 L96 36 L92 41 M96 36 L100 41" stroke="#D62839" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case 'akses-kontak':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi ponsel dengan kartu kontak digembok dan tanda silang merah"
        >
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />

          {/* Ponsel */}
          <rect x="36" y="24" width="48" height="74" rx="7" fill="#14213D" stroke="#FFF9EC" strokeWidth="2.5" />
          
          {/* Ikon Kontak Orang Sederhana (Kepala & Bahu) */}
          <circle cx="60" cy="46" r="8" fill="#FCA311" />
          <path d="M47 68 C47 58 73 58 73 68" fill="#FCA311" />

          {/* Gembok Perlindungan */}
          <rect x="66" y="66" width="18" height="15" rx="2" fill="#2E9E6B" />
          <path d="M70 66 V61 C70 58 80 58 80 61 V66" fill="none" stroke="#FFF9EC" strokeWidth="2" />

          {/* Tanda Silang Larangan Merah Besar */}
          <line x1="42" y1="36" x2="78" y2="78" stroke="#D62839" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="78" y1="36" x2="42" y2="78" stroke="#D62839" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'tanda-tangan':
      return (
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-md select-none"
          aria-label="Ilustrasi jam berputar cepat dan pena yang ditahan sebelum tanda tangan"
        >
          <circle cx="60" cy="60" r="50" fill="#FFF9EC" fillOpacity="0.08" />

          {/* Jam Dinding Waktu Mendesak */}
          <circle cx="48" cy="54" r="28" fill="#14213D" stroke="#FCA311" strokeWidth="3" />
          {/* Jarum Jam */}
          <line x1="48" y1="54" x2="48" y2="34" stroke="#FFF9EC" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="54" x2="62" y2="54" stroke="#D62839" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="48" cy="54" r="3" fill="#FCA311" />

          {/* Pena Tertahan */}
          <path d="M82 32 L94 44 L68 76 L56 78 L58 66 Z" fill="#FCA311" stroke="#FFF9EC" strokeWidth="2" strokeLinejoin="round" />
          {/* Garis Tanda Tangan Putus-Putus */}
          <line x1="42" y1="88" x2="90" y2="88" stroke="#FFF9EC" strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />

          {/* Tanda STOP Mini */}
          <circle cx="86" cy="74" r="10" fill="#D62839" />
          <rect x="80" y="72" width="12" height="4" rx="2" fill="#FFF9EC" />
        </svg>
      );

    default:
      return null;
  }
};
