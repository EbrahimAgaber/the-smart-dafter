import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Package
} from 'lucide-react';
import { Language, BusinessProfile } from '../types';
import { getTranslation } from '../i18n/translations';
import { SQLiteLedgerStore } from '../db/sqliteStorage';

interface CsvImportExportModalProps {
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onRefreshData: () => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  profile,
  lang,
  onClose,
  onRefreshData,
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';
  const store = SQLiteLedgerStore.getInstance();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const customerFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Trigger file download helper
  const triggerDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleExportCustomers = () => {
    const csv = store.exportPartiesCSV();
    triggerDownload(csv, `Dafter_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    setFeedback({ text: isRtl ? 'تم تصدير ملف العملاء بنجاح' : 'Customers exported successfully', type: 'success' });
  };

  const handleExportProducts = () => {
    const csv = store.exportProductsCSV();
    triggerDownload(csv, `Dafter_Products_${new Date().toISOString().split('T')[0]}.csv`);
    setFeedback({ text: isRtl ? 'تم تصدير ملف الأصناف بنجاح' : 'Products exported successfully', type: 'success' });
  };

  const handleDownloadCustomerTemplate = () => {
    const BOM = '\uFEFF';
    const sample = `${BOM}المعرف,النوع,الاسم,رقم الجوال,الحي_المنطقة,العنوان,الرصيد_الحالي,الرصيد_الافتتاحي,ملاحظات\r\n"1","عميل","مؤسسة الأفق التجارية","0501234567","حي الياسمين","شارع العليا",0.00,500.00,"عميل جملة"\r\n"2","عميل","شركة النماء للمقاولات","0559876543","حي الملقا","طريق الملك فهد",0.00,0.00,"سداد 30 يوم"`;
    triggerDownload(sample, 'Dafter_Customers_Template.csv');
  };

  const handleDownloadProductTemplate = () => {
    const BOM = '\uFEFF';
    const sample = `${BOM}المعرف,اسم الصنف,الوحدة,سعر البيع الافتراضي,سعر التكلفة الافتراضي,الباركود\r\n"1","أسمنت مقاوم ممتاز","كيس",24.50,21.00,"628100123456"\r\n"2","حديد تسليح 12 ملم","طن",2850.00,2600.00,"628100789012"`;
    triggerDownload(sample, 'Dafter_Products_Template.csv');
  };

  const handleImportCustomersFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = store.importPartiesCSV(content);
        if (res.imported > 0) {
          onRefreshData();
          setFeedback({
            text: isRtl ? `تم استيراد ${res.imported} جهة اتصال بنجاح!` : `Imported ${res.imported} contacts!`,
            type: 'success',
          });
        } else {
          setFeedback({
            text: res.errors[0] || (isRtl ? 'تعذر استيراد البيانات، تأكد من صحة الملف' : 'Import failed, verify CSV format'),
            type: 'error',
          });
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    if (e.target) e.target.value = '';
  };

  const handleImportProductsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = store.importProductsCSV(content);
        if (res.imported > 0) {
          onRefreshData();
          setFeedback({
            text: isRtl ? `تم استيراد ${res.imported} صنف بنجاح!` : `Imported ${res.imported} products!`,
            type: 'success',
          });
        } else {
          setFeedback({
            text: res.errors[0] || (isRtl ? 'تعذر استيراد البيانات، تأكد من صحة الملف' : 'Import failed, verify CSV format'),
            type: 'error',
          });
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    if (e.target) e.target.value = '';
  };

  return (
    <motion.div
      id="modal-csv-portability-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <motion.div
        id="modal-csv-portability-container"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.csvPortability}</h2>
              <p className="text-[11px] text-slate-500">{isRtl ? 'تصدير واستيراد البيانات بصيغة CSV المتوافقة مع Excel' : 'Import and export data via Excel CSV'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRtl ? 'تصدير البيانات (Export)' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isRtl ? 'استيراد البيانات (Import)' : 'Import CSV'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-cyan-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t.exportCustomersCsv}</h3>
                    <p className="text-[11px] text-slate-500">{isRtl ? 'تصدير جميع العملاء، أرقام الجوال، والأرصدة' : 'Export all customer contacts and balances'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCustomers}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تصدير' : 'Export'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-amber-700 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t.exportProductsCsv}</h3>
                    <p className="text-[11px] text-slate-500">{isRtl ? 'تصدير دليل الأصناف، الوحدات، والأسعار' : 'Export product catalog and prices'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportProducts}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تصدير' : 'Export'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Customer Import Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <h3 className="text-xs font-bold text-slate-900">{t.importCustomersCsv}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCustomerTemplate}
                    className="text-[11px] text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>{t.downloadTemplate}</span>
                  </button>
                </div>

                <input
                  type="file"
                  accept=".csv"
                  ref={customerFileInputRef}
                  onChange={handleImportCustomersFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => customerFileInputRef.current?.click()}
                  className="w-full py-3 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{isRtl ? 'اختر ملف CSV للعملاء' : 'Select Customer CSV'}</span>
                </button>
              </div>

              {/* Product Import Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900">{t.importProductsCsv}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadProductTemplate}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>{t.downloadTemplate}</span>
                  </button>
                </div>

                <input
                  type="file"
                  accept=".csv"
                  ref={productFileInputRef}
                  onChange={handleImportProductsFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => productFileInputRef.current?.click()}
                  className="w-full py-3 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{isRtl ? 'اختر ملف CSV للأصناف' : 'Select Products CSV'}</span>
                </button>
              </div>
            </div>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
          >
            {t.close}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
