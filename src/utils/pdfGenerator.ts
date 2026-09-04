import { jsPDF } from 'jspdf';
import { BusinessProfile, Transaction, Party, Language } from '../types';
import { formatCurrency, formatDate, sanitizePhoneNumber } from './formatters';

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

// ============================================================================
// Canvas-based High-DPI A4 PDF Rendering Engine (Native Vector & Canvas Engine)
// ============================================================================

const PAGE_WIDTH = 1240;  // A4 @ ~150 DPI
const PAGE_HEIGHT = 1754;
const MARGIN_X = 60;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 1120px
const BOTTOM_LIMIT = 1640;

function createA4Canvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  return { canvas, ctx };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill?: string,
  stroke?: string,
  lineWidth = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  pageNum: number,
  totalPages: number,
  isRtl: boolean
) {
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, 1680);
  ctx.lineTo(PAGE_WIDTH - MARGIN_X, 1680);
  ctx.stroke();

  ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  // System branding
  const brandText = isRtl
    ? 'تم إصدار هذه الوثيقة آلياً عبر نظام الدفتر الذكي (The Smart Dafter)'
    : 'Issued electronically via The Smart Dafter';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(brandText, isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X, 1710);

  // Page numbering
  const pageText = isRtl
    ? `صفحة ${pageNum} من ${totalPages}`
    : `Page ${pageNum} of ${totalPages}`;
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(pageText, isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X, 1710);

  ctx.restore();
}

// ============================================================================
// Statement PDF Generator (Multi-Page Intelligent Ledger Engine)
// ============================================================================

