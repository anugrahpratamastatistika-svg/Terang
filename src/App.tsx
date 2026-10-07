import React, { useState } from 'react';
import { Header } from './components/Header';
import { AboutModal } from './components/AboutModal';
import { NavDrawer } from './components/NavDrawer';
import { IntroScreen } from './components/IntroScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Input } from './pages/Input';
import { Confirm } from './pages/Confirm';
import { Reveal } from './pages/Reveal';
import { Late } from './pages/Late';
import { Compare } from './pages/Compare';
import { History } from './pages/History';
import {
  Penawaran,
  hitungSemua,
} from './lib/finance';
import { simpanCek, ItemRiwayat, CONTOH_PENAWARAN } from './lib/storage';
import { Language, translations } from './i18n';

export type ScreenType = 'home' | 'input' | 'confirm' | 'reveal' | 'late' | 'compare' | 'history';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [lang, setLang] = useState<Language>('ID');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Data penawaran yang sedang dihitung
  const [currentPenawaran, setCurrentPenawaran] = useState<Partial<Penawaran>>(CONTOH_PENAWARAN);
  const [kolomTidakYakin, setKolomTidakYakin] = useState<string[]>([]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'));
  };

  const handleStartCheck = () => {
    setCurrentScreen('input');
  };

  const handleViewSample = () => {
    setCurrentPenawaran(CONTOH_PENAWARAN);
    setKolomTidakYakin([]);
    setCurrentScreen('confirm');
  };

  const handleViewHistory = () => {
    setCurrentScreen('history');
  };

  const handleInputExtracted = (data: Partial<Penawaran>, unconfirmed: string[]) => {
    setCurrentPenawaran(data);
    setKolomTidakYakin(unconfirmed);
    setCurrentScreen('confirm');
  };

  const handleConfirmData = (confirmed: Penawaran) => {
    setCurrentPenawaran(confirmed);
    try {
      const hasil = hitungSemua(confirmed);
      simpanCek(confirmed, hasil);
    } catch {
      // Jika angka tidak valid, Reveal akan menampilkan kartu error ramah
    }
    setCurrentScreen('reveal');
  };

  const handleSelectHistoryRecord = (record: ItemRiwayat) => {
    setCurrentPenawaran({
      pokok: record.penawaran.pokok,
      potonganDimuka: record.penawaran.potonganDimuka,
      cicilan: record.penawaran.cicilan,
      jumlahCicilan: record.penawaran.jumlahCicilan,
      frekuensi: record.penawaran.frekuensi,
      dendaPerHari: record.penawaran.dendaPerHari,
      jenisPinjaman: record.penawaran.jenisPinjaman || 'produktif',
    });
    setCurrentScreen('reveal');
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'input':
      case 'history':
        setCurrentScreen('home');
        break;
      case 'confirm':
        setCurrentScreen('input');
        break;
      case 'reveal':
        setCurrentScreen('confirm');
        break;
      case 'late':
      case 'compare':
        setCurrentScreen('reveal');
        break;
      default:
        setCurrentScreen('home');
    }
  };

  const getAudioTitle = (): string => {
    const t = translations[lang];
    if (lang === 'ID') {
      switch (currentScreen) {
        case 'home':
          return 'Terang. Ditawari pinjaman? Cek dulu sebelum tanda tangan. Tempel penawarannya, kami hitung biaya sebenarnya.';
        case 'input':
          return 'Masukkan Penawaran Pinjaman. Pilih Tempel Teks, Foto, atau Isi Manual.';
        case 'confirm':
          return 'Apakah angkanya benar? Kami membaca otomatis. Mohon dicek dulu.';
        case 'reveal': {
          try {
            const h = hitungSemua(currentPenawaran as Penawaran);
            return `Hasil Pembongkaran. Uang lebih yang harus Anda kembalikan adalah ${h.biayaTotal} rupiah.`;
          } catch {
            return 'Hasil Pembongkaran.';
          }
        }
        case 'late':
          return 'Simulasi risiko jika telat bayar.';
        case 'compare':
          return 'Perbandingan biaya dengan pinjaman lain.';
        case 'history':
          return 'Riwayat penawaran pinjaman Anda.';
      }
    } else {
      switch (currentScreen) {
        case 'home':
          return 'Terang. Offered a loan? Check first before signing. Paste the offer, we calculate the real cost.';
        case 'input':
          return 'Enter your loan offer by pasting text, uploading a photo, or manual entry.';
        case 'confirm':
          return 'Are these numbers correct? Extracted automatically, please review.';
        case 'reveal': {
          try {
            const h = hitungSemua(currentPenawaran as Penawaran);
            return `True cost breakdown. Extra money to repay is ${h.biayaTotal} rupiah.`;
          } catch {
            return 'True cost breakdown.';
          }
        }
        case 'late':
          return 'Late payment simulation and penalty risk.';
        case 'compare':
          return 'Side-by-side offer comparison.';
        case 'history':
          return 'Your saved loan calculation history.';
      }
    }
    return t.appName;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F4EFE6] flex justify-center selection:bg-[#FCA311]/30 text-[#1B1B1F]">
        <div className="w-full max-w-[480px] min-h-screen bg-[#FFF9EC] shadow-[0_0_30px_rgba(20,33,61,0.08)] flex flex-col border-x border-[#E8DFC9] relative overflow-hidden">
          {/* Header Aplikasi dengan tombol menu garis 3 */}
          <Header
            currentScreen={currentScreen}
            onBack={handleBack}
            titleForAudio={getAudioTitle()}
            lang={lang}
            onToggleLang={handleToggleLang}
            onOpenMenu={() => setIsNavDrawerOpen(true)}
          />

          {/* Tampilan Layar Aktif */}
          <main className="flex-1 flex flex-col">
            {currentScreen === 'home' && (
              <Home
                onStartCheck={handleStartCheck}
                onViewSample={handleViewSample}
                onViewHistory={handleViewHistory}
                lang={lang}
              />
            )}

            {currentScreen === 'input' && (
              <Input
                onProceedToConfirm={handleInputExtracted}
                lang={lang}
              />
            )}

            {currentScreen === 'confirm' && (
              <Confirm
                initialData={currentPenawaran}
                kolomTidakYakin={kolomTidakYakin}
                onConfirm={handleConfirmData}
                onBack={() => setCurrentScreen('input')}
                lang={lang}
              />
            )}

            {currentScreen === 'reveal' && (
              <Reveal
                penawaran={
                  (currentPenawaran.pokok && currentPenawaran.cicilan
                    ? currentPenawaran
                    : CONTOH_PENAWARAN) as Penawaran
                }
                onGoToLate={() => setCurrentScreen('late')}
                onGoToCompare={() => setCurrentScreen('compare')}
                onNewCheck={() => {
                  setCurrentPenawaran({});
                  setKolomTidakYakin([]);
                  setCurrentScreen('input');
                }}
                onBackToConfirm={() => setCurrentScreen('confirm')}
                lang={lang}
              />
            )}

            {currentScreen === 'late' && (
              <Late
                penawaran={
                  (currentPenawaran.pokok && currentPenawaran.cicilan
                    ? currentPenawaran
                    : CONTOH_PENAWARAN) as Penawaran
                }
                onBackToReveal={() => setCurrentScreen('reveal')}
                lang={lang}
              />
            )}

            {currentScreen === 'compare' && (
              <Compare
                penawaran={
                  (currentPenawaran.pokok && currentPenawaran.cicilan
                    ? currentPenawaran
                    : CONTOH_PENAWARAN) as Penawaran
                }
                onBackToReveal={() => setCurrentScreen('reveal')}
                onBackToConfirm={() => setCurrentScreen('confirm')}
                lang={lang}
              />
            )}

            {currentScreen === 'history' && (
              <History
                onOpenRecord={(selectedPenawaran) => {
                  setCurrentPenawaran(selectedPenawaran);
                  setCurrentScreen('reveal');
                }}
                onCompareRecord={(selectedPenawaran) => {
                  setCurrentPenawaran(selectedPenawaran);
                  setCurrentScreen('compare');
                }}
                onBackToHome={() => setCurrentScreen('home')}
                lang={lang}
              />
            )}
          </main>

          {/* Menu Drawer Garis 3 */}
          <NavDrawer
            isOpen={isNavDrawerOpen}
            onClose={() => setIsNavDrawerOpen(false)}
            onCheckOffer={handleStartCheck}
            onViewSample={handleViewSample}
            onViewHistory={handleViewHistory}
            onOpenAbout={() => setIsAboutOpen(true)}
            lang={lang}
          />

          {/* Modal Tentang Terang */}
          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
            lang={lang}
          />

          {/* Animasi Intro / Splash Screen Pembuka */}
          {showIntro && <IntroScreen onFinish={() => setShowIntro(false)} />}
        </div>
      </div>
    </ErrorBoundary>
  );
}
