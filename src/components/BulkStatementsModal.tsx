import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Printer,
  MapPin,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle,
  Building2
} from 'lucide-react';
import { Party, Transaction, BusinessProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDisplayPhone } from '../utils/formatters';

interface BulkStatementsModalProps {
  parties: Party[];
  transactions: Transaction[];
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onSelectPartyLedger: (party: Party) => void;
}

export const BulkStatementsModal: React.FC<BulkStatementsModalProps> = ({
  parties,
  transactions,
  profile,
  lang,
  onClose,
  onSelectPartyLedger,
}) => {
  const t = getTranslation(lang);
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';

  // Extract distinct regions
  const regions = useMemo(() => {
    const list = new Set<string>();
    parties.forEach((p) => {
      if (!p.isDeleted && p.type === 'CUSTOMER' && p.region && p.region.trim()) {
        list.add(p.region.trim());
      }
    });
    return Array.from(list).sort();
  }, [parties]);

  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const filteredDebtors = useMemo(() => {
    return parties
      .filter((p) => !p.isDeleted && p.type === 'CUSTOMER' && p.currentBalance > 0)
      .filter((p) => {
        if (selectedRegion === 'all') return true;
        return (p.region || '').toLowerCase() === selectedRegion.toLowerCase();
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [parties, selectedRegion]);

  const totalOutstanding = useMemo(() => {
    return filteredDebtors.reduce((sum, p) => sum + p.currentBalance, 0);
  }, [filteredDebtors]);

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <motion.div
      id="modal-bulk-statements-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <motion.div
        id="modal-bulk-statements-container"
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t.bulkStatementsTitle}</h2>
              <p className="text-[11px] text-slate-500">{t.bulkStatementsDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region selector bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 print:hidden text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span>{t.region}:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedRegion('all')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
              selectedRegion === 'all'
                ? 'bg-cyan-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.allRegions}
          </button>
          {regions.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
                selectedRegion === reg
                  ? 'bg-cyan-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Summary Card */}
        <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-200 flex items-center justify-between text-xs print:border-slate-300">
          <div>
            <span className="text-cyan-950 font-bold block">
              {selectedRegion === 'all' ? t.allRegions : selectedRegion} ({filteredDebtors.length} {isRtl ? 'عميل مدين' : 'debtors'})
            </span>
            <span className="text-[10px] text-cyan-700">{isRtl ? 'إجمالي الديون المستحقة للتحصيل' : 'Total Outstanding Receivables'}</span>
          </div>
          <span className="font-mono font-black text-base text-rose-600">
            {formatCurrency(totalOutstanding, currency, lang)}
          </span>
        </div>

        {/* Debtors List Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">{isRtl ? 'اسم العميل' : 'Client Name'}</th>
                <th className="p-2.5">{isRtl ? 'الجوال' : 'Phone'}</th>
                <th className="p-2.5">{t.region}</th>
                <th className="p-2.5 text-end font-mono">{isRtl ? 'الرصيد المستحق' : 'Debt'}</th>
                <th className="p-2.5 text-center print:hidden">{isRtl ? 'الكشف' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {isRtl ? 'لا توجد ديون مستحقة في هذه المنطقة' : 'No outstanding debtors in this district'}
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                    <td className="p-2.5 font-mono text-slate-600">{p.phone ? formatDisplayPhone(p.phone) : '-'}</td>
                    <td className="p-2.5 text-slate-600">{p.region || '-'}</td>
                    <td className="p-2.5 text-end font-mono font-bold text-rose-600">
                      {formatCurrency(p.currentBalance, currency, lang)}
                    </td>
                    <td className="p-2.5 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPartyLedger(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                      >
                        {isRtl ? 'فتح السجل' : 'Open'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
          >
            {t.close}
          </button>

          <button
            type="button"
            onClick={handlePrintManifest}
            className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/20 active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printRegionalManifest}</span>
          </button>
        </div>

        {/* Print Layout Header */}
        <div className="hidden print:block text-slate-900 p-4 border-b">
          <h1 className="text-lg font-bold">{profile.name} - {t.printRegionalManifest}</h1>
          <p className="text-xs">{t.region}: {selectedRegion === 'all' ? t.allRegions : selectedRegion}</p>
          <p className="text-xs">{new Date().toLocaleDateString()}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
