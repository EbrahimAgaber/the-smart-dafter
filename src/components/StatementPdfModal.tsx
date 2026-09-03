import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Printer,
  Download,
  MessageSquare,
  Building2,
  Calendar,
  FileSpreadsheet,
  Copy,
  Check,
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';
import { exportElementToPdf } from '../utils/pdfGenerator';

interface StatementPdfModalProps {
  party: Party;
  transactions: Transaction[];
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
}

export const StatementPdfModal: React.FC<StatementPdfModalProps> = ({
  party,
  transactions,
  profile,
  lang,
  onClose,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const isCustomer = party.type === 'CUSTOMER';
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute ascending ledger entries with rolling running balances
  const statementRows = useMemo(() => {
    const sortedAsc = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let rolling = Number(party.openingBalance) || 0;
    return sortedAsc.map((tx, index) => {
      let debit = 0;
      let credit = 0;

      if (!tx.isVoided) {
        if (isCustomer) {
          if (tx.type === 'SALE_CREDIT') {
            debit = tx.totalAmount - tx.paidAmount;
            rolling += debit;
          } else if (tx.type === 'PAYMENT_RECEIVED') {
            credit = tx.paidAmount;
            rolling -= credit;
          }
        } else {
          // Distributor
          if (tx.type === 'SUPPLY_CREDIT') {
            credit = tx.totalAmount - tx.paidAmount;
            rolling += credit;
          } else if (tx.type === 'PAYMENT_PAID') {
            debit = tx.paidAmount;
            rolling -= debit;
          }
        }
      }

      return {
        index: index + 1,
        tx,
        debit,
        credit,
        runningBalance: Math.round(rolling * 100) / 100,
      };
    });
  }, [transactions, isCustomer, party.openingBalance]);

  const pdfFileName = `${profile.name.replace(/\s+/g, '_')}_Statement_${party.name.replace(/\s+/g, '_')}.pdf`;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    await exportElementToPdf('statement-render-target', pdfFileName, true);
    setIsGenerating(false);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = sanitizePhoneNumber(party.phone);
    const msg = buildWhatsAppMessage(party, null, profile, lang);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const msg = decodeURIComponent(buildWhatsAppMessage(party, null, profile, lang));
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      id="modal-statement-pdf-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 md:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <motion.div
        id="modal-statement-pdf-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-4 md:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:p-0"
      >
        {/* Top Controls Bar */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-slate-800">
              {t.statementHeaderTitle} - {party.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsAppShare}
              title={t.shareWhatsApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              title={t.downloadPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300/60 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">
                {isGenerating ? (isRtl ? 'جاري التصدير...' : 'Generating...') : 'PDF'}
              </span>
            </button>

            <button
              onClick={handlePrint}
              title={t.printDocument}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-750 text-slate-700 border border-slate-300/60 shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-1 scroll-smooth">
          <div
            id="statement-render-target"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-white text-stone-900 p-6 md:p-8 rounded-2xl shadow-xl space-y-5 font-sans border border-stone-200 text-xs"
            style={{
              fontFamily: isRtl ? 'var(--font-cairo), sans-serif' : 'var(--font-tajawal), sans-serif',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-stone-800 pb-4">
              <div>
                <h1 className="text-base font-black text-stone-900">
                  {profile.name}
                </h1>
                <p className="text-xs text-stone-600 font-medium">
                  {profile.phone}
                </p>
                {profile.taxNumber && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t.taxNumber}: <span className="font-mono font-bold">{profile.taxNumber}</span>
                  </p>
                )}
              </div>

              <div className="text-end">
                <span className="inline-block px-2.5 py-1 rounded-md bg-stone-900 text-white font-bold text-xs tracking-wide">
                  {t.statementHeaderTitle}
                </span>
                <div className="text-xs text-stone-500 mt-1">
                  <span>{t.createdOn}: </span>
                  <span className="font-bold">{formatDate(new Date().toISOString(), lang)}</span>
                </div>
              </div>
            </div>

            {/* Account Summary Banner */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {isCustomer ? t.billTo : t.supplierFrom}
                </span>
                <div className="text-sm font-black text-stone-900 mt-0.5">
                  {party.name}
                </div>
                <div className="text-xs text-stone-600 font-mono">
                  {party.phone}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {t.partyType}
                </span>
                <div className="text-xs font-bold text-stone-800 mt-1">
                  {isCustomer ? t.customer : t.distributor}
                </div>
                <div className="text-xs text-stone-500">
                  {transactions.length} {t.items}
                </div>
              </div>

              <div className="text-end col-span-2 sm:col-span-1">
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {t.currentBalance}
                </span>
                <div
                  className={`text-base font-black font-mono mt-0.5 ${
                    party.currentBalance > 0
                      ? isCustomer
                        ? 'text-rose-700'
                        : 'text-amber-700'
                      : 'text-cyan-700'
                  }`}
                >
                  {formatCurrency(party.currentBalance, currency, lang)}
                </div>
                <span className="text-xs text-stone-500">
                  {party.currentBalance === 0
                    ? t.settled
                    : isCustomer
                    ? t.customerOwes
                    : t.merchantOwes}
                </span>
              </div>
            </div>

            {/* Statement Table */}
            <div className="space-y-2">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-700 text-xs bg-stone-100/60">
                    <th className="py-2.5 px-2 text-start font-bold">#</th>
                    <th className="py-2.5 px-2 text-start font-bold">{t.date}</th>
                    <th className="py-2.5 px-2 text-start font-bold">{t.refNumber}</th>
                    <th className="py-2.5 px-2 text-start font-bold">{t.description}</th>
                    <th className="py-2.5 px-2 text-end font-bold text-rose-800">{t.debit}</th>
                    <th className="py-2.5 px-2 text-end font-bold text-cyan-800">{t.credit}</th>
                    <th className="py-2.5 px-2 text-end font-bold text-stone-900">{t.runningBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-800">
                  {statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-stone-500 italic">
                        {t.noTransactionsYet}
                      </td>
                    </tr>
                  ) : (
                    statementRows.map((row) => (
                      <tr key={row.tx.id} className="hover:bg-stone-50">
                        <td className="py-2 px-2 text-stone-400 font-mono text-xs">
                          {row.index}
                        </td>
                        <td className="py-2 px-2 text-stone-600 text-xs whitespace-nowrap">
                          {formatDate(row.tx.date, lang)}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-stone-800 text-xs whitespace-nowrap">
                          {row.tx.receiptNumber}
                        </td>
                        <td className="py-2 px-2 text-stone-900 text-xs max-w-[200px] truncate">
                          {row.tx.notes || (row.tx.type === 'SALE_CREDIT' ? t.creditSaleTitle : row.tx.type === 'PAYMENT_RECEIVED' ? t.receiptTitle : t.supplyIntakeTitle)}
                        </td>
                        <td className="py-2 px-2 text-end font-mono text-xs font-bold text-rose-700">
                          {row.debit > 0 ? formatCurrency(row.debit, currency, lang) : '-'}
                        </td>
                        <td className="py-2 px-2 text-end font-mono text-xs font-bold text-cyan-700">
                          {row.credit > 0 ? formatCurrency(row.credit, currency, lang) : '-'}
                        </td>
                        <td className="py-2 px-2 text-end font-mono text-xs font-black text-stone-900">
                          {formatCurrency(row.runningBalance, currency, lang)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bank Info & Statement Sign-off */}
            <div className="border-t border-stone-200 pt-4 grid grid-cols-2 gap-4 text-xs text-stone-600">
              <div>
                {profile.iban && (
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <div className="font-bold text-stone-800 mb-0.5">{t.bankDetails}</div>
                    <div>{profile.bankName}</div>
                    <div className="font-mono font-bold text-stone-900">{profile.iban}</div>
                  </div>
                )}
              </div>

              <div className="text-end flex flex-col justify-end">
                <p className="font-bold text-stone-900">{profile.name}</p>
                <p className="text-xs text-stone-500 mt-4">
                  {isRtl ? 'الختم والتوقيع المعتمد' : 'Authorized Signature'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fast Action Bar */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-750 text-slate-700 font-semibold border border-slate-300/60 shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ نص الكشف' : 'Copy Text')}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-950/30 transition-all active:scale-98 border border-cyan-400/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.shareWhatsApp}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
