import React from 'react';
import { Button } from './Button';
import { X, ShieldCheck, Cpu, Scale } from 'lucide-react';
import { Language, translations } from '../i18n';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn overflow-hidden"
    >
      <div className="bg-[#FFF9EC] rounded-t-3xl sm:rounded-2xl max-w-[460px] w-full p-5 max-h-[88vh] overflow-y-auto flex flex-col gap-4 shadow-2xl border border-[#E8DFC9]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#14213D] text-[#FCA311] flex items-center justify-center font-bold font-heading text-sm">
              T
            </div>
            <h2 id="about-modal-title" className="text-lg font-extrabold text-[#14213D] font-heading">
              {t.aboutTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup jendela tentang Terang"
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl text-[#14213D]/70 hover:bg-[#14213D]/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alur Kerja Tiga Langkah */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#14213D]/70">
            {t.aboutWorkflowTitle}
          </span>
          <div className="flex flex-col gap-2 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#E8DFC9] flex gap-2.5 items-start">
              <span className="w-6 h-6 rounded-full bg-[#14213D] text-[#FFF9EC] flex items-center justify-center font-extrabold shrink-0 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-[#14213D] font-bold block">{t.step1Title}</strong>
                <p className="text-[#1B1B1F]/70 mt-0.5 leading-relaxed">{t.step1Desc}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E8DFC9] flex gap-2.5 items-start">
              <span className="w-6 h-6 rounded-full bg-[#FCA311] text-[#14213D] flex items-center justify-center font-extrabold shrink-0 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-[#14213D] font-bold block">{t.step2Title}</strong>
                <p className="text-[#1B1B1F]/70 mt-0.5 leading-relaxed">{t.step2Desc}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#E8DFC9] flex gap-2.5 items-start">
              <span className="w-6 h-6 rounded-full bg-[#2E9E6B] text-white flex items-center justify-center font-extrabold shrink-0 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-[#14213D] font-bold block">{t.step3Title}</strong>
                <p className="text-[#1B1B1F]/70 mt-0.5 leading-relaxed">{t.step3Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Perhitungan Murni Kode */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E8DFC9] flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-[#14213D] font-bold text-sm">
            <Cpu className="w-4 h-4 text-[#FCA311]" />
            <span>{t.aboutCodeCalcTitle}</span>
          </div>
          <p className="text-[#1B1B1F]/75 leading-relaxed">
            {t.aboutCodeCalcDesc}
          </p>
        </div>

        {/* Komparasi Terang */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E8DFC9] flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-[#14213D] font-bold text-sm">
            <Scale className="w-4 h-4 text-[#FCA311]" />
            <span>{t.aboutHowWeCompareTitle}</span>
          </div>
          <p className="text-[#1B1B1F]/75 leading-relaxed">
            {t.aboutHowWeCompareDesc}
          </p>
          <p className="text-[#1B1B1F]/80 leading-relaxed font-medium bg-[#FFFDF7] p-2 rounded-lg border border-[#E8DFC9]">
            {t.aboutCategoryNote}
          </p>
        </div>

        {/* Kebijakan Privasi */}
        <div className="p-3.5 rounded-xl bg-[#2E9E6B]/10 border border-[#2E9E6B]/30 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-[#2E9E6B] font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.aboutPrivacyTitle}</span>
          </div>
          <p className="text-[#1B1B1F]/80 leading-relaxed font-medium">
            {t.aboutPrivacyDesc}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DFC9] text-xs text-[#1B1B1F]/70 flex flex-col gap-1">
          <span className="font-bold text-[#14213D]">{t.aboutDisclaimerTitle}</span>
          <p className="leading-relaxed">{t.aboutDisclaimerDesc}</p>
        </div>

        {/* Sumber Regulasi */}
        <p className="text-[11px] text-[#1B1B1F]/60 leading-relaxed px-1">
          {t.aboutPosterSource}
        </p>

        <Button
          variant="primary"
          size="large"
          onClick={onClose}
          aria-label={t.btnClose}
          className="mt-1"
        >
          {t.btnClose}
        </Button>
      </div>
    </div>
  );
};
