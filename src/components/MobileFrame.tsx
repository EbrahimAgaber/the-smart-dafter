import React, { useState } from 'react';
import { Smartphone, Monitor, Globe, QrCode } from 'lucide-react';
import { Language } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
  lang: Language;
  onToggleLang: () => void;
  onOpenPhonePairing?: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  bottomBar,
  lang,
  onToggleLang,
  onOpenPhonePairing,
}) => {
  const [isMobileChassis, setIsMobileChassis] = useState(true);

  return (
    <div
      id="app-mobile-root"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen min-h-[100dvh] bg-[#F8FAFC] md:bg-slate-100 text-slate-900 flex flex-col items-center justify-start p-0 md:p-6 select-none overflow-x-hidden"
      style={{
        fontFamily: lang === 'ar' ? 'var(--font-cairo), system-ui' : 'var(--font-inter), system-ui',
      }}
    >
      {/* Top Device & Language Floating Control Strip */}
      <header
        id="top-control-bar"
        className="no-print w-full max-w-lg mb-4 px-5 py-2.5 hidden md:flex items-center justify-between text-xs text-slate-600 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-semibold text-slate-800">
            {lang === 'ar' ? 'الدفتر الذكي' : 'Daftar Smart'}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
            BETA v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPhonePairing && (
            <button
              id="btn-open-phone-pairing"
              onClick={onOpenPhonePairing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 transition-colors border border-cyan-200/50"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="font-bold">{lang === 'ar' ? 'اختبار على الهاتف' : 'Test on Phone'}</span>
            </button>
          )}

          <button
            id="btn-toggle-lang"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            id="btn-toggle-chassis"
            onClick={() => setIsMobileChassis(!isMobileChassis)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200"
          >
            {isMobileChassis ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'}</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إطار الهاتف' : 'Phone Frame'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: Native full-screen on mobile, chassis or expanded view on desktop */}
      <main
        id="phone-wrapper"
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#F8FAFC] shadow-2xl print:max-w-none print:h-auto print:min-h-0 print:border-none print:shadow-none print:rounded-none print:bg-white print:m-0 print:p-0 ${
          isMobileChassis
            ? 'h-[100dvh] md:h-[92vh] md:min-h-[860px] max-w-full md:max-w-[440px] md:rounded-[48px] md:border-[12px] md:border-black md:ring-1 md:ring-slate-300 overflow-hidden shadow-slate-300/50'
            : 'h-[100dvh] md:min-h-screen md:h-auto max-w-full md:max-w-3xl md:rounded-3xl md:border md:border-slate-200 overflow-hidden shadow-slate-200/50'
        }`}
      >
        {/* Scrollable Mobile View Content Area */}
        <div
          id="mobile-content-area"
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative pt-[env(safe-area-inset-top,0.5rem)] md:pt-2 pb-6 print:pt-0 print:pb-0 scroll-smooth bg-[#F8FAFC] print:bg-white"
        >
          {children}
        </div>

        {/* Permanently Pinned Bottom Navigation Bar */}
        {bottomBar && (
          <div id="mobile-bottom-bar-wrapper" className="shrink-0 w-full z-30">
            {bottomBar}
          </div>
        )}
      </main>
    </div>
  );
};
