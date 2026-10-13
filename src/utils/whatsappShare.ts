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

  // If no blob is available and doc cannot provide one, fall back to text chat if phone exists
  if (!blob) {
    console.warn('sharePdfToWhatsApp: No PDF blob or doc provided');
    if (cleanPhone) {
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedFullMessage}`;
      openExternalUrl(waUrl);
      return { success: true, method: 'text_chat', fileName: safeFileName, cleanPhone };
    }
    return { success: false, method: 'clipboard_only', error: 'No PDF data available' };
  }

  // Mode 2: True PDF File Attachment via Native Web Share API (Level 2)
  // Hands off the ACTUAL physical .pdf document file to the OS share sheet (WhatsApp, etc.)
  const pdfFile = new File([blob], safeFileName, { type: 'application/pdf' });
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] }) &&
    typeof navigator.share === 'function';

  if (canShareFiles) {
    try {
      // If a recipient phone is known, copy to clipboard for user convenience when pasting into WhatsApp chat
      if (cleanPhone && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanPhone).catch(() => {});
      }

      let shareFailed = false;
      let userAborted = false;

      const sharePromise = navigator.share({
        title: `${profile.name || (isArabic ? 'فاتورة' : 'Invoice')} #${transaction?.receiptNumber || ''}`,
        text: messageText,
        files: [pdfFile],
      }).catch((err: any) => {
        if (err?.name === 'AbortError') {
          userAborted = true;
        } else {
          shareFailed = true;
          console.warn('Native file share failed:', err);
        }
      });

      await Promise.race([
        sharePromise,
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      if (userAborted || !shareFailed) {
        return { success: true, method: 'native_file_share', fileName: safeFileName, cleanPhone };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: true, method: 'native_file_share', fileName: safeFileName, cleanPhone };
      }
      console.warn('Native file share exception, falling back to desktop download & chat:', err);
    }
  }

  // Mode 3: Desktop & Unsupported Browser Fallback
  // When Web Share with files is not supported (e.g. desktop Chrome/Firefox/Safari):
  // 1. Immediately download the physical PDF file to the device storage
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

  // 2. Open WhatsApp directly to recipient phone number with clean text summary
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedFullMessage}`
    : `https://wa.me/?text=${encodedFullMessage}`;
  openExternalUrl(waUrl);

  // 3. Copy text to clipboard as non-blocking convenience
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
