import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  ShieldAlert,
  Lock,
  Globe,
  MessageSquare,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Language, BusinessProfile } from '../types';
import {
  activateLicenseKey,
  getLicenseStatus,
  LicenseStatus,
} from '../utils/licenseManager';
import { playSuccessChime } from '../utils/speechFeedback';

interface ActivationGateViewProps {
  lang: Language;
  profile?: BusinessProfile;
  onToggleLang: () => void;
  onActivated: (status: LicenseStatus) => void;
  onOpenOwnerKeyGen: () => void;
}

export const ActivationGateView: React.FC<ActivationGateViewProps> = ({
  lang,
  profile,
  onToggleLang,
  onActivated,
  onOpenOwnerKeyGen,
}) => {
  const isRtl = lang === 'ar';
  const [currentStatus, setCurrentStatus] = useState<LicenseStatus>(() => getLicenseStatus());
  const [inputKey, setInputKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRequest, setCopiedRequest] = useState(false);

  // Hidden 5-tap owner access state
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  const handleOwnerTap = () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    const nextCount = tapCount + 1;
    if (nextCount >= 5) {
      setTapCount(0);
      onOpenOwnerKeyGen();
    } else {
      setTapCount(nextCount);
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 3000);
    }
  };

  const handlePasteKey = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputKey(text.trim().toUpperCase());
          setErrorMessage('');
        }
      }
    } catch {
      // Clipboard access not granted or unavailable
    }
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanKey = inputKey.trim().toUpperCase();
    if (!cleanKey) {
      setErrorMessage(
        isRtl
          ? 'يرجى إدخال مفتاح التفعيل للمتابعة'
          : 'Please enter the activation key to continue'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const clientTag = profile?.name || '';
      const result = activateLicenseKey(cleanKey, clientTag);

      if (result.success && result.status) {
        playSuccessChime();
        setCurrentStatus(result.status);
        setSuccessMessage(isRtl ? result.messageAr : result.messageEn);
        setTimeout(() => {
          onActivated(result.status!);
        }, 800);
      } else {
        setErrorMessage(
          isRtl
            ? result.messageAr || 'مفتاح التفعيل غير صحيح أو منتهي الصلاحية'
            : result.messageEn || 'Invalid or expired activation key'
        );
      }
    } catch {
      setErrorMessage(
        isRtl ? 'حدث خطأ أثناء معالجة المفتاح' : 'An error occurred while validating key'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContactMessage = () => {
    const storeName = profile?.name ? `اسم المتجر: ${profile.name}` : '';
    const phone = profile?.phone ? `الهاتف: ${profile.phone}` : '';
    const details = [storeName, phone].filter(Boolean).join('\n');
    return isRtl
      ? `السلام عليكم ورحمة الله وبركاته\nأود الحصول على كود تفعيل لتطبيق "الدفتر الذكي".\n${details ? details + '\n' : ''}يرجى تزويدي بمفتاح الترخيص الخاص بي.`
      : `Hello,\nI would like to obtain an activation key for "The Smart Dafter" app.\n${details ? details + '\n' : ''}Please send me my license key.`;
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(getContactMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleCopyContactMessage = async () => {
    try {
      await navigator.clipboard.writeText(getContactMessage());
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2500);
    } catch {
      setCopiedRequest(true);
      setTimeout(() => setCopiedRequest(false), 2500);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-full flex flex-col justify-between p-4 md:p-6 bg-slate-900 text-white select-none overflow-y-auto"
    >
      {/* Top Bar with Language Toggle & Brand Header */}
      <div className="flex items-center justify-between pt-1 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* Logo with 5-tap hidden owner trigger */}
          <button
            type="button"
            onClick={handleOwnerTap}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-900/30 active:scale-95 transition-transform"
            title={tapCount > 0 ? `${5 - tapCount}` : 'Daftar Smart'}
          >
            <KeyRound className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>{isRtl ? 'الدفتر الذكي' : 'The Smart Dafter'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {isRtl ? 'نظام إدارة الحسابات والفواتير' : 'Smart Ledger & Invoicing'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
        </button>
      </div>

      {/* Main Activation Card */}
      <div className="my-auto py-6 max-w-md mx-auto w-full space-y-5">
        {/* Status Graphic & Title */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 text-cyan-400 shadow-xl shadow-cyan-950/40 relative cursor-pointer"
            onClick={handleOwnerTap}
          >
            {currentStatus.isExpired ? (
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            ) : (
              <Lock className="w-10 h-10 text-cyan-400" />
            )}
            {tapCount > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow">
                {tapCount}
              </span>
            )}
          </motion.div>

          <h2 className="text-lg font-black text-white">
            {currentStatus.isExpired
              ? (isRtl ? 'انتهت صلاحية مفتاح التفعيل' : 'License Expired')
              : (isRtl ? 'تفعيل نظام الدفتر الذكي' : 'Activate Smart Dafter')}
          </h2>

          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {currentStatus.isExpired
              ? (isRtl
                  ? 'انتهت صلاحية استخدام التطبيق. يرجى إدخال مفتاح ترخيص جديد للمتابعة.'
                  : 'Your license key has expired. Please enter a renewed key to continue.')
              : (isRtl
                  ? 'يرجى إدخال مفتاح التفعيل للبدء باستخدام التطبيق وإدارة حساباتك وفواتيرك.'
                  : 'Please enter your activation key to begin using the application.')}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleActivateSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span>{isRtl ? 'رمز / مفتاح التفعيل:' : 'Activation Key:'}</span>
              <button
                type="button"
                onClick={handlePasteKey}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{isRtl ? 'لصق من الحافظة' : 'Paste'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value.toUpperCase());
                  setErrorMessage('');
                }}
                placeholder="DFT-30D-20261003-XXXX-XXXX"
                className="w-full bg-slate-800 text-white font-mono font-bold text-sm tracking-wider text-center py-3.5 px-4 rounded-2xl border border-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner placeholder:text-slate-500 uppercase"
                autoComplete="off"
                spellCheck="false"
              />
              {inputKey && (
                <button
                  type="button"
                  onClick={() => setInputKey('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 font-medium"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activate Button */}
          <button
            type="submit"
            disabled={isSubmitting || !inputKey.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 active:scale-98 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRtl ? 'تفعيل النظام الآن' : 'Activate System Now'}</span>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        </form>

        {/* Contact Owner Section */}
        <div className="pt-4 border-t border-slate-800/90 space-y-3">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-300">
              {isRtl ? 'ليس لديك مفتاح تفعيل؟' : "Don't have an activation key?"}
            </p>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? 'تواصل مع المالك للحصول على كود التفعيل الخاص بك وتفعيل نسختك'
                : 'Contact the owner to receive your store activation key'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleContactWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center gap-1.5 active:scale-98"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isRtl ? 'طلب المفتاح عبر واتساب' : 'Request via WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyContactMessage}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              {copiedRequest ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isRtl ? 'نسخ رسالة الطلب' : 'Copy Request Text'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer with subtle version & tap handler */}
      <div className="text-center pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} {isRtl ? 'الدفتر الذكي' : 'The Smart Dafter'}</span>
        <button
          type="button"
          onClick={handleOwnerTap}
          className="text-slate-500 hover:text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
        >
          v2.0 Pro
        </button>
      </div>
    </div>
  );
};
