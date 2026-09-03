import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Printer,
  Download,
  Share2,
  MessageSquare,
  Building2,
  Phone,
  Calendar,
  CheckCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';
import { exportElementToPdf, sharePdfFile } from '../utils/pdfGenerator';

interface InvoicePdfModalProps {
  transaction: Transaction;
  party: Party;
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  transaction,
  party,
  profile,
  lang,
  onClose,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSale = transaction.type === 'SALE_CREDIT';
  const isSupply = transaction.type === 'SUPPLY_CREDIT';
  const isReceipt = transaction.type === 'PAYMENT_RECEIVED';
  const isPayment = transaction.type === 'PAYMENT_PAID';

  const docTitle = isSale
    ? (isRtl ? 'فاتورة بيع بالآجل' : 'Credit Sale Invoice')
    : isSupply
    ? (isRtl ? 'فاتورة توريد بالآجل' : 'Supply Intake Invoice')
    : isReceipt
    ? (isRtl ? 'سند قبض مالي' : 'Receipt Voucher')
    : (isRtl ? 'سند صرف مالي' : 'Payment Voucher');

  const pdfFileName = `${profile.name.replace(/\s+/g, '_')}_${transaction.receiptNumber}.pdf`;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    await exportElementToPdf('invoice-render-target', pdfFileName);
    setIsGenerating(false);
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = sanitizePhoneNumber(party.phone);
    const msg = buildWhatsAppMessage(party, transaction, profile, lang);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const msg = decodeURIComponent(buildWhatsAppMessage(party, transaction, profile, lang));
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      id="modal-invoice-pdf-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 md:p-4 overflow-y-auto"
    >
      <motion.div
        id="modal-invoice-pdf-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 p-4 md:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden"
      >
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/50 shadow-2xs">
              {transaction.receiptNumber}
            </span>
            <span className="text-xs font-bold text-slate-200">{docTitle}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              title={t.shareWhatsApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              title={t.downloadPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/60 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">
                {isGenerating ? (isRtl ? 'جاري التحميل...' : 'Generating...') : 'PDF'}
              </span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              title={t.printDocument}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-1 scroll-smooth">
          {/* High quality clean paper canvas layout for printing/PDF */}
          <div
            id="invoice-render-target"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-white text-stone-900 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 font-sans border border-stone-200 text-xs"
            style={{
              fontFamily: isRtl ? 'var(--font-cairo), sans-serif' : 'var(--font-tajawal), sans-serif',
            }}
          >
            {/* Header: Business Profile, Logo, Receipt #, Date */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {profile.logoBase64 ? (
                    <img
                      src={profile.logoBase64}
                      alt="Logo"
                      className="w-12 h-12 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-lg">
                      {profile.name ? profile.name.charAt(0) : 'د'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-black text-stone-900">
                      {profile.name}
                    </h2>
                    <p className="text-[11px] text-stone-600">
                      {profile.phone}
                    </p>
                  </div>
                </div>

                {profile.taxNumber && (
                  <div className="text-[11px] text-stone-600 mt-1">
                    <span>{t.taxNumber}: </span>
                    <span className="font-mono font-bold">{profile.taxNumber}</span>
                  </div>
                )}
              </div>

              {/* Receipt / Invoice Details Box */}
              <div className="text-end space-y-0.5">
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                  {docTitle}
                </span>
                <div className="font-mono font-black text-sm text-stone-900 mt-1">
                  #{transaction.receiptNumber}
                </div>
                <div className="text-[10px] text-stone-500">
                  {formatDate(transaction.date, lang)}
                </div>
              </div>
            </div>

            {/* Party Details (Customer or Supplier) */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {party.type === 'CUSTOMER' ? t.billTo : t.supplierFrom}
                </span>
                <div className="text-xs font-black text-stone-900 mt-0.5">
                  {party.name}
                </div>
                {party.phone && (
                  <div className="text-[11px] text-stone-600 font-mono">
                    {party.phone}
                  </div>
                )}
                {party.address && (
                  <div className="text-[10px] text-stone-500">
                    {party.address}
                  </div>
                )}
              </div>

              <div className="text-end">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {t.currentBalance}
                </span>
                <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                  {formatCurrency(party.currentBalance, currency, lang)}
                </div>
                <span className="text-[10px] text-stone-500">
                  {party.type === 'CUSTOMER'
                    ? (isRtl ? 'ذمم مدينة مطلوبة' : 'Account Receivable')
                    : (isRtl ? 'ذمم دائنة مستحقة' : 'Account Payable')}
                </span>
              </div>
            </div>

            {/* Line Items Table (if any) */}
            {transaction.items && transaction.items.length > 0 && (
              <div className="space-y-2">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-300 text-stone-600 text-[11px]">
                      <th className="py-2 text-start font-bold">#</th>
                      <th className="py-2 text-start font-bold">{t.itemName}</th>
                      <th className="py-2 text-center font-bold">{t.quantity}</th>
                      <th className="py-2 text-end font-bold">{t.unitPrice}</th>
                      <th className="py-2 text-end font-bold">{t.subtotal}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {transaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-stone-400 font-mono">{idx + 1}</td>
                        <td className="py-2 font-semibold text-stone-900">{item.name}</td>
                        <td className="py-2 text-center font-mono">{item.quantity}</td>
                        <td className="py-2 text-end font-mono">
                          {formatCurrency(item.unitPrice, currency, lang)}
                        </td>
                        <td className="py-2 text-end font-mono font-bold text-stone-900">
                          {formatCurrency(item.subtotal, currency, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment & Ledger Balance Breakdown */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 ms-auto max-w-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">{t.invoiceTotal}:</span>
                <span className="font-black font-mono text-stone-900 text-sm">
                  {formatCurrency(transaction.totalAmount, currency, lang)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">{t.paidNow}:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {formatCurrency(transaction.paidAmount, currency, lang)}
                </span>
              </div>

              {(isSale || isSupply) && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-300">
                  <span className="font-bold text-rose-700">{t.remainingDebtDelta}:</span>
                  <span className="font-black font-mono text-rose-700">
                    +{formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, lang)}
                  </span>
                </div>
              )}

              {/* Net Balance Carried Forward */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-300 bg-white p-2 rounded-lg border">
                <span className="font-bold text-stone-800">{isRtl ? 'الرصيد التراكمي للحساب:' : 'Carried Balance:'}</span>
                <span className="font-black font-mono text-stone-900">
                  {formatCurrency(party.currentBalance, currency, lang)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="font-bold">{t.partyNotes}: </span>
                <span>{transaction.notes}</span>
              </div>
            )}

            {/* Footer: Bank Details & Thank You note */}
            <div className="border-t border-stone-200 pt-4 space-y-2 text-[11px] text-stone-600">
              {profile.iban && (
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div className="font-bold text-stone-800 mb-1">
                    {t.bankDetails}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                    <div>
                      <span>{t.bankName}: </span>
                      <span className="font-semibold text-stone-800">{profile.bankName}</span>
                    </div>
                    <div>
                      <span>{t.iban}: </span>
                      <span className="font-mono font-bold text-stone-900">{profile.iban}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-center font-medium text-stone-700 pt-1">
                {profile.invoiceFooterNote || t.thankYouNote}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Fast Action Bar */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs shrink-0">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700/60 shadow-2xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ نص السند' : 'Copy Text')}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/30 transition-all active:scale-98 border border-emerald-400/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إرسال السند عبر واتساب' : 'Send via WhatsApp'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
