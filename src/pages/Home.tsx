import React from 'react';
import { Card } from '../components/Card';
import { Disclaimer } from '../components/Disclaimer';
import { Banknote, Eye, ShieldCheck } from 'lucide-react';
import { PosterCarousel } from '../components/PosterCarousel';
import { Language, translations } from '../i18n';

interface HomeProps {
  onStartCheck: () => void;
  onViewSample?: () => void;
  onViewHistory?: () => void;
  lang: Language;
}

export const Home: React.FC<HomeProps> = ({
  onStartCheck,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-6">
      <div className="flex flex-col gap-4">
        {/* Visual Warm Banner: "Menyalakan Lampu pada Angka yang Disembunyikan" */}
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-[#14213D] to-[#1F2F52] text-white p-5 sm:p-6 shadow-md border border-[#14213D]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#FCA311]/25 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 -left-10 w-32 h-32 rounded-full bg-[#FCA311]/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2.5">
            <div className="inline-flex items-center gap-2 self-start py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-[#FCA311] font-semibold">
              <Banknote className="w-[18px] h-[18px] text-[#FCA311] shrink-0" />
              <span>{t.homeBadge}</span>
            </div>

            <h1 className="text-[24px] sm:text-[26px] leading-[1.25] font-extrabold text-white tracking-tight font-heading">
              {t.homeTitle}
            </h1>

            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#FFF9EC]/90 font-normal">
              {t.homeSubtitle}
            </p>
          </div>
        </div>

        {/* Carousel Poster Peringatan Edukasi (Mendukung ID dan EN) */}
        <PosterCarousel onStartCheck={onStartCheck} lang={lang} />

        {/* Value Proposition Card */}
        <Card className="flex flex-col gap-3 py-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9EC] border border-[#E8DFC9] flex items-center justify-center shrink-0 text-[#14213D]">
              <Eye className="w-5 h-5 text-[#FCA311]" />
            </div>
            <div>
              <h2 className="text-[16px] sm:text-[17px] font-bold text-[#14213D] leading-snug">
                {t.homeFeatureTitle}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#1B1B1F]/75 mt-0.5 leading-normal">
                {t.homeFeatureDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8DFC9]/60 flex items-center gap-2 text-xs text-[#1B1B1F]/70">
            <ShieldCheck className="w-4 h-4 text-[#2E9E6B] shrink-0" />
            <span>{t.homePrivacyNotice}</span>
          </div>
        </Card>
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
        <Disclaimer extended lang={lang} />
      </footer>
    </div>
  );
};
