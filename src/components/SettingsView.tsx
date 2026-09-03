import React, { useState, useRef } from 'react';
import {
  Building2,
  Phone,
  CreditCard,
  Image,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  Save,
  DollarSign,
  FileText,
  Share2,
  Copy,
  Sparkles,
  QrCode,
  Store,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { BusinessProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { compressImageFile } from '../utils/imageCompressor';
import { getLicenseStatus } from '../utils/licenseManager';

interface SettingsViewProps {
  profile: BusinessProfile;
  lang: Language;
  onUpdateProfile: (updates: Partial<BusinessProfile>) => void;
  onToggleLang: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => boolean;
  onResetDemoData: () => void;
  onOpenPhonePairing?: () => void;
  onOpenStoreSetup?: () => void;
  onOpenSecurityGuard?: () => void;
  onOpenKeyGenerator?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  lang,
  onUpdateProfile,
  onToggleLang,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  onOpenPhonePairing,
  onOpenStoreSetup,
  onOpenSecurityGuard,
  onOpenKeyGenerator,
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [taxNumber, setTaxNumber] = useState(profile.taxNumber);
  const [isVatEnabled, setIsVatEnabled] = useState(profile.isVatEnabled ?? true);
  const [defaultTaxRate, setDefaultTaxRate] = useState(profile.defaultTaxRate ?? 15);
  const [bankName, setBankName] = useState(profile.bankName);
  const [iban, setIban] = useState(profile.iban);
  const [currency, setCurrency] = useState(profile.currency || 'SAR');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(profile.invoiceFooterNote);
  const [logoBase64, setLogoBase64] = useState(profile.logoBase64);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);

  const handleVersionTap = () => {
    const next = devTapCount + 1;
    if (next >= 5) {
      setDevTapCount(0);
      onOpenKeyGenerator?.();
    } else {
      setDevTapCount(next);
      setTimeout(() => setDevTapCount(0), 3000);
    }
  };

  const [isSyncingUpdates, setIsSyncingUpdates] = useState(false);

  const handleForceSyncUpdates = async () => {
    setIsSyncingUpdates(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {
      console.warn('Update check error', e);
    }
    window.location.reload();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const handleShareBeta = async () => {
    const url = window.location.href.split('?')[0];
    const shareTitle = 'الدفتر الذكي - Daftar Smart';
    const shareText = isRtl
      ? 'تطبيق الدفتر الذكي لإدارة الفواتير والديون ونقاط البيع السريعة: '
      : 'Daftar Smart app for POS, credit ledger, invoices, and thermal receipts: ';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShareWhatsAppBeta = () => {
    const url = window.location.href.split('?')[0];
    const shareText = isRtl
      ? 'تطبيق الدفتر الذكي لإدارة الفواتير والديون ونقاط البيع السريعة: '
      : 'Daftar Smart app for POS, credit ledger, invoices, and thermal receipts: ';
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + url)}`;
    window.open(waUrl, '_blank');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      phone: phone.trim(),
      taxNumber: taxNumber.trim(),
      isVatEnabled,
      defaultTaxRate: Number(defaultTaxRate) || 15,
      bankName: bankName.trim(),
      iban: iban.trim(),
      currency,
      invoiceFooterNote: invoiceFooterNote.trim(),
      logoBase64,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress and resize image to prevent storage quota crashes
      const compressed = await compressImageFile(file, 400, 0.85);
      setLogoBase64(compressed);
    } catch (err) {
      console.error('Failed compressing logo, using standard reader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const success = onImportBackup(content);
      if (success) {
        setImportStatus(isRtl ? 'تم استيراد النسخة الاحتياطية بنجاح!' : 'Backup imported successfully!');
      } else {
        setImportStatus(isRtl ? 'خطأ في تنسيق ملف النسخة الاحتياطية' : 'Invalid backup file format');
      }
      setTimeout(() => setImportStatus(''), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-view" className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900">
          {t.settingsTitle}
        </h1>
        <p className="text-xs text-slate-400">
          {t.businessProfile}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-green-50/80 border border-green-200/60 text-green-700 text-xs flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-green-600" />
          <span>{t.settingsSaved}</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/60 text-sky-300 text-xs flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-sky-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Language & Regional Settings */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs border-b border-slate-200 pb-2">
          <Globe className="w-4 h-4 text-green-600" />
          <span>{t.language} & {t.currency}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Language Switch */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'ar') onToggleLang();
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === 'ar'
                    ? 'bg-green-50 text-green-600 shadow-2xs border border-green-200/40'
                    : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'en') onToggleLang();
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-green-50 text-green-600 shadow-2xs border border-green-200/40'
                    : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.currency}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-2.5 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 font-bold shadow-2xs"
            >
              <option value="SAR">SAR - ريال سعودي</option>
              <option value="EGP">EGP - جنيه مصري</option>
              <option value="AED">AED - درهم إماراتي</option>
              <option value="KWD">KWD - دينار كويتي</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs border-b border-slate-200 pb-2">
            <Building2 className="w-4 h-4 text-green-600" />
            <span>{t.businessProfile}</span>
          </div>

          {/* Logo Picker */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {t.logo}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-750 text-slate-800 text-xs font-semibold border border-slate-300/60 shadow-2xs transition-colors"
                >
                  {t.uploadLogo}
                </button>
                {logoBase64 && (
                  <button
                    type="button"
                    onClick={() => setLogoBase64('')}
                    className="block text-xs text-rose-400 hover:underline"
                  >
                    {isRtl ? 'حذف الشعار' : 'Remove logo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.businessName} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:border-cyan-500 font-bold shadow-2xs"
            />
          </div>

          {/* Business Phone & Tax Number */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t.businessPhone}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 shadow-2xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t.taxNumber}
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 shadow-2xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tax / VAT Settings */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {isRtl ? 'تفعيل ضريبة القيمة المضافة (ZATCA)' : 'Enable Value Added Tax (VAT)'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isRtl ? 'احتساب الضريبة وإصدار رمز الاستجابة السريع المعتمد' : 'Compute VAT and print compliant QR codes'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                disabled={!isVatEnabled}
                className="w-14 bg-white text-slate-900 text-xs text-center font-bold font-mono rounded-lg px-2 py-1 border border-slate-200"
              />
              <span className="text-xs font-bold text-slate-500">%</span>
              <button
                type="button"
                onClick={() => setIsVatEnabled(!isVatEnabled)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  isVatEnabled ? 'bg-cyan-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isVatEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Bank Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t.bankName}
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 shadow-2xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t.iban}
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 shadow-2xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Note */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {t.invoiceFooter}
            </label>
            <textarea
              rows={2}
              value={invoiceFooterNote}
              onChange={(e) => setInvoiceFooterNote(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 resize-none shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-950/30 transition-all active:scale-98 flex items-center justify-center gap-2 border border-cyan-400/20"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </form>

      {/* Database & Local SQLite Backup */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs border-b border-slate-200 pb-2">
          <Database className="w-4 h-4 text-sky-600" />
          <span>{t.databaseTitle}</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t.sqliteNotice}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export JSON / SQLite */}
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.exportBackup}</span>
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={backupFileInputRef}
            onChange={handleBackupFileSelect}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => backupFileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.importBackup}</span>
          </button>
        </div>

        {/* Reset Demo Data */}
        <button
          onClick={() => {
            if (window.confirm(isRtl ? 'تحذير: هل أنت متأكد من رغبتك في حذف جميع البيانات والعودة للصفر؟' : 'WARNING: Are you sure you want to permanently delete all data and factory reset?')) {
              onResetDemoData();
            }
          }}
          className="w-full mt-2 py-2 rounded-xl bg-slate-50 hover:bg-rose-50/60 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isRtl ? 'مسح جميع البيانات (إعادة ضبط المصنع)' : 'Factory Reset / Wipe All Data'}</span>
        </button>
      </div>

      {/* Store Setup & Onboarding Wizard */}
      {onOpenStoreSetup && (
        <div
          id="settings-store-setup-card"
          className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <Store className="w-4 h-4 text-cyan-600" />
              <span>{isRtl ? 'معالج تهيئة وتخصيص المتجر' : 'Store Setup & Configuration'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {isRtl
              ? 'يمكنك إعادة تشغيل معالج التهيئة لتغيير اسم المتجر، المالك، العملة، أو تفريغ البيانات للبدء من جديد.'
              : 'Re-run the store onboarding wizard to reconfigure business profile, currency, or start with fresh data.'}
          </p>

          <button
            type="button"
            onClick={onOpenStoreSetup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300/60 transition-all shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isRtl ? 'تشغيل معالج تهيئة المتجر' : 'Launch Store Setup Wizard'}</span>
          </button>
        </div>
      )}

      {/* License & Security Guard Status Card */}
      {(() => {
        const licStatus = getLicenseStatus();
        return (
          <div
            id="settings-license-card"
            className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'حالة ترخيص البرنامج' : 'License & Protection Status'}</span>
              </div>

              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs ${
                  licStatus.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {licStatus.isLifetime
                  ? (isRtl ? 'رخصة دائمة' : 'Lifetime')
                  : licStatus.isExpired
                  ? (isRtl ? 'منتهية' : 'Expired')
                  : isRtl
                  ? `${licStatus.daysRemaining} يوم متبقي`
                  : `${licStatus.daysRemaining}d remaining`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  licStatus.isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                {licStatus.isActive ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  {isRtl ? licStatus.planNameAr : licStatus.planNameEn}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {licStatus.isLifetime
                    ? (isRtl ? 'رخصة دائمة ومفتوحة بدون انتهاء' : 'Perpetual Lifetime License')
                    : licStatus.isActive
                    ? (isRtl ? `صالح للاستخدام حتى: ${licStatus.expiryDateStr}` : `Active until: ${licStatus.expiryDateStr}`)
                    : (isRtl ? 'الرخصة منتهية - يرجى إدخال مفتاح تفعيل' : 'License expired - please renew')}
                </p>
              </div>
            </div>

            {onOpenSecurityGuard && (
              <button
                type="button"
                onClick={onOpenSecurityGuard}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/20"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إدارة وتفعيل مفتاح الرخصة' : 'Activate / Manage License'}</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* App Updates & Instant Sync Card */}
      <div
        id="settings-sync-update-card"
        className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <RefreshCw className="w-4 h-4 text-cyan-600" />
            <span>{isRtl ? 'التحديث التلقائي ومزامنة الإصدار' : 'App Updates & Sync'}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {isRtl ? 'تزامن مباشر' : 'Live Sync'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {isRtl
            ? 'يقوم التطبيق بالتحقق التلقائي من التحديثات وتطبيقها فوراً دون الحاجة لإعادة التثبيت. يمكنك أيضاً فرض التحديث الفوري بضغطة واحدة.'
            : 'The app checks for updates automatically without reinstallation. You can also force-sync immediately with one tap.'}
        </p>

        <button
          type="button"
          onClick={handleForceSyncUpdates}
          disabled={isSyncingUpdates}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 text-xs font-bold border border-slate-300/70 transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isSyncingUpdates ? 'animate-spin' : ''}`} />
          <span>{isSyncingUpdates ? (isRtl ? 'جاري فحص وتطبيق التحديثات...' : 'Syncing update...') : (isRtl ? '🔄 فحص وتطبيق أحدث تحديث الآن' : '🔄 Check & Sync Latest Update Now')}</span>
        </button>
      </div>

      {/* About Application & Sharing Card */}
      <div
        id="settings-about-card"
        className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>{isRtl ? 'عن التطبيق والمشاركة' : 'About & Sharing'}</span>
          </div>

          {/* Version badge with hidden 5-tap developer trigger */}
          <button
            type="button"
            onClick={handleVersionTap}
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
            title={devTapCount > 0 ? `${5 - devTapCount} taps remaining` : 'v2.0 Production'}
          >
            v2.0 Production
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {isRtl
            ? 'الدفتر الذكي - نظام محاسبي محلي لإدارة ديون العملاء والموردين والفواتير وسندات القبض ونقاط البيع السريعة.'
            : 'Daftar Smart - Local-first mobile ledger for tracking credit, invoices, receipts, and POS.'}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-share-app-link"
            type="button"
            onClick={handleShareBeta}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-sky-950/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مشاركة الرابط' : 'Share Link'}</span>
          </button>

          <button
            id="btn-whatsapp-share-app"
            type="button"
            onClick={handleShareWhatsAppBeta}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20"
            title={isRtl ? 'مشاركة عبر واتساب' : 'Share via WhatsApp'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRtl ? 'واتساب' : 'WhatsApp'}</span>
          </button>

          {onOpenPhonePairing && (
            <button
              id="btn-settings-qr-pairing"
              type="button"
              onClick={onOpenPhonePairing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300/60 transition-all shadow-2xs"
              title={isRtl ? 'مسح رمز QR للجوال' : 'Scan Phone QR'}
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">{isRtl ? 'رمز للجوال' : 'Phone QR'}</span>
            </button>
          )}

          <button
            id="btn-copy-app-link"
            type="button"
            onClick={handleShareBeta}
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300/60 transition-all shadow-2xs"
            title={isRtl ? 'نسخ الرابط' : 'Copy link'}
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span>{copiedLink ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
