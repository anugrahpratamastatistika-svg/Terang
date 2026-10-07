import React, { useState } from 'react';
import { ArrowLeft, Lightbulb, Volume2, VolumeX, Menu } from 'lucide-react';
import { speakText, stopSpeaking } from '../lib/ai';
import { Language, translations } from '../i18n';

interface HeaderProps {
  currentScreen: string;
  onBack?: () => void;
  titleForAudio?: string;
  lang: Language;
  onToggleLang: () => void;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onBack,
  titleForAudio = 'Terang. Sebelum tanda tangan, tempel penawarannya di sini.',
  lang,
  onToggleLang,
  onOpenMenu,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const t = translations[lang];

  const handleAudioClick = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToRead = titleForAudio;
      const ok = speakText(textToRead, lang, () => {
        setIsSpeaking(false);
      });
      if (!ok) {
        setIsSpeaking(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFF9EC]/95 backdrop-blur-sm border-b border-[#E8DFC9]/70 px-2 sm:px-3 h-16 flex items-center justify-between">
      {/* Sisi Kiri: Garis 3 (Menu), Tombol Kembali (jika ada), Logo Terang & Teks */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Tombol Garis 3 */}
        <button
          onClick={onOpenMenu}
          aria-label="Buka menu navigasi"
          title="Menu"
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[#14213D] hover:bg-[#14213D]/10 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#14213D] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tombol Kembali (jika di sub-halaman) */}
        {currentScreen !== 'home' && onBack && (
          <button
            onClick={() => {
              stopSpeaking();
              setIsSpeaking(false);
              onBack();
            }}
            aria-label={t.back}
            title={t.back}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#14213D] hover:bg-[#14213D]/10 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#14213D] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Logo & Judul Terang */}
        <div className="flex items-center gap-2 select-none pl-0.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#FCA311]/20 flex items-center justify-center text-[#FCA311] shadow-[0_0_12px_rgba(252,163,17,0.35)] shrink-0">
            <Lightbulb className="w-5 h-5 fill-[#FCA311] text-[#14213D]" />
          </div>
          <span className="font-heading font-extrabold text-[20px] tracking-tight text-[#14213D] leading-tight truncate">
            Terang
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Audio & Pilihan Bahasa */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleAudioClick}
          aria-label={isSpeaking ? t.stopAudio : t.listen}
          title={isSpeaking ? t.stopAudio : t.listen}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-[#14213D] cursor-pointer ${
            isSpeaking
              ? 'bg-[#FCA311] text-[#14213D] animate-pulse ring-2 ring-[#FCA311]/50'
              : 'text-[#14213D] hover:bg-[#14213D]/10 active:scale-95'
          }`}
        >
          {isSpeaking ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onToggleLang}
          aria-label={lang === 'ID' ? 'Ganti ke Bahasa Inggris' : 'Switch to Indonesian'}
          className="h-11 min-h-[44px] px-2.5 flex items-center justify-center rounded-xl text-xs font-bold tracking-wide text-[#14213D] hover:bg-[#14213D]/10 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-[#14213D] cursor-pointer"
        >
          <span className={lang === 'ID' ? 'text-[#14213D] font-extrabold underline decoration-2' : 'text-[#1B1B1F]/50'}>
            ID
          </span>
          <span className="mx-1 text-[#1B1B1F]/30">/</span>
          <span className={lang === 'EN' ? 'text-[#14213D] font-extrabold underline decoration-2' : 'text-[#1B1B1F]/50'}>
            EN
          </span>
        </button>
      </div>
    </header>
  );
};
