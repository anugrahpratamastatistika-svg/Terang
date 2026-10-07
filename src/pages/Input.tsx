import React, { useState, useRef } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Disclaimer } from '../components/Disclaimer';
import { FileText, Camera, Edit3, Lightbulb, X, AlertCircle } from 'lucide-react';
import { ekstrakPenawaran, HasilEkstraksi } from '../lib/ai';
import { Penawaran } from '../lib/finance';
import { compressImage } from '../lib/image';
import { Language, translations } from '../i18n';

interface InputProps {
  onProceedToConfirm: (data: Partial<Penawaran>, unconfirmedCols: string[]) => void;
  lang: Language;
}

export const Input: React.FC<InputProps> = ({ onProceedToConfirm, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'text' | 'photo' | 'manual'>('text');
  const [textInput, setTextInput] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTab = (tab: 'text' | 'photo' | 'manual') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'manual') {
      handleManualDirect();
    }
  };

  const handleManualDirect = () => {
    onProceedToConfirm(
      {
        pokok: undefined,
        potonganDimuka: 0,
        cicilan: undefined,
        jumlahCicilan: undefined,
        frekuensi: 'harian',
        dendaPerHari: undefined,
      },
      ['pokok', 'cicilan', 'jumlahCicilan']
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1280, 0.85);
      setPhotoPreview(compressed);
      setErrorMessage(null);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReadAutomatic = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let hasil: HasilEkstraksi;

      if (activeTab === 'text') {
        if (!textInput.trim()) {
          setIsLoading(false);
          return;
        }
        hasil = await ekstrakPenawaran({ teks: textInput.trim(), lang });
      } else {
        if (!photoPreview) {
          setIsLoading(false);
          return;
        }
        const detectedMime = photoPreview.startsWith('data:image/png')
          ? 'image/png'
          : photoPreview.startsWith('data:image/webp')
          ? 'image/webp'
          : 'image/jpeg';

        hasil = await ekstrakPenawaran({
          fotoBase64: photoPreview,
          mimeType: detectedMime,
          lang,
        });
      }

      const partialData: Partial<Penawaran> = {
        pokok: typeof hasil.pokok === 'number' && hasil.pokok > 0 ? hasil.pokok : undefined,
        potonganDimuka: typeof hasil.potonganDimuka === 'number' ? hasil.potonganDimuka : 0,
        cicilan: typeof hasil.cicilan === 'number' && hasil.cicilan > 0 ? hasil.cicilan : undefined,
        jumlahCicilan: typeof hasil.jumlahCicilan === 'number' && hasil.jumlahCicilan > 0 ? hasil.jumlahCicilan : undefined,
        frekuensi: hasil.frekuensi || 'harian',
        dendaPerHari: typeof hasil.dendaPerHari === 'number' ? hasil.dendaPerHari : undefined,
      };

      const unconfirmed = hasil.kolomTidakYakin || [];

      // Periksa apakah foto berhasil mengekstrak angka utama
      const hasAnyExtractedNumber =
        typeof partialData.pokok === 'number' ||
        typeof partialData.cicilan === 'number' ||
        typeof partialData.jumlahCicilan === 'number';

      if (activeTab === 'photo' && !hasAnyExtractedNumber) {
        setErrorMessage(
          lang === 'ID'
            ? 'Angka penawaran pada foto belum terbaca jelas. Coba gunakan foto yang lebih terang/fokus, atau gunakan tab Isi Manual.'
            : 'Loan numbers could not be clearly recognized from this photo. Please try a clearer picture or enter manually.'
        );
        return;
      }

      onProceedToConfirm(partialData, unconfirmed);
    } catch (err: any) {
      console.error('Extraction error:', err);
      const friendlyMsg = err?.message && err.message.length > 5 ? err.message : t.errorAiReading;
      setErrorMessage(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isReadDisabled =
    isLoading ||
    (activeTab === 'text' && !textInput.trim()) ||
    (activeTab === 'photo' && !photoPreview);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] justify-between px-4 pt-4 pb-6">
      <div className="flex flex-col gap-4">
        {/* Title & Description */}
        <div>
          <h1 className="text-[22px] font-extrabold text-[#14213D] font-heading">
            {t.inputTitle}
          </h1>
          <p className="text-[15px] text-[#1B1B1F]/70 mt-0.5">
            {t.inputSubtitle}
          </p>
        </div>

        {/* 3 Tabs Segmented Control: Tempel Teks | Foto | Isi Manual */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#E8DFC9]/40 rounded-xl border border-[#E8DFC9]">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'text'}
            onClick={() => handleSelectTab('text')}
            className={`min-h-[48px] py-2 px-1 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 focus-visible:ring-2 focus-visible:ring-[#14213D] ${
              activeTab === 'text'
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'text-[#14213D]/70 hover:text-[#14213D] hover:bg-white/50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="text-center break-words min-w-0 leading-tight">{t.tabText}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'photo'}
            onClick={() => handleSelectTab('photo')}
            className={`min-h-[48px] py-2 px-1 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 focus-visible:ring-2 focus-visible:ring-[#14213D] ${
              activeTab === 'photo'
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'text-[#14213D]/70 hover:text-[#14213D] hover:bg-white/50'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="text-center break-words min-w-0 leading-tight">{t.tabPhoto}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            onClick={() => handleSelectTab('manual')}
            className={`min-h-[48px] py-2 px-1 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 focus-visible:ring-2 focus-visible:ring-[#14213D] ${
              activeTab === 'manual'
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'text-[#14213D]/70 hover:text-[#14213D] hover:bg-white/50'
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span className="text-center break-words min-w-0 leading-tight">{t.tabManual}</span>
          </button>
        </div>

        {/* Tab 1: Tempel Teks */}
        {activeTab === 'text' && (
          <Card className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="offer-text-input"
                className="text-sm font-bold text-[#14213D]"
              >
                {t.labelOfferText}
              </label>
              <button
                type="button"
                onClick={() =>
                  setTextInput(
                    lang === 'ID'
                      ? 'Pinjaman modal pedagang Rp 1.000.000, dipotong admin Rp 100.000 (cair bersih Rp 900.000). Bayar cicilan Rp 46.000 per hari selama 30 hari. Denda telat Rp 5.000 per hari.'
                      : 'Merchant loan Rp 1,000,000, admin fee Rp 100,000 (net received Rp 900,000). Repay Rp 46,000 daily for 30 days. Late penalty Rp 5,000 per day.'
                  )
                }
                className="min-h-[36px] px-2 text-xs font-bold text-[#FCA311] hover:underline cursor-pointer"
              >
                {t.btnFillSample}
              </button>
            </div>
            <textarea
              id="offer-text-input"
              rows={6}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.placeholderOfferText}
              className="w-full p-3.5 rounded-xl border border-[#E8DFC9] bg-[#FFF9EC]/40 text-[#1B1B1F] placeholder:text-[#1B1B1F]/40 focus:outline-none focus:ring-2 focus:ring-[#14213D]/30 text-base resize-none leading-relaxed"
            />
            <div className="flex items-center gap-1.5 text-xs text-[#1B1B1F]/60">
              <Lightbulb className="w-4 h-4 text-[#FCA311] shrink-0" />
              <span>{t.aiEducationNote}</span>
            </div>
          </Card>
        )}

        {/* Tab 2: Foto */}
        {activeTab === 'photo' && (
          <Card className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              id="photo-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!photoPreview ? (
              <div
                role="button"
                tabIndex={0}
                aria-label={t.btnPickPhoto}
                onClick={handleTriggerFileInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTriggerFileInput();
                  }
                }}
                className="border-2 border-dashed border-[#E8DFC9] hover:border-[#FCA311] bg-[#FFFDF7] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer active:scale-[0.99] transition-all text-center min-h-[190px] focus-visible:ring-2 focus-visible:ring-[#14213D] focus-visible:outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-[#FCA311]/20 flex items-center justify-center text-[#14213D]">
                  <Camera className="w-6 h-6 text-[#14213D]" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[#14213D]">
                    {t.btnPickPhoto}
                  </div>
                  <p className="text-xs text-[#1B1B1F]/60 mt-1">
                    {t.photoUploadDesc}
                  </p>
                  <p className="text-[11px] font-semibold text-[#D62839] mt-2 leading-relaxed">
                    {t.photoPrivacyWarning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative rounded-xl overflow-hidden border border-[#E8DFC9] max-h-[220px] bg-black/5 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Pratinjau Foto Penawaran"
                    className="object-contain max-h-[220px] w-full"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    aria-label="Hapus Foto"
                    className="absolute top-2 right-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#14213D]/80 text-white flex items-center justify-center hover:bg-[#14213D] shadow-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#1B1B1F]/70 px-1">
                  <span>{t.photoReady}</span>
                  <button
                    onClick={handleTriggerFileInput}
                    className="text-[#14213D] font-bold hover:underline min-h-[44px] flex items-center"
                  >
                    {t.btnChangePhoto}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Error message if extraction fails */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#D62839]/10 border border-[#D62839]/30 flex flex-col gap-2">
            <div className="flex items-start gap-2 text-sm text-[#D62839] font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={handleManualDirect}
              className="text-xs font-bold text-[#14213D] underline self-start hover:text-[#1E2E52] min-h-[44px] flex items-center"
            >
              {t.btnOpenManualNow}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Tombol Utama: Baca Otomatis */}
          <Button
            variant="primary"
            size="large"
            disabled={isReadDisabled}
            onClick={handleReadAutomatic}
            aria-label={isLoading ? t.readingOffer : t.btnReadAutomatic}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FCA311] animate-pulse" />
                <span>{t.readingOffer}</span>
              </span>
            ) : (
              <span>{t.btnReadAutomatic}</span>
            )}
          </Button>

          {/* Tombol Sekunder: Isi Manual */}
          <Button
            variant="secondary"
            size="large"
            onClick={handleManualDirect}
            aria-label={t.btnFillManual}
          >
            {t.btnFillManual}
          </Button>
        </div>
      </div>

      <footer className="mt-6 pt-2 border-t border-[#E8DFC9]/40">
        <Disclaimer lang={lang} />
      </footer>
    </div>
  );
};
