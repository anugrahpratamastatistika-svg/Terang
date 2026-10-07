import React, { useEffect } from 'react';
import { X, FileText, Eye, History, Info, Lightbulb, ChevronRight } from 'lucide-react';
import { Language, translations } from '../i18n';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckOffer: () => void;
  onViewSample: () => void;
  onViewHistory: () => void;
  onOpenAbout: () => void;
  lang: Language;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  onCheckOffer,
  onViewSample,
  onViewHistory,
  onOpenAbout,
  lang,
}) => {
  const t = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'check',
      label: t.btnCheckOffer,
      desc: lang === 'ID' ? 'Bongkar biaya penawaran baru' : 'Analyze new loan offer',
      icon: FileText,
      action: () => {
        onClose();
        onCheckOffer();
      },
    },
    {
      id: 'sample',
      label: t.btnViewSample,
      desc: lang === 'ID' ? 'Simulasi pinjaman pasar standar' : 'Standard market loan simulation',
      icon: Eye,
      action: () => {
        onClose();
        onViewSample();
      },
    },
    {
      id: 'history',
      label: t.history,
      desc: lang === 'ID' ? 'Daftar perhitungan tersimpan' : 'Your saved calculations',
      icon: History,
      action: () => {
        onClose();
        onViewHistory();
      },
    },
    {
      id: 'about',
      label: t.about,
      desc: lang === 'ID' ? 'Prinsip, privasi, & aturan OJK' : 'Principles, privacy & OJK rules',
      icon: Info,
      action: () => {
        onClose();
        onOpenAbout();
      },
    },
  ];

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden">
      {/* Backdrop terbatas di dalam bingkai aplikasi */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#14213D]/60 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-[82%] max-w-[320px] h-full bg-[#FFFDF7] shadow-2xl flex flex-col justify-between border-r border-[#E8DFC9] z-10 animate-in slide-in-from-left duration-300">
        <div>
          {/* Header Drawer */}
          <div className="p-4 bg-[#FFF9EC] border-b border-[#E8DFC9]/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FCA311]/25 flex items-center justify-center text-[#FCA311] shadow-[0_0_12px_rgba(252,163,17,0.3)]">
                <Lightbulb className="w-5 h-5 fill-[#FCA311] text-[#14213D]" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-[20px] text-[#14213D] leading-tight">
                  Terang
                </span>
                <span className="text-[11px] text-[#1B1B1F]/60 font-medium">
                  {lang === 'ID' ? 'Kalkulator Transparansi' : 'Transparency Calculator'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup menu"
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#14213D] hover:bg-[#14213D]/10 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigasi 4 Pilihan Utama */}
          <nav className="p-3 flex flex-col gap-1.5" aria-label="Menu Navigasi">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full min-h-[56px] px-3.5 py-3 rounded-2xl flex items-center justify-between gap-3 text-left hover:bg-[#FFF4DC] active:bg-[#FFE8B8] transition-all group border border-transparent hover:border-[#E8DFC9]/80 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#14213D]/5 group-hover:bg-[#14213D] group-hover:text-white text-[#14213D] flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[15px] font-bold text-[#14213D] leading-snug">
                        {item.label}
                      </span>
                      <span className="text-[12px] text-[#1B1B1F]/65 truncate">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#14213D]/30 group-hover:text-[#14213D] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Drawer */}
        <div className="p-4 border-t border-[#E8DFC9]/70 bg-[#FFF9EC]/60 flex flex-col gap-1 text-[11px] text-[#1B1B1F]/65">
          <p className="font-semibold text-[#14213D]">
            Terang Kalkulator Transparansi Pinjaman
          </p>
          <p>
            {lang === 'ID'
              ? 'Tanpa login • Data hanya tersimpan di perangkat ini'
              : 'No login required • Stored on this device only'}
          </p>
        </div>
      </div>
    </div>
  );
};
