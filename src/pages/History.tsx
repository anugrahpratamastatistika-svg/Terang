import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import {
  History as HistoryIcon,
  Trash2,
  Lightbulb,
  ExternalLink,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Check,
} from 'lucide-react';
import { daftarCek, hapusCek, hapusSemua, ItemRiwayat } from '../lib/storage';
import { formatRupiah } from '../lib/format';
import { RISK_CONFIG, tentukanRisiko, hitungBiayaPerHari, ambangOjk } from '../config/benchmarks';
import { Penawaran } from '../lib/finance';
import { Language, translations } from '../i18n';

interface HistoryProps {
  onOpenRecord: (penawaran: Penawaran) => void;
  onCompareRecord: (penawaran: Penawaran) => void;
  onBackToHome: () => void;
  lang: Language;
}

export const History: React.FC<HistoryProps> = ({
  onOpenRecord,
  onCompareRecord,
  onBackToHome,
  lang,
}) => {
  const t = translations[lang];
  const [records, setRecords] = useState<ItemRiwayat[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const loadRecords = () => {
    try {
      const items = daftarCek();
      setRecords(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error loading history:', err);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadRecords();
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Menghapus langsung item dari storage dan memperbarui state agar daftar segera ter-update
  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      hapusCek(id);
      const updated = daftarCek();
      setRecords([...updated]);
      showToast(lang === 'ID' ? 'Catatan berhasil dihapus' : 'Record successfully deleted');
    } catch (err) {
      console.error('Gagal menghapus catatan:', err);
    }
  };

  // Menghapus seluruh riwayat dari storage dan mengosongkan state seketika
  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      hapusSemua();
      setRecords([]);
      showToast(lang === 'ID' ? 'Semua riwayat berhasil dibersihkan' : 'All history records cleared');
    } catch (err) {
      console.error('Gagal mengosongkan riwayat:', err);
    }
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp || typeof timestamp !== 'number' || isNaN(timestamp)) {
      return '-';
    }
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(lang === 'EN' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-8">
      {/* Toast Feedback */}
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

      <div className="flex flex-col gap-4">
        {/* Header Title */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#14213D] font-heading">
              {t.historyTitle}
            </h1>
            <p className="text-[14px] text-[#1B1B1F]/70 mt-0.5">
              {t.historySubtitle}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#FCA311]/20 flex items-center justify-center text-[#FCA311]">
            <HistoryIcon className="w-5 h-5 text-[#14213D]" />
          </div>
        </div>

        {/* Empty State atau Aman jika Data Kosong / Rusak */}
        {!records || records.length === 0 ? (
          <Card className="text-center py-12 px-6 flex flex-col items-center justify-center gap-3 bg-[#FFFDF7]">
            <div className="w-16 h-16 rounded-full bg-[#FCA311]/20 flex items-center justify-center text-[#FCA311] shadow-[0_0_20px_rgba(252,163,17,0.35)]">
              <Lightbulb className="w-9 h-9 fill-[#FCA311] text-[#14213D]" />
            </div>

            <div className="text-base font-extrabold text-[#14213D] font-heading mt-1">
              {t.historyEmptyTitle}
            </div>

            <p className="text-xs text-[#1B1B1F]/65 max-w-xs leading-relaxed">
              {t.historyEmptyDesc}
            </p>

            <Button
              variant="primary"
              size="normal"
              onClick={onBackToHome}
              aria-label={t.btnCheckOfferNow}
              className="mt-2"
            >
              {t.btnCheckOfferNow}
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map((item, idx) => {
              if (!item || typeof item !== 'object') return null;

              // Fallback aman untuk setiap nilai agar tidak memicu TypeError layar putih
              const pokok = item.penawaran?.pokok || 0;
              const potonganDimuka = item.penawaran?.potonganDimuka || 0;
              const cicilan = item.penawaran?.cicilan || 0;
              const jumlahCicilan = item.penawaran?.jumlahCicilan || 1;
              const frekuensi = item.penawaran?.frekuensi || 'harian';
              const dendaPerHari = item.penawaran?.dendaPerHari || 0;

              const diterima = item.hasil?.diterima ?? Math.max(0, pokok - potonganDimuka);
              const totalBayar = item.hasil?.totalBayar ?? (cicilan * jumlahCicilan);
              const biayaTotal = item.hasil?.biayaTotal ?? Math.max(0, totalBayar - diterima);
              const durasiHari = item.hasil?.durasiHari || (frekuensi === 'harian' ? jumlahCicilan : frekuensi === 'mingguan' ? jumlahCicilan * 7 : jumlahCicilan * 30);

              const biayaPerHari = hitungBiayaPerHari(biayaTotal, pokok, durasiHari);
              const ambang = ambangOjk(item.penawaran?.jenisPinjaman ?? 'produktif', pokok, durasiHari);
              const riskLvl = tentukanRisiko(biayaPerHari, ambang.batas);
              const riskInfo = RISK_CONFIG[riskLvl] || RISK_CONFIG.AMAN;

              const RiskIcon = {
                AMAN: CheckCircle2,
                WASPADA: AlertTriangle,
                BAHAYA: XCircle,
              }[riskLvl] || CheckCircle2;

              const itemPenawaran: Penawaran = {
                pokok,
                potonganDimuka,
                cicilan,
                jumlahCicilan,
                frekuensi,
                dendaPerHari,
                jenisPinjaman: item.penawaran?.jenisPinjaman ?? 'produktif',
              };

              const itemId = item.id || `rec_${idx}`;

              return (
                <Card
                  key={itemId}
                  className="p-4 flex flex-col gap-2.5 hover:border-[#14213D]/40 transition-all shadow-sm"
                >
                  {/* Top Bar: Date & Risk Badge */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#1B1B1F]/60 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.waktu)}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${riskInfo.badgeBg} ${riskInfo.badgeBorder} ${riskInfo.badgeText}`}
                    >
                      <RiskIcon className="w-3 h-3" />
                      <span>{riskInfo.label}</span>
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-baseline pt-1 border-t border-[#E8DFC9]/60">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase font-bold text-[#1B1B1F]/60">
                        {t.tableReceived}
                      </span>
                      <span className="text-[17px] font-extrabold text-[#2E9E6B] num-tabular font-heading">
                        {formatRupiah(diterima)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[11px] uppercase font-bold text-[#1B1B1F]/60">
                        {t.tableTotalRepaid}
                      </span>
                      <span className="text-[17px] font-extrabold text-[#14213D] num-tabular font-heading">
                        {formatRupiah(totalBayar)}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle details */}
                  <div className="text-xs text-[#1B1B1F]/70">
                    {formatRupiah(cicilan)} ({jumlahCicilan}x {frekuensi}) · {t.youPayExtra}{' '}
                    <strong className="text-[#D62839] num-tabular">+{formatRupiah(biayaTotal)}</strong>
                  </div>

                  {/* Action Buttons per item with min 48px touch area */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E8DFC9]/60">
                    <button
                      type="button"
                      onClick={() => onOpenRecord(itemPenawaran)}
                      aria-label={`${t.btnOpen} ${formatRupiah(pokok)}`}
                      className="min-h-[48px] px-2 rounded-xl bg-[#14213D] text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#1E2E52] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.btnOpen}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCompareRecord(itemPenawaran)}
                      aria-label={`${t.btnCompare} ${formatRupiah(pokok)}`}
                      className="min-h-[48px] px-2 rounded-xl bg-white border border-[#E8DFC9] text-[#14213D] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#FFF9EC] active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#14213D]"
                    >
                      <Scale className="w-3.5 h-3.5 text-[#FCA311]" />
                      <span>{t.btnCompare}</span>
                    </button>

                    {/* Tombol Hapus: langsung mengeksekusi hapusCek dan memperbarui state */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(e, itemId)}
                      aria-label={`${t.btnDelete} ${formatRupiah(pokok)}`}
                      className="min-h-[48px] px-2 rounded-xl bg-white border border-[#D62839]/30 text-[#D62839] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#D62839]/10 active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D62839]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.btnDelete}</span>
                    </button>
                  </div>
                </Card>
              );
            })}

            {/* Bottom Clear All Data Button (min 48px touch area) */}
            <div className="pt-2 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearAll}
                aria-label={t.btnClearAll}
                className="min-h-[48px] px-5 rounded-xl text-xs font-bold text-[#D62839] hover:bg-[#D62839]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D62839]"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.btnClearAll}</span>
              </button>
              <span className="text-[11px] text-[#1B1B1F]/50">
                {t.historySubtitle}
              </span>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="pt-2">
          <Button
            variant="secondary"
            size="large"
            onClick={onBackToHome}
            aria-label={t.back}
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
