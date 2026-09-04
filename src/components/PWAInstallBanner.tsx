import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallBannerProps {
  lang: Language;
  onOpenPhonePairing: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  lang,
  onOpenPhonePairing,
}) => {
  const isRtl = lang === 'ar';
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Mobile top pill or banner */}
      <div className="no-print w-full bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-500/30 px-3 py-2 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1 rounded-lg bg-sky-500/30 text-sky-300 shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <span className="truncate text-xs text-slate-100 font-medium">
            {isRtl
              ? 'تطبيق الدفتر الذكي: جاهز للتثبيت كبرنامج جوال أصلي'
              : 'Daftar Smart: Ready to install as a native mobile app'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Android / Chromium direct install */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>{isRtl ? 'تثبيت' : 'Install'}</span>
            </button>
          )}

          {/* iOS Safari Guide */}
          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>{isRtl ? 'تثبيت على iPhone' : 'Install on iPhone'}</span>
            </button>
          )}

          {/* If on desktop or general browser, offer scan QR */}
          {!isMobile && (
            <button
              onClick={onOpenPhonePairing}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Smartphone className="w-3 h-3 text-sky-400" />
              <span>{isRtl ? 'مسح للجوال (QR)' : 'Pair Phone'}</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label={isRtl ? 'إغلاق الإشعار' : 'Dismiss banner'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-600" />
                <span>{isRtl ? 'تثبيت التطبيق على iPhone / iPad' : 'Install on iPhone / iPad'}</span>
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-600 mt-0.5">
                  <Share className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isRtl ? '1. اضغط على زر المشاركة (Share)' : '1. Tap the Share button'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isRtl
                      ? 'موجود في الشريط السفلي في متصفح Safari (المربع الذي يحتوي على سهم للأعلى)'
                      : 'Located at the bottom toolbar of Safari (box with upward arrow)'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-green-600 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isRtl ? '2. اختر "إضافة إلى الشاشة الرئيسية"' : '2. Select "Add to Home Screen"'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isRtl
                      ? 'مرر للأسفل في قائمة المشاركة واضغط "Add to Home Screen"'
                      : 'Scroll down the share sheet and tap "Add to Home Screen"'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isRtl ? '3. اضغط "إضافة" (Add)' : '3. Tap "Add"'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isRtl
                      ? 'سيظهر التطبيق بأيقونته الرسمية على شاشة هاتفك ويعمل بدون إنترنت!'
                      : 'The app icon appears on your home screen and works offline!'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors"
            >
              {isRtl ? 'حسناً، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
