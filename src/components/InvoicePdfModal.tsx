import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Volume2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, sanitizePhoneNumber, buildWhatsAppMessage } from '../utils/formatters';
import { exportElementToPdf, sharePdfFile } from '../utils/pdfGenerator';
import { generateZatcaTlvQrString } from '../utils/zatca';
import { speakText } from '../utils/speechFeedback';

interface InvoicePdfModalProps {
  transaction: Transaction;
  party: Party;
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onVoidTransaction?: (txId: string) => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  transaction,
  party,
  profile,
  lang,
  onClose,
  onVoidTransaction,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zatcaQrUrl, setZatcaQrUrl] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const isSale = transaction.type === 'SALE_CREDIT';
  const isSupply = transaction.type === 'SUPPLY_CREDIT';
  const isReceipt = transaction.type === 'PAYMENT_RECEIVED';
  const isPayment = transaction.type === 'PAYMENT_PAID';

  const isVatApplied = Boolean(transaction.taxAmount && transaction.taxAmount > 0);

  const docTitle = isSale
    ? isVatApplied
      ? (isRtl ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice')
      : (isRtl ? 'فاتورة بيع آجل' : 'Credit Sale Invoice')
    : isSupply
    ? (isRtl ? 'سند توريد بالآجل' : 'Credit Supply Note')
    : isReceipt
    ? (isRtl ? 'سند قبض مالي' : 'Payment Receipt Voucher')
    : (isRtl ? 'سند صرف نقدي' : 'Payment Voucher');

  const pdfFileName = `${profile.name.replace(/\s+/g, '_')}_${docTitle.replace(/\s+/g, '_')}_${transaction.receiptNumber}.pdf`;

  // Pre-generate ZATCA QR Code
  useEffect(() => {
    try {
      const qrData = generateZatcaTlvQrString({
        sellerName: profile.name,
        vatNumber: profile.vatNumber || '',
        timestamp: transaction.date,
        totalAmount: transaction.totalAmount,
        vatAmount: isVatApplied ? (transaction.taxAmount || 0) : 0,
      });

      QRCode.toDataURL(qrData, { width: 140, margin: 1 })
        .then((url) => setZatcaQrUrl(url))
        .catch((e) => console.error('QR code generation error:', e));
    } catch (err) {
      console.error('Failed encoding QR:', err);
    }
  }, [profile, transaction, party, isVatApplied]);

  // Background pre-generate PDF Blob so iOS user click gesture is preserved instantly!
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const b = await exportElementToPdf('invoice-render-target', pdfFileName, false);
        if (mounted && b) {
          setPdfBlob(b);
          setPdfUrl(URL.createObjectURL(b));
        }
      } catch (e) {
        console.warn('Precomputing PDF failed:', e);
      }
    }, 450);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [profile, transaction, party, zatcaQrUrl, isVatApplied]);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    await exportElementToPdf('invoice-render-target', pdfFileName, true);
    setIsGenerating(false);
  };

  const handleSharePdf = async () => {
    setIsGenerating(true);
    setShareFeedback(null);
    try {
      const result = await sharePdfFile(
        'invoice-render-target',
        pdfFileName,
        `${docTitle} - #${transaction.receiptNumber}`,
        pdfBlob
      );
      if (result.success) {
        if (result.url) {
          setPdfUrl(result.url);
          setShareFeedback(isRtl ? 'تم تجهيز ملف PDF بنجاح!' : 'PDF ready!');
        }
      } else {
        alert(isRtl ? 'تعذر إنشاء ملف PDF. يرجى المحاولة مجدداً.' : 'Could not generate PDF. Please retry.');
      }
    } catch (err: any) {
      console.error('Share error:', err);
    } finally {
      setIsGenerating(false);
    }
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 md:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      <motion.div
        id="modal-invoice-pdf-container"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
        className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-4 md:p-6 space-y-4 shadow-2xl max-h-[96vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:p-0"
      >
        {/* Top Controls Bar (Hidden during Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 shadow-2xs">
              {transaction.receiptNumber}
            </span>
            <span className="text-xs font-bold text-slate-800">{docTitle}</span>
            {transaction.isVoided && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {isRtl ? 'ملغي' : 'Voided'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Void / Delete Transaction if not already voided */}
            {!transaction.isVoided && onVoidTransaction && (
              <button
                onClick={() => {
                  if (window.confirm(isRtl ? `هل أنت متأكد من إلغاء القيد رقم ${transaction.receiptNumber}؟` : `Void transaction ${transaction.receiptNumber}?`)) {
                    onVoidTransaction(transaction.id);
                    onClose();
                  }
                }}
                title={isRtl ? 'إلغاء القيد' : 'Void transaction'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRtl ? 'إلغاء' : 'Void'}</span>
              </button>
            )}

            {/* Audio Listen for Low-literacy Users */}
            <button
              onClick={() => {
                const remaining = transaction.totalAmount - transaction.paidAmount;
                const textToSpeak = isRtl
                  ? `${docTitle}، باسم ${party.name}. المبلغ الإجمالي ${transaction.totalAmount} ريال. المدفوع ${transaction.paidAmount} ريال. المتبقي ${remaining} ريال.`
                  : `${docTitle} for ${party.name}. Total amount ${transaction.totalAmount}. Paid ${transaction.paidAmount}. Remaining ${remaining}.`;
                speakText(textToSpeak, isRtl ? 'ar' : 'en');
              }}
              title={isRtl ? 'استمع للسند صوتيًا' : 'Listen out loud'}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors shadow-2xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">{isRtl ? 'استمع' : 'Listen'}</span>
            </button>

            {/* Share PDF File (iOS Share Sheet / Native Web Share) */}
            <button
              onClick={handleSharePdf}
              disabled={isGenerating}
              title={t.sharePdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isGenerating ? t.generatingPdf : t.sharePdf}
              </span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              title={t.downloadPdf}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300/60 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">PDF</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              title={t.printDocument}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/60 shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-1 scroll-smooth print:overflow-visible print:p-0">
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
                    <div className="w-10 h-10 rounded-lg bg-cyan-700 text-white flex items-center justify-center font-black text-lg">
                      {profile.name ? profile.name.charAt(0) : 'د'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-black text-stone-900">
                      {profile.name}
                    </h2>
                    <p className="text-xs text-stone-600">
                      {profile.phone}
                    </p>
                  </div>
                </div>

                {profile.taxNumber && (
                  <div className="text-xs text-stone-600 mt-1">
                    <span>{t.taxNumber}: </span>
                    <span className="font-mono font-bold">{profile.taxNumber}</span>
                  </div>
                )}
              </div>

              {/* Receipt / Invoice Details Box & ZATCA QR */}
              <div className="flex items-center gap-3">
                {zatcaQrUrl && (
                  <div className="p-1 bg-white border border-stone-200 rounded-lg shrink-0 shadow-2xs">
                    <img src={zatcaQrUrl} alt="ZATCA QR" className="w-16 h-16 object-contain" />
                  </div>
                )}
                <div className="text-end space-y-0.5">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-800 font-bold text-xs border border-cyan-200">
                    {docTitle}
                  </span>
                  <div className="font-mono font-black text-sm text-stone-900 mt-1">
                    #{transaction.receiptNumber}
                  </div>
                  <div className="text-xs text-stone-500">
                    {formatDate(transaction.date, lang)}
                  </div>
                </div>
              </div>
            </div>

            {/* Party Details (Customer or Supplier) */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {party.type === 'CUSTOMER' ? t.billTo : t.supplierFrom}
                </span>
                <div className="text-xs font-black text-stone-900 mt-0.5">
                  {party.name}
                </div>
                {party.phone && (
                  <div className="text-xs text-stone-600 font-mono">
                    {party.phone}
                  </div>
                )}
                {party.address && (
                  <div className="text-xs text-stone-500">
                    {party.address}
                  </div>
                )}
              </div>

              <div className="text-end">
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {t.currentBalance}
                </span>
                <div className="text-sm font-black font-mono text-stone-900 mt-0.5">
                  {formatCurrency(party.currentBalance, currency, lang)}
                </div>
                <span className="text-xs text-stone-500">
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
                    <tr className="border-b-2 border-stone-300 text-stone-600 text-xs">
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
              {transaction.discountAmount !== undefined && transaction.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>{isRtl ? 'الخصم / الحسم:' : 'Discount:'}</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(transaction.discountAmount, currency, lang)}
                  </span>
                </div>
              )}

              {transaction.taxAmount !== undefined && transaction.taxAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>{isRtl ? `ضريبة القيمة المضافة (${transaction.taxRate || 15}%):` : `VAT (${transaction.taxRate || 15}%):`}</span>
                  <span className="font-mono font-bold text-stone-800">
                    +{formatCurrency(transaction.taxAmount, currency, lang)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200 font-bold">
                <span className="text-stone-700">{t.invoiceTotal}:</span>
                <span className="font-black font-mono text-stone-900 text-sm">
                  {formatCurrency(transaction.totalAmount, currency, lang)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">{t.paidNow}:</span>
                <span className="font-bold font-mono text-cyan-700">
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

              {/* Visual Debt / Payment Status Badge for Low-literacy Users */}
              <div className="pt-1">
                {transaction.totalAmount <= transaction.paidAmount ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{isRtl ? 'مسدد بالكامل (خالص)' : 'Fully Paid (Settled)'}</span>
                    </span>
                    <span className="text-xs font-mono font-bold">{formatCurrency(0, currency, lang)}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>{isRtl ? 'متبقي آجل على الحساب:' : 'Remaining on Credit:'}</span>
                    </span>
                    <span className="text-xs font-mono font-black text-rose-700">
                      {formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, lang)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="font-bold">{t.partyNotes}: </span>
                <span>{transaction.notes}</span>
              </div>
            )}

            {/* Footer: Bank Details & Thank You note */}
            <div className="border-t border-stone-200 pt-4 space-y-2 text-xs text-stone-600">
              {profile.iban && (
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div className="font-bold text-stone-800 mb-1">
                    {t.bankDetails}
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
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
        {/* PDF Ready Direct Access Banner */}
        {pdfUrl && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5 truncate">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{shareFeedback || (isRtl ? 'ملف PDF جاهز للمشاركة والحفظ' : 'PDF ready for sharing & saving')}</span>
            </span>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={pdfFileName}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'فتح / حفظ PDF' : 'Open / Save PDF'}</span>
            </a>
          </div>
        )}

        {/* Bottom Fast Action Bar */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2 text-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/60 shadow-2xs transition-colors"
              title={isRtl ? 'نسخ نص السند للحافظة' : 'Copy text to clipboard'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ النص' : 'Copy Text')}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/60 shadow-2xs transition-colors"
              title={isRtl ? 'إرسال ملخص نصي عبر واتساب' : 'Send quick text via WhatsApp'}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.shareWhatsAppText}</span>
            </button>
          </div>

          <button
            onClick={handleSharePdf}
            disabled={isGenerating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-950/20 transition-all border border-emerald-400/30 disabled:opacity-75"
          >
            <Share2 className="w-4 h-4" />
            <span>{isGenerating ? t.generatingPdf : t.sharePdf}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
