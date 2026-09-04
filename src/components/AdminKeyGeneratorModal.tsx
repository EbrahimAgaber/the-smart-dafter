import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Calendar,
  X,
  Store,
} from 'lucide-react';
import { Language } from '../types';
import { generateLicenseKey, PlanDurationUnit, verifyAdminPin } from '../utils/licenseManager';
import { playSuccessChime } from '../utils/speechFeedback';

interface AdminKeyGeneratorModalProps {
  lang: Language;
  onClose: () => void;
}

export const AdminKeyGeneratorModal: React.FC<AdminKeyGeneratorModalProps> = ({
  lang,
  onClose,
}) => {
  const isRtl = lang === 'ar';
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Generator form state
  const [durationValue, setDurationValue] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<PlanDurationUnit>('DAYS');
  const [clientTag, setClientTag] = useState<string>('');

  // Generated output
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [generatedExpiry, setGeneratedExpiry] = useState<string>('');
  const [generatedPlanName, setGeneratedPlanName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    const valid = await verifyAdminPin(pinInput);
    setIsVerifying(false);
    if (valid) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError(isRtl ? 'الرمز السري غير صحيح' : 'Incorrect master PIN');
    }
  };

  const handleGenerate = () => {
    const result = generateLicenseKey(durationValue, durationUnit, clientTag);
    setGeneratedKey(result.key);
    setGeneratedExpiry(result.expiryDate);
    setGeneratedPlanName(result.planName);
    playSuccessChime();
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!generatedKey) return;
    const msg = encodeURIComponent(
      isRtl
        ? `مرحبًا بك! مفتاح تفعيل برنامج "الدفتر الذكي" الخاص بك:\n\n🔐 المفتاح: ${generatedKey}\n⏱️ مدة الترخيص: ${generatedPlanName}\n📅 صالح حتى: ${generatedExpiry}\n\nطريقة التفعيل: افتح التطبيق -> الإعدادات -> حماية وترخيص البرنامج -> أدخل المفتاح واضغط تفعيل.`
        : `Welcome! Here is your Daftar Smart activation key:\n\nKey: ${generatedKey}\nPlan: ${generatedPlanName}\nValid until: ${generatedExpiry}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <motion.div
      id="modal-admin-keygen-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <motion.div
        id="modal-admin-keygen-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 md:p-6 space-y-4 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{isRtl ? 'مولد مفاتيح التراخيص (للمالك فقط)' : 'Master Key Generator (Owner)'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'توليد رخص مشفرة أوفلاين بالأيام أو الأشهر أو السنوات' : 'Generate offline cryptographically signed keys'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isUnlocked ? (
          /* Step 1: PIN Gate */
          <form onSubmit={handleUnlock} className="space-y-4 py-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">
                {isRtl ? 'أدخل الرمز السري للمطور للوصول لمولد المفاتيح' : 'Enter Master PIN to access Key Generator'}
              </p>
            </div>

            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={isRtl ? 'الرمز السري للإدارة' : 'Master Admin PIN'}
                className="w-full bg-slate-50 text-slate-900 font-mono text-center text-sm font-bold rounded-xl px-3 py-3 border border-slate-200 focus:outline-none focus:border-purple-500 shadow-2xs"
              />
              {pinError && (
                <p className="text-xs text-rose-600 mt-1.5 text-center font-semibold">
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/20 active:scale-98 disabled:opacity-60"
            >
              {isVerifying
                ? (isRtl ? 'جار التحقق...' : 'Verifying...')
                : (isRtl ? 'دخول لوحة التوليد' : 'Unlock Generator')}
            </button>
          </form>
        ) : (
          /* Step 2: Key Generator Console */
          <div className="space-y-4">
            {/* Quick Duration Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRtl ? 'اختر مدة الترخيص:' : 'Select License Duration:'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { label: isRtl ? '7 أيام' : '7 Days', val: 7, unit: 'DAYS' as PlanDurationUnit },
                  { label: isRtl ? '30 يوم' : '30 Days', val: 30, unit: 'DAYS' as PlanDurationUnit },
                  { label: isRtl ? '3 أشهر' : '3 Months', val: 3, unit: 'MONTHS' as PlanDurationUnit },
                  { label: isRtl ? '6 أشهر' : '6 Months', val: 6, unit: 'MONTHS' as PlanDurationUnit },
                  { label: isRtl ? 'سنة كاملة' : '1 Year', val: 1, unit: 'YEARS' as PlanDurationUnit },
                  { label: isRtl ? 'سنتين' : '2 Years', val: 2, unit: 'YEARS' as PlanDurationUnit },
                  { label: isRtl ? '3 سنوات' : '3 Years', val: 3, unit: 'YEARS' as PlanDurationUnit },
                  { label: isRtl ? 'دائم مدى الحياة' : 'Lifetime', val: 99, unit: 'LIFETIME' as PlanDurationUnit },
                ].map((item, idx) => {
                  const isSelected = durationValue === item.val && durationUnit === item.unit;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDurationValue(item.val);
                        setDurationUnit(item.unit);
                      }}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Client Store Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRtl ? 'اسم متجر العميل (اختياري للتوثيق):' : 'Client Store Tag (Optional):'}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={clientTag}
                  onChange={(e) => setClientTag(e.target.value)}
                  placeholder={isRtl ? 'مثال: تموينات النور' : 'e.g. Al-Noor Mart'}
                  className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl ps-9 pe-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/20 transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRtl ? 'توليد المفتاح الآن' : 'Generate License Key'}</span>
            </button>

            {/* Output Display Box */}
            {generatedKey && (
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-purple-950">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>{isRtl ? 'المفتاح جاهز للتفعيل:' : 'Ready License Key:'}</span>
                  </span>
                  <span className="font-mono font-semibold text-[11px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                    {generatedPlanName}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-center font-mono font-black text-sm text-slate-900 select-all tracking-wider break-all shadow-2xs">
                  {generatedKey}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isRtl ? 'نسخ المفتاح' : 'Copy'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إرسال عبر واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
