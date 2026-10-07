import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Penawaran, validasiPenawaran, Frekuensi, JenisPinjaman } from '../lib/finance';
import { formatRupiah } from '../lib/format';
import { Language, translations } from '../i18n';

interface ConfirmProps {
  initialData?: Partial<Penawaran>;
  kolomTidakYakin?: string[];
  onConfirm: (confirmedData: Penawaran) => void;
  onBack: () => void;
  lang: Language;
}

export const Confirm: React.FC<ConfirmProps> = ({
  initialData,
  kolomTidakYakin = [],
  onConfirm,
  onBack,
  lang,
}) => {
  const t = translations[lang];

  const [pokok, setPokok] = useState<number | undefined>(initialData?.pokok);
  const [modePotongan, setModePotongan] = useState<'rp' | 'persen'>('rp');
  const [potonganRp, setPotonganRp] = useState<number>(initialData?.potonganDimuka ?? 0);
  const [potonganPersen, setPotonganPersen] = useState<number>(() => {
    if (initialData?.pokok && initialData?.potonganDimuka) {
      return Number(((initialData.potonganDimuka / initialData.pokok) * 100).toFixed(1));
    }
    return 0;
  });

  const [cicilan, setCicilan] = useState<number | undefined>(initialData?.cicilan);
  const [jumlahCicilan, setJumlahCicilan] = useState<number | undefined>(initialData?.jumlahCicilan);
  const [frekuensi, setFrekuensi] = useState<Frekuensi>(initialData?.frekuensi || 'harian');
  const [jenisPinjaman, setJenisPinjaman] = useState<JenisPinjaman>(initialData?.jenisPinjaman ?? 'produktif');
  const [dendaPerHari, setDendaPerHari] = useState<number | undefined>(initialData?.dendaPerHari);

  const effectivePotonganDimuka = useMemo(() => {
    if (modePotongan === 'persen') {
      const p = pokok ?? 0;
      return Math.round((p * (potonganPersen || 0)) / 100);
    }
    return potonganRp || 0;
  }, [modePotongan, potonganRp, potonganPersen, pokok]);

  const penawaranObj: Penawaran = useMemo(() => ({
    pokok: pokok ?? 0,
    potonganDimuka: effectivePotonganDimuka,
    cicilan: cicilan ?? 0,
    jumlahCicilan: jumlahCicilan ?? 0,
    frekuensi,
    jenisPinjaman,
    dendaPerHari: dendaPerHari ?? 0,
  }), [pokok, effectivePotonganDimuka, cicilan, jumlahCicilan, frekuensi, jenisPinjaman, dendaPerHari]);

  const validationErrors = useMemo(() => validasiPenawaran(penawaranObj), [penawaranObj]);
  const isValid = validationErrors.length === 0 && (pokok ?? 0) > 0 && (cicilan ?? 0) > 0 && (jumlahCicilan ?? 0) > 0;

  const liveDiterima = Math.max(0, (pokok ?? 0) - effectivePotonganDimuka);
  const liveTotalBayar = (cicilan ?? 0) * (jumlahCicilan ?? 0);

  const formatInputDisplay = (val: number | undefined): string => {
    if (!val) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const parseNumberInput = (str: string): number | undefined => {
    const clean = str.replace(/[^\d]/g, '');
    if (!clean) return undefined;
    const num = parseInt(clean, 10);
    return isNaN(num) ? undefined : num;
  };

  const isUncertain = (colName: string, value: any): boolean => {
    if (!value) return true;
    return kolomTidakYakin.includes(colName);
  };

  const handleModePotonganChange = (newMode: 'rp' | 'persen') => {
    setModePotongan(newMode);
    if (newMode === 'persen' && pokok && pokok > 0) {
      setPotonganPersen(Number(((potonganRp / pokok) * 100).toFixed(1)));
    } else if (newMode === 'rp' && pokok && pokok > 0) {
      setPotonganRp(Math.round((pokok * potonganPersen) / 100));
    }
  };

  const handleSubmit = () => {
    if (isValid) onConfirm(penawaranObj);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#14213D] font-heading leading-tight">
            {t.confirmTitle}
          </h1>
          <p className="text-[15px] text-[#1B1B1F]/70 mt-1">
            {t.confirmSubtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* Pokok Pinjaman */}
          <Card className={`p-4 flex flex-col gap-1.5 transition-all ${
            isUncertain('pokok', pokok) ? 'border-[#FCA311] ring-1 ring-[#FCA311]/40' : ''
          }`}>
            <div className="flex justify-between items-center">
              <label htmlFor="input-pokok" className="text-sm font-bold text-[#14213D]">
                {t.labelLoanAmount}
              </label>
              {isUncertain('pokok', pokok) && (
                <span className="text-[11px] font-bold text-[#14213D] bg-[#FCA311]/25 px-2 py-0.5 rounded-md border border-[#FCA311]/50">
                  {t.pleaseCheck}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-[#14213D]/60 text-[15px]">Rp</span>
              <input
                id="input-pokok"
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(pokok)}
                onChange={(e) => setPokok(parseNumberInput(e.target.value))}
                placeholder="1.000.000"
                aria-label={t.labelLoanAmount}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[17px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
              />
            </div>
          </Card>

          {/* Potongan Dimuka */}
          <Card className={`p-4 flex flex-col gap-2 transition-all ${
            isUncertain('potonganDimuka', effectivePotonganDimuka) && effectivePotonganDimuka > 0 ? 'border-[#FCA311] ring-1 ring-[#FCA311]/40' : ''
          }`}>
            <div className="flex justify-between items-center">
              <label htmlFor="input-potongan" className="text-sm font-bold text-[#14213D]">
                {t.labelUpfrontCut}
              </label>

              <div className="flex items-center p-0.5 bg-[#E8DFC9]/50 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleModePotonganChange('rp')}
                  aria-label="Mode Rupiah"
                  className={`min-h-[36px] px-3 py-1 rounded-md transition-all cursor-pointer ${
                    modePotongan === 'rp' ? 'bg-[#14213D] text-white shadow-sm' : 'text-[#14213D]/70'
                  }`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => handleModePotonganChange('persen')}
                  aria-label="Mode Persen"
                  className={`min-h-[36px] px-3 py-1 rounded-md transition-all cursor-pointer ${
                    modePotongan === 'persen' ? 'bg-[#14213D] text-white shadow-sm' : 'text-[#14213D]/70'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {modePotongan === 'rp' ? (
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold text-[#14213D]/60 text-[15px]">Rp</span>
                <input
                  id="input-potongan"
                  type="text"
                  inputMode="numeric"
                  value={formatInputDisplay(potonganRp)}
                  onChange={(e) => setPotonganRp(parseNumberInput(e.target.value) || 0)}
                  placeholder="0"
                  aria-label={t.labelUpfrontCut}
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[17px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
                />
              </div>
            ) : (
              <div className="relative flex items-center">
                <input
                  id="input-potongan"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={potonganPersen || ''}
                  onChange={(e) => setPotonganPersen(parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  aria-label={t.labelUpfrontCut}
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[17px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
                />
                <span className="absolute right-3 font-bold text-[#14213D]/60 text-[16px]">%</span>
              </div>
            )}
          </Card>

          {/* Cicilan Per Kali Bayar */}
          <Card className={`p-4 flex flex-col gap-1.5 transition-all ${
            isUncertain('cicilan', cicilan) ? 'border-[#FCA311] ring-1 ring-[#FCA311]/40' : ''
          }`}>
            <div className="flex justify-between items-center">
              <label htmlFor="input-cicilan" className="text-sm font-bold text-[#14213D]">
                {t.labelInstallment}
              </label>
              {isUncertain('cicilan', cicilan) && (
                <span className="text-[11px] font-bold text-[#14213D] bg-[#FCA311]/25 px-2 py-0.5 rounded-md border border-[#FCA311]/50">
                  {t.pleaseCheck}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-[#14213D]/60 text-[15px]">Rp</span>
              <input
                id="input-cicilan"
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(cicilan)}
                onChange={(e) => setCicilan(parseNumberInput(e.target.value))}
                placeholder="46.000"
                aria-label={t.labelInstallment}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[17px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
              />
            </div>
          </Card>

          {/* Tenor & Frekuensi */}
          <div className="grid grid-cols-2 gap-2.5">
            <Card className={`p-3.5 flex flex-col gap-1.5 transition-all ${
              isUncertain('jumlahCicilan', jumlahCicilan) ? 'border-[#FCA311] ring-1 ring-[#FCA311]/40' : ''
            }`}>
              <div className="flex justify-between items-center">
                <label htmlFor="input-tenor" className="text-xs font-bold text-[#14213D]">
                  {t.labelFrequency}
                </label>
                {isUncertain('jumlahCicilan', jumlahCicilan) && (
                  <span className="text-[9px] font-bold text-[#14213D] bg-[#FCA311]/25 px-1 py-0.5 rounded border border-[#FCA311]/50">
                    Cek
                  </span>
                )}
              </div>
              <input
                id="input-tenor"
                type="number"
                min="1"
                step="1"
                value={jumlahCicilan || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setJumlahCicilan(isNaN(val) ? undefined : val);
                }}
                placeholder="30"
                aria-label={t.labelFrequency}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[16px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
              />
            </Card>

            <Card className={`p-3.5 flex flex-col gap-1.5 transition-all ${
              isUncertain('frekuensi', frekuensi) ? 'border-[#FCA311] ring-1 ring-[#FCA311]/40' : ''
            }`}>
              <label htmlFor="select-frekuensi" className="text-xs font-bold text-[#14213D]">
                {t.labelHowOften}
              </label>
              <select
                id="select-frekuensi"
                value={frekuensi}
                onChange={(e) => setFrekuensi(e.target.value as Frekuensi)}
                aria-label={t.labelHowOften}
                className="w-full px-2.5 py-2.5 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[16px] focus:outline-none focus:ring-2 focus:ring-[#14213D]/40 cursor-pointer"
              >
                <option value="harian">{t.daily}</option>
                <option value="mingguan">{t.weekly}</option>
                <option value="bulanan">{t.monthly}</option>
              </select>
            </Card>
          </div>

          {/* Tujuan Pinjaman */}
          <Card className="p-4 flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[#14213D]">
              {t.labelLoanPurpose}
            </label>
            <div role="radiogroup" aria-label={t.labelLoanPurpose} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={jenisPinjaman === 'produktif'}
                onClick={() => setJenisPinjaman('produktif')}
                className={`min-h-[48px] px-3 py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center text-center break-words min-w-0 transition-colors cursor-pointer ${
                  jenisPinjaman === 'produktif'
                    ? 'bg-[#14213D] text-white'
                    : 'bg-white text-[#14213D] border border-[#E8DFC9] hover:bg-[#FFF9EC]'
                }`}
              >
                {t.loanPurposeBusiness}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={jenisPinjaman === 'konsumtif'}
                onClick={() => setJenisPinjaman('konsumtif')}
                className={`min-h-[48px] px-3 py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center text-center break-words min-w-0 transition-colors cursor-pointer ${
                  jenisPinjaman === 'konsumtif'
                    ? 'bg-[#14213D] text-white'
                    : 'bg-white text-[#14213D] border border-[#E8DFC9] hover:bg-[#FFF9EC]'
                }`}
              >
                {t.loanPurposePersonal}
              </button>
            </div>
            <p className="text-xs text-[#1B1B1F]/70 leading-relaxed">
              {t.loanPurposeHint}
            </p>
          </Card>

          {/* Denda Telat (Opsional) */}
          <Card className="p-4 flex flex-col gap-1.5">
            <label htmlFor="input-denda" className="text-sm font-bold text-[#14213D]">
              {t.labelLatePenalty}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-[#14213D]/60 text-[15px]">Rp</span>
              <input
                id="input-denda"
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(dendaPerHari)}
                onChange={(e) => setDendaPerHari(parseNumberInput(e.target.value))}
                placeholder="5.000"
                aria-label={t.labelLatePenalty}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#14213D] font-bold text-[16px] num-tabular focus:outline-none focus:ring-2 focus:ring-[#14213D]/40"
              />
            </div>
          </Card>
        </div>

        {/* Live Summary Box */}
        <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#14213D]/15 shadow-sm flex flex-col gap-2">
          <div className="text-xs font-bold tracking-wide uppercase text-[#1B1B1F]/60">
            {t.liveSummaryTitle}
          </div>
          <div className="text-[16px] text-[#14213D] leading-snug font-medium">
            {t.liveSummaryPrefix} <strong className="text-[#2E9E6B] font-extrabold num-tabular">{formatRupiah(liveDiterima)}</strong> {t.liveSummaryMiddle} <strong className="text-[#D62839] font-extrabold num-tabular">{formatRupiah(liveTotalBayar)}</strong>.
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#D62839]/10 border border-[#D62839]/30 flex flex-col gap-1.5">
            {validationErrors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-bold text-[#D62839]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            variant="accent"
            size="large"
            disabled={!isValid}
            onClick={handleSubmit}
            aria-label={t.btnConfirmAndCalculate}
          >
            {t.btnConfirmAndCalculate}
          </Button>

          <Button
            variant="secondary"
            size="large"
            onClick={onBack}
            aria-label={t.back}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t.back}
          </Button>
        </div>
      </div>

      <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
        <Disclaimer lang={lang} />
      </footer>
    </div>
  );
};
