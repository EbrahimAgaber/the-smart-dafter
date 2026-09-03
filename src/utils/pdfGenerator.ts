import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf',
  autoDownload = true
): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return null;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    if (autoDownload) {
      pdf.save(fileName);
    }
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

export async function sharePdfFile(
  elementId: string,
  fileName = 'document.pdf',
  title = 'Document'
): Promise<boolean> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    const blob = await exportElementToPdf(elementId, safeFileName, false);
    if (!blob) return false;

    // Create standard File object
    const file = new File([blob], safeFileName, { type: 'application/pdf' });

    // Check if Web Share API with files is supported (mobile iOS Safari, Android Chrome, etc.)
    const canShareFiles = typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] });

    if (canShareFiles && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });
        return true;
      } catch (err: any) {
        // User tapped Cancel / dismissed the share sheet - this is normal behavior
        if (err?.name === 'AbortError') {
          return true;
        }
        console.warn('Native share failed, falling back to download:', err);
      }
    }

    // Fallback: direct download if share is unavailable or failed
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (error) {
    console.error('Error in sharePdfFile:', error);
    return false;
  }
}
