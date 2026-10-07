import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, AlertTriangle } from 'lucide-react';
import { DAFTAR_POSTER } from '../data/poster';
import { PosterIllustration } from './PosterIllustrations';
import { Language } from '../i18n';

interface PosterCarouselProps {
  onStartCheck?: () => void;
  lang?: Language;
}

export const PosterCarousel: React.FC<PosterCarouselProps> = ({ onStartCheck, lang = 'ID' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = DAFTAR_POSTER.length;
  const isEn = lang === 'EN';

  const resumeTimeoutRef = useRef<any>(null);
  const autoplayTimerRef = useRef<any>(null);

  // Drag & Swipe gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Next & Prev handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Pause autoplay on user interaction and resume after 5 seconds
  const pauseAutoplay = useCallback(() => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);

    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  // Autoplay effect (every 4 seconds)
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    autoplayTimerRef.current = setInterval(() => {
      handleNext();
    }, 4000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [handleNext, isPaused, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, []);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    pauseAutoplay();
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const onTouchEnd = () => {
    if (touchDeltaX < -40) {
      handleNext();
    } else if (touchDeltaX > 40) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    pauseAutoplay();
    setIsDragging(true);
    setTouchStartX(e.clientX);
    setTouchDeltaX(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartX === null) return;
    setTouchDeltaX(e.clientX - touchStartX);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    if (touchDeltaX < -40) {
      handleNext();
    } else if (touchDeltaX > 40) {
      handlePrev();
    }
    setIsDragging(false);
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const onMouseLeave = () => {
    if (isDragging) onMouseUp();
  };

  return (
    <div
      className="relative flex flex-col gap-2 w-full select-none"
      onMouseEnter={pauseAutoplay}
      role="region"
      aria-roledescription="carousel"
      aria-label={isEn ? 'Educational Loan Warning Posters' : 'Poster Edukasi & Peringatan Pinjaman'}
    >
      {/* Outer Slider Viewport with Peek on Right */}
      <div
        className="relative overflow-hidden w-full rounded-[20px] shadow-sm cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="flex transition-transform duration-400 ease-out will-change-transform"
          style={{
            transform: `translateX(calc(-${currentIndex * 92}% + ${touchDeltaX}px))`,
          }}
        >
          {DAFTAR_POSTER.map((poster, index) => {
            const isActive = index === currentIndex;
            const judul = isEn ? poster.judulEn : poster.judul;
            const teks = isEn ? poster.teksEn : poster.teks;

            return (
              <div
                key={poster.id}
                className="w-[92%] shrink-0 pr-2.5 box-border"
                aria-hidden={!isActive}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${totalSlides}: ${judul}`}
              >
                <div
                  className={`h-[210px] rounded-[20px] bg-gradient-to-br ${poster.bgGradient} p-4 sm:p-5 text-[#FFF9EC] border border-[#E8DFC9]/20 flex items-center justify-between gap-3 shadow-md relative overflow-hidden`}
                >
                  <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-[#FCA311]/10 blur-xl pointer-events-none" />

                  {/* Left Column: Text & CTA */}
                  <div className="flex-1 flex flex-col justify-center h-full z-10">
                    <div className="flex flex-col gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FCA311]/20 border border-[#FCA311]/35 flex items-center justify-center text-[#FCA311] shrink-0 mb-0.5 shadow-sm" aria-hidden="true">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h3 className="text-[19px] sm:text-[20px] font-extrabold leading-[1.25] text-white font-heading tracking-tight line-clamp-2">
                        {judul}
                      </h3>
                      <p className="text-[13px] text-[#FFF9EC]/85 leading-snug line-clamp-3 mt-0.5">
                        {teks}
                      </p>
                    </div>

                    {poster.hasActionButton && onStartCheck && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartCheck();
                          }}
                          aria-label={isEn ? 'Check Loan Offer Now' : 'Cek Penawaran di Terang'}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FCA311] text-[#14213D] text-xs font-extrabold flex items-center gap-1.5 shadow hover:bg-[#EAA10E] active:scale-95 transition-all cursor-pointer"
                        >
                          <span>{isEn ? 'Check Offer' : 'Cek Penawaran'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Inline SVG Illustration */}
                  <div className="shrink-0 z-10 flex items-center justify-center">
                    <PosterIllustration type={poster.illustrationType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Arrow Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            pauseAutoplay();
            handlePrev();
          }}
          aria-label={isEn ? 'Previous poster' : 'Sebelumnya'}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#14213D]/70 hover:bg-[#14213D] text-white flex items-center justify-center backdrop-blur-sm shadow transition-all cursor-pointer z-20 focus-visible:ring-2 focus-visible:ring-[#FCA311]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            pauseAutoplay();
            handleNext();
          }}
          aria-label={isEn ? 'Next poster' : 'Berikutnya'}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#14213D]/70 hover:bg-[#14213D] text-white flex items-center justify-center backdrop-blur-sm shadow transition-all cursor-pointer z-20 focus-visible:ring-2 focus-visible:ring-[#FCA311]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots Indicator & Caption */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label={isEn ? 'Select poster' : 'Pilih poster'}>
          {DAFTAR_POSTER.map((p, idx) => {
            const isActive = idx === currentIndex;
            const judul = isEn ? p.judulEn : p.judul;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`${isEn ? 'Go to slide' : 'Buka poster'} ${idx + 1}: ${judul}`}
                onClick={() => {
                  pauseAutoplay();
                  setCurrentIndex(idx);
                }}
                className="transition-all duration-300 rounded-full cursor-pointer min-h-[24px] min-w-[24px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14213D]"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-6 h-2 bg-[#FCA311]'
                      : 'w-2 h-2 bg-[#14213D]/25 hover:bg-[#14213D]/45'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-[#1B1B1F]/50 text-center font-medium">
          {isEn
            ? 'General educational tips. Not financial advice.'
            : 'Tips umum untuk edukasi. Bukan nasihat keuangan.'}
        </span>
      </div>
    </div>
  );
};
