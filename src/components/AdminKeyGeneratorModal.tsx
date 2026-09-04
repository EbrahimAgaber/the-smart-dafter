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
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { Language } from '../types';
import {
  generateLicenseKey,
  PlanDurationUnit,
  verifyAdminPin,
  activateLicenseKey,
  LicenseStatus,
} from '../utils/licenseManager';
import { playSuccessChime } from '../utils/speechFeedback';

interface AdminKeyGeneratorModalProps {
  lang: Language;
  onClose: () => void;
  onLicenseActivated?: (status: LicenseStatus) => void;
}

export const AdminKeyGeneratorModal: React.FC<AdminKeyGeneratorModalProps> = ({
  lang,
  onClose,
  onLicenseActivated,
}) => {
  const isRtl = lang === 'ar';
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [directActivateMsg, setDirectActivateMsg] = useState<string>('');

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
        ? `مرحبًا بك! مفتاح تفعيل برنامج "الدفتر الذكي" الخاص بك:\n\n🔐 المفتاح: ${generatedKey}\n⏱️ مدة الترخيص: ${generatedPlanName}\n📅 صالح حتى: ${generatedExpiry}\n\nطريقة التفعيل: افتح التطبيق -> أدخل المفتاح في شاشة التفعيل واضغط "تفعيل الآن".`
        : `Welcome! Here is your Daftar Smart activation key:\n\nKey: ${generatedKey}\nPlan: ${generatedPlanName}\nValid until: ${generatedExpiry}\n\nActivation: Open app -> Enter key and tap Activate Now.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleDirectActivate = () => {
    if (!generatedKey) return;
    const res = activateLicenseKey(generatedKey, clientTag);
    if (res.success && res.status) {
      playSuccessChime();
      setDirectActivateMsg(isRtl ? 'تم تفعيل هذا الجهاز بنجاح!' : 'Activated on this device!');
      if (onLicenseActivated) {
        onLicenseActivated(res.status);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    }
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
                <span>{isRtl ? 'لوحة المالك: توليد التراخيص' : 'Master Key Generator (Owner)'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'توليد وتفعيل رخص مشفرة أوفلاين' : 'Generate & activate offline cryptographically signed keys'}
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
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 mx-auto flex items-center justify-center border border-purple-200">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {isRtl ? 'التحقق من هوية المالك' : 'Owner Identity Verification'}
              </p>
              <p className="text-xs text-slate-500">
                {isRtl ? 'أدخل الرمز السري للمالك لتأكيد الهوية والوصول لمولد المفاتيح' : 'Enter owner passkey to verify identity and unlock generator'}
              </p>
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder={isRtl ? 'رمز المالك السري' : 'Owner Passkey'}
                  autoFocus
                  className="w-full bg-slate-50 text-slate-900 font-mono text-center text-sm font-bold rounded-xl px-10 py-3 border border-slate-200 focus:outline-none focus:border-purple-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  tabIndex={-1}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-rose-600 mt-1.5 text-center font-semibold">
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || !pinInput.trim()}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-950/20 active:scale-98 disabled:opacity-60"
            >
              {isVerifying
                ? (isRtl ? 'جار التحقق...' : 'Verifying...')
                : (isRtl ? 'تأكيد الهوية ودخول اللوحة' : 'Verify Identity & Unlock')}
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

                {/* Direct Activate on This Device */}
                <button
                  type="button"
                  onClick={handleDirectActivate}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'تفعيل فوري لهذا الجهاز بالمفتاح المُولَّد' : 'Activate This Device Directly'}</span>
                </button>

                {directActivateMsg && (
                  <p className="text-xs text-emerald-700 font-bold text-center bg-emerald-100 py-1.5 px-3 rounded-lg border border-emerald-300 animate-in fade-in">
                    {directActivateMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
