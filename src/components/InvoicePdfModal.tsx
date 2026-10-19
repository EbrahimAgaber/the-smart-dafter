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
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatDate, sanitizePhoneNumber, formatLocalPhoneInput, buildWhatsAppMessage, openExternalUrl } from '../utils/formatters';
import type { jsPDF } from 'jspdf';
import { generateInvoicePdf, shareOrDownloadPdf } from '../utils/pdfGenerator';
import { generateZatcaTlvQrString } from '../utils/zatca';
import { sharePdfToWhatsApp } from '../utils/whatsappShare';
import { verifyPdfBlobIntegrity, type PdfIntegrityResult, type IntegrityCheckStatus } from '../utils/pdfIntegrity';
import { getDocumentNaming } from '../utils/messageEngine';

interface InvoicePdfModalProps {
  transaction: Transaction;
  party: Party;
  profile: BusinessProfile;
  lang: Language;
  onClose: () => void;
  onVoidTransaction?: (txId: string) => void;
  onConvertToInvoice?: (quotationTx: Transaction) => void;
  onEditInvoice?: (tx: Transaction) => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  transaction,
  party,
  profile,
  lang,
  onClose,
  onVoidTransaction,
  onConvertToInvoice,
  onEditInvoice,
}) => {
  const t = getTranslation(lang);
  const currency = profile.currency || 'SAR';
  const isRtl = lang === 'ar';
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zatcaQrUrl, setZatcaQrUrl] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  // Automated File Integrity Checker & Local Memory Cache State
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityCheckStatus>('checking');
  const [integrityResult, setIntegrityResult] = useState<PdfIntegrityResult | null>(null);
  const [integrityError, setIntegrityError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [whatsAppNotice, setWhatsAppNotice] = useState<{ text: string; fileName?: string } | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>(() => formatLocalPhoneInput(party.phone || ''));
  const [pdfFormat, setPdfFormat] = useState<'MOBILE_PHONE' | 'A4' | 'THERMAL_80MM'>('MOBILE_PHONE');

  const isSale = transaction.type === 'SALE_CREDIT';
  const isSupply = transaction.type === 'SUPPLY_CREDIT';
  const isReceipt = transaction.type === 'PAYMENT_RECEIVED';
  const isPayment = transaction.type === 'PAYMENT_PAID';
  const isQuotation = transaction.type === 'QUOTATION';
  const isReturn = transaction.type === 'RETURN_SALE';

  const isVatApplied = Boolean(transaction.taxAmount && transaction.taxAmount > 0);
  const docNaming = getDocumentNaming(transaction.type, lang, isVatApplied);
  const docTitle = docNaming.title;

  const pdfFileName = `${profile.name.replace(/\s+/g, '_')}_${docTitle.replace(/\s+/g, '_')}_${transaction.receiptNumber}.pdf`;

  // Pre-generate ZATCA QR Code
  useEffect(() => {
    try {
      const qrData = generateZatcaTlvQrString({
        sellerName: profile.name,
        vatNumber: profile.taxNumber || '',
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

  // Check if invoice can be modified (strictly allowed within 5 days of issuance and not voided)
  const modificationStatus = useMemo(() => {
    if (!transaction) return { allowed: false, reason: 'الفاتورة غير موجودة' };
    if (transaction.isVoided) {
      return {
        allowed: false,
        reason: isRtl ? 'لا يمكن تعديل فاتورة ملغاة ومبطلة' : 'Cannot edit a voided invoice',
      };
    }
    const txTime = new Date(transaction.date).getTime();
    if (isNaN(txTime)) {
      return { allowed: false, reason: isRtl ? 'تاريخ الفاتورة غير صالح' : 'Invalid invoice date' };
    }
    const now = Date.now();
    const elapsedMs = now - txTime;
    const maxMs = 5 * 24 * 60 * 60 * 1000; // 5 days (120 hours)
    if (elapsedMs > maxMs) {
      return {
        allowed: false,
        reason: isRtl
          ? 'انتهت مهلة التعديل (مسموح بتعديل الفاتورة خلال 5 أيام فقط من تاريخ إصدارها)'
          : 'Modification period expired (allowed for 5 days after issuance only)',
        remainingDays: 0,
        remainingHours: 0,
      };
    }
    const remainingMs = Math.max(0, maxMs - elapsedMs);
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingDays = Math.ceil(remainingHours / 24);
    return {
      allowed: true,
      remainingDays,
      remainingHours,
    };
  }, [transaction, isRtl]);

  // Invoice summary metric calculations
  const totalUnitsSold = useMemo(() => {
    return (transaction.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [transaction.items]);

  const itemsSubtotal = useMemo(() => {
    if (transaction.items && transaction.items.length > 0) {
      return Math.round(transaction.items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0) * 100) / 100;
    }
    return transaction.subtotalBeforeTax ?? transaction.totalAmount;
  }, [transaction]);

  // Check if invoice is VAT inclusive / has VAT applied
  const hasVat = Boolean(
    transaction.taxAmount !== undefined &&
    transaction.taxAmount > 0 &&
    (transaction.taxRate ?? 0) > 0
  );

  // Automated File Integrity Checker: validates presence, structure, header (%PDF-), and local memory cache
  const runAutomatedIntegrityCheck = async (providedBlob?: Blob): Promise<{ success: boolean; blob: Blob | null; result?: PdfIntegrityResult }> => {
    setIntegrityStatus('checking');
    setIntegrityError(null);
    try {
      let targetBlob = providedBlob || pdfBlob;
      if (!targetBlob) {
        const doc = await generateInvoicePdf({
          profile,
          transaction,
          party,
          zatcaQrDataUrl: zatcaQrUrl || undefined,
          isVatApplied,
          lang,
          format: pdfFormat,
        });
        targetBlob = doc.output('blob');
      }

      // Automated deep binary inspection & header verification
      const checkResult = await verifyPdfBlobIntegrity(targetBlob);
      if (!checkResult.valid || !checkResult.cachedInMemory) {
        setIntegrityStatus('failed');
        setIntegrityError(checkResult.error || (isRtl ? 'تعذر التحقق من سلامة ملف الـ PDF' : 'Document integrity check failed'));
        return { success: false, blob: null, result: checkResult };
      }

      // Cached in local memory & verified
      setPdfBlob(targetBlob);
      setIntegrityResult(checkResult);
      setIntegrityStatus('verified');
      if (!pdfUrl) {
        setPdfUrl(URL.createObjectURL(targetBlob));
      }
      return { success: true, blob: targetBlob, result: checkResult };
    } catch (err: any) {
      console.error('Automated file integrity check error:', err);
      setIntegrityStatus('failed');
      setIntegrityError(err?.message || (isRtl ? 'خطأ أثناء فحص سلامة الملف' : 'Integrity check error'));
      return { success: false, blob: null };
    }
  };

  // Precompute PDF Blob and automatically verify file integrity once mounted or format toggled
  useEffect(() => {
    let mounted = true;
    let activeUrl: string | null = null;
    setIntegrityStatus('checking');
    setIntegrityError(null);

    const timer = setTimeout(async () => {
      try {
        const doc = await generateInvoicePdf({
          profile,
          transaction,
          party,
          zatcaQrDataUrl: zatcaQrUrl || undefined,
          isVatApplied,
          lang,
          format: pdfFormat,
        });
        if (mounted) {
          const blob = doc.output('blob');
          const check = await verifyPdfBlobIntegrity(blob);
          if (check.valid && check.cachedInMemory) {
            setPdfBlob(blob);
            setIntegrityResult(check);
            setIntegrityStatus('verified');
            activeUrl = URL.createObjectURL(blob);
            setPdfUrl(activeUrl);
          } else {
            setIntegrityStatus('failed');
            setIntegrityError(check.error || 'Failed integrity inspection');
          }
        }
      } catch (e: any) {
        console.warn('Precomputing Invoice PDF failed:', e);
        if (mounted) {
          setIntegrityStatus('failed');
          setIntegrityError(e?.message || 'Invoice PDF generation error');
        }
      }
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [profile, transaction, party, zatcaQrUrl, isVatApplied, lang, pdfFormat]);

  // Automated Gate: verifies existence of cached invoice Blob before allowing any share
  const ensureVerifiedPdfBlob = async (): Promise<Blob | null> => {
    if (pdfBlob && integrityStatus === 'verified') {
      const fastCheck = await verifyPdfBlobIntegrity(pdfBlob);
      if (fastCheck.valid && fastCheck.cachedInMemory) {
        return pdfBlob;
      }
    }
    const res = await runAutomatedIntegrityCheck();
    return res.success ? res.blob : null;
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      if (pdfBlob && integrityStatus === 'verified') {
        const url = pdfUrl || URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const doc = await generateInvoicePdf({
          profile,
          transaction,
          party,
          zatcaQrDataUrl: zatcaQrUrl || undefined,
          isVatApplied,
          lang,
          format: pdfFormat,
        });
        doc.save(pdfFileName);
      }
    } catch (err) {
      console.error('Invoice PDF download error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSharePdf = async () => {
    const targetPhone = (recipientPhone || '').trim() || party.phone || '';
    if (targetPhone) {
      return handleSendPdfToWhatsApp();
    }

    setIsGenerating(true);
    setShareFeedback(null);
    try {
      // 1. Automated Integrity Check Gate: Verify existence of Blob in local memory
      const verifiedBlob = await ensureVerifiedPdfBlob();
      if (!verifiedBlob) {
        setShareFeedback(isRtl ? 'تعذر إرسال المستند: فشل التحقق من سلامة ملف الـ PDF بالذاكرة.' : 'Document share prevented: PDF file integrity check failed in memory.');
        setIsGenerating(false);
        return;
      }

      // Generation finished, release UI immediately so returning from external share is responsive
      setIsGenerating(false);

      const result = await shareOrDownloadPdf(
        null,
        pdfFileName,
        `${docTitle} - #${transaction.receiptNumber}`,
        verifiedBlob
      );
      if (result.success) {
        setShareFeedback(isRtl ? 'تم تجهيز ومشاركة ملف PDF بنجاح!' : 'PDF ready and shared!');
      } else {
        setShareFeedback(isRtl ? 'تعذر إنشاء ملف PDF. يرجى المحاولة مجدداً.' : 'Could not generate PDF. Please retry.');
      }
    } catch (err: any) {
      console.error('Share error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendPdfToWhatsApp = async () => {
    setIsGenerating(true);
    setWhatsAppNotice(null);
    try {
      // 1. Automated Integrity Check Gate: Verify existence of Blob in local memory
      const verifiedBlob = await ensureVerifiedPdfBlob();
      if (!verifiedBlob) {
        setWhatsAppNotice({
          text: isRtl
            ? 'تنبيه: تعذر إرسال المستند لعدم اجتياز فحص سلامة الملف في الذاكرة. يرجى إعادة محاولة الفحص.'
            : 'Alert: Cannot share document because file integrity check failed in memory. Please retry.',
        });
        setIsGenerating(false);
        return;
      }

      setIsGenerating(false);

      const res = await sharePdfToWhatsApp({
        pdfBlob: verifiedBlob,
        fileName: pdfFileName,
        party,
        transaction,
        profile,
        lang,
        recipientPhone,
        mode: 'file',
      });

      if (res.method === 'native_file_share') {
        setWhatsAppNotice({
          text: isRtl
            ? 'تم فتح نافذة مشاركة ملف الـ PDF مباشرة! اختر واتساب لإرسال ملف الفاتورة.'
            : 'Opened native share sheet with PDF file attached! Select WhatsApp to send.',
          fileName: res.fileName,
        });
      } else if (res.cleanPhone) {
        setWhatsAppNotice({
          text: isRtl
            ? `تم تنزيل ملف PDF الفاتورة (${res.fileName}) بجهازك وفتح محادثة العميل (${res.cleanPhone}) في واتساب.`
            : `Downloaded invoice PDF (${res.fileName}) and opened WhatsApp chat with ${res.cleanPhone}.`,
          fileName: res.fileName,
        });
      } else {
        setWhatsAppNotice({
          text: isRtl
            ? `تم تنزيل ملف PDF الفاتورة (${res.fileName}) بجهازك وفتح واتساب.`
            : `Downloaded invoice PDF (${res.fileName}) and opened WhatsApp.`,
          fileName: res.fileName,
        });
      }
    } catch (err: any) {
      console.error('handleSendPdfToWhatsApp error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSystemSharePdf = async () => {
    setIsGenerating(true);
    setWhatsAppNotice(null);
    try {
      // 1. Automated Integrity Check Gate: Verify existence of Blob in local memory
      const verifiedBlob = await ensureVerifiedPdfBlob();
      if (!verifiedBlob) {
        setWhatsAppNotice({
          text: isRtl
            ? 'تعذر مشاركة المستند: فشل فحص سلامة ملف الـ PDF في الذاكرة.'
            : 'Cannot share document: PDF file integrity check failed in memory.',
        });
        setIsGenerating(false);
        return;
      }

      setIsGenerating(false);

      const res = await sharePdfToWhatsApp({
        pdfBlob: verifiedBlob,
        fileName: pdfFileName,
        party,
        transaction,
        profile,
        lang,
        recipientPhone,
        mode: 'system_share',
      });

      if (res.method === 'native_file_share') {
        setWhatsAppNotice({
          text: isRtl ? 'تم فتح نافذة مشاركة النظام كملف PDF!' : 'Native OS share sheet opened with PDF file attached!',
          fileName: res.fileName,
        });
      }
    } catch (err: any) {
      console.error('handleSystemSharePdf error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendTextToWhatsApp = () => {
    setWhatsAppNotice(null);
    sharePdfToWhatsApp({
      fileName: pdfFileName,
      party,
      transaction,
      profile,
      lang,
      recipientPhone,
      mode: 'text',
    });
    setWhatsAppNotice({
      text: isRtl
        ? 'تم فتح محادثة الواتساب مع إرسال الملخص النصي!'
        : 'Opened WhatsApp with invoice text summary!',
    });
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


            {/* Convert Quotation to Invoice Button */}
            {isQuotation && !transaction.isQuotationConverted && onConvertToInvoice && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(transaction);
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
              >
                <span>{t.convertToInvoice}</span>
              </button>
            )}

            {/* Edit Invoice Button (within 5-day grace period) */}
            {onEditInvoice && !isReceipt && !isPayment && (
              <button
                type="button"
                onClick={() => {
                  if (modificationStatus.allowed) {
                    onEditInvoice(transaction);
                  } else {
                    alert(modificationStatus.reason);
                  }
                }}
                title={modificationStatus.allowed
                  ? `${t.editInvoice} (${isRtl ? `متبقي ${modificationStatus.remainingDays} أيام` : `${modificationStatus.remainingDays} days remaining`})`
                  : modificationStatus.reason}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  modificationStatus.allowed
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/10 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t.editInvoice}</span>
                {modificationStatus.allowed && modificationStatus.remainingDays !== undefined && (
                  <span className="bg-amber-600/70 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                    {modificationStatus.remainingDays} {isRtl ? 'ي' : 'd'}
                  </span>
                )}
              </button>
            )}

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

        {/* Format Selector Bar for Phone, A4, and Thermal 80mm */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 px-1">
              {isRtl ? 'تنسيق وحجم ملف الـ PDF:' : 'PDF File Format:'}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {isRtl ? '(اختر قياس الهاتف لقراءة الخط بوضوح تام دون تكبير)' : '(Select phone format for large legible text)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setPdfFormat('MOBILE_PHONE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs ${
                pdfFormat === 'MOBILE_PHONE'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>📱</span>
              <span>{isRtl ? 'مخصص للهاتف (خط كبير بدون تكبير)' : 'Mobile Phone (Large)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPdfFormat('A4')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs ${
                pdfFormat === 'A4'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>📄</span>
              <span>{isRtl ? 'ورق رسمي A4' : 'A4 Sheet'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPdfFormat('THERMAL_80MM')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs ${
                pdfFormat === 'THERMAL_80MM'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>🧾</span>
              <span>{isRtl ? 'حراري 80mm' : 'Thermal 80mm'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-1 scroll-smooth print:overflow-visible print:p-0">
          {/* High quality clean paper canvas layout for printing/PDF */}
          <div
            id="invoice-render-target"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="bg-white text-stone-900 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 font-sans border border-stone-200 text-sm sm:text-base"
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
                    <h2 className="text-base sm:text-lg font-black text-stone-900">
                      {profile.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600">
                      {profile.phone}
                    </p>
                  </div>
                </div>

                {profile.crNumber && (
                  <div className="text-xs sm:text-sm text-stone-600 mt-1">
                    <span>{t.crNumber}: </span>
                    <span className="font-mono font-bold">{profile.crNumber}</span>
                  </div>
                )}

                {profile.taxNumber && (
                  <div className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    <span>{t.taxNumber}: </span>
                    <span className="font-mono font-bold">{profile.taxNumber}</span>
                  </div>
                )}

                {profile.address && (
                  <div className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    <span>{t.businessAddress}: </span>
                    <span className="font-medium">{profile.address}</span>
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
                  <span className={`inline-block px-2.5 py-1 rounded-md ${docNaming.badgeBg} ${docNaming.badgeText} font-bold text-xs sm:text-sm border ${docNaming.badgeBorder}`}>
                    {docTitle}
                  </span>
                  <div className="font-mono font-black text-sm sm:text-base text-stone-900 mt-1">
                    #{transaction.receiptNumber}
                  </div>
                  <div className="text-xs sm:text-sm text-stone-500">
                    {formatDate(transaction.date, lang)}
                  </div>
                </div>
              </div>
            </div>

            {/* Party Details (Customer or Supplier) */}
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-stone-500 block">
                  {docNaming.recipientLabel}
                </span>
                <div className="text-sm sm:text-base font-black text-stone-900 mt-0.5">
                  {party.name}
                </div>
                {party.phone && (
                  <div className="text-xs sm:text-sm text-stone-600 font-mono">
                    {party.phone}
                  </div>
                )}
                {party.address && (
                  <div className="text-xs text-stone-500">
                    {party.address}
                  </div>
                )}
              </div>

              {isQuotation ? (
                <div className="text-end">
                  <span className="text-xs uppercase font-bold text-indigo-600 block">
                    {isRtl ? 'الأثر المالي للعرض' : 'Financial Impact'}
                  </span>
                  <div className="text-sm sm:text-base font-black text-indigo-900 mt-0.5">
                    {isRtl ? 'لا يترتب أي دين (0.00 ر.س)' : 'Zero Debt (0.00 SAR)'}
                  </div>
                  <span className="text-[11px] text-indigo-600">
                    {isRtl ? 'عرض سعر تقديري غير ملزم' : 'Non-binding price quote'}
                  </span>
                </div>
              ) : (
                <div className="text-end">
                  <span className="text-xs uppercase font-bold text-stone-500 block">
                    {t.currentBalance}
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-stone-900 mt-0.5">
                    {formatCurrency(party.currentBalance, currency, lang)}
                  </div>
                  <span className="text-xs text-stone-500">
                    {party.type === 'CUSTOMER'
                      ? (isRtl ? 'ذمم مدينة مطلوبة' : 'Account Receivable')
                      : (isRtl ? 'ذمم دائنة مستحقة' : 'Account Payable')}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items Table (if any) */}
            {transaction.items && transaction.items.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <table className="w-full text-start border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-stone-300 text-stone-600">
                        <th className="py-2.5 text-start font-bold">#</th>
                        <th className="py-2.5 text-start font-bold">{t.itemName}</th>
                        <th className="py-2.5 text-center font-bold">{t.quantity}</th>
                        <th className="py-2.5 text-end font-bold">{t.unitPrice}</th>
                        <th className="py-2.5 text-end font-bold">{t.subtotal}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 text-stone-800">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 text-stone-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 font-semibold text-stone-900">{item.name}</td>
                          <td className="py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="py-2.5 text-end font-mono">
                            {formatCurrency(item.unitPrice, currency, lang)}
                          </td>
                          <td className="py-2.5 text-end font-mono font-bold text-stone-900">
                            {formatCurrency(item.subtotal, currency, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Simple Unified Financial Summary (ملخص الفاتورة الموحد والبسيط) */}
            <div className="bg-stone-50/90 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-2.5 ms-auto max-w-sm sm:max-w-md w-full shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>{isRtl ? 'ملخص الفاتورة' : 'Invoice Summary'}</span>
                <span className="font-mono text-stone-400">#{transaction.receiptNumber}</span>
              </div>

              {/* Row 1: Quantity Sold (الكمية المباعة) */}
              {totalUnitsSold > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                  <span className="font-medium">{isRtl ? 'إجمالي الكمية المباعة:' : 'Total Quantity Sold:'}</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                    {totalUnitsSold} {isRtl ? 'قطعة' : 'Units'}
                  </span>
                </div>
              )}

              {/* Row 2: Sub Total (المجموع الفرعي) */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                <span className="font-medium">{isRtl ? 'المجموع الفرعي للأصناف:' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatCurrency(itemsSubtotal, currency, lang)}
                </span>
              </div>

              {/* Row 3: Discount (الخصم / الحسم) - User can add / edit discount */}
              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{isRtl ? 'الخصم / الحسم:' : 'Discount:'}</span>
                  {modificationStatus.allowed && onEditInvoice && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditInvoice(transaction);
                      }}
                      className="text-[11px] text-cyan-700 hover:text-cyan-800 underline font-bold"
                      title={isRtl ? 'تعديل أو إضافة خصم على الفاتورة' : 'Add or edit discount'}
                    >
                      {transaction.discountAmount && transaction.discountAmount > 0
                        ? (isRtl ? 'تعديل الخصم' : 'Edit')
                        : (isRtl ? '+ إضافة خصم' : '+ Add Discount')}
                    </button>
                  )}
                </div>
                <span className={`font-mono font-bold ${transaction.discountAmount && transaction.discountAmount > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                  {transaction.discountAmount && transaction.discountAmount > 0
                    ? `-${formatCurrency(transaction.discountAmount, currency, lang)}`
                    : formatCurrency(0, currency, lang)}
                </span>
              </div>

              {/* Row 4: VAT (ضريبة القيمة المضافة) - ONLY appears if invoice is VAT inclusive / taxAmount > 0 */}
              {hasVat && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">
                      {isRtl ? `ضريبة القيمة المضافة (${transaction.taxRate || 15}%):` : `VAT (${transaction.taxRate || 15}%):`}
                    </span>
                    <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded font-bold">
                      {isRtl ? 'شامل' : 'Inclusive'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-stone-800">
                    +{formatCurrency(transaction.taxAmount!, currency, lang)}
                  </span>
                </div>
              )}

              {/* Row 5: Total (الإجمالي النهائي) */}
              <div className="flex items-center justify-between text-sm sm:text-base pt-2 border-t-2 border-stone-300 font-bold">
                <span className="text-stone-900 font-black">
                  {isQuotation
                    ? (isRtl ? 'إجمالي عرض السعر التقديري:' : 'Quotation Total Estimate:')
                    : `${t.invoiceTotal}:`}
                </span>
                <span className={`font-black font-mono text-base sm:text-lg ${isQuotation ? 'text-indigo-800' : 'text-cyan-800'}`}>
                  {formatCurrency(transaction.totalAmount, currency, lang)}
                </span>
              </div>

              {/* Paid Now (Invoices and returns only, never on quotations) */}
              {!isQuotation && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-600 font-medium">{t.paidNow}:</span>
                  <span className="font-bold font-mono text-cyan-700">
                    {formatCurrency(transaction.paidAmount, currency, lang)}
                  </span>
                </div>
              )}

              {isQuotation ? (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span>{isRtl ? '⏱️ مدة سريان العرض:' : '⏱️ Validity Period:'}</span>
                    <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      {transaction.quotationValidityDays || 15} {isRtl ? 'يوم' : 'Days'}
                    </span>
                  </div>
                  {transaction.quotationTerms && (
                    <div className="pt-1 border-t border-indigo-200/60 text-[11px] text-indigo-900">
                      <span className="font-bold">{isRtl ? '📜 الشروط والأحكام: ' : '📜 Terms: '}</span>
                      <span>{transaction.quotationTerms}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-indigo-700 pt-0.5">
                    {isRtl
                      ? 'عرض سعر تقديري - لا يترتب عليه أي التزام مالي حالي حتى اعتماده وتحويله لفاتورة مبيعات'
                      : 'Draft estimate - No current financial obligation until approved and converted to invoice'}
                  </p>
                </div>
              ) : isReturn ? (
                <>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-300">
                    <span className="font-bold text-rose-700">{isRtl ? 'المخصوم من رصيد العميل:' : 'Deducted from Debt:'}</span>
                    <span className="font-black font-mono text-rose-700">
                      -{formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-300 bg-white p-2 rounded-lg border">
                    <span className="font-bold text-stone-800">{isRtl ? 'الرصيد المتبقي بعد الإشعار:' : 'Balance After Note:'}</span>
                    <span className="font-black font-mono text-stone-900">
                      {formatCurrency(party.currentBalance, currency, lang)}
                    </span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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

              {!isQuotation && (
                <p className="text-center font-medium text-stone-700 pt-1">
                  {profile.invoiceFooterNote || t.thankYouNote}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Automated File Integrity Checker & Local Memory Cache UI Indicator */}
        <div className="rounded-2xl transition-all duration-200">
          {integrityStatus === 'verified' && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-300 shadow-2xs space-y-1.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-emerald-950">
                        {isRtl ? 'المستند جاهز للمشاركة' : 'Document Ready to Share'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-bold border border-emerald-300/80">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span>{isRtl ? 'محفوظ في الذاكرة' : 'Cached in Local Memory'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-700 pt-0.5">
                      <span className="font-semibold">{integrityResult?.formattedSize || '42 KB'}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{integrityResult?.header || '%PDF-1.4'}</span>
                      <span>•</span>
                      <span>{isRtl ? 'سليم ومفحوص 100%' : 'Integrity Verified (100%)'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => runAutomatedIntegrityCheck()}
                    title={isRtl ? 'إعادة فحص سلامة الملف' : 'Recheck document integrity'}
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-emerald-800 border border-emerald-200 shadow-2xs transition-all active:scale-95 text-xs flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">{isRtl ? 'إعادة الفحص' : 'Recheck'}</span>
                  </button>

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={pdfFileName}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'فتح / حفظ PDF' : 'Open / Save PDF'}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {integrityStatus === 'checking' && (
            <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                <div>
                  <p className="font-bold text-amber-950">
                    {isRtl ? 'جاري فحص وتأكيد سلامة المستند...' : 'Checking Document Integrity...'}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {isRtl ? 'جاري فحص سلامة الـ Blob وتخزينه في الذاكرة المحلية قبل المشاركة' : 'Verifying invoice Blob existence and caching in memory prior to share'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {integrityStatus === 'failed' && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-950">
                    {isRtl ? 'تعذر التحقق من سلامة المستند' : 'Document Integrity Check Failed'}
                  </p>
                  <p className="text-[11px] text-rose-700">
                    {integrityError || (isRtl ? 'حدث خطأ أثناء فحص ملف الـ PDF' : 'An error occurred while validating the PDF Blob')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => runAutomatedIntegrityCheck()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct WhatsApp Instant Dispatch Bar */}
        <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200/90 space-y-2.5 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? `إرسال ${docNaming.shortLabel} عبر الواتساب` : `Dispatch ${docNaming.shortLabel} via WhatsApp`}</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-mono">
              {isRtl ? 'بدون كتابة رمز الدولة (+966 تلقائي)' : 'No country code required'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="flex items-center bg-white rounded-xl border border-emerald-200 px-2 py-2 shrink-0 shadow-2xs font-mono font-bold text-emerald-800 text-xs">
                🇸🇦 +966
              </div>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="flex-1 min-w-0 bg-white text-slate-900 font-mono font-bold text-xs rounded-xl px-3 py-2 border border-emerald-200 focus:outline-none focus:border-emerald-500 shadow-2xs min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Primary: Direct PDF File Delivery via WhatsApp to the Dedicated Number */}
              <button
                type="button"
                onClick={handleSendPdfToWhatsApp}
                disabled={isGenerating || integrityStatus === 'checking'}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all min-h-[40px]"
                title={isRtl ? 'إرسال ملف PDF مباشرة لرقم الواتساب المحدد' : 'Send PDF directly to dedicated WhatsApp number'}
              >
                {integrityStatus === 'checking' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>
                  {integrityStatus === 'checking'
                    ? (isRtl ? 'جاري الفحص...' : 'Checking...')
                    : (isRtl ? 'إرسال PDF للرقم' : 'Send PDF to Number')}
                </span>
              </button>

              {/* Secondary: Quick Text Summary Only */}
              <button
                type="button"
                onClick={handleSendTextToWhatsApp}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all min-h-[40px]"
                title={isRtl ? 'إرسال ملخص نصي فقط للرقم' : 'Text Summary to Number'}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{isRtl ? 'نص فقط' : 'Text'}</span>
              </button>

              {/* Tertiary: OS Native Share Sheet (for apps/AirDrop) */}
              <button
                type="button"
                onClick={handleSystemSharePdf}
                disabled={isGenerating || integrityStatus === 'checking'}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all min-h-[40px]"
                title={isRtl ? 'مشاركة كملف عبر التطبيقات (Share Sheet)' : 'Share file via system sheet'}
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{isRtl ? 'مشاركة كملف' : 'Share File'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Action Notice / Feedback Guidance */}
          {whatsAppNotice && (
            <div className="p-2.5 bg-white/95 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-start gap-2 shadow-2xs animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p>{whatsAppNotice.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Fast Action Bar */}
        <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2 text-xs shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onEditInvoice && !isReceipt && !isPayment && (
              <button
                type="button"
                onClick={() => {
                  if (modificationStatus.allowed) {
                    onEditInvoice(transaction);
                  } else {
                    alert(modificationStatus.reason);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold border transition-colors min-h-[40px] ${
                  modificationStatus.allowed
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title={modificationStatus.allowed
                  ? `${t.editInvoice} (${isRtl ? `متبقي ${modificationStatus.remainingDays} أيام` : `${modificationStatus.remainingDays} days remaining`})`
                  : modificationStatus.reason}
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.editInvoice}</span>
                {modificationStatus.allowed && modificationStatus.remainingDays !== undefined && (
                  <span className="bg-amber-200 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-md font-mono">
                    {modificationStatus.remainingDays} {isRtl ? 'ي' : 'd'}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/60 shadow-2xs transition-colors min-h-[40px]"
              title={isRtl ? 'نسخ نص السند للحافظة' : 'Copy text to clipboard'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ النص' : 'Copy Text')}</span>
            </button>

            <button
              onClick={handleSendTextToWhatsApp}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300/60 shadow-2xs transition-colors min-h-[40px]"
              title={isRtl ? 'إرسال ملخص نصي عبر واتساب' : 'Send quick text via WhatsApp'}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.shareWhatsAppText}</span>
            </button>
          </div>

          <button
            onClick={handleSendPdfToWhatsApp}
            disabled={isGenerating || integrityStatus === 'checking'}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-950/20 transition-all border border-emerald-400/30 disabled:opacity-75 min-h-[40px]"
          >
            {integrityStatus === 'checking' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>
              {integrityStatus === 'checking'
                ? (isRtl ? 'جاري فحص وتجهيز الملف...' : 'Checking File Integrity...')
                : isGenerating
                ? t.generatingPdf
                : (isRtl ? 'مشاركة ملف PDF مباشرة' : 'Share PDF Directly')}
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
