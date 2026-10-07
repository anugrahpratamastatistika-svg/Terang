import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Terang application:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9EC] text-[#14213D] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-[#E8DFC9] shadow-lg flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#D62839]/10 flex items-center justify-center text-[#D62839]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-extrabold font-heading text-[#14213D]">
              Terjadi Kendala Teknis
            </h1>

            <p className="text-sm text-[#1B1B1F]/75 leading-relaxed">
              Aplikasi Terang tetap menjaga data Anda dengan aman. Silakan muat ulang halaman untuk melanjutkan.
            </p>

            <button
              onClick={this.handleReload}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#14213D] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#1E2E52] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
