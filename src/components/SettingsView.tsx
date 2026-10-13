import React, { useState, useRef, useEffect } from 'react';
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
  Activity,
  Zap,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudCheck,
  CloudOff,
  CloudUpload,
  CloudDownload,
} from 'lucide-react';
import { BusinessProfile, Language, CloudSyncStatus } from '../types';
import { getTranslation } from '../i18n/translations';
import { compressImageFile } from '../utils/imageCompressor';
import { getLicenseStatus } from '../utils/licenseManager';
import { openExternalUrl } from '../utils/formatters';
import { SQLiteLedgerStore, StorageHealthStatus, StorageDiagnosticResult } from '../db/sqliteStorage';
import { cloudSyncManager } from '../db/cloudSyncManager';

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

  // Storage Health Audit and Diagnostics
  const store = SQLiteLedgerStore.getInstance();
  const [storageHealth, setStorageHealth] = useState<StorageHealthStatus>(() => store.getStorageHealth());
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<StorageDiagnosticResult | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  useEffect(() => {
    store.refreshStorageHealth().then(setStorageHealth);
    const unsubscribe = store.subscribe(() => {
      setStorageHealth(store.getStorageHealth());
    });
    return unsubscribe;
  }, [store]);

  const handleRunDiagnostics = async () => {
    setIsDiagnosticsRunning(true);
    try {
      const res = await store.runStorageDiagnostics();
      setDiagnosticResult(res);
      setShowDiagnostics(true);
      setStorageHealth(store.getStorageHealth());
    } finally {
      setIsDiagnosticsRunning(false);
    }
  };

  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    try {
      await store.forceSyncToIndexedDB();
      const updated = await store.refreshStorageHealth();
      setStorageHealth(updated);
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Cloud Sync state & hooks
  const [cloudSyncConfig, setCloudSyncConfig] = useState(cloudSyncManager.getConfig());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(cloudSyncManager.getStatus());
  const [targetSyncKeyInput, setTargetSyncKeyInput] = useState('');
  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = cloudSyncManager.subscribe((status) => {
      setCloudSyncStatus(status);
      setCloudSyncConfig(cloudSyncManager.getConfig());
    });
    return unsub;
  }, []);

  const handleToggleCloudSync = (enabled: boolean) => {
    cloudSyncManager.saveConfig({ enabled });
  };

  const handleManualCloudSync = async () => {
    setCloudSyncFeedback(null);
    const res = await cloudSyncManager.syncNow('MANUAL');
    setCloudSyncFeedback(res.message);
    setTimeout(() => setCloudSyncFeedback(null), 4000);
  };

  const handlePullCloudBackup = async () => {
    const keyToUse = targetSyncKeyInput.trim() || cloudSyncConfig.syncKey;
    if (!keyToUse) return;

    if (window.confirm(isRtl ? `هل أنت متأكد من استرجاع ومزامنة البيانات السحابية للمفتاح "${keyToUse}"؟` : `Are you sure you want to restore and sync from cloud key "${keyToUse}"?`)) {
      setCloudSyncFeedback(null);
      const res = await cloudSyncManager.pullAndRestore(keyToUse);
      setCloudSyncFeedback(res.message);
      setTimeout(() => setCloudSyncFeedback(null), 5000);
    }
  };

  const handleRegenerateSyncKey = () => {
    if (window.confirm(isRtl ? 'هل ترغب في إنشاء مفتاح مزامنة جديد؟' : 'Generate a new private sync key?')) {
      const newKey = cloudSyncManager.generateNewSyncKey();
      cloudSyncManager.saveConfig({ syncKey: newKey });
    }
  };

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
    openExternalUrl(waUrl);
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
        <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/60 text-sky-800 text-xs flex items-center gap-2 shadow-2xs">
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
                  className="px-3 py-1.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300/60 shadow-2xs transition-colors flex items-center justify-center"
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
              <div dir="ltr" className="inline-flex items-center min-w-[44px] min-h-[44px] justify-center">
                <button
                  type="button"
                  dir="ltr"
                  onClick={() => setIsVatEnabled(!isVatEnabled)}
                  aria-label={isRtl ? 'تفعيل ضريبة القيمة المضافة' : 'Toggle VAT'}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                    isVatEnabled ? 'bg-cyan-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isVatEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
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

      {/* Connection & Storage Health Status Indicator Card */}
      <div
        id="settings-storage-health-card"
        className={`p-4 bg-white rounded-3xl border space-y-3.5 shadow-2xs transition-all ${
          storageHealth.status === 'error'
            ? 'border-rose-300 ring-2 ring-rose-100'
            : storageHealth.status === 'warning'
            ? 'border-amber-300 ring-2 ring-amber-100'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Activity
              className={`w-4 h-4 ${
                storageHealth.status === 'error'
                  ? 'text-rose-600 animate-pulse'
                  : storageHealth.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-emerald-600'
              }`}
            />
            <span>{t.storageHealthTitle}</span>
          </div>

          <span
            id="storage-health-status-badge"
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
              storageHealth.status === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : storageHealth.status === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                storageHealth.status === 'error'
                  ? 'bg-rose-500 animate-ping'
                  : storageHealth.status === 'warning'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-emerald-500'
              }`}
            />
            <span>
              {storageHealth.status === 'error'
                ? t.storageError
                : storageHealth.status === 'warning'
                ? t.storageWarning
                : t.storageHealthy}
            </span>
          </span>
        </div>

        {/* Critical Failure / Warning Alert Box */}
        {storageHealth.status === 'error' && (
          <div
            id="storage-health-error-alert"
            className="p-3 bg-rose-50/90 rounded-2xl border border-rose-200 space-y-2 text-xs"
          >
            <div className="flex items-start gap-2 text-rose-800 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{t.storageFailureAlert}</p>
                {storageHealth.lastError && (
                  <p className="text-[11px] font-mono font-normal text-rose-600 bg-white/70 px-2 py-0.5 rounded border border-rose-200">
                    {storageHealth.lastError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.quickExportBackup}</span>
              </button>
              <button
                type="button"
                onClick={handleRetrySync}
                disabled={isRetryingSync}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSync ? 'animate-spin' : ''}`} />
                <span>{t.retrySync}</span>
              </button>
            </div>
          </div>
        )}

        {storageHealth.lastErrorCode === 'QUOTA_EXCEEDED' && (
          <div
            id="storage-health-quota-alert"
            className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t.quotaExceededAlert}</p>
          </div>
        )}

        {/* Subsystems Health Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Subsystem 1: Local Storage Cache */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>{isRtl ? 'الذاكرة السريعة' : 'Cache'}</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  storageHealth.localStorageOperational ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="font-bold text-slate-800 text-[11px] truncate">
              {storageHealth.localStorageOperational
                ? (isRtl ? 'نشط (0ms)' : 'Operational')
                : (isRtl ? 'غير متاح' : 'Disabled')}
            </div>
          </div>

          {/* Subsystem 2: IndexedDB Engine */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-600" />
                <span>IndexedDB</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  storageHealth.indexedDbOperational ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="font-bold text-slate-800 text-[11px] truncate">
              {storageHealth.indexedDbOperational
                ? (isRtl ? 'مستديم ومؤمن' : 'Persistent')
                : (isRtl ? 'معطل' : 'Disabled')}
            </div>
          </div>

          {/* Subsystem 3: Stored Data Footprint */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-indigo-500" />
                <span>{isRtl ? 'المساحة' : 'Footprint'}</span>
              </span>
            </div>
            <div className="font-bold text-slate-800 text-[11px] truncate">
              {(storageHealth.localStorageBytesUsed / 1024).toFixed(1)} KB
              <span className="text-[10px] text-slate-400 font-normal mr-1">
                ({storageHealth.transactionsCount} {isRtl ? 'قيد' : 'tx'})
              </span>
            </div>
          </div>

          {/* Subsystem 4: Last Auto-Save */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>{isRtl ? 'الحفظ' : 'Auto-Save'}</span>
              </span>
            </div>
            <div className="font-bold text-slate-800 text-[11px] truncate">
              {storageHealth.lastSuccessfulSave
                ? new Date(storageHealth.lastSuccessfulSave).toLocaleTimeString(
                    isRtl ? 'ar-SA' : 'en-US',
                    { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                  )
                : (isRtl ? 'محفوظ تلقائياً' : 'Saved')}
            </div>
          </div>
        </div>

        {/* Run Storage Diagnostics Action & Live Results */}
        <div className="pt-0.5 space-y-2">
          <button
            type="button"
            id="btn-run-storage-diagnostics"
            onClick={handleRunDiagnostics}
            disabled={isDiagnosticsRunning}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold border border-slate-300/60 transition-all shadow-2xs"
          >
            <Activity className={`w-3.5 h-3.5 text-cyan-600 ${isDiagnosticsRunning ? 'animate-spin' : ''}`} />
            <span>{isDiagnosticsRunning ? t.runningDiagnostics : t.runDiagnostics}</span>
          </button>

          {showDiagnostics && diagnosticResult && (
            <div
              id="storage-diagnostics-results"
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      diagnosticResult.allPassed ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>
                    {diagnosticResult.allPassed ? t.diagnosticsPassed : t.diagnosticsFailed}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(false)}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  {isRtl ? 'إخفاء' : 'Close'}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'فحص الذاكرة السريعة (LocalStorage):' : 'LocalStorage Probe:'}</span>
                  <span className={diagnosticResult.localStorageTest.passed ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {diagnosticResult.localStorageTest.passed
                      ? `${isRtl ? 'سليم' : 'Passed'} (${diagnosticResult.localStorageTest.latencyMs}ms)`
                      : `${isRtl ? 'فشل' : 'Failed'}: ${diagnosticResult.localStorageTest.error}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'فحص التخزين المستديم (IndexedDB):' : 'IndexedDB Probe:'}</span>
                  <span className={diagnosticResult.indexedDbTest.passed ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {diagnosticResult.indexedDbTest.passed
                      ? `${isRtl ? 'سليم' : 'Passed'} (${diagnosticResult.indexedDbTest.latencyMs}ms)`
                      : `${isRtl ? 'فشل' : 'Failed'}: ${diagnosticResult.indexedDbTest.error}`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>{isRtl ? 'تكامل الأرصدة وقيود الدفتر:' : 'Ledger Determinism:'}</span>
                  <span className={diagnosticResult.balanceReconciliationTest.passed ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {diagnosticResult.balanceReconciliationTest.passed
                      ? (isRtl ? 'متطابق 100% (صفر انحراف)' : '100% Reconciled')
                      : `${diagnosticResult.balanceReconciliationTest.discrepancyCount} ${isRtl ? 'فروقات رصيد' : 'discrepancies'}`}
                  </span>
                </div>
              </div>

              {diagnosticResult.recommendation && (
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  ⚠️ {diagnosticResult.recommendation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Automated Cloud Sync & Backup Card */}
      <div id="settings-cloud-sync-card" className="p-4 bg-white rounded-3xl border border-slate-200 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Cloud className="w-4 h-4 text-cyan-600" />
            <span>{t.cloudSyncTitle}</span>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
              cloudSyncStatus.lastSyncStatus === 'SUCCESS'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : cloudSyncStatus.lastSyncStatus === 'SYNCING'
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : cloudSyncStatus.lastSyncStatus === 'ERROR'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cloudSyncStatus.lastSyncStatus === 'SYNCING'
                  ? 'bg-cyan-500 animate-ping'
                  : cloudSyncStatus.lastSyncStatus === 'SUCCESS'
                  ? 'bg-emerald-500'
                  : cloudSyncStatus.lastSyncStatus === 'ERROR'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {cloudSyncStatus.lastSyncStatus === 'SYNCING'
                ? t.cloudSyncInProgress
                : cloudSyncStatus.lastSyncStatus === 'SUCCESS'
                ? t.cloudSyncHealthy
                : cloudSyncStatus.lastSyncStatus === 'ERROR'
                ? t.storageError
                : (isRtl ? 'غير مفعل' : 'Idle')}
            </span>
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          {t.cloudSyncDesc}
        </p>

        {/* Master Toggle */}
        <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
          <div>
            <span className="font-bold text-slate-800 text-xs block">
              {t.enableCloudSync}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {isRtl ? 'حفظ تلقائي عند التعديل + نسخة يومية' : 'Sync on changes + 24h daily snapshots'}
            </span>
          </div>
          <input
            type="checkbox"
            checked={cloudSyncConfig.enabled}
            onChange={(e) => handleToggleCloudSync(e.target.checked)}
            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
          />
        </label>

        {/* Sync Key Display & Cross-Device Controls */}
        <div className="p-3 bg-cyan-50/60 rounded-2xl border border-cyan-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-950 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-600" />
              <span>{t.syncKeyLabel}:</span>
            </span>
            <button
              type="button"
              onClick={handleRegenerateSyncKey}
              className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold underline"
            >
              {t.generateNewKey}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-cyan-200 rounded-xl px-3 py-1.5 font-mono font-bold text-center text-cyan-900 text-xs tracking-wider shadow-2xs">
              {cloudSyncConfig.syncKey}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(cloudSyncConfig.syncKey);
                alert(isRtl ? 'تم نسخ مفتاح المزامنة!' : 'Sync key copied to clipboard!');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-xs shadow-2xs"
              title={isRtl ? 'نسخ المفتاح' : 'Copy Key'}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-cyan-800/80 leading-relaxed">
            {t.syncKeyDesc}
          </p>
        </div>

        {/* Sync Trigger Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleManualCloudSync}
            disabled={cloudSyncStatus.isSyncing}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-75"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{cloudSyncStatus.isSyncing ? (isRtl ? 'جاري الرفع...' : 'Syncing...') : t.syncNowButton}</span>
          </button>

          <button
            type="button"
            onClick={handlePullCloudBackup}
            disabled={cloudSyncStatus.isSyncing}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition-colors shadow-2xs disabled:opacity-75"
          >
            <CloudDownload className="w-3.5 h-3.5 text-cyan-600" />
            <span>{t.restoreFromCloud}</span>
          </button>
        </div>

        {/* Restore from Another Device Key Input */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={targetSyncKeyInput}
            onChange={(e) => setTargetSyncKeyInput(e.target.value.toUpperCase())}
            placeholder={isRtl ? 'مفتاح جهاز آخر لاسترجاع بياناته (DS-XXXX-XXXX)...' : 'Other device sync key (DS-XXXX-XXXX)...'}
            className="flex-1 bg-slate-50 text-slate-900 font-mono text-xs rounded-xl px-3 py-2 border border-slate-200 focus:outline-none focus:border-cyan-500 shadow-2xs"
          />
          <button
            type="button"
            onClick={handlePullCloudBackup}
            disabled={!targetSyncKeyInput.trim() || cloudSyncStatus.isSyncing}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-xs border border-slate-200 shrink-0"
          >
            {isRtl ? 'استيراد' : 'Import'}
          </button>
        </div>

        {/* Feedback alert */}
        {cloudSyncFeedback && (
          <div className="p-2.5 bg-cyan-50 rounded-xl border border-cyan-200 text-cyan-900 text-xs font-medium animate-fade-in">
            ℹ️ {cloudSyncFeedback}
          </div>
        )}
      </div>

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
