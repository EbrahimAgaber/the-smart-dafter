import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Store,
  Phone,
  User,
  Coins,
  FileCheck2,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { BusinessProfile, Currency, Language } from '../types';

interface StoreSetupWizardModalProps {
  currentProfile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onSaveSetup: (
    updatedProfile: Partial<BusinessProfile>,
    freshStart: boolean
  ) => void;
}

export const StoreSetupWizardModal: React.FC<StoreSetupWizardModalProps> = ({
  currentProfile,
  lang,
  onClose,
  onSaveSetup,
}) => {
  const isRtl = lang === 'ar';

  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState(currentProfile.name || '');
  const [ownerName, setOwnerName] = useState(currentProfile.ownerName || '');
  const [phone, setPhone] = useState(currentProfile.phone || '');
  const [currency, setCurrency] = useState<Currency>(currentProfile.currency || 'SAR');
  const [taxNumber, setTaxNumber] = useState(currentProfile.taxNumber || '');
  const [address, setAddress] = useState(currentProfile.address || '');
  const [freshStart, setFreshStart] = useState<boolean>(false);

  const currencies: { code: Currency; labelAr: string; labelEn: string; symbol: string }[] = [
    { code: 'SAR', labelAr: 'ريال سعودي (SAR)', labelEn: 'Saudi Riyal (SAR)', symbol: 'ر.س' },
    { code: 'EGP', labelAr: 'جنيه مصري (EGP)', labelEn: 'Egyptian Pound (EGP)', symbol: 'ج.م' },
    { code: 'AED', labelAr: 'درهم إماراتي (AED)', labelEn: 'UAE Dirham (AED)', symbol: 'د.إ' },
    { code: 'KWD', labelAr: 'دينار كويتي (KWD)', labelEn: 'Kuwaiti Dinar (KWD)', symbol: 'د.ك' },
    { code: 'USD', labelAr: 'دولار أمريكي (USD)', labelEn: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', labelAr: 'يورو أوروبي (EUR)', labelEn: 'Euro (€)', symbol: '€' },
  ];

  const handleFinish = () => {
    onSaveSetup(
      {
        name: businessName.trim() || (isRtl ? 'متجري التجاري' : 'My Store'),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        currency,
        taxNumber: taxNumber.trim(),
        address: address.trim(),
      },
      freshStart
    );
    onClose();
  };

  return (
    <motion.div
      id="modal-store-setup-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && currentProfile.name) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <motion.div
        id="modal-store-setup-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-green-600 border border-cyan-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>{isRtl ? 'إعداد المتجر للاستخدام الحقيقي' : 'Real Store Setup Wizard'}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-cyan-500/20 text-green-700 border border-cyan-500/30">
                  {step === 1 ? '1/2' : '2/2'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl
                  ? 'جهز بيانات متجرك لتجربته على الجوال كتاجر حقيقي'
                  : 'Configure real store profile for field mobile testing'}
              </p>
            </div>
          </div>
          {currentProfile.name && (
            <button
              onClick={onClose}
              aria-label={isRtl ? 'إغلاق' : 'Close'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step 1: Store & Owner Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{isRtl ? 'اسم المحل أو النشاط التجاري *' : 'Business / Store Name *'}</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={isRtl ? 'مثال: تموينات البركة / مؤسسة النور' : 'e.g., Al-Baraka Trading'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>{isRtl ? 'اسم المالك أو المسؤول' : 'Owner Name'}</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={isRtl ? 'مثال: أبو أحمد' : 'e.g. John Doe'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                  <span>{isRtl ? 'رقم الواتساب / الجوال *' : 'WhatsApp / Mobile *'}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRtl ? 'العملة الأساسية للمعاملات' : 'Default Currency'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`min-h-[44px] py-2.5 px-3.5 rounded-xl text-xs font-bold text-start border transition-all flex items-center justify-between ${
                      currency === c.code
                        ? 'bg-sky-50 text-sky-800 border-sky-600 shadow-xs'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{isRtl ? c.labelAr : c.labelEn}</span>
                    <span className="font-mono text-xs opacity-75">{c.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md mt-2"
            >
              <span>{isRtl ? 'المتابعة للخطوة التالية' : 'Continue to Step 2'}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Step 2: Clean Ledger Option & Confirmation */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRtl ? 'الرقم الضريبي أو السجل التجاري (اختياري)' : 'Tax ID / CR Number (Optional)'}
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="300000000000003"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isRtl ? 'عنوان المحل أو المدينة (اختياري)' : 'Store Address or City (Optional)'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isRtl ? 'الرياض - حي الملز' : 'Riyadh, Saudi Arabia'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Clean Ledger Option (Fresh Start) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={freshStart}
                  onChange={(e) => setFreshStart(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 shrink-0"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isRtl ? 'بدء دفتر جديد ونظيف (مسح بيانات العرض التجريبية)' : 'Fresh Start (Clear demo seed data)'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {isRtl
                      ? 'تفعيل هذا الخيار سيقوم بمسح كافة المعاملات والعملاء التجريبيين لبدء دفتر حسابات فارغ لمتجرك.'
                      : 'Checking this will wipe all demo transactions and parties to start with a blank ledger.'}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[44px] py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
              >
                {isRtl ? 'السابق' : 'Back'}
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{isRtl ? 'حفظ والبدء في المتجر' : 'Save & Launch Store'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
