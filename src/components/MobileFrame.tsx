import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Globe, QrCode, Wifi, Battery, Signal } from 'lucide-react';
import { Language } from '../types';

interface MobileFrameProps {
  children: React.ReactNode;
  lang: Language;
  onToggleLang: () => void;
  onOpenPhonePairing?: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  lang,
  onToggleLang,
  onOpenPhonePairing,
}) => {
  const [isMobileChassis, setIsMobileChassis] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [lang]);

  return (
    <div
      id="app-mobile-root"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start p-0 md:p-6 select-none overflow-x-hidden"
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

      {/* Main Container: Either iPhone/Android Mobile Chassis or Full Responsive View */}
      <main
        id="phone-wrapper"
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#F8FAFC] shadow-2xl print:max-w-none print:h-auto print:min-h-0 print:border-none print:shadow-none print:rounded-none print:bg-white print:m-0 print:p-0 ${
          isMobileChassis
            ? 'max-w-[440px] md:min-h-[860px] md:h-[92vh] md:rounded-[48px] md:border-[12px] md:border-black md:ring-1 md:ring-slate-300 overflow-hidden shadow-slate-300/50'
            : 'max-w-3xl min-h-screen md:rounded-3xl md:border md:border-slate-200 overflow-hidden shadow-slate-200/50'
        }`}
      >
        {/* Status Bar for Mobile Feel */}
        <div
          id="mobile-status-bar"
          className="no-print w-full bg-[#F8FAFC]/95 backdrop-blur z-30 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold text-slate-800"
        >
          <span className="tracking-wider w-12 text-center">{currentTime}</span>

          {/* Dynamic Island / Speaker Pill (in chassis mode) */}
          {isMobileChassis && (
            <div
              id="dynamic-island"
              className="hidden md:flex items-center justify-center h-7 w-28 bg-black rounded-full border border-black px-2 shadow-sm"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 me-3" />
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 blur-[1px]" />
            </div>
          )}

          {/* Mobile status icons: Network, Wifi, Battery */}
          <div className="flex items-center gap-1.5 text-slate-800 justify-end w-16">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Mobile View Content Area */}
        <div
          id="mobile-content-area"
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative pb-20 print:pb-0 scroll-smooth bg-[#F8FAFC] print:bg-white"
        >
          {children}
        </div>
      </main>
    </div>
  );
};
