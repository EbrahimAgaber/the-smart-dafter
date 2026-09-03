import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Globe, QrCode } from 'lucide-react';
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
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 md:p-4 select-none overflow-x-hidden font-sans"
      style={{
        fontFamily: lang === 'ar' ? 'var(--font-cairo), system-ui' : 'var(--font-tajawal), system-ui',
      }}
    >
      {/* Top Device & Language Floating Control Strip */}
      <header
        id="top-control-bar"
        className="w-full max-w-lg mb-2 px-4 py-2 hidden md:flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">
            {lang === 'ar' ? 'الدفتر الذكي' : 'Daftar Smart'}
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
            BETA v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPhonePairing && (
            <button
              id="btn-open-phone-pairing"
              onClick={onOpenPhonePairing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 transition-colors border border-sky-500/30 shadow-xs"
              title={lang === 'ar' ? 'تجربة على الهاتف المحمول (QR)' : 'Test on Phone (QR)'}
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold">{lang === 'ar' ? 'جرب على هاتفك' : 'Test on Phone'}</span>
            </button>
          )}

          <button
            id="btn-toggle-lang"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60 shadow-xs"
            title={lang === 'ar' ? 'تغيير اللغة' : 'Switch Language'}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            id="btn-toggle-chassis"
            onClick={() => setIsMobileChassis(!isMobileChassis)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60 shadow-xs"
            title={isMobileChassis ? 'توسيع الشاشة' : 'وضع إطار الجوال'}
          >
            {isMobileChassis ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'ar' ? 'ملء الشاشة' : 'Full Screen'}</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'ar' ? 'إطار الجوال' : 'Phone Frame'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: Either iPhone/Android Mobile Chassis or Full Responsive View */}
      <main
        id="phone-wrapper"
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-900 shadow-2xl ${
          isMobileChassis
            ? 'max-w-[440px] md:min-h-[860px] md:h-[92vh] md:rounded-[44px] md:border-[10px] md:border-slate-800 md:ring-1 md:ring-slate-700/50 overflow-hidden'
            : 'max-w-3xl min-h-screen md:rounded-2xl md:border md:border-slate-800 overflow-hidden'
        }`}
      >
        {/* Status Bar for Mobile Feel */}
        <div
          id="mobile-status-bar"
          className="w-full bg-slate-900/95 backdrop-blur z-30 px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/50 select-none"
        >
          <span className="tracking-wider">{currentTime}</span>

          {/* Dynamic Island / Speaker Pill (in chassis mode) */}
          {isMobileChassis && (
            <div
              id="dynamic-island"
              className="hidden md:flex items-center justify-center h-5 w-24 bg-slate-950 rounded-full border border-slate-800/80 px-2"
            >
              <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800 me-2" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          )}

          {/* Mobile status icons: Network, Wifi, Battery */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 13c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
            <span className="text-[10px] font-bold text-emerald-400">5G</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
              <div className="h-full w-4/5 bg-emerald-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Mobile View Content Area */}
        <div
          id="mobile-content-area"
          className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative pb-20 scroll-smooth bg-slate-950"
        >
          {children}
        </div>
      </main>
    </div>
  );
};
