import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { generateZatcaTlvQrString } from './zatca';
import { shapeBidi } from './arabicShaper';
import { registerArabicFont } from './fonts/arabicFont';
import { BusinessProfile, Transaction, Party, Language, Currency } from '../types';

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

// Coordinate & Dimension Constants (A4 in mm)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 14;
const MARGIN_TOP = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 182mm
const PAGE_BOTTOM_LIMIT = 272; // Maximum cursor Y before page break

interface CursorState {
  cursorY: number;
}

/**
 * Intelligent pagination supervisor (Bug 8 fix).
 * Ensures that if neededHeight does not fit on the current page,
 * a clean page break is added and optional onNewPage callback (e.g. repeated table headers) is executed.
 */
function ensureSpace(
  doc: jsPDF,
  neededHeight: number,
  state: CursorState,
  onNewPage?: () => void
): void {
  if (state.cursorY + neededHeight > PAGE_BOTTOM_LIMIT) {
    doc.addPage();
    state.cursorY = MARGIN_TOP;
    if (onNewPage) {
      onNewPage();
    }
  }
}

/**
 * Helper to format currency values cleanly with 2 decimals.
 */
function formatAmount(val: number | undefined | null, currency?: Currency): string {
  const num = Number(val || 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * Helper to format ISO date string.
 */
function formatPdfDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

/**
 * Native jsPDF Direct Vector Drawing Engine for Invoices and Receipts
 */
export async function generateInvoicePdf(options: GenerateInvoicePdfOptions): Promise<jsPDF> {
  const { profile, transaction, party, isVatApplied, lang = 'ar' } = options;
  const isRtl = lang !== 'en';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Register and activate Amiri Arabic font
  await registerArabicFont(doc);

  const state: CursorState = { cursorY: MARGIN_TOP };

  // Document Title determination
  const isSupply = transaction.type === 'SUPPLY_CREDIT';
  const isReceipt = transaction.type === 'PAYMENT_RECEIVED';
  const isVoucher = transaction.type === 'PAYMENT_PAID';

  let docTitle = isRtl ? 'فاتورة بيع آجل' : 'Credit Sale Invoice';
  if (transaction.type === 'SALE_CREDIT') {
    docTitle = isVatApplied
      ? (isRtl ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice')
      : (isRtl ? 'فاتورة بيع آجل' : 'Credit Sale Invoice');
  } else if (isSupply) {
    docTitle = isRtl ? 'سند توريد بالآجل' : 'Credit Supply Note';
  } else if (isReceipt) {
    docTitle = isRtl ? 'سند قبض مالي' : 'Payment Receipt Voucher';
  } else if (isVoucher) {
    docTitle = isRtl ? 'سند صرف نقدي' : 'Payment Voucher';
  }

  // Pre-generate ZATCA QR Code if applicable
  let zatcaQrPng = options.zatcaQrDataUrl;
  if (!zatcaQrPng && (transaction.type === 'SALE_CREDIT' || isVatApplied)) {
    try {
      const qrData = generateZatcaTlvQrString({
        sellerName: profile.name,
        vatNumber: profile.taxNumber || '', // Bug 1 fix
        timestamp: transaction.date,
        totalAmount: transaction.totalAmount,
        vatAmount: isVatApplied ? (transaction.taxAmount || 0) : 0,
      });
      zatcaQrPng = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.warn('QR code generation error:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. HEADER SECTION (Merchant Info, Document Title Badge, Receipt #, Date, QR)
  // ---------------------------------------------------------------------------
  const headerTop = state.cursorY;
  const qrSize = 25; // 25x25mm
  const qrX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - qrSize;
  const qrY = headerTop;

  // Draw ZATCA QR code if available
  if (zatcaQrPng) {
    try {
      doc.addImage(zatcaQrPng, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.warn('Embedding QR image failed:', e);
    }
  }

  // Merchant Details Block
  const textStartX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
  const textAlignment = isRtl ? 'right' : 'left';

  // Merchant Name
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(shapeBidi(profile.name, isRtl), textStartX, headerTop + 5, { align: textAlignment });

  // Merchant Sub-details (Phone, Tax Number, Address)
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // #475569

  let merchantSubY = headerTop + 10;
  if (profile.taxNumber) {
    const taxLabel = isRtl
      ? `الرقم الضريبي: ${profile.taxNumber}`
      : `Tax Reg: ${profile.taxNumber}`;
    doc.text(shapeBidi(taxLabel, isRtl), textStartX, merchantSubY, { align: textAlignment });
    merchantSubY += 4.5;
  }
  if (profile.phone) {
    const phoneLabel = isRtl ? `الهاتف: ${profile.phone}` : `Tel: ${profile.phone}`;
    doc.text(shapeBidi(phoneLabel, isRtl), textStartX, merchantSubY, { align: textAlignment });
    merchantSubY += 4.5;
  }
  if (profile.address) {
    doc.text(shapeBidi(profile.address, isRtl), textStartX, merchantSubY, { align: textAlignment });
    merchantSubY += 4.5;
  }

  // Document Title & Metadata Badge
  const badgeX = isRtl ? MARGIN_X + qrSize + 4 : PAGE_WIDTH - MARGIN_X - 60;
  const badgeY = headerTop;
  const badgeWidth = 60;
  const badgeHeight = 24;

  // Badge background box
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');

  // Title
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(docTitle, isRtl), badgeX + badgeWidth / 2, badgeY + 6, { align: 'center' });

  // Receipt Number
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199); // #0284C7 Sky blue
  const receiptLabel = `#${transaction.receiptNumber}`;
  doc.text(shapeBidi(receiptLabel, false), badgeX + badgeWidth / 2, badgeY + 12, { align: 'center' });

  // Date
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748B
  const dateFormatted = formatPdfDate(transaction.date);
  doc.text(shapeBidi(dateFormatted, false), badgeX + badgeWidth / 2, badgeY + 17, { align: 'center' });

  state.cursorY = Math.max(merchantSubY, headerTop + qrSize) + 5;

  // Horizontal separator hairline
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, state.cursorY, PAGE_WIDTH - MARGIN_X, state.cursorY);
  state.cursorY += 4;

  // ---------------------------------------------------------------------------
  // 2. PARTY / CUSTOMER INFO CARD
  // ---------------------------------------------------------------------------
  const partyCardHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN_X, state.cursorY, CONTENT_WIDTH, partyCardHeight, 2, 2, 'FD');

  const partyCol1X = isRtl ? PAGE_WIDTH - MARGIN_X - 4 : MARGIN_X + 4;
  const partyCol2X = isRtl ? MARGIN_X + 4 : PAGE_WIDTH - MARGIN_X - 4;
  const partyAlign1 = isRtl ? 'right' : 'left';
  const partyAlign2 = isRtl ? 'left' : 'right';

  // Column 1: Bill To / Party Details
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const billToLabel = isRtl
    ? (party.type === 'DISTRIBUTOR' ? 'المورد / الموزع:' : 'فاتورة إلى (العميل):')
    : (party.type === 'DISTRIBUTOR' ? 'Distributor / Supplier:' : 'Bill To (Customer):');
  doc.text(shapeBidi(billToLabel, isRtl), partyCol1X, state.cursorY + 5, { align: partyAlign1 });

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(party.name, isRtl), partyCol1X, state.cursorY + 11, { align: partyAlign1 });

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const partyPhone = party.phone ? (isRtl ? `هاتف: ${party.phone}` : `Phone: ${party.phone}`) : '';
  if (partyPhone) {
    doc.text(shapeBidi(partyPhone, isRtl), partyCol1X, state.cursorY + 16, { align: partyAlign1 });
  }

  // Column 2: Account Balance Context
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const balLabel = isRtl ? 'الرصيد التراكمي للحساب:' : 'Account Balance:';
  doc.text(shapeBidi(balLabel, isRtl), partyCol2X, state.cursorY + 5, { align: partyAlign2 });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const balStr = formatAmount(party.currentBalance, profile.currency);
  doc.text(shapeBidi(balStr, isRtl), partyCol2X, state.cursorY + 12, { align: partyAlign2 });

  state.cursorY += partyCardHeight + 5;

  // ---------------------------------------------------------------------------
  // 3. LINE ITEMS TABLE (or VOUCHER SUMMARY if no items)
  // ---------------------------------------------------------------------------
  const items = transaction.items || [];
  const hasItems = items.length > 0;

  if (hasItems) {
    // Column widths (Total = 182mm)
    const colSeqW = 10;
    const colDescW = 82;
    const colQtyW = 24;
    const colPriceW = 32;
    const colTotalW = 34;

    const renderTableHeader = (headerY: number) => {
      doc.setFillColor(241, 245, 249); // #F1F5F9
      doc.setDrawColor(203, 213, 225); // #CBD5E1
      doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, 7.5, 'FD');

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // #334155

      if (isRtl) {
        let x = PAGE_WIDTH - MARGIN_X;
        doc.text(shapeBidi('#', isRtl), x - colSeqW / 2, headerY + 5, { align: 'center' });
        x -= colSeqW;
        doc.text(shapeBidi('الصنف / البيان', isRtl), x - 4, headerY + 5, { align: 'right' });
        x -= colDescW;
        doc.text(shapeBidi('الكمية', isRtl), x - colQtyW / 2, headerY + 5, { align: 'center' });
        x -= colQtyW;
        doc.text(shapeBidi('السعر', isRtl), x - colPriceW / 2, headerY + 5, { align: 'center' });
        x -= colPriceW;
        doc.text(shapeBidi('الإجمالي', isRtl), x - colTotalW / 2, headerY + 5, { align: 'center' });
      } else {
        let x = MARGIN_X;
        doc.text('#', x + colSeqW / 2, headerY + 5, { align: 'center' });
        x += colSeqW;
        doc.text('Item Description', x + 4, headerY + 5, { align: 'left' });
        x += colDescW;
        doc.text('Qty', x + colQtyW / 2, headerY + 5, { align: 'center' });
        x += colQtyW;
        doc.text('Unit Price', x + colPriceW / 2, headerY + 5, { align: 'center' });
        x += colPriceW;
        doc.text('Subtotal', x + colTotalW / 2, headerY + 5, { align: 'center' });
      }
    };

    // Draw initial table header
    renderTableHeader(state.cursorY);
    state.cursorY += 7.5;

    // Render table rows with guaranteed atomic pagination (Bug 8 fix)
    const rowHeight = 7.5;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Ensure space: if next row does not fit, push page & re-draw headers
      ensureSpace(doc, rowHeight, state, () => {
        renderTableHeader(state.cursorY);
        state.cursorY += 7.5;
      });

      const rowY = state.cursorY;
      const isEven = i % 2 === 1;

      // Row background zebra striping
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(MARGIN_X, rowY, CONTENT_WIDTH, rowHeight, 'F');
      }

      // Bottom border hairline
      doc.setDrawColor(241, 245, 249);
      doc.line(MARGIN_X, rowY + rowHeight, PAGE_WIDTH - MARGIN_X, rowY + rowHeight);

      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      if (isRtl) {
        let x = PAGE_WIDTH - MARGIN_X;
        doc.text(String(i + 1), x - colSeqW / 2, rowY + 5, { align: 'center' });
        x -= colSeqW;
        doc.text(shapeBidi(item.name, isRtl), x - 4, rowY + 5, { align: 'right' });
        x -= colDescW;
        doc.text(String(item.quantity), x - colQtyW / 2, rowY + 5, { align: 'center' });
        x -= colQtyW;
        doc.text(Number(item.unitPrice).toFixed(2), x - colPriceW / 2, rowY + 5, { align: 'center' });
        x -= colPriceW;
        doc.text(Number(item.subtotal).toFixed(2), x - colTotalW / 2, rowY + 5, { align: 'center' });
      } else {
        let x = MARGIN_X;
        doc.text(String(i + 1), x + colSeqW / 2, rowY + 5, { align: 'center' });
        x += colSeqW;
        doc.text(item.name, x + 4, rowY + 5, { align: 'left' });
        x += colDescW;
        doc.text(String(item.quantity), x + colQtyW / 2, rowY + 5, { align: 'center' });
        x += colQtyW;
        doc.text(Number(item.unitPrice).toFixed(2), x + colPriceW / 2, rowY + 5, { align: 'center' });
        x += colPriceW;
        doc.text(Number(item.subtotal).toFixed(2), x + colTotalW / 2, rowY + 5, { align: 'center' });
      }

      state.cursorY += rowHeight;
    }
  } else {
    // Payment voucher receipt box without line items
    const voucherBoxH = 25;
    ensureSpace(doc, voucherBoxH, state);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(MARGIN_X, state.cursorY, CONTENT_WIDTH, voucherBoxH, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const amountLabel = isRtl ? 'المبلغ المستلم / المدفوع:' : 'Voucher Amount:';
    doc.text(shapeBidi(amountLabel, isRtl), textStartX, state.cursorY + 7, { align: textAlignment });

    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // #0D9488 Teal
    const amountVal = formatAmount(transaction.paidAmount || transaction.totalAmount, profile.currency);
    doc.text(shapeBidi(amountVal, isRtl), textStartX, state.cursorY + 16, { align: textAlignment });

    if (transaction.paymentMethod) {
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const methodStr = isRtl
        ? `طريقة الدفع: ${transaction.paymentMethod}`
        : `Payment Method: ${transaction.paymentMethod}`;
      doc.text(shapeBidi(methodStr, isRtl), isRtl ? MARGIN_X + 6 : PAGE_WIDTH - MARGIN_X - 6, state.cursorY + 16, {
        align: isRtl ? 'left' : 'right',
      });
    }

    state.cursorY += voucherBoxH + 4;
  }

  state.cursorY += 4;

  // ---------------------------------------------------------------------------
  // 4. TOTALS & SETTLEMENT SUMMARY BLOCK
  // ---------------------------------------------------------------------------
  const totalsBlockHeight = 44;
  ensureSpace(doc, totalsBlockHeight, state);

  const totalsBoxW = 85;
  const totalsBoxX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - totalsBoxW;
  const totalsBoxY = state.cursorY;

  // Container box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBlockHeight, 2, 2, 'FD');

  const tLblX = isRtl ? totalsBoxX + totalsBoxW - 4 : totalsBoxX + 4;
  const tValX = isRtl ? totalsBoxX + 4 : totalsBoxX + totalsBoxW - 4;
  const tLblAlign = isRtl ? 'right' : 'left';
  const tValAlign = isRtl ? 'left' : 'right';

  let currentLineY = totalsBoxY + 6;

  // Subtotal
  if (transaction.subtotalBeforeTax !== undefined && transaction.subtotalBeforeTax > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(shapeBidi(isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal before VAT:', isRtl), tLblX, currentLineY, { align: tLblAlign });
    doc.text(formatAmount(transaction.subtotalBeforeTax), tValX, currentLineY, { align: tValAlign });
    currentLineY += 5;
  }

  // Discount
  if (transaction.discountAmount && transaction.discountAmount > 0) {
    doc.setFontSize(8);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(shapeBidi(isRtl ? 'الخصم الممنوح:' : 'Discount:', isRtl), tLblX, currentLineY, { align: tLblAlign });
    doc.text(`-${formatAmount(transaction.discountAmount)}`, tValX, currentLineY, { align: tValAlign });
    currentLineY += 5;
  }

  // VAT (15%)
  if (isVatApplied && transaction.taxAmount !== undefined && transaction.taxAmount > 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const vatLabel = isRtl
      ? `ضريبة القيمة المضافة (${transaction.taxRate || 15}%):`
      : `VAT (${transaction.taxRate || 15}%):`;
    doc.text(shapeBidi(vatLabel, isRtl), tLblX, currentLineY, { align: tLblAlign });
    doc.text(formatAmount(transaction.taxAmount), tValX, currentLineY, { align: tValAlign });
    currentLineY += 5;
  }

  // Grand Total Highlight Row
  doc.setFillColor(241, 245, 249);
  doc.rect(totalsBoxX, currentLineY - 3.5, totalsBoxW, 7, 'F');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(isRtl ? 'الإجمالي النهائي:' : 'Total Amount:', isRtl), tLblX, currentLineY + 1.5, { align: tLblAlign });
  doc.text(formatAmount(transaction.totalAmount, profile.currency), tValX, currentLineY + 1.5, { align: tValAlign });
  currentLineY += 8;

  // Paid Now
  doc.setFontSize(8.5);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text(shapeBidi(isRtl ? 'المدفوع الآن:' : 'Paid Now:', isRtl), tLblX, currentLineY, { align: tLblAlign });
  doc.text(formatAmount(transaction.paidAmount), tValX, currentLineY, { align: tValAlign });
  currentLineY += 5;

  // Remaining Balance
  const remainingDelta = transaction.totalAmount - transaction.paidAmount;
  doc.setFontSize(8.5);
  doc.setTextColor(remainingDelta > 0 ? 225 : 100, remainingDelta > 0 ? 29 : 116, remainingDelta > 0 ? 72 : 139);
  doc.text(shapeBidi(isRtl ? 'المتبقي آجل:' : 'Remaining Delta:', isRtl), tLblX, currentLineY, { align: tLblAlign });
  doc.text(formatAmount(remainingDelta), tValX, currentLineY, { align: tValAlign });

  // Notes & Bank Information (left/right aligned alongside totals)
  const infoBoxW = CONTENT_WIDTH - totalsBoxW - 6;
  const infoBoxX = isRtl ? totalsBoxX + totalsBoxW + 6 : MARGIN_X;

  if (transaction.notes || profile.iban || profile.bankName) {
    let noteY = totalsBoxY + 5;

    if (transaction.notes) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(shapeBidi(isRtl ? 'ملاحظات:' : 'Notes:', isRtl), infoBoxX, noteY, { align: isRtl ? 'left' : 'left' });
      noteY += 4.5;
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(shapeBidi(transaction.notes, isRtl), infoBoxX, noteY, { align: isRtl ? 'left' : 'left' });
      noteY += 7;
    }

    if (profile.bankName || profile.iban) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(shapeBidi(isRtl ? 'بيانات التحويل البنكي:' : 'Bank Details:', isRtl), infoBoxX, noteY, { align: 'left' });
      noteY += 4.5;
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      if (profile.bankName) {
        doc.text(shapeBidi(profile.bankName, isRtl), infoBoxX, noteY, { align: 'left' });
        noteY += 4;
      }
      if (profile.iban) {
        doc.text(`IBAN: ${profile.iban}`, infoBoxX, noteY, { align: 'left' });
      }
    }
  }

  state.cursorY = totalsBoxY + totalsBlockHeight + 10;

  // ---------------------------------------------------------------------------
  // 5. SIGNATURE & STAMP BLOCK
  // ---------------------------------------------------------------------------
  const signBlockH = 22;
  ensureSpace(doc, signBlockH, state);

  const signY = state.cursorY;
  const halfContentW = CONTENT_WIDTH / 2 - 8;

  // Receiver Signature
  const rSignX = isRtl ? PAGE_WIDTH - MARGIN_X - halfContentW : MARGIN_X;
  doc.setDrawColor(203, 213, 225);
  doc.line(rSignX, signY + 14, rSignX + halfContentW, signY + 14);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    shapeBidi(isRtl ? 'توقيع المستلم / العميل' : 'Receiver Signature', isRtl),
    rSignX + halfContentW / 2,
    signY + 19,
    { align: 'center' }
  );

  // Merchant Authorized Signature / Stamp
  const mSignX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - halfContentW;
  doc.line(mSignX, signY + 14, mSignX + halfContentW, signY + 14);
  doc.text(
    shapeBidi(isRtl ? 'الختم والتوقيع المعتمد' : 'Authorized Signature & Stamp', isRtl),
    mSignX + halfContentW / 2,
    signY + 19,
    { align: 'center' }
  );

  // ---------------------------------------------------------------------------
  // 6. TWO-PASS PAGE NUMBERING & FOOTERS
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Separator hairline
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, 283, PAGE_WIDTH - MARGIN_X, 283);

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerNote = profile.invoiceFooterNote || (isRtl ? 'شكراً لتعاملكم معنا' : 'Thank you for your business');
    doc.text(shapeBidi(footerNote, isRtl), PAGE_WIDTH / 2, 288, { align: 'center' });

    // Page number
    const pageNumText = isRtl ? `صفحة ${p} من ${totalPages}` : `Page ${p} of ${totalPages}`;
    doc.text(shapeBidi(pageNumText, isRtl), isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X, 288, {
      align: isRtl ? 'left' : 'right',
    });
  }

  return doc;
}

