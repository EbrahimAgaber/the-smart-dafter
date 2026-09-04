import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BusinessProfile, Transaction, Party, Language } from '../types';

export interface PdfExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  method?: 'native_share' | 'browser_open' | 'download_fallback';
  error?: string;
}

export interface GenerateInvoicePdfOptions {
  profile: BusinessProfile;
  transaction: Transaction;
  party: Party;
  zatcaQrDataUrl?: string;
  isVatApplied?: boolean;
  lang?: Language;
}

export interface GenerateStatementPdfOptions {
  profile: BusinessProfile;
  party: Party;
  transactions: Transaction[];
  startDate?: string;
  endDate?: string;
  lang?: Language;
}

/**
 * High-performance off-screen DOM clone rendering to crisp A4 PDF.
 * Eliminates all CSS transforms, animation jitter, and scroll offsets.
 * Natively renders Arabic RTL cursive text via browser WebKit/Blink engine.
 */
export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf',
  autoDownload = false
): Promise<{ blob: Blob; doc: jsPDF } | null> {
  if (typeof document === 'undefined') {
    // Headless / SSR / Test runner mock
    const mockDoc = new jsPDF();
    return { blob: mockDoc.output('blob'), doc: mockDoc };
  }

  // 1. Locate source DOM element (with retry if modal is transitioning)
  let element = document.getElementById(elementId);
  if (!element) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    element = document.getElementById(elementId);
  }

  if (!element) {
    console.error(`exportElementToPdf: Element #${elementId} not found`);
    return null;
  }

  // 2. Wait for fonts to be ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness timeout
    }
  }

  // 3. Create a clean, isolated off-screen sandbox clone
  // This bypasses any motion.div transforms (scale: 0.98, y: 48) and scroll offsets
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `${elementId}-print-sandbox`;
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = '794px'; // 210mm at 96 DPI (exact A4 width)
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';
  clone.style.padding = '32px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#1c1917';
  clone.style.transform = 'none';
  clone.style.animation = 'none';
  clone.style.transition = 'none';
  clone.style.boxShadow = 'none';
  clone.style.zIndex = '-9999';

  document.body.appendChild(clone);

  try {
    // 4. Capture crisp canvas (scale: 2 produces 1588px width - razor sharp on retina & mobile)
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight + 4) {
      // Single A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    } else {
      // Multi-page document (for long account statements)
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    if (autoDownload) {
      pdf.save(fileName);
    }

    const blob = pdf.output('blob');
    return { blob, doc: pdf };
  } catch (error) {
    console.error('Error in exportElementToPdf:', error);
    return null;
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}

/**
 * Universal PDF sharing & download handler with iOS Safari Share Sheet support.
 */
export async function shareOrDownloadPdf(
  doc: jsPDF | null,
  fileName = 'document.pdf',
  title = 'Document',
  precomputedBlob?: Blob | null
): Promise<PdfExportResult> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    let blob = precomputedBlob;
    if (!blob && doc) {
      blob = doc.output('blob');
    }

    if (!blob) {
      return { success: false, error: 'No PDF data available' };
    }

    const file = new File([blob], safeFileName, { type: 'application/pdf' });

    // 1. Native Web Share API with files (iOS Safari, Android Chrome)
    const canShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === 'function';

    if (canShare) {
      try {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });
        return { success: true, blob, method: 'native_share' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: true, blob, method: 'native_share' };
        }
        console.warn('Native share dismissed or failed, falling back:', err);
      }
    }

    // 2. Direct anchor download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    return { success: true, blob, url, method: 'download_fallback' };
  } catch (error: any) {
    console.error('Error in shareOrDownloadPdf:', error);
    return { success: false, error: error?.message || 'Unknown share error' };
  }
}

/**
 * Invoice PDF generator targeting #invoice-render-target DOM element.
 */
export async function generateInvoicePdf(options: GenerateInvoicePdfOptions): Promise<jsPDF> {
  if (typeof document === 'undefined') {
    return new jsPDF();
  }

  const fileName = `Invoice_${options.transaction.receiptNumber || 'doc'}.pdf`;
  const res = await exportElementToPdf('invoice-render-target', fileName, false);
  if (res?.doc) {
    return res.doc;
  }
  return new jsPDF();
}

/**
 * Statement PDF generator targeting #statement-render-target DOM element.
 */
export async function generateStatementPdf(options: GenerateStatementPdfOptions): Promise<jsPDF> {
  if (typeof document === 'undefined') {
    return new jsPDF();
  }

  const fileName = `Statement_${options.party.name.replace(/\s+/g, '_')}.pdf`;
  const res = await exportElementToPdf('statement-render-target', fileName, false);
  if (res?.doc) {
    return res.doc;
  }
  return new jsPDF();
}

export async function sharePdfFile(
  elementId: string,
  fileName = 'document.pdf',
  title = 'Document',
  precomputedBlob?: Blob | null
): Promise<PdfExportResult> {
  if (precomputedBlob) {
    return shareOrDownloadPdf(null, fileName, title, precomputedBlob);
  }
  const res = await exportElementToPdf(elementId, fileName, false);
  return shareOrDownloadPdf(res?.doc || null, fileName, title, res?.blob || null);
}

export default {
  generateInvoicePdf,
  generateStatementPdf,
  shareOrDownloadPdf,
  exportElementToPdf,
  sharePdfFile,
};
