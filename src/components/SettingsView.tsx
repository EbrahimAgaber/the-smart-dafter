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
} from 'lucide-react';
import { BusinessProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';

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
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [taxNumber, setTaxNumber] = useState(profile.taxNumber);
  const [bankName, setBankName] = useState(profile.bankName);
  const [iban, setIban] = useState(profile.iban);
  const [currency, setCurrency] = useState(profile.currency || 'SAR');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(profile.invoiceFooterNote);
  const [logoBase64, setLogoBase64] = useState(profile.logoBase64);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const handleShareBeta = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'الدفتر الذكي - Daftar Smart (Beta)',
          text: isRtl
            ? 'جرب تطبيق الدفتر الذكي لإدارة الفواتير والديون ونقاط البيع السريعة:'
            : 'Try Daftar Smart app for POS, credit ledger, invoices, and thermal receipts:',
          url,
        });
        return;
      } catch (e) {
        // User cancelled or share not permitted, fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      phone: phone.trim(),
      taxNumber: taxNumber.trim(),
      bankName: bankName.trim(),
      iban: iban.trim(),
      currency,
      invoiceFooterNote: invoiceFooterNote.trim(),
      logoBase64,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoBase64(result);
    };
    reader.readAsDataURL(file);
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
        <h1 className="text-base font-bold text-slate-100">
          {t.settingsTitle}
        </h1>
        <p className="text-xs text-slate-400">
          {t.businessProfile}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{t.settingsSaved}</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-800/60 text-sky-300 text-xs flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Language & Regional Settings */}
      <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs border-b border-slate-800 pb-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>{t.language} & {t.currency}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Language Switch */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  if (lang !== 'ar') onToggleLang();
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === 'ar'
                    ? 'bg-emerald-950 text-emerald-400 shadow-2xs border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-emerald-950 text-emerald-400 shadow-2xs border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              {t.currency}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-2.5 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs"
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
        <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>{t.businessProfile}</span>
          </div>

          {/* Logo Picker */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {t.logo}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
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
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/60 shadow-2xs transition-colors"
                >
                  {t.uploadLogo}
                </button>
                {logoBase64 && (
                  <button
                    type="button"
                    onClick={() => setLogoBase64('')}
                    className="block text-[10px] text-rose-400 hover:underline"
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
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 font-bold shadow-2xs"
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
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono rounded-xl px-3 py-2 border border-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono rounded-xl px-3 py-2 border border-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500"
              />
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
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono rounded-xl px-3 py-2 border border-slate-800 shadow-2xs focus:outline-none focus:border-emerald-500"
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
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/30 transition-all active:scale-98 flex items-center justify-center gap-2 border border-emerald-400/20"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </form>

      {/* Database & Local SQLite Backup */}
      <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs border-b border-slate-800 pb-2">
          <Database className="w-4 h-4 text-sky-400" />
          <span>{t.databaseTitle}</span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {t.sqliteNotice}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export JSON / SQLite */}
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
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
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.importBackup}</span>
          </button>
        </div>

        {/* Reset Demo Data */}
        <button
          onClick={() => {
            if (window.confirm(isRtl ? 'هل تريد استعادة البيانات التجريبية للمتجر وتحديث الحركات؟' : 'Restore initial demo merchant records and transactions?')) {
              onResetDemoData();
            }
          }}
          className="w-full mt-2 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 text-[11px] font-semibold border border-slate-850 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.resetDemoData}</span>
        </button>
      </div>

      {/* Beta Release & Distribution Card */}
      <div
        id="beta-release-card"
        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-sky-500/30 p-4 space-y-3 shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>{isRtl ? 'إصدار التجربة الميدانية' : 'Field Beta Release'}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-sky-500 text-slate-950">
                  v1.0-BETA
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isRtl
                  ? 'جاهز للاختبار الميداني ومشاركة الرابط مع العملاء وفريق العمل'
                  : 'Ready for merchant testing and team sharing'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-share-beta-link"
            type="button"
            onClick={handleShareBeta}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مشاركة الرابط' : 'Share Link'}</span>
          </button>

          {onOpenPhonePairing && (
            <button
              id="btn-settings-qr-pairing"
              type="button"
              onClick={onOpenPhonePairing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold border border-slate-700 transition-all"
              title={isRtl ? 'مسح رمز QR للجوال' : 'Scan Phone QR'}
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>{isRtl ? 'رمز QR للجوال' : 'Phone QR'}</span>
            </button>
          )}

          <button
            id="btn-copy-beta-link"
            type="button"
            onClick={handleShareBeta}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            title={isRtl ? 'نسخ الرابط' : 'Copy link'}
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="text-[11px]">{copiedLink ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
          </button>
        </div>

        {onOpenStoreSetup && (
          <button
            type="button"
            onClick={onOpenStoreSetup}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isRtl ? 'معالج إعداد المتجر للاستخدام الحقيقي' : 'Real Store Setup Wizard'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