/**
 * Native jsPDF Direct Vector Drawing Engine for Ledger Statements
 */
export async function generateStatementPdf(options: GenerateStatementPdfOptions): Promise<jsPDF> {
  const { profile, party, transactions, lang = 'ar' } = options;
  const isRtl = lang !== 'en';
  const isCustomer = party.type === 'CUSTOMER';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Register and activate Amiri Arabic font
  await registerArabicFont(doc);

  const state: CursorState = { cursorY: MARGIN_TOP };

  // ---------------------------------------------------------------------------
  // 1. STATEMENT HEADER BLOCK
  // ---------------------------------------------------------------------------
  const headerTop = state.cursorY;
  const textStartX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
  const textAlignment = isRtl ? 'right' : 'left';

  // Merchant details
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(profile.name, isRtl), textStartX, headerTop + 5, { align: textAlignment });

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let subY = headerTop + 10;
  if (profile.taxNumber) {
    const taxLabel = isRtl ? `الرقم الضريبي: ${profile.taxNumber}` : `Tax Reg: ${profile.taxNumber}`;
    doc.text(shapeBidi(taxLabel, isRtl), textStartX, subY, { align: textAlignment });
    subY += 4.5;
  }
  if (profile.phone) {
    const phoneLabel = isRtl ? `الهاتف: ${profile.phone}` : `Tel: ${profile.phone}`;
    doc.text(shapeBidi(phoneLabel, isRtl), textStartX, subY, { align: textAlignment });
    subY += 4.5;
  }

  // Statement Title Banner
  const titleBoxX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - 65;
  const titleBoxY = headerTop;
  const titleBoxW = 65;
  const titleBoxH = 20;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(titleBoxX, titleBoxY, titleBoxW, titleBoxH, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const stmtTitle = isRtl ? 'كشف حساب مالي تفصيلي' : 'Statement of Account';
  doc.text(shapeBidi(stmtTitle, isRtl), titleBoxX + titleBoxW / 2, titleBoxY + 7, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const issueDateStr = isRtl
    ? `تاريخ الإصدار: ${formatPdfDate(new Date().toISOString())}`
    : `Date: ${formatPdfDate(new Date().toISOString())}`;
  doc.text(shapeBidi(issueDateStr, isRtl), titleBoxX + titleBoxW / 2, titleBoxY + 14, { align: 'center' });

  state.cursorY = Math.max(subY, headerTop + titleBoxH) + 5;

  // Hairline separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, state.cursorY, PAGE_WIDTH - MARGIN_X, state.cursorY);
  state.cursorY += 4;

  // ---------------------------------------------------------------------------
  // 2. PARTY FINANCIAL SUMMARY CARD
  // ---------------------------------------------------------------------------
  const summaryCardH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(MARGIN_X, state.cursorY, CONTENT_WIDTH, summaryCardH, 2, 2, 'FD');

  const pCol1X = isRtl ? PAGE_WIDTH - MARGIN_X - 4 : MARGIN_X + 4;
  const pCol2X = isRtl ? MARGIN_X + 4 : PAGE_WIDTH - MARGIN_X - 4;
  const pAlign1 = isRtl ? 'right' : 'left';
  const pAlign2 = isRtl ? 'left' : 'right';

  // Column 1: Party Details
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const partyTypeLbl = isCustomer
    ? (isRtl ? 'حساب العميل:' : 'Customer Account:')
    : (isRtl ? 'حساب المورد:' : 'Distributor Account:');
  doc.text(shapeBidi(partyTypeLbl, isRtl), pCol1X, state.cursorY + 5, { align: pAlign1 });

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(party.name, isRtl), pCol1X, state.cursorY + 11, { align: pAlign1 });

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  if (party.phone) {
    doc.text(shapeBidi(`هاتف: ${party.phone}`, isRtl), pCol1X, state.cursorY + 16, { align: pAlign1 });
  }

  // Column 2: Current Outstanding Balance
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const curBalLbl = isRtl ? 'الرصيد الختامي الحالي:' : 'Current Balance:';
  doc.text(shapeBidi(curBalLbl, isRtl), pCol2X, state.cursorY + 5, { align: pAlign2 });

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(shapeBidi(formatAmount(party.currentBalance, profile.currency), isRtl), pCol2X, state.cursorY + 12, {
    align: pAlign2,
  });

  state.cursorY += summaryCardH + 5;

  // ---------------------------------------------------------------------------
  // 3. LEDGER CHRONOLOGICAL TABLE COMPUTATION
  // ---------------------------------------------------------------------------
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = Number(party.openingBalance || 0);

  interface LedgerRow {
    seq: string;
    date: string;
    ref: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    isVoided?: boolean;
  }

  const rows: LedgerRow[] = [];

  // Opening Balance Row
  rows.push({
    seq: '1',
    date: formatPdfDate(party.createdAt || sortedTxs[0]?.date),
    ref: '-',
    description: isRtl ? 'رصيد افتتاحي سابق' : 'Opening Balance',
    debit: running > 0 ? running : 0,
    credit: 0,
    balance: Math.round(running * 100) / 100,
  });

  for (let i = 0; i < sortedTxs.length; i++) {
    const tx = sortedTxs[i];
    let debit = 0;
    let credit = 0;

    if (!tx.isVoided) {
      if (isCustomer) {
        if (tx.type === 'SALE_CREDIT') {
          debit = tx.totalAmount - tx.paidAmount;
          running += debit;
        } else if (tx.type === 'PAYMENT_RECEIVED') {
          credit = tx.paidAmount;
          running -= credit;
        }
      } else {
        // Distributor
        if (tx.type === 'SUPPLY_CREDIT') {
          credit = tx.totalAmount - tx.paidAmount;
          running += credit;
        } else if (tx.type === 'PAYMENT_PAID') {
          debit = tx.paidAmount;
          running -= debit;
        }
      }
    }

    let txDesc = tx.notes || '';
    if (!txDesc) {
      if (tx.type === 'SALE_CREDIT') txDesc = isRtl ? 'فاتورة بيع آجل' : 'Credit Sale';
      else if (tx.type === 'SUPPLY_CREDIT') txDesc = isRtl ? 'سند توريد آجل' : 'Credit Supply';
      else if (tx.type === 'PAYMENT_RECEIVED') txDesc = isRtl ? 'سند قبض نقدي' : 'Payment Received';
      else if (tx.type === 'PAYMENT_PAID') txDesc = isRtl ? 'سند صرف نقدي' : 'Payment Paid';
    }

    rows.push({
      seq: String(rows.length + 1),
      date: formatPdfDate(tx.date),
      ref: tx.receiptNumber,
      description: txDesc,
      debit,
      credit,
      balance: Math.round(running * 100) / 100,
      isVoided: tx.isVoided,
    });
  }

  // Column widths (Total = 182mm)
  const colSeqW = 8;
  const colDateW = 20;
  const colRefW = 26;
  const colDescW = 54;
  const colDebitW = 24;
  const colCreditW = 24;
  const colBalW = 26;

  const renderTableHeader = (headerY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(MARGIN_X, headerY, CONTENT_WIDTH, 7.5, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    if (isRtl) {
      let x = PAGE_WIDTH - MARGIN_X;
      doc.text(shapeBidi('#', isRtl), x - colSeqW / 2, headerY + 5, { align: 'center' });
      x -= colSeqW;
      doc.text(shapeBidi('التاريخ', isRtl), x - colDateW / 2, headerY + 5, { align: 'center' });
      x -= colDateW;
      doc.text(shapeBidi('رقم القيد', isRtl), x - colRefW / 2, headerY + 5, { align: 'center' });
      x -= colRefW;
      doc.text(shapeBidi('البيان / الوصف', isRtl), x - 4, headerY + 5, { align: 'right' });
      x -= colDescW;
      doc.text(shapeBidi('مدين (+)', isRtl), x - colDebitW / 2, headerY + 5, { align: 'center' });
      x -= colDebitW;
      doc.text(shapeBidi('دائن (-)', isRtl), x - colCreditW / 2, headerY + 5, { align: 'center' });
      x -= colCreditW;
      doc.text(shapeBidi('الرصيد', isRtl), x - colBalW / 2, headerY + 5, { align: 'center' });
    } else {
      let x = MARGIN_X;
      doc.text('#', x + colSeqW / 2, headerY + 5, { align: 'center' });
      x += colSeqW;
      doc.text('Date', x + colDateW / 2, headerY + 5, { align: 'center' });
      x += colDateW;
      doc.text('Ref #', x + colRefW / 2, headerY + 5, { align: 'center' });
      x += colRefW;
      doc.text('Description', x + 4, headerY + 5, { align: 'left' });
      x += colDescW;
      doc.text('Debit (+)', x + colDebitW / 2, headerY + 5, { align: 'center' });
      x += colDebitW;
      doc.text('Credit (-)', x + colCreditW / 2, headerY + 5, { align: 'center' });
      x += colCreditW;
      doc.text('Balance', x + colBalW / 2, headerY + 5, { align: 'center' });
    }
  };

  renderTableHeader(state.cursorY);
  state.cursorY += 7.5;

  // Render Ledger rows with atomic pagination & repeated headers (Bug 8 fix)
  const rowH = 7.5;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    ensureSpace(doc, rowH, state, () => {
      renderTableHeader(state.cursorY);
      state.cursorY += 7.5;
    });

    const rowY = state.cursorY;
    const isEven = i % 2 === 1;

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN_X, rowY, CONTENT_WIDTH, rowH, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(MARGIN_X, rowY + rowH, PAGE_WIDTH - MARGIN_X, rowY + rowH);

    doc.setFontSize(8);
    doc.setTextColor(row.isVoided ? 148 : 15, row.isVoided ? 163 : 23, row.isVoided ? 184 : 42);

    const debitStr = row.debit > 0 ? row.debit.toFixed(2) : '-';
    const creditStr = row.credit > 0 ? row.credit.toFixed(2) : '-';
    const balStr = row.balance.toFixed(2);

    if (isRtl) {
      let x = PAGE_WIDTH - MARGIN_X;
      doc.text(row.seq, x - colSeqW / 2, rowY + 5, { align: 'center' });
      x -= colSeqW;
      doc.text(row.date, x - colDateW / 2, rowY + 5, { align: 'center' });
      x -= colDateW;
      doc.text(shapeBidi(row.ref, false), x - colRefW / 2, rowY + 5, { align: 'center' });
      x -= colRefW;
      doc.text(shapeBidi(row.description, isRtl), x - 4, rowY + 5, { align: 'right' });
      x -= colDescW;
      doc.setTextColor(row.debit > 0 ? 190 : 100, row.debit > 0 ? 18 : 116, row.debit > 0 ? 60 : 139);
      doc.text(debitStr, x - colDebitW / 2, rowY + 5, { align: 'center' });
      x -= colDebitW;
      doc.setTextColor(row.credit > 0 ? 15 : 100, row.credit > 0 ? 118 : 116, row.credit > 0 ? 110 : 139);
      doc.text(creditStr, x - colCreditW / 2, rowY + 5, { align: 'center' });
      x -= colCreditW;
      doc.setTextColor(15, 23, 42);
      doc.text(balStr, x - colBalW / 2, rowY + 5, { align: 'center' });
    } else {
      let x = MARGIN_X;
      doc.text(row.seq, x + colSeqW / 2, rowY + 5, { align: 'center' });
      x += colSeqW;
      doc.text(row.date, x + colDateW / 2, rowY + 5, { align: 'center' });
      x += colDateW;
      doc.text(row.ref, x + colRefW / 2, rowY + 5, { align: 'center' });
      x += colRefW;
      doc.text(row.description, x + 4, rowY + 5, { align: 'left' });
      x += colDescW;
      doc.setTextColor(row.debit > 0 ? 190 : 100, row.debit > 0 ? 18 : 116, row.debit > 0 ? 60 : 139);
      doc.text(debitStr, x + colDebitW / 2, rowY + 5, { align: 'center' });
      x += colDebitW;
      doc.setTextColor(row.credit > 0 ? 15 : 100, row.credit > 0 ? 118 : 116, row.credit > 0 ? 110 : 139);
      doc.text(creditStr, x + colCreditW / 2, rowY + 5, { align: 'center' });
      x += colCreditW;
      doc.setTextColor(15, 23, 42);
      doc.text(balStr, x + colBalW / 2, rowY + 5, { align: 'center' });
    }

    state.cursorY += rowH;
  }

  // ---------------------------------------------------------------------------
  // 4. STATEMENT TOTALS & SIGN-OFF
  // ---------------------------------------------------------------------------
  const stmtSummaryH = 30;
  ensureSpace(doc, stmtSummaryH, state);

  state.cursorY += 5;
  const signY = state.cursorY;
  const halfContentW = CONTENT_WIDTH / 2 - 8;

  const rSignX = isRtl ? PAGE_WIDTH - MARGIN_X - halfContentW : MARGIN_X;
  doc.setDrawColor(203, 213, 225);
  doc.line(rSignX, signY + 16, rSignX + halfContentW, signY + 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(shapeBidi(isRtl ? 'توقيع واعتماد العميل / المورد' : 'Party Confirmation Signature', isRtl), rSignX + halfContentW / 2, signY + 21, {
    align: 'center',
  });

  const mSignX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - halfContentW;
  doc.line(mSignX, signY + 16, mSignX + halfContentW, signY + 16);
  doc.text(shapeBidi(isRtl ? 'توقيع وختم المنشأة المعتمد' : 'Authorized Stamp & Signature', isRtl), mSignX + halfContentW / 2, signY + 21, {
    align: 'center',
  });

  // ---------------------------------------------------------------------------
  // 5. TWO-PASS PAGE NUMBERING & FOOTERS
  // ---------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_X, 283, PAGE_WIDTH - MARGIN_X, 283);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerNote = profile.invoiceFooterNote || (isRtl ? 'شكراً لتعاملكم معنا' : 'Thank you for your business');
    doc.text(shapeBidi(footerNote, isRtl), PAGE_WIDTH / 2, 288, { align: 'center' });

    const pageNumText = isRtl ? `صفحة ${p} من ${totalPages}` : `Page ${p} of ${totalPages}`;
    doc.text(shapeBidi(pageNumText, isRtl), isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X, 288, {
      align: isRtl ? 'left' : 'right',
    });
  }

  return doc;
}

