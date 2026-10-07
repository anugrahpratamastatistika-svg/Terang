import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  FastForward,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Penawaran, Hasil, hitungSemua } from '../lib/finance';
import { formatRupiah, formatPersen } from '../lib/format';
import { BENCHMARK, tentukanRisiko, hitungBiayaPerHari, ambangOjk, RISK_CONFIG } from '../config/benchmarks';
import { jelaskanHasil, PenjelasanHasil, speakText, stopSpeaking } from '../lib/ai';
import { simpanCek } from '../lib/storage';
import { Language, translations } from '../i18n';
import { Coachmark } from '../components/Coachmark';

interface RevealProps {
  penawaran: Penawaran;
  onGoToLate: () => void;
  onGoToCompare: () => void;
  onNewCheck: () => void;
  onBackToConfirm?: () => void;
  lang: Language;
}

export const Reveal: React.FC<RevealProps> = ({
  penawaran,
  onGoToLate,
  onGoToCompare,
  onNewCheck,
  onBackToConfirm,
  lang,
}) => {
  const t = translations[lang];

  // Hitung murni dengan hitungSemua() tanpa angka fallback tetap
  let hasil: Hasil | null = null;
  try {
    hasil = hitungSemua(penawaran);
  } catch {
    hasil = null;
  }

  // Jika hitungSemua() gagal, tampilkan kartu error ramah dan jangan tampilkan hasil apa pun
  if (!hasil) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-8 pb-6">
        <div className="flex flex-col gap-4">
          <Card className="p-6 flex flex-col items-center justify-center text-center gap-4 bg-[#FFFDF7] border-[#D62839]/30 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#D62839]/10 flex items-center justify-center text-[#D62839]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-extrabold text-[#14213D] font-heading leading-snug">
                Angka ini tidak bisa dihitung. Cek lagi isian di langkah sebelumnya
              </h2>
            </div>
            <Button
              variant="primary"
              size="large"
              onClick={onBackToConfirm || onNewCheck}
              aria-label="Kembali ke Cek Angka"
              className="mt-2"
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Kembali ke Cek Angka
            </Button>
          </Card>
        </div>
        <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
          <Disclaimer extended lang={lang} />
        </footer>
      </div>
    );
  }

  return (
    <RevealContent
      hasil={hasil}
      penawaran={penawaran}
      onGoToLate={onGoToLate}
      onGoToCompare={onGoToCompare}
      onNewCheck={onNewCheck}
      lang={lang}
    />
  );
};

interface RevealContentProps {
  hasil: Hasil;
  penawaran: Penawaran;
  onGoToLate: () => void;
  onGoToCompare: () => void;
  onNewCheck: () => void;
  lang: Language;
}

