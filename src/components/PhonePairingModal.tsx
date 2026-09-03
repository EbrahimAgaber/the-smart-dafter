import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  AlertCircle,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Language } from '../types';

interface PhonePairingModalProps {
  lang: Language;
  onClose: () => void;
  onOpenStoreSetup?: () => void;
}

export const PhonePairingModal: React.FC<PhonePairingModalProps> = ({
  lang,
  onClose,
  onOpenStoreSetup,
}) => {
  const isRtl = lang === 'ar';

  // URLs
  const devUrl = 'https://ais-dev-nwq7exa3je54pddclvil7b-547806900389.europe-west2.run.app';
  const sharedUrl = 'https://ais-pre-nwq7exa3je54pddclvil7b-547806900389.europe-west2.run.app';

  const [selectedUrlType, setSelectedUrlType] = useState<'shared' | 'dev'>('shared');
  const activeUrl = selectedUrlType === 'shared' ? sharedUrl : devUrl;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(activeUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [activeUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <motion.div
      id="modal-phone-pairing-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <motion.div
        id="modal-phone-pairing-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 p-5 md:p-6 space-y-5 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isRtl ? 'تجربة التطبيق على هاتفك المحمول' : 'Test App on Your Mobile Phone'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl
                  ? 'امسح الرمز بكاميرا الجوال لتشغيل التطبيق مثل مستخدم حقيقي'
                  : 'Scan the QR code with your phone camera to run as a real user'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Type Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedUrlType('shared')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedUrlType === 'shared'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? 'الرابط العام (مستحسن)' : 'Public Shared URL'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedUrlType('dev')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              selectedUrlType === 'dev'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isRtl ? 'رابط المطورين (حساب Google)' : 'Dev URL (Google)'}</span>
          </button>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-slate-800 flex items-center justify-center">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code to test on phone"
                className="w-48 h-48 md:w-56 md:h-56 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
          </div>

          <div className="text-center space-y-1 max-w-sm">
            <p className="text-xs font-bold text-slate-200">
              {isRtl
                ? '1. افتح تطبيق الكاميرا على هاتفك (iPhone أو Android)'
                : '1. Open the camera app on your phone (iPhone or Android)'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? '2. وجه الكاميرا نحو الرمز واضغط على الرابط الأصفر الذي يظهر للشاشة'
                : '2. Point camera at the QR code and tap the link notification banner'}
            </p>
          </div>
        </div>

        {/* Why did page not found happen? Notice */}
        {selectedUrlType === 'shared' ? (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-amber-200/90 space-y-1">
              <span className="font-bold text-amber-300 block">
                {isRtl ? 'هام: لتفعيل الرابط بدون رسالة "Page not found"' : 'Important: To avoid "Page not found"'}
              </span>
              <span>
                {isRtl
                  ? 'اضغط على زر "Share" (مشاركة) في الزاوية العلوية اليمنى في AI Studio واضغط Publish مرة واحدة لتفعيل الرابط العام لجميع الهواتف.'
                  : 'Click the "Share" button at the top-right of AI Studio and tap Publish once to activate the shared preview for any device.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-sky-200/90 space-y-1">
              <span className="font-bold text-sky-300 block">
                {isRtl ? 'ملاحظة رابط المطور' : 'Developer URL Notice'}
              </span>
              <span>
                {isRtl
                  ? 'يعمل مباشرة بشرط أن يكون متصفح الهاتف مسجلاً بنفس بريد حساب Google الخاص بك (gaberibra48@gmail.com).'
                  : 'Works directly if your mobile browser is logged in to your Google account (gaberibra48@gmail.com).'}
              </span>
            </div>
          </div>
        )}

        {/* Link Copier & Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-hidden">
            <span className="truncate flex-1 px-2 select-all">{activeUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نسخ' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={activeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isRtl ? 'فتح في علامة تبويب جديدة' : 'Open in New Tab'}</span>
            </a>

            {onOpenStoreSetup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStoreSetup();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? 'معالج إعداد المتجر الحقيقي' : 'Setup Real Store'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
