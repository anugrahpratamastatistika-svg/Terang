import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import {
  Scale,
  ArrowLeft,
  History as HistoryIcon,
  Edit,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Penawaran, Hasil, hitungSemua, bandingkan, HasilPerbandingan } from '../lib/finance';
import { formatRupiah, formatPersen } from '../lib/format';
import { daftarCek, ItemRiwayat, CONTOH_PENAWARAN } from '../lib/storage';
import { tentukanRisiko, hitungBiayaPerHari, ambangOjk, RISK_CONFIG } from '../config/benchmarks';
import { Language, translations } from '../i18n';

interface CompareProps {
  penawaran?: Penawaran;
  onBackToReveal: () => void;
  onBackToConfirm?: () => void;
  lang: Language;
}

export const Compare: React.FC<CompareProps> = ({
  penawaran,
  onBackToReveal,
  onBackToConfirm,
  lang,
}) => {
  const t = translations[lang];

  const [penawaranA, setPenawaranA] = useState<Penawaran>(() => {
    if (penawaran && penawaran.pokok && penawaran.cicilan) return penawaran;
    return CONTOH_PENAWARAN;
  });

  const [penawaranB, setPenawaranB] = useState<Penawaran>(() => {
    return {
      pokok: 1000000,
      potonganDimuka: 0,
      cicilan: 37000,
      jumlahCicilan: 30,
      frekuensi: 'harian',
      dendaPerHari: 2000,
    };
  });

  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);
  const [editingTarget, setEditingTarget] = useState<'A' | 'B' | null>(null);

  const [editPokok, setEditPokok] = useState<number>(1000000);
  const [editPotongan, setEditPotongan] = useState<number>(0);
  const [editCicilan, setEditCicilan] = useState<number>(40000);
  const [editJumlahCicilan, setEditJumlahCicilan] = useState<number>(30);
  const [editFrekuensi, setEditFrekuensi] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  const openEditor = (target: 'A' | 'B') => {
    const targetOffer = target === 'A' ? penawaranA : penawaranB;
    setEditPokok(targetOffer.pokok);
    setEditPotongan(targetOffer.potonganDimuka);
    setEditCicilan(targetOffer.cicilan);
    setEditJumlahCicilan(targetOffer.jumlahCicilan);
    setEditFrekuensi(targetOffer.frekuensi);
    setEditingTarget(target);
  };

  const saveEditedOffer = () => {
    const updated: Penawaran = {
      pokok: editPokok,
      potonganDimuka: editPotongan,
      cicilan: editCicilan,
      jumlahCicilan: editJumlahCicilan,
      frekuensi: editFrekuensi,
    };
    if (editingTarget === 'A') setPenawaranA(updated);
    if (editingTarget === 'B') setPenawaranB(updated);
    setEditingTarget(null);
  };

  const handleSelectFromHistory = (item: ItemRiwayat) => {
    const selected: Penawaran = {
      pokok: item.penawaran.pokok,
      potonganDimuka: item.penawaran.potonganDimuka,
      cicilan: item.penawaran.cicilan,
      jumlahCicilan: item.penawaran.jumlahCicilan,
      frekuensi: item.penawaran.frekuensi,
      dendaPerHari: item.penawaran.dendaPerHari,
      jenisPinjaman: item.penawaran.jenisPinjaman ?? 'produktif',
    };
    if (pickerTarget === 'A') setPenawaranA(selected);
    if (pickerTarget === 'B') setPenawaranB(selected);
    setPickerTarget(null);
  };

  // Hitung murni hitungSemua() tanpa fallback angka tetap
  let hasilA: Hasil | null = null;
  let hasilB: Hasil | null = null;
  let calcError = false;

  try {
    hasilA = hitungSemua(penawaranA);
    hasilB = hitungSemua(penawaranB);
  } catch {
    calcError = true;
  }

  // Jika hitungSemua() error, tampilkan kartu error ramah dan jangan tampilkan hasil apa pun
  if (calcError || !hasilA || !hasilB) {
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
              onClick={onBackToConfirm || onBackToReveal}
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
    <CompareValidContent
      penawaranA={penawaranA}
      penawaranB={penawaranB}
      hasilA={hasilA}
      hasilB={hasilB}
      onOpenEditor={openEditor}
      onSetPickerTarget={setPickerTarget}
      onBackToReveal={onBackToReveal}
      pickerTarget={pickerTarget}
      editingTarget={editingTarget}
      onClosePicker={() => setPickerTarget(null)}
      onCloseEditor={() => setEditingTarget(null)}
      onSelectFromHistory={handleSelectFromHistory}
      editPokok={editPokok}
      setEditPokok={setEditPokok}
      editPotongan={editPotongan}
      setEditPotongan={setEditPotongan}
      editCicilan={editCicilan}
      setEditCicilan={setEditCicilan}
      editJumlahCicilan={editJumlahCicilan}
      setEditJumlahCicilan={setEditJumlahCicilan}
      editFrekuensi={editFrekuensi}
      setEditFrekuensi={setEditFrekuensi}
      saveEditedOffer={saveEditedOffer}
      lang={lang}
    />
  );
};