const RevealContent: React.FC<RevealContentProps> = ({
  hasil,
  penawaran,
  onGoToLate,
  onGoToCompare,
  onNewCheck,
  lang,
}) => {
  const t = translations[lang];

  // Ukur dengan "biaya per hari dari nilai pinjaman" = biayaTotal / pokok / durasiHari, lalu bandingkan dengan ambang OJK
  const ambang = ambangOjk(penawaran.jenisPinjaman ?? 'produktif', penawaran.pokok, hasil.durasiHari);
  const biayaPerHari = hitungBiayaPerHari(hasil.biayaTotal, penawaran.pokok, hasil.durasiHari);
  const tingkatRisiko = tentukanRisiko(biayaPerHari, ambang.batas);
  const riskInfo = RISK_CONFIG[tingkatRisiko];
  const biayaPerHariPersen = (biayaPerHari * 100).toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  // Animation sequence state (Stage 1 to 4)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [animStage, setAnimStage] = useState<number>(prefersReducedMotion ? 4 : 1);
  const [animatedDiterima, setAnimatedDiterima] = useState<number>(
    prefersReducedMotion ? hasil.diterima : 0
  );
  const [animatedTotalBayar, setAnimatedTotalBayar] = useState<number>(
    prefersReducedMotion ? hasil.totalBayar : 0
  );

  // AI Explanation state
  const [penjelasanData, setPenjelasanData] = useState<PenjelasanHasil | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);

  // Audio speech playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Run animations on mount
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimStage(4);
      setAnimatedDiterima(hasil.diterima);
      setAnimatedTotalBayar(hasil.totalBayar);
      return;
    }

    let isMounted = true;
    let frameId: number;

    const startTime1 = performance.now();
    const duration1 = 1500;

    const animateStage1 = (now: number) => {
      if (!isMounted) return;
      const elapsed = now - startTime1;
      const progress = Math.min(1, elapsed / duration1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedDiterima(Math.round(ease * hasil.diterima));

      if (progress < 1) {
        frameId = requestAnimationFrame(animateStage1);
      } else {
        setTimeout(() => {
          if (!isMounted) return;
          setAnimStage(2);

          const startTime2 = performance.now();
          const duration2 = 1500;

          const animateStage2 = (now2: number) => {
            if (!isMounted) return;
            const elapsed2 = now2 - startTime2;
            const progress2 = Math.min(1, elapsed2 / duration2);
            const ease2 = 1 - Math.pow(1 - progress2, 3);
            setAnimatedTotalBayar(Math.round(ease2 * hasil.totalBayar));

            if (progress2 < 1) {
              frameId = requestAnimationFrame(animateStage2);
            } else {
              setTimeout(() => {
                if (!isMounted) return;
                setAnimStage(3);
                setTimeout(() => {
                  if (!isMounted) return;
                  setAnimStage(4);
                }, 800);
              }, 700);
            }
          };

          frameId = requestAnimationFrame(animateStage2);
        }, 600);
      }
    };

    frameId = requestAnimationFrame(animateStage1);

    return () => {
      isMounted = false;
      cancelAnimationFrame(frameId);
    };
  }, [hasil, prefersReducedMotion]);

  // Fetch plain explanation from AI
  useEffect(() => {
    let isMounted = true;
    setIsAiLoading(true);

    jelaskanHasil(hasil, penawaran, lang)
      .then((res) => {
        if (isMounted) {
          setPenjelasanData(res);
          setIsAiLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsAiLoading(false);
      });

    return () => {
      isMounted = false;
      stopSpeaking();
    };
  }, [hasil, penawaran, lang]);

  const handleSkipAnimation = () => {
    setAnimStage(4);
    setAnimatedDiterima(hasil.diterima);
    setAnimatedTotalBayar(hasil.totalBayar);
  };

  const handleToggleSpeech = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = penjelasanData
        ? `${penjelasanData.penjelasan}. ${t.questionsToAskTitle}: ${penjelasanData.tandaBahaya.join('. ')}`
        : `${t.youReceive} ${formatRupiah(hasil.diterima)}, ${t.youRepay} ${formatRupiah(hasil.totalBayar)}. ${t.youPayExtra} ${formatRupiah(hasil.biayaTotal)}.`;

      setIsPlayingAudio(true);
      const supported = speakText(textToSpeak, lang, () => {
        setIsPlayingAudio(false);
      });

      if (!supported) {
        setIsPlayingAudio(false);
        showToast(lang === 'ID' ? 'Fitur suara tidak didukung di peramban ini' : 'Speech synthesis not supported');
      }
    }
  };

  const handleSaveToHistory = () => {
    simpanCek(penawaran, hasil);
    showToast(t.toastSaved);
  };

  const handleShare = async () => {
    const textShare = `Pinjaman ini: terima ${formatRupiah(hasil.diterima)}, bayar ${formatRupiah(hasil.totalBayar)}. Dicek dengan Terang.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Hasil Cek Pinjaman Terang',
          text: textShare,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textShare);
      showToast(t.toastCopied);
    } else {
      showToast(t.toastCopied);
    }
  };

  const pctDiterima = Math.max(1, Math.round((hasil.diterima / Math.max(1, hasil.totalBayar)) * 100));
  const pctPotongan = Math.round((penawaran.potonganDimuka / Math.max(1, hasil.totalBayar)) * 100);
  const pctBungaEkstra = Math.max(1, 100 - pctDiterima - pctPotongan);

  const RiskIcon = {
    AMAN: CheckCircle2,
    WASPADA: AlertTriangle,
    BAHAYA: XCircle,
  }[tingkatRisiko];

  const needleAngle = useMemo(() => {
    if (tingkatRisiko === 'AMAN') return -55;
    if (tingkatRisiko === 'WASPADA') return 0;
    return 55;
  }, [tingkatRisiko]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between pb-32">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 py-2.5 px-5 rounded-2xl bg-[#14213D] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce"
        >
          <Check className="w-4 h-4 text-[#2E9E6B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Dynamic Animation & Presentation Stage */}
      <div className="flex flex-col gap-5 px-4 pt-3">
        {/* Animated Reveal Banner */}
        <div
          className={`relative rounded-[24px] transition-all duration-700 p-6 overflow-hidden border ${
            animStage < 3
              ? 'bg-[#14213D] text-[#FFF9EC] border-[#14213D] shadow-md'
              : 'bg-[#FFFFFF] text-[#1B1B1F] border-[#E8DFC9] shadow-[0_4px_20px_-2px_rgba(20,33,61,0.06)]'
          }`}
        >
          {/* Skip animation button */}
          {animStage < 4 && !prefersReducedMotion && (
            <button
              onClick={handleSkipAnimation}
              aria-label={t.btnSkipAnim}
              className={`absolute top-3 right-3 text-xs font-bold px-3 py-1.5 min-h-[40px] rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                animStage < 3
                  ? 'bg-white/10 text-white/80 hover:bg-white/20'
                  : 'bg-[#14213D]/10 text-[#14213D] hover:bg-[#14213D]/20'
              }`}
            >
              <span>{t.btnSkipAnim}</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex flex-col gap-4">
            {/* Step 1: Kamu terima */}
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold uppercase tracking-wider ${
                  animStage < 3 ? 'text-[#FFF9EC]/75' : 'text-[#1B1B1F]/60'
                }`}
              >
                {t.youReceive}
              </span>
              <div
                className={`text-[46px] leading-[1.1] font-extrabold num-tabular font-heading tracking-tight ${
                  animStage < 3 ? 'text-white' : 'text-[#2E9E6B]'
                }`}
              >
                {formatRupiah(animatedDiterima)}
              </div>
            </div>

            {/* Step 2: Kamu bayar */}
            {animStage >= 2 && (
              <div className="flex flex-col pt-1 border-t border-white/10 dark:border-slate-200/50">
                <span
                  className={`text-sm font-bold uppercase tracking-wider ${
                    animStage < 3 ? 'text-[#FFF9EC]/75' : 'text-[#1B1B1F]/60'
                  }`}
                >
                  {t.youRepay}
                </span>
                <div
                  className={`text-[46px] leading-[1.1] font-extrabold num-tabular font-heading tracking-tight transition-transform ${
                    animStage < 3 ? 'text-[#FCA311] scale-105 origin-left' : 'text-[#14213D]'
                  }`}
                >
                  {formatRupiah(animatedTotalBayar)}
                </div>
              </div>
            )}

            {/* Step 3: Selisih - Kamu bayar lebih */}
            {animStage >= 3 && (
              <div className="pt-3 border-t border-[#E8DFC9] flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D62839]">
                  {t.youPayExtra}
                </span>
                <div className="text-[34px] leading-tight font-extrabold text-[#D62839] num-tabular font-heading">
                  +{formatRupiah(hasil.biayaTotal)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Bagan "Ke mana uangmu pergi" */}
        {animStage >= 4 && (
          <Card className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#14213D] font-heading">
                {t.whereMoneyGoes}
              </h2>
              <span className="text-xs text-[#1B1B1F]/60 num-tabular">
                Total {formatRupiah(hasil.totalBayar)}
              </span>
            </div>

            {/* Horizontal Stack Bar SVG */}
            <div className="w-full h-8 rounded-xl overflow-hidden flex shadow-inner bg-[#E8DFC9]/40 p-1 gap-1">
              <div
                style={{ width: `${pctDiterima}%` }}
                className="h-full bg-[#2E9E6B] rounded-lg transition-all duration-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
              >
                {pctDiterima >= 20 ? `${pctDiterima}%` : ''}
              </div>

              {penawaran.potonganDimuka > 0 && (
                <div
                  style={{ width: `${pctPotongan}%` }}
                  className="h-full bg-[#D62839] rounded-lg transition-all duration-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
                >
                  {pctPotongan >= 12 ? `${pctPotongan}%` : ''}
                </div>
              )}

              <div
                style={{ width: `${pctBungaEkstra}%` }}
                className="h-full bg-[#F28C28] rounded-lg transition-all duration-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
              >
                {pctBungaEkstra >= 15 ? `${pctBungaEkstra}%` : ''}
              </div>
            </div>

            {/* Stack Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#2E9E6B] shrink-0" />
                <span className="text-[#1B1B1F]/80">
                  {t.receivedLabel}
                  <strong className="num-tabular">{formatRupiah(hasil.diterima)}</strong>
                </span>
              </div>

              {penawaran.potonganDimuka > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#D62839] shrink-0" />
                  <span className="text-[#1B1B1F]/80">
                    {t.upfrontFeeLabel}
                    <strong className="num-tabular">{formatRupiah(penawaran.potonganDimuka)}</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#F28C28] shrink-0" />
                <span className="text-[#1B1B1F]/80">
                  {t.extraFeeLabel}
                  <strong className="num-tabular">{formatRupiah(hasil.biayaTotal - penawaran.potonganDimuka)}</strong>
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 4 Kartu Angka (Grid 2 Kolom di Mobile) */}
        {animStage >= 4 && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Biaya per 100rb */}
            <Card className="p-3.5 flex flex-col justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-tight text-[#1B1B1F]/60">
                {t.cardCostPer100kTitle}
              </span>
              <div className="text-[19px] font-extrabold text-[#D62839] num-tabular font-heading mt-0.5 leading-tight">
                +{formatRupiah(Math.round(hasil.biayaPer100rb))}
              </div>
              <p className="text-[11px] text-[#1B1B1F]/65 mt-1 leading-snug">
                {t.cardCostPer100kDesc} {formatRupiah(Math.round(hasil.biayaPer100rb))}.
              </p>
            </Card>

            {/* Card 2: Bunga Sebenarnya per Periode */}
            <Card className="p-3.5 flex flex-col justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-tight text-[#1B1B1F]/60">
                {t.cardTrueRateTitle}
              </span>
              <div className="text-[19px] font-extrabold text-[#14213D] num-tabular font-heading mt-0.5 leading-tight">
                ~{formatPersen(hasil.bungaPerPeriode, 1)} / {penawaran.frekuensi === 'harian' ? (lang === 'ID' ? 'hari' : 'day') : penawaran.frekuensi === 'mingguan' ? (lang === 'ID' ? 'minggu' : 'week') : (lang === 'ID' ? 'bln' : 'mo')}
              </div>
              <p className="text-[11px] text-[#1B1B1F]/65 mt-1 leading-snug">
                {t.cardTrueRateDesc}
              </p>
            </Card>

            {/* Card 3: Kalau dihitung setahun */}
            <Card className="p-3.5 flex flex-col justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-tight text-[#1B1B1F]/60">
                {t.cardAnnualRateTitle}
              </span>
              <div className="text-[19px] font-extrabold text-[#14213D] num-tabular font-heading mt-0.5 leading-tight">
                ~{Math.round(hasil.bungaNominalTahunan * 100)}% / {lang === 'ID' ? 'thn' : 'yr'}
              </div>
              <p className="text-[11px] text-[#1B1B1F]/65 mt-1 leading-snug">
                {t.cardAnnualRateDesc}
              </p>
            </Card>

            {/* Card 4: Lama pinjaman */}
            <Card className="p-3.5 flex flex-col justify-between gap-1">
              <span className="text-[11px] font-bold uppercase tracking-tight text-[#1B1B1F]/60">
                {t.cardDurationTitle}
              </span>
              <div className="text-[19px] font-extrabold text-[#14213D] num-tabular font-heading mt-0.5 leading-tight">
                {hasil.durasiHari} {t.cardDurationUnit}
              </div>
              <p className="text-[11px] text-[#1B1B1F]/65 mt-1 leading-snug">
                {penawaran.jumlahCicilan}x {t.tableTotalRepaid} ({penawaran.frekuensi}).
              </p>
            </Card>
          </div>
        )}

        {/* Meter Risiko: SVG Gauge Setengah Lingkaran */}
        {animStage >= 4 && (
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#14213D] uppercase tracking-wide">
                {t.riskMeterTitle}
              </span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-extrabold ${riskInfo.badgeBg} ${riskInfo.badgeBorder} ${riskInfo.badgeText}`}>
                <RiskIcon className="w-3.5 h-3.5" />
                <span>{riskInfo.label}</span>
              </div>
            </div>

            {/* Semi-circle Gauge SVG */}
            <div className="relative flex flex-col items-center justify-center pt-2">
              <svg viewBox="0 0 200 110" className="w-48 h-28 overflow-visible">
                <path
                  d="M 20 100 A 80 80 0 0 1 60 30.7"
                  fill="none"
                  stroke="#2E9E6B"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 66 26 A 80 80 0 0 1 134 26"
                  fill="none"
                  stroke="#F28C28"
                  strokeWidth="16"
                />
                <path
                  d="M 140 30.7 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#D62839"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Needle Indicator */}
                <g transform={`translate(100, 100) rotate(${needleAngle})`}>
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-70"
                    stroke="#14213D"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy="0" r="8" fill="#14213D" />
                  <circle cx="0" cy="0" r="3" fill="#FCA311" />
                </g>
              </svg>

              <div className="flex justify-between w-full max-w-[200px] text-[11px] font-bold text-[#1B1B1F]/60 -mt-2">
                <span className="text-[#2E9E6B]">AMAN</span>
                <span className="text-[#F28C28]">WASPADA</span>
                <span className="text-[#D62839]">BAHAYA</span>
              </div>
            </div>

            {/* Teks Perbandingan Resmi OJK */}
            <div className="p-3 rounded-xl bg-[#FFFDF7] border border-[#E8DFC9] flex flex-col gap-1 text-center">
              <p className="text-xs font-semibold text-[#14213D] leading-relaxed">
                {lang === 'EN'
                  ? `This offer costs ${biayaPerHariPersen}% per day. Official OJK ceiling for licensed online lenders (${ambang.jenis === 'produktif' ? 'business/productive loan' : 'personal/consumer loan'}, ${ambang.tenorPendek ? 'tenor up to 6 months' : 'tenor over 6 months'}): ${ambang.batasPersenTeks} per day (${BENCHMARK.sumber}, source checked ${BENCHMARK.tanggalCek}). This benchmark is not legal advice.`
                  : `Biaya penawaran ini ${biayaPerHariPersen}% per hari. Batas OJK untuk pinjol berizin (pinjaman ${ambang.jenis === 'produktif' ? 'usaha/produktif' : 'pribadi/konsumtif'}, ${ambang.tenorPendek ? 'tenor sampai 6 bulan' : 'tenor di atas 6 bulan'}): ${ambang.batasPersenTeks} per hari (${BENCHMARK.sumber}, sumber dicek ${BENCHMARK.tanggalCek}). Patokan ini bukan nasihat hukum.`}
              </p>
            </div>

            <p className="text-xs text-[#1B1B1F]/80 leading-relaxed text-center px-2">
              {lang === 'EN'
                ? (tingkatRisiko === 'AMAN' ? t.descAman : tingkatRisiko === 'WASPADA' ? t.descWaspada : t.descBahaya)
                : riskInfo.advice}
            </p>
          </Card>
        )}

        {/* Kartu "Artinya begini:" - Penjelasan Bahasa Awam AI */}
        {animStage >= 4 && (
          <Card className="flex flex-col gap-2.5 p-4 bg-[#FFFDF7]">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#14213D] font-heading flex items-center gap-1.5">
                <span>{t.inSimpleWordsTitle}</span>
              </h2>
              <button
                onClick={handleToggleSpeech}
                aria-label={isPlayingAudio ? t.stopAudio : t.listen}
                className={`min-h-[44px] py-1 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-[#FCA311] text-[#14213D] animate-pulse'
                    : 'bg-[#14213D]/10 text-[#14213D] hover:bg-[#14213D]/20'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? t.stopAudio : t.listen}</span>
              </button>
            </div>

            {isAiLoading ? (
              <div className="flex flex-col gap-2 py-1 animate-pulse">
                <div className="h-4 bg-[#E8DFC9]/60 rounded-md w-full" />
                <div className="h-4 bg-[#E8DFC9]/60 rounded-md w-5/6" />
                <div className="h-4 bg-[#E8DFC9]/60 rounded-md w-2/3" />
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed text-[#14213D] font-medium">
                {penjelasanData?.penjelasan}
              </p>
            )}
          </Card>
        )}

        {/* Kartu "Hal yang perlu kamu tanyakan" */}
        {animStage >= 4 && (
          <Card className="flex flex-col gap-2.5 p-4 border-[#FCA311]/40 bg-[#FFFDF9]">
            <h2 className="text-sm font-bold text-[#14213D] font-heading flex items-center gap-1.5">
              <span>{t.questionsToAskTitle}</span>
            </h2>

            {isAiLoading ? (
              <div className="flex flex-col gap-2 py-1 animate-pulse">
                <div className="h-3.5 bg-[#E8DFC9]/50 rounded w-4/5" />
                <div className="h-3.5 bg-[#E8DFC9]/50 rounded w-3/4" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {penjelasanData?.tandaBahaya.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[13px] leading-snug text-[#1B1B1F]/85">
                    <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <span className="text-[11px] text-[#1B1B1F]/50 italic pt-1 border-t border-[#E8DFC9]/50">
              {t.educationalNotice}
            </span>
          </Card>
        )}

        <Disclaimer extended lang={lang} />
      </div>

      {/* Coachmark / Tour Guide for first-time visitors */}
      <Coachmark onDismiss={() => {}} lang={lang} />

      {/* Sticky Bottom Action Bar with 48px min height and aria-labels */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFF9EC]/95 backdrop-blur-md border-t border-[#E8DFC9] p-3 shadow-lg flex justify-center">
        <div className="w-full max-w-[480px] flex items-center justify-between gap-2">
          {/* Audio Button */}
          <button
            onClick={handleToggleSpeech}
            aria-label={isPlayingAudio ? t.stopAudio : t.listen}
            className={`min-h-[48px] h-[48px] px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D] ${
              isPlayingAudio
                ? 'bg-[#FCA311] text-[#14213D] ring-2 ring-[#FCA311]/50'
                : 'bg-white border border-[#E8DFC9] text-[#14213D] hover:bg-[#FFF9EC]'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>🔊 {t.listen}</span>
              </>
            )}
          </button>

          {/* Telat */}
          <button
            onClick={onGoToLate}
            aria-label={t.btnLateRisk}
            className="min-h-[48px] h-[48px] px-3 rounded-xl border border-[#E8DFC9] bg-white hover:bg-[#FFF9EC] text-[#14213D] font-bold text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
          >
            <Clock className="w-4 h-4" />
            <span>{t.btnLateRisk}</span>
          </button>

          {/* Bandingkan */}
          <button
            onClick={onGoToCompare}
            aria-label={t.btnCompare}
            className="min-h-[48px] h-[48px] px-3 rounded-xl border border-[#E8DFC9] bg-white hover:bg-[#FFF9EC] text-[#14213D] font-bold text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
          >
            <Scale className="w-4 h-4" />
            <span>{t.btnCompare}</span>
          </button>

          {/* Simpan ke Riwayat */}
          <button
            onClick={handleSaveToHistory}
            aria-label={t.btnSave}
            className="min-h-[48px] h-[48px] px-3 rounded-xl border border-[#E8DFC9] bg-white hover:bg-[#FFF9EC] text-[#14213D] font-bold text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
          >
            <Bookmark className="w-4 h-4 text-[#2E9E6B]" />
            <span>{t.btnSave}</span>
          </button>

          {/* Bagikan */}
          <button
            onClick={handleShare}
            aria-label={t.btnShare}
            className="min-h-[48px] h-[48px] px-3.5 rounded-xl bg-[#14213D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 hover:bg-[#1E2E52] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.btnShare}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
