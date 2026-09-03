import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf'
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

    pdf.save(fileName);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

export async function sharePdfFile(
  elementId: string,
  fileName = 'statement.pdf',
  title = 'Document'
): Promise<boolean> {
  try {
    const blob = await exportElementToPdf(elementId, fileName);
    if (!blob) return false;

    // Check if Web Share API with files is supported (mobile browsers, iOS Safari, Android Chrome)
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      await navigator.share({
        title,
        text: title,
        files: [file],
      });
      return true;
    } else {
      // Fallback: PDF is downloaded automatically by exportElementToPdf
      return true;
    }
  } catch (error) {
    console.error('Error sharing PDF file:', error);
    return false;
  }
}