interface CompareValidContentProps {
  penawaranA: Penawaran;
  penawaranB: Penawaran;
  hasilA: Hasil;
  hasilB: Hasil;
  onOpenEditor: (target: 'A' | 'B') => void;
  onSetPickerTarget: (target: 'A' | 'B') => void;
  onBackToReveal: () => void;
  pickerTarget: 'A' | 'B' | null;
  editingTarget: 'A' | 'B' | null;
  onClosePicker: () => void;
  onCloseEditor: () => void;
  onSelectFromHistory: (item: ItemRiwayat) => void;
  editPokok: number;
  setEditPokok: (val: number) => void;
  editPotongan: number;
  setEditPotongan: (val: number) => void;
  editCicilan: number;
  setEditCicilan: (val: number) => void;
  editJumlahCicilan: number;
  setEditJumlahCicilan: (val: number) => void;
  editFrekuensi: 'harian' | 'mingguan' | 'bulanan';
  setEditFrekuensi: (val: 'harian' | 'mingguan' | 'bulanan') => void;
  saveEditedOffer: () => void;
  lang: Language;
}

const CompareValidContent: React.FC<CompareValidContentProps> = ({
  penawaranA,
  penawaranB,
  hasilA,
  hasilB,
  onOpenEditor,
  onSetPickerTarget,
  onBackToReveal,
  pickerTarget,
  editingTarget,
  onClosePicker,
  onCloseEditor,
  onSelectFromHistory,
  editPokok,
  setEditPokok,
  editPotongan,
  setEditPotongan,
  editCicilan,
  setEditCicilan,
  editJumlahCicilan,
  setEditJumlahCicilan,
  editFrekuensi,
  setEditFrekuensi,
  saveEditedOffer,
  lang,
}) => {
  const t = translations[lang];

  const komparasi: HasilPerbandingan = useMemo(() => {
    return bandingkan(penawaranA, penawaranB);
  }, [penawaranA, penawaranB]);

  const biayaPerHariA = hitungBiayaPerHari(hasilA.biayaTotal, penawaranA.pokok, hasilA.durasiHari);
  const biayaPerHariB = hitungBiayaPerHari(hasilB.biayaTotal, penawaranB.pokok, hasilB.durasiHari);
  const ambangA = ambangOjk(penawaranA.jenisPinjaman ?? 'produktif', penawaranA.pokok, hasilA.durasiHari);
  const ambangB = ambangOjk(penawaranB.jenisPinjaman ?? 'produktif', penawaranB.pokok, hasilB.durasiHari);
  const riskA = tentukanRisiko(biayaPerHariA, ambangA.batas);
  const riskB = tentukanRisiko(biayaPerHariB, ambangB.batas);

  const historyItems = useMemo(() => daftarCek(), []);

  const bestDiterima = hasilA.diterima > hasilB.diterima ? 'A' : hasilB.diterima > hasilA.diterima ? 'B' : 'sama';
  const bestTotalBayar = hasilA.totalBayar < hasilB.totalBayar ? 'A' : hasilB.totalBayar < hasilA.totalBayar ? 'B' : 'sama';
  const bestBiayaPer100rb = hasilA.biayaPer100rb < hasilB.biayaPer100rb ? 'A' : hasilB.biayaPer100rb < hasilA.biayaPer100rb ? 'B' : 'sama';
  const bestBunga = hasilA.bungaPerPeriode < hasilB.bungaPerPeriode ? 'A' : hasilB.bungaPerPeriode < hasilA.bungaPerPeriode ? 'B' : 'sama';
  const rankRisk = (r: 'AMAN' | 'WASPADA' | 'BAHAYA') => (r === 'AMAN' ? 1 : r === 'WASPADA' ? 2 : 3);
  const bestRisk = rankRisk(riskA) < rankRisk(riskB) ? 'A' : rankRisk(riskB) < rankRisk(riskA) ? 'B' : 'sama';

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-8">
      <div className="flex flex-col gap-4">
        {/* Header Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14213D] mb-1">
            <Scale className="w-3.5 h-3.5 text-[#FCA311]" />
            <span>{t.compareTitle}</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#14213D] font-heading">
            {t.compareTitle}
          </h1>
          <p className="text-[14px] text-[#1B1B1F]/70 mt-0.5">
            {t.compareSubtitle}
          </p>
        </div>

        {/* Top Comparison Banner */}
        <div
          className={`p-4 rounded-2xl border text-center shadow-sm flex flex-col items-center gap-1 ${
            komparasi.lebihMurah === 'sama'
              ? 'bg-[#FFFDF7] border-[#E8DFC9] text-[#14213D]'
              : 'bg-[#2E9E6B]/10 border-[#2E9E6B]/30 text-[#14213D]'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#1B1B1F]/60">
            {t.comparisonResult}
          </span>
          <div className="text-[18px] font-extrabold font-heading text-[#14213D] leading-snug">
            {komparasi.lebihMurah === 'sama' ? (
              t.bothOffersIdentical
            ) : komparasi.lebihMurah === 'b' ? (
              <>
                Penawaran B {t.offerIsCheaper} <span className="text-[#2E9E6B] num-tabular">{formatRupiah(Math.round(komparasi.selisihBiayaPer100rb))}</span> {t.forEvery100k}
              </>
            ) : (
              <>
                Penawaran A {t.offerIsCheaper} <span className="text-[#2E9E6B] num-tabular">{formatRupiah(Math.round(komparasi.selisihBiayaPer100rb))}</span> {t.forEvery100k}
              </>
            )}
          </div>
          <p className="text-xs text-[#1B1B1F]/70 italic mt-0.5">{komparasi.penjelasan}</p>
        </div>

        {/* Column Selectors A and B */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Column A */}
          <div className="p-3 rounded-2xl border border-[#14213D]/20 bg-white flex flex-col gap-2 min-w-0">
            <div className="flex justify-between items-center gap-1">
              <span className="text-xs font-extrabold text-[#14213D] px-2 py-0.5 rounded bg-[#14213D]/10">
                {t.offerA}
              </span>
              <button
                onClick={() => onOpenEditor('A')}
                aria-label={`Ubah ${t.offerA}`}
                className="text-[11px] font-bold text-[#14213D] hover:underline flex items-center gap-0.5 min-h-[36px] cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>{t.btnChangeOffer}</span>
              </button>
            </div>
            <div className="text-xs font-bold text-[#14213D] break-words min-w-0">
              {formatRupiah(penawaranA.pokok)} ({penawaranA.jumlahCicilan}x {penawaranA.frekuensi})
            </div>
            <button
              onClick={() => onSetPickerTarget('A')}
              aria-label={`Pilih dari riwayat untuk ${t.offerA}`}
              className="min-h-[44px] py-1 px-2 rounded-lg bg-[#FFF9EC] border border-[#E8DFC9] text-[11px] font-bold text-[#14213D] hover:bg-[#F3EAD3] flex items-center justify-center gap-1 cursor-pointer"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>{t.btnFromHistory}</span>
            </button>
          </div>

          {/* Column B */}
          <div className="p-3 rounded-2xl border border-[#14213D]/20 bg-white flex flex-col gap-2 min-w-0">
            <div className="flex justify-between items-center gap-1">
              <span className="text-xs font-extrabold text-[#14213D] px-2 py-0.5 rounded bg-[#14213D]/10">
                {t.offerB}
              </span>
              <button
                onClick={() => onOpenEditor('B')}
                aria-label={`Ubah ${t.offerB}`}
                className="text-[11px] font-bold text-[#14213D] hover:underline flex items-center gap-0.5 min-h-[36px] cursor-pointer"
              >
                <Edit className="w-3 h-3" />
                <span>{t.btnChangeOffer}</span>
              </button>
            </div>
            <div className="text-xs font-bold text-[#14213D] break-words min-w-0">
              {formatRupiah(penawaranB.pokok)} ({penawaranB.jumlahCicilan}x {penawaranB.frekuensi})
            </div>
            <button
              onClick={() => onSetPickerTarget('B')}
              aria-label={`Pilih dari riwayat untuk ${t.offerB}`}
              className="min-h-[44px] py-1 px-2 rounded-lg bg-[#FFF9EC] border border-[#E8DFC9] text-[11px] font-bold text-[#14213D] hover:bg-[#F3EAD3] flex items-center justify-center gap-1 cursor-pointer"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>{t.btnFromHistory}</span>
            </button>
          </div>
        </div>

        {/* Detailed Side-by-Side Table with Best Checkmark indicators */}
        <Card className="p-0 overflow-hidden border-[#E8DFC9]">
          <div className="divide-y divide-[#E8DFC9]/70 text-xs">
            {/* Row 1: Uang Diterima */}
            <div className="grid grid-cols-6 p-3 items-center gap-1">
              <div className="col-span-2 font-bold text-[#1B1B1F]/70 min-w-0 break-words">
                {t.tableReceived}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatRupiah(hasilA.diterima)}</span>
                {bestDiterima === 'A' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatRupiah(hasilB.diterima)}</span>
                {bestDiterima === 'B' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
            </div>

            {/* Row 2: Total Dibayar */}
            <div className="grid grid-cols-6 p-3 items-center gap-1 bg-[#FFFDF7]/40">
              <div className="col-span-2 font-bold text-[#1B1B1F]/70 min-w-0 break-words">
                {t.tableTotalRepaid}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatRupiah(hasilA.totalBayar)}</span>
                {bestTotalBayar === 'A' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatRupiah(hasilB.totalBayar)}</span>
                {bestTotalBayar === 'B' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
            </div>

            {/* Row 3: Bayar Lebih per Rp100.000 */}
            <div className="grid grid-cols-6 p-3 items-center gap-1">
              <div className="col-span-2 font-bold text-[#1B1B1F]/70 min-w-0 break-words">
                {t.tableExtraPer100k}
              </div>
              <div className="col-span-2 text-center font-extrabold text-[#D62839] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>+{formatRupiah(Math.round(hasilA.biayaPer100rb))}</span>
                {bestBiayaPer100rb === 'A' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
              <div className="col-span-2 text-center font-extrabold text-[#D62839] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>+{formatRupiah(Math.round(hasilB.biayaPer100rb))}</span>
                {bestBiayaPer100rb === 'B' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
            </div>

            {/* Row 4: Bunga per Hari / Periode */}
            <div className="grid grid-cols-6 p-3 items-center gap-1 bg-[#FFFDF7]/40">
              <div className="col-span-2 font-bold text-[#1B1B1F]/70 min-w-0 break-words">
                {t.tableRate}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatPersen(hasilA.bungaPerPeriode, 1)}</span>
                {bestBunga === 'A' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
              <div className="col-span-2 text-center font-bold text-[#14213D] num-tabular flex items-center justify-center gap-1 min-w-0 break-words">
                <span>{formatPersen(hasilB.bungaPerPeriode, 1)}</span>
                {bestBunga === 'B' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
            </div>

            {/* Row 5: Status Risiko */}
            <div className="grid grid-cols-6 p-3 items-center gap-1">
              <div className="col-span-2 font-bold text-[#1B1B1F]/70 min-w-0 break-words">
                {t.tableRisk}
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1 font-bold min-w-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${RISK_CONFIG[riskA].badgeBg} ${RISK_CONFIG[riskA].badgeText}`}>
                  {riskA}
                </span>
                {bestRisk === 'A' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1 font-bold min-w-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${RISK_CONFIG[riskB].badgeBg} ${RISK_CONFIG[riskB].badgeText}`}>
                  {riskB}
                </span>
                {bestRisk === 'B' && <span className="text-[#2E9E6B] font-extrabold shrink-0">✓</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Back Button */}
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

      {/* Modal / Bottom Sheet: Pick from History */}
      {pickerTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-[440px] w-full p-5 max-h-[80vh] flex flex-col gap-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
              <h3 className="text-base font-bold text-[#14213D] font-heading">
                Pilih Riwayat untuk Penawaran {pickerTarget}
              </h3>
              <button
                onClick={onClosePicker}
                aria-label="Tutup pemilih riwayat"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-[#1B1B1F]/50 hover:bg-[#14213D]/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-2 max-h-[50vh]">
              {historyItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#1B1B1F]/60">
                  {t.historyEmptyDesc}
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectFromHistory(item)}
                    className="p-3 rounded-xl border border-[#E8DFC9] hover:border-[#14213D] bg-[#FFFDF7] cursor-pointer flex justify-between items-center transition-all min-h-[52px]"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#14213D]">
                        Pokok {formatRupiah(item.penawaran.pokok)} ({item.penawaran.jumlahCicilan}x {item.penawaran.frekuensi})
                      </div>
                      <div className="text-[11px] text-[#1B1B1F]/65 mt-0.5">
                        Terima: {formatRupiah(item.hasil.diterima)} · Total: {formatRupiah(item.hasil.totalBayar)}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#FCA311] px-2.5 py-1 bg-[#FCA311]/15 rounded-md min-h-[36px] flex items-center">
                      Pilih
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal / Quick Form Editor */}
      {editingTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-[440px] w-full p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E8DFC9] pb-3">
              <h3 className="text-base font-bold text-[#14213D] font-heading">
                Isi Angka Penawaran {editingTarget}
              </h3>
              <button
                onClick={onCloseEditor}
                aria-label="Tutup form ubah penawaran"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-[#1B1B1F]/50 hover:bg-[#14213D]/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <label htmlFor="edit-pokok" className="flex flex-col gap-1 font-bold text-[#14213D]">
                <span>Pokok Pinjaman:</span>
                <input
                  id="edit-pokok"
                  type="number"
                  value={editPokok}
                  onChange={(e) => setEditPokok(parseInt(e.target.value, 10) || 0)}
                  className="p-2.5 border border-[#E8DFC9] rounded-lg text-[16px]"
                />
              </label>

              <label htmlFor="edit-potongan" className="flex flex-col gap-1 font-bold text-[#14213D]">
                <span>Potongan di Awal (Admin):</span>
                <input
                  id="edit-potongan"
                  type="number"
                  value={editPotongan}
                  onChange={(e) => setEditPotongan(parseInt(e.target.value, 10) || 0)}
                  className="p-2.5 border border-[#E8DFC9] rounded-lg text-[16px]"
                />
              </label>

              <label htmlFor="edit-cicilan" className="flex flex-col gap-1 font-bold text-[#14213D]">
                <span>Cicilan per Periode:</span>
                <input
                  id="edit-cicilan"
                  type="number"
                  value={editCicilan}
                  onChange={(e) => setEditCicilan(parseInt(e.target.value, 10) || 0)}
                  className="p-2.5 border border-[#E8DFC9] rounded-lg text-[16px]"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="edit-tenor" className="flex flex-col gap-1 font-bold text-[#14213D]">
                  <span>Jumlah Cicilan:</span>
                  <input
                    id="edit-tenor"
                    type="number"
                    value={editJumlahCicilan}
                    onChange={(e) => setEditJumlahCicilan(parseInt(e.target.value, 10) || 1)}
                    className="p-2.5 border border-[#E8DFC9] rounded-lg text-[16px]"
                  />
                </label>

                <label htmlFor="edit-frekuensi" className="flex flex-col gap-1 font-bold text-[#14213D]">
                  <span>Frekuensi:</span>
                  <select
                    id="edit-frekuensi"
                    value={editFrekuensi}
                    onChange={(e) => setEditFrekuensi(e.target.value as any)}
                    className="p-2.5 border border-[#E8DFC9] rounded-lg text-[16px] bg-white cursor-pointer"
                  >
                    <option value="harian">Harian</option>
                    <option value="mingguan">Mingguan</option>
                    <option value="bulanan">Bulanan</option>
                  </select>
                </label>
              </div>

              <Button
                variant="accent"
                size="large"
                className="mt-2"
                onClick={saveEditedOffer}
                aria-label="Terapkan Angka"
              >
                Terapkan Angka
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
        <Disclaimer extended lang={lang} />
      </footer>
    </div>
  );
};
