import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react';
import { Language, BusinessProfile } from '../types';
import {
  getLicenseStatus,
  activateLicenseKey,
  LicenseStatus,
} from '../utils/licenseManager';
import { playSuccessChime, speakText } from '../utils/speechFeedback';

interface SecurityGuardModalProps {
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onLicenseUpdated?: (status: LicenseStatus) => void;
}

export const SecurityGuardModal: React.FC<SecurityGuardModalProps> = ({
  profile,
  lang,
  onClose,
  onLicenseUpdated,
}) => {
  const isRtl = lang === 'ar';
  const [status, setStatus] = useState<LicenseStatus>(() => getLicenseStatus());
  const [inputKey, setInputKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inputKey.trim()) {
      setErrorMsg(isRtl ? 'يرجى إدخال مفتاح التفعيل' : 'Please enter license key');
      return;
    }

    const result = activateLicenseKey(inputKey, profile.name);
    if (result.success && result.status) {
      setStatus(result.status);
      setSuccessMsg(isRtl ? result.messageAr : result.messageEn);
      setInputKey('');
      playSuccessChime();
      speakText(
        isRtl
          ? 'تم تفعيل رخصة البرنامج بنجاح'
          : 'License activated successfully',
        isRtl ? 'ar' : 'en'
      );
      if (onLicenseUpdated) {
        onLicenseUpdated(result.status);
      }
    } else {
      setErrorMsg(isRtl ? result.messageAr : result.messageEn);
    }
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      isRtl
        ? `السلام عليكم، أود تجديد أو شراء ترخيص لتطبيق الدفتر الذكي.\nاسم المتجر: ${profile.name || 'بدون اسم'}\nرقم الجوال: ${profile.phone || 'غير محدد'}`
        : `Hello, I would like to renew or purchase a license for Daftar Smart.\nStore: ${profile.name || 'N/A'}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <motion.div
      id="modal-security-guard-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <motion.div
        id="modal-security-guard-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 md:p-6 space-y-4 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                status.isActive
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {status.isActive ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isRtl ? 'حماية وترخيص البرنامج' : 'License & Security Guard'}
              </h2>
              <p className="text-xs text-slate-400">
                {status.isActive
                  ? (isRtl ? 'البرنامج مفعل وصالح للاستخدام' : 'Active and licensed')
                  : (isRtl ? 'انتهت صلاحية فترة الاستخدام' : 'License expired')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Card */}
        <div
          className={`p-4 rounded-2xl border space-y-2 ${
            status.isActive
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5">
              {status.isActive ? (
                <Unlock className="w-4 h-4 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-rose-600" />
              )}
              <span>{isRtl ? status.planNameAr : status.planNameEn}</span>
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                status.isActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {status.isLifetime
                ? (isRtl ? 'دائم' : 'Lifetime')
                : status.isExpired
                ? (isRtl ? 'منتهية' : 'Expired')
                : isRtl
                ? `متبقي ${status.daysRemaining} يوم`
                : `${status.daysRemaining} days left`}
            </span>
          </div>

          <div className="text-xs">
            <span className="opacity-75">{isRtl ? 'صالحة حتى: ' : 'Valid until: '}</span>
            <span className="font-bold">{status.expiryDateStr}</span>
          </div>
        </div>

        {/* Reassurance Notice: Data is NEVER held hostage */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isRtl ? 'ضمان أمان وحرية البيانات:' : 'Data Guarantee:'}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isRtl
              ? 'جميع حسابات عملائك، كشوفات الديون، السندات، والنسخ الاحتياطية محفوظة بالكامل وتستطيع تصفحها وطباعتها وتصديرها في أي وقت دون أي قيود. التجديد مطلوب فقط لإنشاء فواتير جديدة.'
              : 'All your customer ledgers, historical transactions, and statements remain 100% accessible, printable, and exportable. License renewal is only required to issue new invoices.'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isRtl ? 'إدخال مفتاح التفعيل:' : 'Enter License Key:'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="DFT-30D-2026XXXX-XXXX-XXXX"
                className="w-full bg-slate-50 text-slate-900 font-mono text-xs font-bold rounded-xl ps-9 pe-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppContact}
              className="flex-1 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'طلب مفتاح تفعيل' : 'Request Key'}</span>
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/20 active:scale-98"
            >
              {isRtl ? 'تفعيل الآن' : 'Activate Key'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