export async function generateStatementPdf(
  options: GenerateStatementPdfOptions
): Promise<jsPDF> {
  const { profile, party, transactions, startDate, endDate, lang = 'ar' } = options;
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';
  const isCustomer = party.type === 'CUSTOMER';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (typeof document === 'undefined') {
    doc.text(`Statement: ${party.name}`, 14, 20);
    return doc;
  }

  // 1. Prepare sorted ledger rows with running balance
  const filtered = transactions.filter((tx) => {
    const txDate = tx.date ? tx.date.split('T')[0] : '';
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });

  const sortedAsc = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let rolling = Number(party.openingBalance) || 0;
  const rows: Array<{
    index: number;
    date: string;
    ref: string;
    desc: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }> = [];

  // Opening balance row if non-zero
  if (rolling !== 0) {
    rows.push({
      index: 0,
      date: startDate || (party.createdAt ? party.createdAt.split('T')[0] : '-'),
      ref: '-',
      desc: isRtl ? 'رصيد افتتاحي سابق' : 'Opening Balance',
      debit: rolling > 0 ? (isCustomer ? rolling : 0) : (isCustomer ? 0 : Math.abs(rolling)),
      credit: rolling > 0 ? (isCustomer ? 0 : rolling) : (isCustomer ? Math.abs(rolling) : 0),
      runningBalance: Math.round(rolling * 100) / 100,
    });
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < sortedAsc.length; i++) {
    const tx = sortedAsc[i];
    let debit = 0;
    let credit = 0;

    if (!tx.isVoided) {
      if (isCustomer) {
        if (tx.type === 'SALE_CREDIT') {
          debit = tx.totalAmount - tx.paidAmount;
          rolling += debit;
        } else if (tx.type === 'PAYMENT_RECEIVED') {
          credit = tx.paidAmount;
          rolling -= credit;
        }
      } else {
        if (tx.type === 'SUPPLY_CREDIT') {
          credit = tx.totalAmount - tx.paidAmount;
          rolling += credit;
        } else if (tx.type === 'PAYMENT_PAID') {
          debit = tx.paidAmount;
          rolling -= debit;
        }
      }
    }

    totalDebit += debit;
    totalCredit += credit;

    let desc = tx.notes;
    if (!desc) {
      if (tx.type === 'SALE_CREDIT') desc = isRtl ? 'فاتورة بيع آجل' : 'Credit Sale';
      else if (tx.type === 'PAYMENT_RECEIVED') desc = isRtl ? 'سند قبض مالي' : 'Payment Receipt';
      else if (tx.type === 'SUPPLY_CREDIT') desc = isRtl ? 'سند توريد آجل' : 'Supply Credit';
      else desc = isRtl ? 'سند صرف نقدي' : 'Payment Voucher';
    }
    if (tx.isVoided) {
      desc = `[${isRtl ? 'ملغاة' : 'VOIDED'}] ${desc}`;
    }

    rows.push({
      index: i + 1,
      date: tx.date ? tx.date.split('T')[0] : '-',
      ref: tx.receiptNumber || '-',
      desc,
      debit,
      credit,
      runningBalance: Math.round(rolling * 100) / 100,
    });
  }

  // 2. Table Column Dimensions (total = 1120px)
  const cols = [
    { key: 'index', width: 60, title: '#' },
    { key: 'date', width: 130, title: isRtl ? 'التاريخ' : 'Date' },
    { key: 'ref', width: 140, title: isRtl ? 'رقم السند' : 'Ref #' },
    { key: 'desc', width: 350, title: isRtl ? 'البيان والتفاصيل' : 'Description' },
    { key: 'debit', width: 140, title: isRtl ? 'مدين (+)' : 'Debit (+)' },
    { key: 'credit', width: 140, title: isRtl ? 'دائن (-)' : 'Credit (-)' },
    { key: 'balance', width: 160, title: isRtl ? 'الرصيد' : 'Balance' },
  ];

  const ROW_HEIGHT = 38;
  const HEADER_HEIGHT = 42;

  // 3. Multi-page Canvas Collection
  const pages: HTMLCanvasElement[] = [];

  function startNewPage(isFirstPage: boolean): { ctx: CanvasRenderingContext2D; currentY: number } {
    const { canvas, ctx } = createA4Canvas();
    pages.push(canvas);

    ctx.direction = isRtl ? 'rtl' : 'ltr';
    let currentY = 60;

    if (isFirstPage) {
      // Primary Header Banner
      ctx.save();
      // Store Name
      ctx.font = 'bold 28px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(profile.name, isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X, currentY + 30);

      // Store Details (phone, VAT)
      ctx.font = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      let subY = currentY + 54;
      if (profile.phone) {
        ctx.fillText(
          `${isRtl ? 'هاتف / جوال: ' : 'Phone: '} ${profile.phone}`,
          isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X,
          subY
        );
        subY += 22;
      }
      if (profile.taxNumber) {
        ctx.fillText(
          `${isRtl ? 'الرقم الضريبي: ' : 'VAT No: '} ${profile.taxNumber}`,
          isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X,
          subY
        );
      }

      // Opposite side: Document Badge & Meta
      const badgeW = 220;
      const badgeH = 44;
      const badgeX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - badgeW;
      drawRoundedRect(ctx, badgeX, currentY, badgeW, badgeH, 8, '#0f172a');

      ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(
        isRtl ? 'كشف حساب مالي' : 'ACCOUNT STATEMENT',
        badgeX + badgeW / 2,
        currentY + 28
      );

      ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = isRtl ? 'left' : 'right';
      const metaX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X;
      ctx.fillText(
        `${isRtl ? 'تاريخ الإصدار: ' : 'Date: '} ${formatDate(new Date().toISOString(), lang)}`,
        metaX,
        currentY + 68
      );

      if (startDate || endDate) {
        ctx.fillText(
          `${isRtl ? 'الفترة: ' : 'Period: '} ${startDate || '...'} ${isRtl ? 'إلى' : 'to'} ${endDate || '...'}`,
          metaX,
          currentY + 88
        );
      }
      ctx.restore();

      currentY += 115;

      // Divider Line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN_X, currentY);
      ctx.lineTo(PAGE_WIDTH - MARGIN_X, currentY);
      ctx.stroke();

      currentY += 20;

      // Account Summary Banner Box
      const boxH = 110;
      drawRoundedRect(ctx, MARGIN_X, currentY, CONTENT_WIDTH, boxH, 12, '#f8fafc', '#cbd5e1', 1);

      ctx.save();
      // Party Column
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      ctx.textAlign = isRtl ? 'right' : 'left';
      const partyColX = isRtl ? PAGE_WIDTH - MARGIN_X - 25 : MARGIN_X + 25;

      ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        isCustomer ? (isRtl ? 'بيانات العميل (مدين):' : 'BILL TO:') : (isRtl ? 'بيانات المورد (دائن):' : 'SUPPLIER:'),
        partyColX,
        currentY + 28
      );

      ctx.font = 'bold 20px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(party.name, partyColX, currentY + 56);

      ctx.font = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(party.phone || '-', partyColX, currentY + 82);

      // Outstanding Balance Column (Opposite side)
      ctx.textAlign = isRtl ? 'left' : 'right';
      const balanceColX = isRtl ? MARGIN_X + 25 : PAGE_WIDTH - MARGIN_X - 25;

      ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(isRtl ? 'الرصيد القائم الحالي:' : 'OUTSTANDING BALANCE:', balanceColX, currentY + 28);

      const balColor = party.currentBalance > 0
        ? (isCustomer ? '#b91c1c' : '#b45309')
        : '#047857';

      ctx.font = 'bold 24px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = balColor;
      ctx.fillText(formatCurrency(party.currentBalance, currency, lang), balanceColX, currentY + 60);

      ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      const statusText = party.currentBalance === 0
        ? (isRtl ? 'الحساب خالص بالكامل (مسدد)' : 'Settled (Zero Balance)')
        : (isCustomer
            ? (isRtl ? 'مستحق بذمة العميل' : 'Customer Owes Merchant')
            : (isRtl ? 'مستحق بذمة المتجر للمورد' : 'Merchant Owes Supplier'));
      ctx.fillText(statusText, balanceColX, currentY + 84);

      ctx.restore();
      currentY += boxH + 25;
    } else {
      // Subsequent Pages Minimal Header
      ctx.save();
      ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = isRtl ? 'right' : 'left';
      const repeatTitle = isRtl
        ? `تابع كشف حساب: ${party.name} (${profile.name})`
        : `Statement Continuation: ${party.name} (${profile.name})`;
      ctx.fillText(repeatTitle, isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X, currentY + 20);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN_X, currentY + 35);
      ctx.lineTo(PAGE_WIDTH - MARGIN_X, currentY + 35);
      ctx.stroke();
      ctx.restore();

      currentY += 50;
    }

    // Draw Table Header
    drawTableHeader(ctx, currentY);
    currentY += HEADER_HEIGHT;

    return { ctx, currentY };
  }

  function drawTableHeader(ctx: CanvasRenderingContext2D, y: number) {
    drawRoundedRect(ctx, MARGIN_X, y, CONTENT_WIDTH, HEADER_HEIGHT, 6, '#1e293b');

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    let curX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
    for (const col of cols) {
      if (isRtl) {
        ctx.textAlign = col.key === 'desc' || col.key === 'index' || col.key === 'ref' || col.key === 'date' ? 'right' : 'left';
        const cellX = ctx.textAlign === 'right' ? curX - 10 : curX - col.width + 10;
        ctx.fillText(col.title, cellX, y + 26);
        curX -= col.width;
      } else {
        ctx.textAlign = col.key === 'desc' || col.key === 'index' || col.key === 'ref' || col.key === 'date' ? 'left' : 'right';
        const cellX = ctx.textAlign === 'left' ? curX + 10 : curX + col.width - 10;
        ctx.fillText(col.title, cellX, y + 26);
        curX += col.width;
      }
    }
    ctx.restore();
  }

  // Draw Statement Rows across pages
  let currentPage = startNewPage(true);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    // Check pagination
    if (currentPage.currentY + ROW_HEIGHT > BOTTOM_LIMIT - 100) {
      currentPage = startNewPage(false);
    }

    const y = currentPage.currentY;
    const ctx = currentPage.ctx;

    // Row zebra striping
    if (r % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(MARGIN_X, y, CONTENT_WIDTH, ROW_HEIGHT);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN_X, y, CONTENT_WIDTH, ROW_HEIGHT);

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#1e293b';

    let curX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
    for (const col of cols) {
      let cellText = '';
      let textColor = '#1e293b';
      let fontOverride: string | null = null;

      if (col.key === 'index') {
        cellText = row.index === 0 ? '-' : String(row.index);
        textColor = '#64748b';
      } else if (col.key === 'date') {
        cellText = row.date;
      } else if (col.key === 'ref') {
        cellText = row.ref;
        fontOverride = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'desc') {
        cellText = fitText(ctx, row.desc, col.width - 20);
      } else if (col.key === 'debit') {
        cellText = row.debit > 0 ? formatCurrency(row.debit, currency, lang) : '-';
        textColor = row.debit > 0 ? '#b91c1c' : '#94a3b8';
        if (row.debit > 0) fontOverride = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'credit') {
        cellText = row.credit > 0 ? formatCurrency(row.credit, currency, lang) : '-';
        textColor = row.credit > 0 ? '#047857' : '#94a3b8';
        if (row.credit > 0) fontOverride = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'balance') {
        cellText = formatCurrency(row.runningBalance, currency, lang);
        textColor = '#0f172a';
        fontOverride = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      }

      ctx.font = fontOverride || '12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = textColor;

      if (isRtl) {
        ctx.textAlign = col.key === 'desc' || col.key === 'index' || col.key === 'ref' || col.key === 'date' ? 'right' : 'left';
        const cellX = ctx.textAlign === 'right' ? curX - 10 : curX - col.width + 10;
        ctx.fillText(cellText, cellX, y + 24);
        curX -= col.width;
      } else {
        ctx.textAlign = col.key === 'desc' || col.key === 'index' || col.key === 'ref' || col.key === 'date' ? 'left' : 'right';
        const cellX = ctx.textAlign === 'left' ? curX + 10 : curX + col.width - 10;
        ctx.fillText(cellText, cellX, y + 24);
        curX += col.width;
      }
    }
    ctx.restore();

    currentPage.currentY += ROW_HEIGHT;
  }

  // Totals Row
  if (currentPage.currentY + ROW_HEIGHT > BOTTOM_LIMIT - 80) {
    currentPage = startNewPage(false);
  }

  const totalsY = currentPage.currentY;
  const tCtx = currentPage.ctx;
  drawRoundedRect(tCtx, MARGIN_X, totalsY, CONTENT_WIDTH, ROW_HEIGHT + 4, 4, '#f1f5f9', '#94a3b8', 1.5);

  tCtx.save();
  tCtx.direction = isRtl ? 'rtl' : 'ltr';
  tCtx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';

  // Label: Total
  tCtx.fillStyle = '#0f172a';
  tCtx.textAlign = isRtl ? 'right' : 'left';
  const labelX = isRtl ? PAGE_WIDTH - MARGIN_X - 20 : MARGIN_X + 20;
  tCtx.fillText(isRtl ? 'المجموع الإجمالي للحركات:' : 'Total Activity:', labelX, totalsY + 26);

  // Total Debit
  tCtx.fillStyle = '#b91c1c';
  tCtx.textAlign = isRtl ? 'left' : 'right';
  const debitX = isRtl ? MARGIN_X + 440 : MARGIN_X + CONTENT_WIDTH - 440;
  tCtx.fillText(formatCurrency(totalDebit, currency, lang), debitX, totalsY + 26);

  // Total Credit
  tCtx.fillStyle = '#047857';
  const creditX = isRtl ? MARGIN_X + 300 : MARGIN_X + CONTENT_WIDTH - 300;
  tCtx.fillText(formatCurrency(totalCredit, currency, lang), creditX, totalsY + 26);

  // Final Balance
  tCtx.fillStyle = '#0f172a';
  const balX = isRtl ? MARGIN_X + 140 : MARGIN_X + CONTENT_WIDTH - 140;
  tCtx.fillText(formatCurrency(rolling, currency, lang), balX, totalsY + 26);
  tCtx.restore();

  currentPage.currentY += ROW_HEIGHT + 35;

  // Final Page Bank & Sign-off Block
  if (currentPage.currentY + 110 > BOTTOM_LIMIT) {
    currentPage = startNewPage(false);
  }

  const finalCtx = currentPage.ctx;
  const signY = currentPage.currentY;

  finalCtx.save();
  // Bank Details Card
  if (profile.iban || profile.bankName) {
    const bankBoxW = 460;
    drawRoundedRect(finalCtx, MARGIN_X, signY, bankBoxW, 90, 8, '#f8fafc', '#cbd5e1', 1);
    finalCtx.direction = isRtl ? 'rtl' : 'ltr';
    finalCtx.textAlign = isRtl ? 'right' : 'left';
    finalCtx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
    finalCtx.fillStyle = '#0f172a';
    const bTextX = isRtl ? MARGIN_X + bankBoxW - 15 : MARGIN_X + 15;
    finalCtx.fillText(isRtl ? 'بيانات التحويل البنكي للمتجر:' : 'Bank Transfer Details:', bTextX, signY + 26);

    finalCtx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
    finalCtx.fillStyle = '#475569';
    if (profile.bankName) {
      finalCtx.fillText(`${isRtl ? 'البنك: ' : 'Bank: '} ${profile.bankName}`, bTextX, signY + 50);
    }
    if (profile.iban) {
      finalCtx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", monospace';
      finalCtx.fillStyle = '#0f172a';
      finalCtx.fillText(`IBAN: ${profile.iban}`, bTextX, signY + 74);
    }
  }

  // Stamp & Signature Box (Opposite side)
  const signBoxW = 320;
  const signBoxX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - signBoxW;
  drawRoundedRect(finalCtx, signBoxX, signY, signBoxW, 90, 8, '#ffffff', '#cbd5e1', 1);

  finalCtx.direction = isRtl ? 'rtl' : 'ltr';
  finalCtx.textAlign = 'center';
  finalCtx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
  finalCtx.fillStyle = '#0f172a';
  finalCtx.fillText(profile.name, signBoxX + signBoxW / 2, signY + 26);

  finalCtx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
  finalCtx.fillStyle = '#94a3b8';
  finalCtx.fillText(
    isRtl ? 'الختم والتوقيع المعتمد' : 'Authorized Signature & Stamp',
    signBoxX + signBoxW / 2,
    signY + 74
  );
  finalCtx.restore();

  // 4. Draw Footer & Page Numbers on all pages
  const totalPages = pages.length;
  for (let p = 0; p < totalPages; p++) {
    const pCanvas = pages[p];
    const pCtx = pCanvas.getContext('2d')!;
    drawFooter(pCtx, p + 1, totalPages, isRtl);

    const imgData = pCanvas.toDataURL('image/jpeg', 0.95);
    if (p > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  return doc;
}

// ============================================================================
// Invoice & Voucher PDF Generator (ZATCA QR Vector Embedded)
// ============================================================================

export async function generateInvoicePdf(
  options: GenerateInvoicePdfOptions
): Promise<jsPDF> {
  const { profile, transaction, party, zatcaQrDataUrl, isVatApplied = false, lang = 'ar' } = options;
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';

  const isSale = transaction.type === 'SALE_CREDIT';
  const isSupply = transaction.type === 'SUPPLY_CREDIT';
  const isReceipt = transaction.type === 'PAYMENT_RECEIVED';
  const isPayment = transaction.type === 'PAYMENT_PAID';

  const docTitle = isSale
    ? isVatApplied
      ? (isRtl ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice')
      : (isRtl ? 'فاتورة بيع بالآجل' : 'Credit Sale Invoice')
    : isSupply
    ? (isRtl ? 'سند توريد بالآجل' : 'Credit Supply Note')
    : isReceipt
    ? (isRtl ? 'سند قبض مالي' : 'Payment Receipt Voucher')
    : (isRtl ? 'سند صرف نقدي' : 'Payment Voucher');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (typeof document === 'undefined') {
    doc.text(`Invoice: ${transaction.receiptNumber}`, 14, 20);
    return doc;
  }

  // Pre-load QR Code & Logo Images
  const qrImg = zatcaQrDataUrl ? await loadImage(zatcaQrDataUrl) : null;
  const logoImg = profile.logoBase64 ? await loadImage(profile.logoBase64) : null;

  const { canvas, ctx } = createA4Canvas();
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  let currentY = 60;

  // 1. Header Banner
  ctx.save();
  let textStartX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;

  // Draw Logo if present
  if (logoImg) {
    const logoSize = 80;
    const logoX = isRtl ? PAGE_WIDTH - MARGIN_X - logoSize : MARGIN_X;
    ctx.drawImage(logoImg, logoX, currentY, logoSize, logoSize);
    textStartX = isRtl ? PAGE_WIDTH - MARGIN_X - logoSize - 20 : MARGIN_X + logoSize + 20;
  }

  // Business Name
  ctx.font = 'bold 28px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(profile.name, textStartX, currentY + 30);

  // Business Subtitle & Tax Number
  ctx.font = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  let bSubY = currentY + 54;
  if (profile.phone) {
    ctx.fillText(`${isRtl ? 'الهاتف: ' : 'Phone: '} ${profile.phone}`, textStartX, bSubY);
    bSubY += 22;
  }
  if (profile.taxNumber) {
    ctx.fillText(`${isRtl ? 'الرقم الضريبي: ' : 'VAT: '} ${profile.taxNumber}`, textStartX, bSubY);
  }

  // Opposite side: Doc Title Badge & Reference
  const badgeW = 240;
  const badgeH = 46;
  const badgeX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - badgeW;
  const badgeFill = isSale ? '#0f172a' : isReceipt ? '#047857' : isPayment ? '#b91c1c' : '#0284c7';
  drawRoundedRect(ctx, badgeX, currentY, badgeW, badgeH, 8, badgeFill);

  ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(docTitle, badgeX + badgeW / 2, currentY + 29);

  // Invoice Number & Date
  ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = isRtl ? 'left' : 'right';
  const metaX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X;
  ctx.fillText(`#${transaction.receiptNumber}`, metaX, currentY + 74);

  ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(formatDate(transaction.date, lang), metaX, currentY + 96);
  ctx.restore();

  currentY += 125;

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, currentY);
  ctx.lineTo(PAGE_WIDTH - MARGIN_X, currentY);
  ctx.stroke();

  currentY += 20;

  // 2. Party & Transaction Details Cards (2 columns)
  const cardW = (CONTENT_WIDTH - 20) / 2;
  const cardH = 100;

  // Bill To / Supplier Card
  const partyCardX = isRtl ? PAGE_WIDTH - MARGIN_X - cardW : MARGIN_X;
  drawRoundedRect(ctx, partyCardX, currentY, cardW, cardH, 10, '#f8fafc', '#cbd5e1', 1);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const pTextX = isRtl ? partyCardX + cardW - 18 : partyCardX + 18;

  ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    isSale || isReceipt
      ? (isRtl ? 'فاتورة موجهة إلى العميل:' : 'BILL TO:')
      : (isRtl ? 'سند موجه إلى المورد:' : 'SUPPLIER:'),
    pTextX,
    currentY + 26
  );

  ctx.font = 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(party.name, pTextX, currentY + 52);

  ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(party.phone || '-', pTextX, currentY + 76);
  ctx.restore();

  // Invoice Details Card
  const metaCardX = isRtl ? MARGIN_X : MARGIN_X + cardW + 20;
  drawRoundedRect(ctx, metaCardX, currentY, cardW, cardH, 10, '#f8fafc', '#cbd5e1', 1);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const mTextX = isRtl ? metaCardX + cardW - 18 : metaCardX + 18;

  ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(isRtl ? 'تفاصيل العملية:' : 'TRANSACTION DETAILS:', mTextX, currentY + 26);

  ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    `${isRtl ? 'طريقة السداد: ' : 'Payment Method: '} ${transaction.paymentMethod || (isRtl ? 'آجل مسجل بالدفتر' : 'Credit / On-Account')}`,
    mTextX,
    currentY + 52
  );

  ctx.fillText(
    `${isRtl ? 'الحالة: ' : 'Status: '} ${transaction.isVoided ? (isRtl ? 'ملغاة' : 'VOIDED') : (isRtl ? 'معتمدة ومسجلة' : 'Confirmed')}`,
    mTextX,
    currentY + 76
  );
  ctx.restore();

  currentY += cardH + 25;

  // 3. Line Items Table (For Sale & Supply)
  const items = transaction.items || [];
  if (items.length > 0) {
    const itemCols = [
      { key: 'index', width: 60, title: '#' },
      { key: 'name', width: 500, title: isRtl ? 'اسم الصنف / البضاعة' : 'Item Description' },
      { key: 'qty', width: 160, title: isRtl ? 'الكمية' : 'Quantity' },
      { key: 'price', width: 180, title: isRtl ? 'سعر الوحدة' : 'Unit Price' },
      { key: 'total', width: 220, title: isRtl ? 'الإجمالي' : 'Total' },
    ];

    // Table Header
    drawRoundedRect(ctx, MARGIN_X, currentY, CONTENT_WIDTH, 40, 6, '#1e293b');
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    let hX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
    for (const col of itemCols) {
      if (isRtl) {
        ctx.textAlign = col.key === 'name' || col.key === 'index' ? 'right' : 'left';
        const cX = ctx.textAlign === 'right' ? hX - 12 : hX - col.width + 12;
        ctx.fillText(col.title, cX, currentY + 25);
        hX -= col.width;
      } else {
        ctx.textAlign = col.key === 'name' || col.key === 'index' ? 'left' : 'right';
        const cX = ctx.textAlign === 'left' ? hX + 12 : hX + col.width - 12;
        ctx.fillText(col.title, cX, currentY + 25);
        hX += col.width;
      }
    }
    ctx.restore();
    currentY += 40;

    // Table Rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rY = currentY;

      if (i % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(MARGIN_X, rY, CONTENT_WIDTH, 36);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN_X, rY, CONTENT_WIDTH, 36);

      ctx.save();
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#1e293b';

      let rowX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;
      for (const col of itemCols) {
        let text = '';
        if (col.key === 'index') text = String(i + 1);
        else if (col.key === 'name') text = fitText(ctx, item.name, col.width - 24);
        else if (col.key === 'qty') text = String(item.quantity);
        else if (col.key === 'price') text = formatCurrency(item.unitPrice, currency, lang);
        else if (col.key === 'total') text = formatCurrency(item.subtotal, currency, lang);

        if (isRtl) {
          ctx.textAlign = col.key === 'name' || col.key === 'index' ? 'right' : 'left';
          const cX = ctx.textAlign === 'right' ? rowX - 12 : rowX - col.width + 12;
          ctx.fillText(text, cX, rY + 23);
          rowX -= col.width;
        } else {
          ctx.textAlign = col.key === 'name' || col.key === 'index' ? 'left' : 'right';
          const cX = ctx.textAlign === 'left' ? rowX + 12 : rowX + col.width - 12;
          ctx.fillText(text, cX, rY + 23);
          rowX += col.width;
        }
      }
      ctx.restore();
      currentY += 36;
    }
  } else {
    // Payment Receipt / Voucher Highlight Box
    const payH = 100;
    drawRoundedRect(ctx, MARGIN_X, currentY, CONTENT_WIDTH, payH, 10, '#f8fafc', '#cbd5e1', 1);

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isRtl ? 'المبلغ المستلم / المدفوع:' : 'Voucher Amount:', PAGE_WIDTH / 2, currentY + 34);

    ctx.font = 'bold 32px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = isReceipt ? '#047857' : '#b91c1c';
    ctx.fillText(
      formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, lang),
      PAGE_WIDTH / 2,
      currentY + 76
    );
    ctx.restore();

    currentY += payH + 20;
  }

  currentY += 20;

  // 4. Financial Summary Breakdown & ZATCA QR Code Block
  const summaryBoxW = 480;
  const qrBoxW = 320;
  const sumY = currentY;

  // Financial Breakdown Box
  const sumBoxX = isRtl ? MARGIN_X : PAGE_WIDTH - MARGIN_X - summaryBoxW;
  drawRoundedRect(ctx, sumBoxX, sumY, summaryBoxW, 210, 10, '#f8fafc', '#cbd5e1', 1);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  let lineY = sumY + 30;

  const drawSummaryLine = (label: string, value: string, isBold = false, color = '#1e293b') => {
    ctx.font = isBold
      ? 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif'
      : '13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = color;

    // Label
    ctx.textAlign = isRtl ? 'right' : 'left';
    const lX = isRtl ? sumBoxX + summaryBoxW - 20 : sumBoxX + 20;
    ctx.fillText(label, lX, lineY);

    // Value
    ctx.textAlign = isRtl ? 'left' : 'right';
    const vX = isRtl ? sumBoxX + 20 : sumBoxX + summaryBoxW - 20;
    ctx.fillText(value, vX, lineY);

    lineY += 28;
  };

  const subtotal = transaction.subtotalBeforeTax ?? transaction.totalAmount;
  drawSummaryLine(isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal:', formatCurrency(subtotal, currency, lang));

  if (transaction.discountAmount && transaction.discountAmount > 0) {
    drawSummaryLine(isRtl ? 'الخصم الممنوح:' : 'Discount:', `- ${formatCurrency(transaction.discountAmount, currency, lang)}`, false, '#b91c1c');
  }

  if (isVatApplied && transaction.taxAmount && transaction.taxAmount > 0) {
    drawSummaryLine(
      `${isRtl ? 'ضريبة القيمة المضافة ' : 'VAT '}(${transaction.taxRate || 15}%):`,
      formatCurrency(transaction.taxAmount, currency, lang)
    );
  }

  // Grand Total Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sumBoxX + 15, lineY - 14);
  ctx.lineTo(sumBoxX + summaryBoxW - 15, lineY - 14);
  ctx.stroke();

  drawSummaryLine(isRtl ? 'الإجمالي النهائي:' : 'Grand Total:', formatCurrency(transaction.totalAmount, currency, lang), true, '#0f172a');

  if (transaction.paidAmount > 0) {
    drawSummaryLine(isRtl ? 'المدفوع نقداً:' : 'Paid Amount:', formatCurrency(transaction.paidAmount, currency, lang), false, '#047857');
  }

  const remaining = Math.max(0, transaction.totalAmount - transaction.paidAmount);
  if (remaining > 0) {
    drawSummaryLine(isRtl ? 'المتبقي مقيد بالآجل:' : 'Remaining On-Account:', formatCurrency(remaining, currency, lang), true, '#b91c1c');
  }
  ctx.restore();

  // ZATCA QR Code Box (Opposite side)
  const qrBoxX = isRtl ? PAGE_WIDTH - MARGIN_X - qrBoxW : MARGIN_X;
  drawRoundedRect(ctx, qrBoxX, sumY, qrBoxW, 210, 10, '#ffffff', '#cbd5e1', 1);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';

  if (qrImg) {
    const qrSize = 140;
    ctx.drawImage(qrImg, qrBoxX + (qrBoxW - qrSize) / 2, sumY + 18, qrSize, qrSize);

    ctx.font = 'bold 11px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(
      isRtl ? 'رمز الفوترة الإلكترونية (ZATCA)' : 'ZATCA E-Invoice QR Code',
      qrBoxX + qrBoxW / 2,
      sumY + 185
    );
  } else {
    ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(
      isRtl ? 'الدفتر الذكي' : 'The Smart Dafter',
      qrBoxX + qrBoxW / 2,
      sumY + 95
    );
    ctx.font = '11px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillText(
      isRtl ? 'نظام الفوترة وإدارة الحسابات' : 'E-Invoicing & Ledger System',
      qrBoxX + qrBoxW / 2,
      sumY + 120
    );
  }
  ctx.restore();

  // 5. Bank Info & Footer Notes
  currentY = sumY + 230;

  if (profile.iban || profile.invoiceFooterNote) {
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';
    const noteX = isRtl ? PAGE_WIDTH - MARGIN_X : MARGIN_X;

    if (profile.iban) {
      ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        `${isRtl ? 'الحساب البنكي: ' : 'Bank: '} ${profile.bankName || ''} | IBAN: ${profile.iban}`,
        noteX,
        currentY
      );
      currentY += 20;
    }

    if (profile.invoiceFooterNote) {
      ctx.font = '11px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(profile.invoiceFooterNote, noteX, currentY);
    }
    ctx.restore();
  }

  // Draw Page Footer
  drawFooter(ctx, 1, 1, isRtl);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

  return doc;
}

// ============================================================================
// Universal PDF Share & Download Manager (Web Share API + File Fallback)
// ============================================================================

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

    // 1. Native Web Share API (iOS Safari, Android Chrome, Samsung Internet)
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

// Retained for backward-compatibility with tests / interfaces
export async function exportElementToPdf(
  elementId: string,
  fileName = 'document.pdf',
  autoDownload = false
): Promise<{ blob: Blob; doc: jsPDF } | null> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  if (autoDownload) {
    doc.save(fileName);
  }
  const blob = doc.output('blob');
  return { blob, doc };
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
