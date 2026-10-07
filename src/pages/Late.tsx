import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import { Clock, ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { Penawaran, simulasiTelat, hitungSemua } from '../lib/finance';
import { formatRupiah } from '../lib/format';
import { ambangOjk, cekDendaOjk, formatPersenOjk } from '../config/benchmarks';
import { Language, translations } from '../i18n';

interface LateProps {
  penawaran: Penawaran;
  onBackToReveal: () => void;
  lang: Language;
}

export const Late: React.FC<LateProps> = ({ penawaran, onBackToReveal, lang }) => {
  const t = translations[lang];

  const [hariTelat, setHariTelat] = useState<number>(7);
  const [dendaPerHariInput, setDendaPerHariInput] = useState<number>(
    penawaran.dendaPerHari || 0
  );

  const activePenawaran: Penawaran = useMemo(() => {
    return {
      ...penawaran,
      dendaPerHari: dendaPerHariInput,
    };
  }, [penawaran, dendaPerHariInput]);

  const hasilTelat = useMemo(() => {
    return simulasiTelat(activePenawaran, hariTelat);
  }, [activePenawaran, hariTelat]);

  const hasil = useMemo(() => {
    try {
      return hitungSemua(penawaran);
    } catch {
      return null;
    }
  }, [penawaran]);

  const evaluasiDenda = useMemo(() => {
    if (!hasil || penawaran.pokok <= 0) return null;
    const ambang = ambangOjk(
      penawaran.jenisPinjaman ?? 'produktif',
      penawaran.pokok,
      hasil.durasiHari
    );
    const cek = cekDendaOjk(dendaPerHariInput, penawaran.pokok, ambang.batas);
    return {
      ambang,
      cek,
      dendaPersenPerHari: cek.persenPerHari,
      melebihiBatas: cek.melebihiBatas,
    };
  }, [penawaran, hasil, dendaPerHariInput]);

  const totalBiayaDanDendaMelebihi100 = useMemo(() => {
    if (!hasil || penawaran.pokok <= 0) return false;
    return (hasil.biayaTotal + hasilTelat.denda) > penawaran.pokok;
  }, [hasil, hasilTelat.denda, penawaran.pokok]);

  const handleReset = () => {
    setHariTelat(0);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-6">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D62839] mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.lateTitle}</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#14213D] font-heading">
            {t.lateTitle}
          </h1>
          <p className="text-[15px] text-[#1B1B1F]/70 mt-0.5">
            {t.lateSubtitle}
          </p>
        </div>

        {/* Big Slider Card */}
        <Card className="p-5 flex flex-col gap-4 bg-[#FFFDF7] border-[#E8DFC9]">
          <div className="flex justify-between items-end">
            <label
              htmlFor="late-days-slider"
              className="text-xs font-bold uppercase tracking-wider text-[#1B1B1F]/60"
            >
              {t.lateDaysQuestion}
            </label>
            <div className="text-[34px] font-extrabold text-[#14213D] font-heading leading-none num-tabular">
              {hariTelat} <span className="text-lg font-bold text-[#1B1B1F]/60">{t.days}</span>
            </div>
          </div>

          {/* Slider Element */}
          <div className="flex flex-col gap-2">
            <input
              id="late-days-slider"
              type="range"
              min="0"
              max="30"
              step="1"
              value={hariTelat}
              onChange={(e) => setHariTelat(parseInt(e.target.value, 10))}
              aria-label={t.lateDaysQuestion}
              className="w-full h-3.5 bg-[#E8DFC9] rounded-lg appearance-none cursor-pointer accent-[#14213D]"
            />
            <div className="flex justify-between text-[11px] font-bold text-[#1B1B1F]/50 px-1">
              <span>0 {t.days.toLowerCase()}</span>
              <span>10 {t.days.toLowerCase()}</span>
              <span>20 {t.days.toLowerCase()}</span>
              <span>30 {t.days.toLowerCase()}</span>
            </div>
          </div>

          {/* Input jika denda per hari kosong */}
          {dendaPerHariInput <= 0 && (
            <div className="p-3.5 rounded-xl bg-[#FCA311]/15 border border-[#FCA311]/40 flex flex-col gap-2 mt-1">
              <label
                htmlFor="input-custom-denda"
                className="flex items-start gap-2 text-xs font-bold text-[#14213D] cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-[#FCA311] shrink-0 mt-0.5" />
                <span>{t.penaltyUnsetPrompt}</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold text-[#14213D]/60 text-sm">Rp</span>
                <input
                  id="input-custom-denda"
                  type="text"
                  inputMode="numeric"
                  placeholder="5.000"
                  aria-label={t.labelLatePenalty}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d]/g, '');
                    setDendaPerHariInput(clean ? parseInt(clean, 10) : 0);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#E8DFC9] bg-white text-[16px] font-bold text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#14213D]"
                />
              </div>
            </div>
          )}

          {/* Quick preset buttons (min 44px hit area) */}
          <div className="flex items-center flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-[#1B1B1F]/50">{lang === 'ID' ? 'Cepat:' : 'Quick:'}</span>
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setHariTelat(d)}
                aria-label={`${d} ${t.days}`}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hariTelat === d
                    ? 'bg-[#14213D] text-white shadow-sm'
                    : 'bg-white border border-[#E8DFC9] text-[#14213D]/80 hover:bg-[#FFF9EC]'
                }`}
              >
                {d}h
              </button>
            ))}
          </div>
        </Card>

        {/* Live Calculation Results Card */}
        <Card className="p-4 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1B1B1F]/60">
            {lang === 'ID' ? 'Akibat Keterlambatan' : 'Late Consequences'}
          </span>

          <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFC9]/60">
            <span className="text-sm text-[#1B1B1F]/75">{t.accumulatedPenalty}</span>
            <span className="text-lg font-extrabold text-[#D62839] num-tabular font-heading">
              +{formatRupiah(hasilTelat.denda)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-[#E8DFC9]/60">
            <span className="text-sm text-[#1B1B1F]/75">{t.extraCostLabel}</span>
            <span className="text-base font-bold text-[#D62839] num-tabular">
              +{formatRupiah(hasilTelat.tambahanBiaya)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold text-[#14213D]">{t.newTotalRepay}</span>
            <span className="text-xl font-extrabold text-[#14213D] num-tabular font-heading">
              {formatRupiah(hasilTelat.totalBaru)}
            </span>
          </div>
        </Card>

        {/* Peringatan Batas Denda OJK (SEOJK No. 19/SEOJK.06/2025 Romawi XIV angka 4) */}
        {dendaPerHariInput > 0 && evaluasiDenda?.melebihiBatas && (
          <Card className="p-4 flex flex-col gap-2.5 bg-[#FFF9F2] border-2 border-[#F28C28] shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F28C28]/20 flex items-center justify-center text-[#F28C28] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-extrabold text-[#14213D] font-heading">
                {t.lateOjkPenaltyTitle}
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#1B1B1F]/85">
              {t.lateOjkPenaltyDesc(
                formatRupiah(dendaPerHariInput),
                formatPersenOjk(evaluasiDenda.dendaPersenPerHari),
                formatPersenOjk(evaluasiDenda.ambang.batas)
              )}
            </p>
            <p className="text-[11px] text-[#1B1B1F]/60 italic pt-1 border-t border-[#F28C28]/20">
              {t.lateOjkNotice}
            </p>
          </Card>
        )}

        {/* Peringatan Total Biaya & Denda Melebihi 100% Pokok (SEOJK No. 19/SEOJK.06/2025 Romawi XIV angka 5) */}
        {totalBiayaDanDendaMelebihi100 && (
          <Card className="p-4 flex flex-col gap-2.5 bg-[#FFF9F2] border-2 border-[#F28C28] shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F28C28]/20 flex items-center justify-center text-[#F28C28] shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold leading-relaxed text-[#14213D]">
                {t.lateOjkTotalCapDesc}
              </p>
            </div>
            <p className="text-[11px] text-[#1B1B1F]/60 italic pt-1 border-t border-[#F28C28]/20">
              {t.lateOjkNotice}
            </p>
          </Card>
        )}

        {/* Reset & Kembali Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {hariTelat > 0 && (
            <Button
              variant="secondary"
              size="normal"
              onClick={handleReset}
              aria-label={t.btnResetDays}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              {t.btnResetDays}
            </Button>
          )}

          <Button
            variant="primary"
            size="large"
            onClick={onBackToReveal}
            aria-label={t.btnBackToResult}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t.btnBackToResult}
          </Button>
        </div>
      </div>

      <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
        <Disclaimer extended lang={lang} />
      </footer>
    </div>
  );
};
