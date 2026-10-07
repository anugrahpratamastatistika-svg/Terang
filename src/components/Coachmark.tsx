import React, { useState, useEffect } from 'react';
import { Clock, Scale, X, ArrowRight, Check, Lightbulb } from 'lucide-react';
import { Language, translations } from '../i18n';

interface CoachmarkProps {
  onDismiss: () => void;
  lang: Language;
}

const COACHMARK_KEY = 'terang_coachmark_seen_v1';

export const Coachmark: React.FC<CoachmarkProps> = ({ onDismiss, lang }) => {
  const t = translations[lang];
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(COACHMARK_KEY);
      if (!seen) {
        // Small delay so page content appears first, then coachmark gracefully slides in
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage not available or security restricted
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(COACHMARK_KEY, 'true');
    } catch {
      // ignore
    }
    onDismiss();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      handleClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t.coachmarkTitle}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[440px] z-50 animate-slideUp"
    >
      <div className="relative rounded-2xl bg-[#14213D] text-[#FFF9EC] p-4 shadow-2xl border-2 border-[#FCA311] flex flex-col gap-3">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCA311]/25 border border-[#FCA311]/40 text-[#FCA311] text-[11px] font-extrabold uppercase tracking-wide">
            <Lightbulb className="w-3.5 h-3.5 fill-[#FCA311] text-[#14213D]" />
            <span>{t.coachmarkTitle} ({currentStep}/2)</span>
          </div>

          <button
            onClick={handleClose}
            aria-label="Tutup panduan"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        {currentStep === 1 ? (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D62839]/20 text-[#D62839] border border-[#D62839]/40 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-[#FCA311]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-white font-heading">
                1. {t.btnLateRisk}
              </h4>
              <p className="text-xs text-[#FFF9EC]/85 leading-relaxed">
                {t.coachmarkLateTip}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E9E6B]/20 text-[#2E9E6B] border border-[#2E9E6B]/40 flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-5 h-5 text-[#FCA311]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-bold text-white font-heading">
                2. {t.btnCompare}
              </h4>
              <p className="text-xs text-[#FFF9EC]/85 leading-relaxed">
                {t.coachmarkCompareTip}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex justify-between items-center pt-1 border-t border-white/10">
          <button
            onClick={handleClose}
            className="min-h-[44px] px-3 text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
          >
            {t.coachmarkSkip}
          </button>

          <button
            onClick={handleNext}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FCA311] text-[#14213D] text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:bg-[#EAA10E] transition-all cursor-pointer"
          >
            {currentStep === 1 ? (
              <>
                <span>{t.coachmarkNext}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>{t.coachmarkGotIt}</span>
                <Check className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