/**
 * Mobile Native Web Share API with Desktop Download Fallback
 */
export async function shareOrDownloadPdf(
  doc: jsPDF,
  fileName = 'document.pdf',
  title = 'Document'
): Promise<PdfExportResult> {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    const blob = doc.output('blob');
    const file = new File([blob], safeFileName, { type: 'application/pdf' });

    // 1. Mobile Native Web Share API (Android Chrome & iOS Safari)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title,
          text: title,
          files: [file],
        });
        return { success: true, blob, method: 'native_share' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User closed share sheet normally
          return { success: true, blob, method: 'native_share' };
        }
        console.warn('Native share failed, using download fallback:', err);
      }
    }

    // 2. Desktop Download Fallback
    doc.save(safeFileName);
    return { success: true, blob, method: 'download_fallback' };
  } catch (error: any) {
    console.error('Error in shareOrDownloadPdf:', error);
    return { success: false, error: error?.message || 'Failed to export PDF' };
  }
}

/**
 * Backward-compatible helper aliases for any existing legacy callers
 */
export async function exportElementToPdf(
  _elementId: string,
  fileName = 'document.pdf',
  autoDownload = false
): Promise<Blob | null> {
  console.warn('exportElementToPdf is deprecated. Use generateInvoicePdf or generateStatementPdf directly.');
  const doc = new jsPDF();
  if (autoDownload) {
    doc.save(fileName);
  }
  return doc.output('blob');
}

export async function sharePdfFile(
  _elementId: string,
  fileName = 'document.pdf',
  title = 'Document',
  precomputedBlob?: Blob | null
): Promise<PdfExportResult> {
  console.warn('sharePdfFile is deprecated. Use shareOrDownloadPdf directly.');
  const doc = new jsPDF();
  if (precomputedBlob) {
    const file = new File([precomputedBlob], fileName, { type: 'application/pdf' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return { success: true, blob: precomputedBlob, method: 'native_share' };
    }
  }
  return shareOrDownloadPdf(doc, fileName, title);
}

export default {
  generateInvoicePdf,
  generateStatementPdf,
  shareOrDownloadPdf,
  exportElementToPdf,
  sharePdfFile,
};
