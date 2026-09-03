import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  method?: 'native_share' | 'browser_open' | 'download_fallback';
  error?: string;
}

export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf',
  autoDownload = false
): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return null;
  }

  try {
    // Generate crisp canvas with settings tuned for iOS WebKit & Android mobile
    const canvas = await html2canvas(element, {
      scale: 1.5, // 1.5x gives high resolution without exceeding iOS canvas RAM limits
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000,
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
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    if (autoDownload) {
      pdf.save(fileName);
    }
    return pdf.output('blob');
  } catch (error: any) {
    console.error('Error generating PDF canvas:', error);
    return null;
  }
}

export async function sharePdfFile(
  elementId: string,
  fileName = 'document.pdf',
  title = 'Document',
  precomputedBlob?: Blob | null
): Promise<PdfExportResult> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    const blob = precomputedBlob || (await exportElementToPdf(elementId, safeFileName, false));
    if (!blob) {
      return { success: false, error: 'Could not generate PDF from document' };
    }

    const file = new File([blob], safeFileName, { type: 'application/pdf' });

    // 1. Try Native Web Share API with files (iOS Safari, Android Chrome)
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] });

    if (canShareFiles && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });
        return { success: true, blob, method: 'native_share' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User dismissed the native share sheet
          return { success: true, blob, method: 'native_share' };
        }
        console.warn('Native share failed or gesture timed out, trying fallback:', err);
      }
    }

    // 2. Open PDF in a new tab / window for iOS native PDF viewer
    const url = URL.createObjectURL(blob);
    try {
      const win = window.open(url, '_blank');
      if (win) {
        return { success: true, blob, url, method: 'browser_open' };
      }
    } catch (e) {
      console.warn('window.open was blocked, trying anchor download:', e);
    }

    // 3. Fallback: Trigger anchor download
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return { success: true, blob, url, method: 'download_fallback' };
  } catch (error: any) {
    console.error('Error in sharePdfFile:', error);
    return { success: false, error: error?.message || 'Unknown share error' };
  }
}

