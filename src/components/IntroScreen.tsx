import React, { useEffect, useState } from 'react';
import { Lightbulb, ShieldCheck } from 'lucide-react';

interface IntroScreenProps {
  onFinish: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1600);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b from-[#0F172A] via-[#14213D] to-[#1A2642] text-white cursor-pointer select-none overflow-hidden transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Efek pendaran cahaya lentera */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#FCA311]/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Bagian atas: Ruang kosong agar seimbang */}
      <div className="w-full" />

      {/* Bagian Tengah: Lentera Emas, Judul Terang & Slogan */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Lingkaran lentera bercahaya */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-[#FCA311]/25 blur-2xl animate-ping pointer-events-none" />
          <div className="relative w-22 h-22 rounded-3xl bg-gradient-to-tr from-[#FCA311] via-[#FFE3A8] to-[#FCA311] p-1 shadow-[0_0_35px_rgba(252,163,17,0.45)] flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-[#14213D] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#FCA311]/15 to-transparent" />
              <Lightbulb className="w-11 h-11 text-[#FCA311] fill-[#FCA311] relative z-10 drop-shadow-[0_0_12px_rgba(252,163,17,0.7)]" />
            </div>
          </div>
        </div>

        {/* Tipografi Nama Brand */}
        <h1 className="font-heading font-black text-4xl tracking-tight text-white mb-2 drop-shadow-md">
          Terang
        </h1>

        {/* Slogan Brand */}
        <p className="text-sm text-[#FFF9EC]/90 max-w-[260px] font-normal leading-relaxed mb-6">
          Menyalakan lampu pada angka yang disembunyikan.
        </p>

        {/* Animasi Garis Pemuatan Berkilau */}
        <div className="w-32 h-1 bg-white/15 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FCA311] to-[#FFE3A8] rounded-full animate-pulse" />
        </div>
      </div>

      {/* Bagian Bawah: Pernyataan Regulasi OJK */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs text-[#FFF9EC]/85 font-medium shadow-sm">
        <ShieldCheck className="w-4 h-4 text-[#FCA311] shrink-0" />
        <span>Mengacu pada batas OJK</span>
      </div>
    </div>
  );
};
