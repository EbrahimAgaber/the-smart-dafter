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
 * Robust DOM-to-PDF rendering engine using html2canvas & jsPDF.
 * Renders the visible DOM with native browser fonts, Arabic ligatures & RTL layout.
 */
export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf',
  autoDownload = false
): Promise<{ blob: Blob; doc: jsPDF } | null> {
  if (typeof document === 'undefined') {
    const mockDoc = new jsPDF();
    return { blob: mockDoc.output('blob'), doc: mockDoc };
  }

  // 1. Locate source DOM element with retry
  let element = document.getElementById(elementId);
  if (!element) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    element = document.getElementById(elementId);
  }

  if (!element) {
    console.error(`exportElementToPdf: Element #${elementId} not found`);
    return null;
  }

  // 2. Wait for fonts to ensure layout calculation is accurate
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness timeout
    }
  }

  try {
    // 3. Render high-res canvas directly from the target DOM element
    // Uses scale: 2 for sharp retina print without clipping
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          // Remove shadows and borders for clean paper output
          el.style.boxShadow = 'none';
          el.style.borderRadius = '0';
          el.style.transform = 'none';
          el.style.animation = 'none';

          // Ensure all parent containers inside modal have visible overflow
          let parent = el.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.transform = 'none';
            parent.style.overflow = 'visible';
            parent = parent.parentElement;
          }
        }
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.error('html2canvas produced invalid canvas dimensions');
      return null;
    }

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

    if (imgHeight <= pageHeight + 6) {
      // Single A4 page document
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight), undefined, 'FAST');
    } else {
      // Multi-page document (for long account statements)
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }

    if (autoDownload) {
      pdf.save(fileName);
    }

    const blob = pdf.output('blob');
    return { blob, doc: pdf };
  } catch (error) {
    console.error('Error generating PDF canvas:', error);
    return null;
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
