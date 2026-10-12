import { jsPDF } from 'jspdf';
import { BusinessProfile, Language, Party, Transaction } from '../types';
import { sanitizePhoneNumber, buildWhatsAppMessage, openExternalUrl } from './formatters';

export interface SharePdfToWhatsAppOptions {
  pdfBlob?: Blob | null;
  doc?: jsPDF | null;
  fileName: string;
  party: Party;
  transaction?: Transaction | null;
  profile: BusinessProfile;
  lang?: Language;
  recipientPhone?: string;
  mode?: 'file' | 'text' | 'system_share';
}

export interface SharePdfResult {
  success: boolean;
  method: 'native_file_share' | 'download_and_chat' | 'text_chat' | 'clipboard_only';
  fileName?: string;
  cleanPhone?: string;
  error?: string;
}

/**
 * WhatsApp Dispatcher for Real PDF Attachments & Text Summaries:
 * - File Mode ('file' / 'system_share'):
 *   On mobile devices (iOS Safari & Android Chrome), uses the native Web Share API (navigator.share with files)
 *   to hand off the PHYSICAL .pdf DOCUMENT FILE directly to WhatsApp as a true file attachment.
 *   On desktop browsers that lack file sharing, automatically downloads the PDF file and opens WhatsApp Web.
 * - Text Mode ('text'):
 *   Opens WhatsApp directly to the recipient's phone number with the clean invoice text summary (no empty file claims or broken URLs).
 */
export async function sharePdfToWhatsApp(
  options: SharePdfToWhatsAppOptions
): Promise<SharePdfResult> {
  const {
    pdfBlob,
    doc,
    fileName,
    party,
    transaction = null,
    profile,
    lang = 'ar',
    recipientPhone,
    mode = 'file',
  } = options;

  const phoneToUse = (recipientPhone || '').trim() || party.phone || '';
  const cleanPhone = sanitizePhoneNumber(phoneToUse);
  const isArabic = lang === 'ar';
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // Generate base message - clean invoice summary without any unopenable dev URLs
  const rawBaseEncoded = buildWhatsAppMessage(party, transaction, profile, lang);
  let messageText = decodeURIComponent(rawBaseEncoded);


  const encodedFullMessage = encodeURIComponent(messageText);

  // Mode 1: Quick Text Summary Only (Dispatched directly to dedicated receiver number)
  if (mode === 'text') {
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${rawBaseEncoded}`
      : `https://wa.me/?text=${rawBaseEncoded}`;
    openExternalUrl(url);
    return { success: true, method: 'text_chat', fileName: safeFileName, cleanPhone };
  }

  // Obtain or generate PDF Blob
  let blob = pdfBlob;
  if (!blob && doc) {
    blob = doc.output('blob');
  }

  // Mode 2: True PDF File Attachment via Native Web Share API (iOS Safari, Android Chrome)
  // Hands off the ACTUAL physical .pdf document file to WhatsApp attachment
  if (blob) {
    const pdfFile = new File([blob], safeFileName, { type: 'application/pdf' });
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [pdfFile] }) &&
      typeof navigator.share === 'function';

    if (canShareFiles) {
      try {
        if (cleanPhone && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cleanPhone).catch(() => {});
        }

        const sharePromise = navigator.share({
          title: `${profile.name || (isArabic ? 'فاتورة' : 'Invoice')} #${transaction?.receiptNumber || ''}`,
          text: messageText,
          files: [pdfFile],
        });

        await Promise.race([
          sharePromise,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        return { success: true, method: 'native_file_share', fileName: safeFileName, cleanPhone };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User closed the share sheet
          return { success: true, method: 'native_file_share', fileName: safeFileName, cleanPhone };
        }
        console.warn('Native file share failed or deferred, falling back to desktop download & chat:', err);
      }
    }
  }

  // Mode 3: Desktop Fallback (when Web Share with files is not supported by the browser)
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedFullMessage}`
    : `https://wa.me/?text=${encodedFullMessage}`;

  openExternalUrl(waUrl);

  // Auto-download the PDF file directly to device storage so user has the actual PDF file ready
  if (blob) {
    setTimeout(() => {
      try {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = safeFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      } catch (e) {
        console.warn('PDF auto-download warning:', e);
      }
    }, 250);
  }

  // Copy text to clipboard as non-blocking convenience
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(messageText).catch(() => {});
  }

  return {
    success: true,
    method: 'download_and_chat',
    fileName: safeFileName,
    cleanPhone,
  };
}
