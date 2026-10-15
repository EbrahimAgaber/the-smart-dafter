import { jsPDF } from 'jspdf';
import { BusinessProfile, Transaction, Party, Language } from '../types';
import { formatCurrency, formatDate, sanitizePhoneNumber } from './formatters';
import { getDocumentNaming } from './messageEngine';
import { verifyPdfBlobIntegrity, formatBlobSize, type PdfIntegrityResult, type IntegrityCheckStatus } from './pdfIntegrity';

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
  format?: 'A4' | 'THERMAL_80MM' | 'MOBILE_PHONE';
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
// Core Vector & Canvas Engine Helpers
// ============================================================================

const A4_WIDTH = 1240;  // A4 @ ~150 DPI
const A4_HEIGHT = 1754;
const A4_MARGIN_X = 60;
const A4_CONTENT_WIDTH = A4_WIDTH - A4_MARGIN_X * 2; // 1120px
const A4_BOTTOM_LIMIT = 1640;

function createA4Canvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = A4_WIDTH;
  canvas.height = A4_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
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
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Standardized Date and Time Formatter for PDF generation.
 * Avoids browser BiDi reordering quirks (such as flipped 'م' or scrambled timestamps)
 * by producing clean, standardized Arabic/English date ribbons.
 */
function formatPdfDate(dateString: string, lang: Language = 'ar'): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const isPm = hours >= 12;
    hours = hours % 12 || 12;
    const hStr = String(hours).padStart(2, '0');

    if (lang === 'ar') {
      const ampm = isPm ? 'م' : 'ص';
      return `${year}/${month}/${day}   ${hStr}:${minutes} ${ampm}`;
    } else {
      const ampm = isPm ? 'PM' : 'AM';
      return `${year}-${month}-${day}   ${hStr}:${minutes} ${ampm}`;
    }
  } catch {
    return dateString;
  }
}

interface ColumnDef {
  key: string;
  title: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

interface ComputedColumn extends ColumnDef {
  left: number;
  right: number;
  center: number;
}

/**
 * Computes exact non-overlapping column bounds across RTL and LTR layouts.
 */
function computeColumnBounds(
  cols: ColumnDef[],
  tableLeft: number,
  totalWidth: number,
  isRtl: boolean
): ComputedColumn[] {
  const result: ComputedColumn[] = [];
  if (isRtl) {
    let curRight = tableLeft + totalWidth;
    for (const col of cols) {
      const left = curRight - col.width;
      result.push({
        ...col,
        left,
        right: curRight,
        center: (left + curRight) / 2,
      });
      curRight = left;
    }
  } else {
    let curLeft = tableLeft;
    for (const col of cols) {
      const right = curLeft + col.width;
      result.push({
        ...col,
        left: curLeft,
        right,
        center: (curLeft + right) / 2,
      });
      curLeft = right;
    }
  }
  return result;
}

function drawA4Footer(
  ctx: CanvasRenderingContext2D,
  pageNum: number,
  totalPages: number,
  isRtl: boolean
) {
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(A4_MARGIN_X, 1680);
  ctx.lineTo(A4_WIDTH - A4_MARGIN_X, 1680);
  ctx.stroke();

  ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  const brandText = isRtl
    ? 'تم إصدار هذه الوثيقة آلياً عبر نظام الدفتر الذكي (The Smart Dafter)'
    : 'Issued electronically via The Smart Dafter';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(brandText, isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X, 1710);

  const pageText = isRtl
    ? `صفحة ${pageNum} من ${totalPages}`
    : `Page ${pageNum} of ${totalPages}`;
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(pageText, isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X, 1710);

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

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
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
      const txNaming = getDocumentNaming(tx.type, lang, Boolean(tx.taxAmount && tx.taxAmount > 0));
      desc = txNaming.shortLabel;
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

  // Column definitions (Sum = 1120px)
  const statementCols: ColumnDef[] = [
    { key: 'index', width: 55, title: '#', align: 'center' },
    { key: 'date', width: 125, title: isRtl ? 'التاريخ' : 'Date', align: 'center' },
    { key: 'ref', width: 130, title: isRtl ? 'رقم السند' : 'Ref #', align: 'center' },
    { key: 'desc', width: 370, title: isRtl ? 'البيان والتفاصيل' : 'Description', align: isRtl ? 'right' : 'left' },
    { key: 'debit', width: 145, title: isRtl ? 'مدين (+)' : 'Debit (+)', align: 'center' },
    { key: 'credit', width: 145, title: isRtl ? 'دائن (-)' : 'Credit (-)', align: 'center' },
    { key: 'balance', width: 150, title: isRtl ? 'الرصيد' : 'Balance', align: 'center' },
  ];

  const computedCols = computeColumnBounds(statementCols, A4_MARGIN_X, A4_CONTENT_WIDTH, isRtl);

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 44;
  const pages: HTMLCanvasElement[] = [];

  function startNewPage(isFirstPage: boolean): { ctx: CanvasRenderingContext2D; currentY: number } {
    const { canvas, ctx } = createA4Canvas();
    pages.push(canvas);

    ctx.direction = isRtl ? 'rtl' : 'ltr';
    let currentY = 55;

    if (isFirstPage) {
      // Top Store Header
      ctx.save();
      ctx.font = 'bold 30px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(profile.name, isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X, currentY + 30);

      ctx.font = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      let subY = currentY + 56;
      if (profile.phone) {
        ctx.fillText(
          `${isRtl ? 'هاتف / جوال: ' : 'Phone: '} ${profile.phone}`,
          isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X,
          subY
        );
        subY += 22;
      }
      if (profile.taxNumber) {
        ctx.fillText(
          `${isRtl ? 'الرقم الضريبي: ' : 'VAT No: '} ${profile.taxNumber}`,
          isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X,
          subY
        );
      }

      // Title Badge
      const badgeW = 240;
      const badgeH = 46;
      const badgeX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X - badgeW;
      drawRoundedRect(ctx, badgeX, currentY, badgeW, badgeH, 8, '#0f172a');

      ctx.font = 'bold 17px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(
        isRtl ? 'كشف حساب مالي' : 'ACCOUNT STATEMENT',
        badgeX + badgeW / 2,
        currentY + 29
      );

      ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = isRtl ? 'left' : 'right';
      const metaX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X;
      ctx.fillText(
        `${isRtl ? 'تاريخ الإصدار: ' : 'Date: '} ${formatDate(new Date().toISOString(), lang)}`,
        metaX,
        currentY + 70
      );

      if (startDate || endDate) {
        ctx.fillText(
          `${isRtl ? 'الفترة: ' : 'Period: '} ${startDate || '...'} ${isRtl ? 'إلى' : 'to'} ${endDate || '...'}`,
          metaX,
          currentY + 92
        );
      }
      ctx.restore();

      currentY += 120;

      // Divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(A4_MARGIN_X, currentY);
      ctx.lineTo(A4_WIDTH - A4_MARGIN_X, currentY);
      ctx.stroke();

      currentY += 22;

      // Account Summary Banner Box
      const boxH = 104;
      drawRoundedRect(ctx, A4_MARGIN_X, currentY, A4_CONTENT_WIDTH, boxH, 12, '#f8fafc', '#cbd5e1', 1.2);

      ctx.save();
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      ctx.textAlign = isRtl ? 'right' : 'left';
      const partyColX = isRtl ? A4_WIDTH - A4_MARGIN_X - 25 : A4_MARGIN_X + 25;

      ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        isCustomer ? (isRtl ? 'بيانات العميل (مدين):' : 'BILL TO:') : (isRtl ? 'بيانات المورد (دائن):' : 'SUPPLIER:'),
        partyColX,
        currentY + 28
      );

      ctx.font = 'bold 22px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(party.name, partyColX, currentY + 56);

      ctx.font = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(party.phone || '-', partyColX, currentY + 82);

      // Outstanding Balance
      ctx.textAlign = isRtl ? 'left' : 'right';
      const balanceColX = isRtl ? A4_MARGIN_X + 25 : A4_WIDTH - A4_MARGIN_X - 25;

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
      ctx.save();
      ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = isRtl ? 'right' : 'left';
      const repeatTitle = isRtl
        ? `تابع كشف حساب: ${party.name} (${profile.name})`
        : `Statement Continuation: ${party.name} (${profile.name})`;
      ctx.fillText(repeatTitle, isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X, currentY + 20);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(A4_MARGIN_X, currentY + 35);
      ctx.lineTo(A4_WIDTH - A4_MARGIN_X, currentY + 35);
      ctx.stroke();
      ctx.restore();

      currentY += 50;
    }

    // Draw Table Header
    drawStatementHeader(ctx, currentY);
    currentY += HEADER_HEIGHT;

    return { ctx, currentY };
  }

  function drawStatementHeader(ctx: CanvasRenderingContext2D, y: number) {
    drawRoundedRect(ctx, A4_MARGIN_X, y, A4_CONTENT_WIDTH, HEADER_HEIGHT, 6, '#1e293b');
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    for (const col of computedCols) {
      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(col.title, col.center, y + 27);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(col.title, col.right - 14, y + 27);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(col.title, col.left + 14, y + 27);
      }
    }
    ctx.restore();
  }

  let currentPage = startNewPage(true);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    if (currentPage.currentY + ROW_HEIGHT > A4_BOTTOM_LIMIT - 100) {
      currentPage = startNewPage(false);
    }

    const y = currentPage.currentY;
    const ctx = currentPage.ctx;

    if (r % 2 === 1) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(A4_MARGIN_X, y, A4_CONTENT_WIDTH, ROW_HEIGHT);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(A4_MARGIN_X, y, A4_CONTENT_WIDTH, ROW_HEIGHT);

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    for (const col of computedCols) {
      let cellText = '';
      let textColor = '#1e293b';
      let fontStr = '13px Cairo, Tahoma, "Segoe UI", sans-serif';

      if (col.key === 'index') {
        cellText = row.index === 0 ? '-' : String(row.index);
        textColor = '#64748b';
      } else if (col.key === 'date') {
        cellText = row.date;
      } else if (col.key === 'ref') {
        cellText = row.ref;
        fontStr = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'desc') {
        cellText = fitText(ctx, row.desc, col.width - 24);
      } else if (col.key === 'debit') {
        cellText = row.debit > 0 ? formatCurrency(row.debit, currency, lang) : '-';
        textColor = row.debit > 0 ? '#b91c1c' : '#94a3b8';
        if (row.debit > 0) fontStr = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'credit') {
        cellText = row.credit > 0 ? formatCurrency(row.credit, currency, lang) : '-';
        textColor = row.credit > 0 ? '#047857' : '#94a3b8';
        if (row.credit > 0) fontStr = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
      } else if (col.key === 'balance') {
        cellText = formatCurrency(row.runningBalance, currency, lang);
        textColor = '#0f172a';
        fontStr = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
      }

      ctx.font = fontStr;
      ctx.fillStyle = textColor;

      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(cellText, col.center, y + 25);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(cellText, col.right - 14, y + 25);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(cellText, col.left + 14, y + 25);
      }
    }
    ctx.restore();

    currentPage.currentY += ROW_HEIGHT;
  }

  // Totals Row
  if (currentPage.currentY + ROW_HEIGHT > A4_BOTTOM_LIMIT - 80) {
    currentPage = startNewPage(false);
  }

  const totalsY = currentPage.currentY;
  const tCtx = currentPage.ctx;
  drawRoundedRect(tCtx, A4_MARGIN_X, totalsY, A4_CONTENT_WIDTH, ROW_HEIGHT + 4, 4, '#f1f5f9', '#94a3b8', 1.5);

  tCtx.save();
  tCtx.direction = isRtl ? 'rtl' : 'ltr';
  tCtx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';

  // Label
  tCtx.fillStyle = '#0f172a';
  tCtx.textAlign = isRtl ? 'right' : 'left';
  const labelX = isRtl ? A4_WIDTH - A4_MARGIN_X - 20 : A4_MARGIN_X + 20;
  tCtx.fillText(isRtl ? 'المجموع الإجمالي للحركات:' : 'Total Activity:', labelX, totalsY + 28);

  // Exact matching column centers:
  const debitCol = computedCols.find((c) => c.key === 'debit')!;
  const creditCol = computedCols.find((c) => c.key === 'credit')!;
  const balCol = computedCols.find((c) => c.key === 'balance')!;

  tCtx.textAlign = 'center';

  tCtx.fillStyle = '#b91c1c';
  tCtx.fillText(formatCurrency(totalDebit, currency, lang), debitCol.center, totalsY + 28);

  tCtx.fillStyle = '#047857';
  tCtx.fillText(formatCurrency(totalCredit, currency, lang), creditCol.center, totalsY + 28);

  tCtx.fillStyle = '#0f172a';
  tCtx.fillText(formatCurrency(rolling, currency, lang), balCol.center, totalsY + 28);
  tCtx.restore();

  currentPage.currentY += ROW_HEIGHT + 35;

  // Final Page Bank & Sign-off Block
  if (currentPage.currentY + 110 > A4_BOTTOM_LIMIT) {
    currentPage = startNewPage(false);
  }

  const finalCtx = currentPage.ctx;
  const signY = currentPage.currentY;

  finalCtx.save();
  if (profile.iban || profile.bankName) {
    const bankBoxW = 460;
    drawRoundedRect(finalCtx, A4_MARGIN_X, signY, bankBoxW, 90, 8, '#f8fafc', '#cbd5e1', 1);
    finalCtx.direction = isRtl ? 'rtl' : 'ltr';
    finalCtx.textAlign = isRtl ? 'right' : 'left';
    finalCtx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
    finalCtx.fillStyle = '#0f172a';
    const bTextX = isRtl ? A4_MARGIN_X + bankBoxW - 15 : A4_MARGIN_X + 15;
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

  // Stamp Box
  const signBoxW = 320;
  const signBoxX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X - signBoxW;
  drawRoundedRect(finalCtx, signBoxX, signY, signBoxW, 90, 8, '#ffffff', '#cbd5e1', 1);

  finalCtx.direction = isRtl ? 'rtl' : 'ltr';
  finalCtx.textAlign = 'center';
  finalCtx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  finalCtx.fillStyle = '#0f172a';
  finalCtx.fillText(profile.name, signBoxX + signBoxW / 2, signY + 28);

  finalCtx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
  finalCtx.fillStyle = '#94a3b8';
  finalCtx.fillText(
    isRtl ? 'الختم والتوقيع المعتمد' : 'Authorized Signature & Stamp',
    signBoxX + signBoxW / 2,
    signY + 74
  );
  finalCtx.restore();

  const totalPages = pages.length;
  for (let p = 0; p < totalPages; p++) {
    const pCanvas = pages[p];
    const pCtx = pCanvas.getContext('2d')!;
    drawA4Footer(pCtx, p + 1, totalPages, isRtl);

    const imgData = pCanvas.toDataURL('image/jpeg', 0.95);
    if (p > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    pCanvas.width = 0;
    pCanvas.height = 0;
  }

  return doc;
}

// ============================================================================
// Thermal 80mm Invoice Generator (Receipt Roll Format)
// ============================================================================

async function generateThermal80mmInvoicePdf(
  options: GenerateInvoicePdfOptions
): Promise<jsPDF> {
  const { profile, transaction, party, zatcaQrDataUrl, isVatApplied = false, lang = 'ar' } = options;
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';
  const naming = getDocumentNaming(transaction.type, lang, isVatApplied);
  const items = transaction.items || [];
  const totalUnitsSold = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const qrImg = zatcaQrDataUrl ? await loadImage(zatcaQrDataUrl) : null;
  const logoImg = profile.logoBase64 ? await loadImage(profile.logoBase64) : null;

  const WIDTH = 580;
  const PADDING = 28;
  const C_WIDTH = WIDTH - PADDING * 2; // 524px

  // Estimate height
  const baseH = 800;
  const itemsH = items.length * 44;
  const summaryH = 260;
  const canvasHeight = Math.max(920, baseH + itemsH + summaryH);

  if (typeof document === 'undefined') {
    const fallbackDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });
    fallbackDoc.text(`Thermal Invoice: ${transaction.receiptNumber}`, 5, 10);
    return fallbackDoc;
  }

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, canvasHeight);
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  let y = 30;

  // Logo
  if (logoImg) {
    const lSize = 64;
    ctx.drawImage(logoImg, (WIDTH - lSize) / 2, y, lSize, lSize);
    y += lSize + 12;
  }

  // Store Name
  ctx.font = 'bold 24px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText(profile.name, WIDTH / 2, y + 20);
  y += 32;

  // Phone & Tax
  ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  if (profile.phone) {
    ctx.fillText(`${isRtl ? 'هاتف: ' : 'Phone: '} ${profile.phone}`, WIDTH / 2, y + 14);
    y += 22;
  }
  if (profile.taxNumber) {
    ctx.fillText(`${isRtl ? 'الرقم الضريبي: ' : 'VAT: '} ${profile.taxNumber}`, WIDTH / 2, y + 14);
    y += 22;
  }

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PADDING, y + 8);
  ctx.lineTo(WIDTH - PADDING, y + 8);
  ctx.stroke();
  y += 20;

  // Doc Title Badge
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, 40, 8, naming.color || '#0f172a');
  ctx.font = 'bold 17px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(naming.title, WIDTH / 2, y + 26);
  y += 50;

  // Receipt Number & Date Strip
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, 40, 8, '#f8fafc', '#e2e8f0', 1);
  ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';

  ctx.textAlign = isRtl ? 'right' : 'left';
  const rNumX = isRtl ? WIDTH - PADDING - 14 : PADDING + 14;
  ctx.fillText(`${isRtl ? 'رقم الفاتورة: ' : 'Invoice #: '} ${transaction.receiptNumber}`, rNumX, y + 25);

  ctx.textAlign = isRtl ? 'left' : 'right';
  const rDateX = isRtl ? PADDING + 14 : WIDTH - PADDING - 14;
  ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(formatPdfDate(transaction.date, lang), rDateX, y + 25);
  y += 50;

  // Customer Card
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, 70, 8, '#f8fafc', '#e2e8f0', 1);
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(naming.recipientLabel, isRtl ? WIDTH - PADDING - 14 : PADDING + 14, y + 22);

  ctx.font = 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(fitText(ctx, party.name, C_WIDTH - 140), isRtl ? WIDTH - PADDING - 14 : PADDING + 14, y + 48);

  if (party.phone) {
    ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(party.phone, isRtl ? PADDING + 14 : WIDTH - PADDING - 14, y + 48);
  }
  y += 82;

  // Items Table
  if (items.length > 0) {
    const thermalCols: ColumnDef[] = [
      { key: 'name', width: 244, title: isRtl ? 'الصنف' : 'Item', align: isRtl ? 'right' : 'left' },
      { key: 'qtyPrice', width: 140, title: isRtl ? 'الكمية × السعر' : 'Qty × Price', align: 'center' },
      { key: 'total', width: 140, title: isRtl ? 'الإجمالي' : 'Total', align: 'center' },
    ];
    const cCols = computeColumnBounds(thermalCols, PADDING, C_WIDTH, isRtl);

    drawRoundedRect(ctx, PADDING, y, C_WIDTH, 36, 6, '#1e293b');
    ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    for (const col of cCols) {
      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(col.title, col.center, y + 24);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(col.title, col.right - 10, y + 24);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(col.title, col.left + 10, y + 24);
      }
    }
    y += 36;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (i % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(PADDING, y, C_WIDTH, 40);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(PADDING, y, C_WIDTH, 40);

      ctx.save();
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      for (const col of cCols) {
        let text = '';
        let fontStr = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
        let clr = '#0f172a';

        if (col.key === 'name') {
          text = fitText(ctx, it.name, col.width - 20);
          fontStr = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
        } else if (col.key === 'qtyPrice') {
          text = `${it.quantity} × ${formatCurrency(it.unitPrice, currency, lang)}`;
        } else if (col.key === 'total') {
          text = formatCurrency(it.subtotal, currency, lang);
          fontStr = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
        }

        ctx.font = fontStr;
        ctx.fillStyle = clr;

        if (col.align === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(text, col.center, y + 25);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(text, col.right - 10, y + 25);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(text, col.left + 10, y + 25);
        }
      }
      ctx.restore();
      y += 40;
    }
    y += 16;
  }

  // Financial Summary Card
  const isVatInclusive = Boolean(isVatApplied && transaction.taxAmount && transaction.taxAmount > 0 && (transaction.taxRate ?? 0) > 0);
  const subtotal = items.length > 0 ? items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0) : (transaction.subtotalBeforeTax ?? transaction.totalAmount);
  const remaining = Math.max(0, transaction.totalAmount - transaction.paidAmount);

  const summaryLines: Array<{ label: string; value: string; isBold?: boolean; color?: string; isDivider?: boolean }> = [];
  if (totalUnitsSold > 0) {
    summaryLines.push({ label: isRtl ? 'إجمالي الكمية المباعة:' : 'Quantity Sold:', value: `${totalUnitsSold} ${isRtl ? 'قطعة' : 'units'}`, color: '#047857' });
  }
  summaryLines.push({ label: isRtl ? 'المجموع الفرعي للأصناف:' : 'Subtotal:', value: formatCurrency(subtotal, currency, lang) });
  if (transaction.discountAmount && transaction.discountAmount > 0) {
    summaryLines.push({ label: isRtl ? 'الخصم / التخفيض:' : 'Discount:', value: `- ${formatCurrency(transaction.discountAmount, currency, lang)}`, color: '#b91c1c' });
  }
  if (isVatInclusive) {
    summaryLines.push({ label: `${isRtl ? 'ضريبة القيمة المضافة ' : 'VAT '}(${transaction.taxRate || 15}%):`, value: `+ ${formatCurrency(transaction.taxAmount!, currency, lang)}` });
  }
  summaryLines.push({ label: '', value: '', isDivider: true });
  summaryLines.push({ label: isRtl ? 'الإجمالي الصافي النهائي:' : 'Total Amount:', value: formatCurrency(transaction.totalAmount, currency, lang), isBold: true, color: '#0f172a' });
  if (transaction.paidAmount > 0) {
    summaryLines.push({ label: isRtl ? 'المدفوع نقداً:' : 'Paid Now:', value: formatCurrency(transaction.paidAmount, currency, lang), color: '#047857' });
  }
  if (remaining > 0) {
    summaryLines.push({ label: isRtl ? 'المتبقي مقيد بالآجل:' : 'Remaining Debt:', value: formatCurrency(remaining, currency, lang), isBold: true, color: '#b91c1c' });
  }

  // Calculate exact box height
  let sumBoxH = 34; // header padding
  for (const line of summaryLines) {
    sumBoxH += line.isDivider ? 18 : (line.isBold ? 38 : 30);
  }
  sumBoxH += 12;

  drawRoundedRect(ctx, PADDING, y, C_WIDTH, sumBoxH, 10, '#f8fafc', '#cbd5e1', 1.2);
  let curSumY = y + 26;

  for (const line of summaryLines) {
    if (line.isDivider) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(PADDING + 14, curSumY + 6);
      ctx.lineTo(WIDTH - PADDING - 14, curSumY + 6);
      ctx.stroke();
      curSumY += 18;
      continue;
    }

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = line.isBold ? 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif' : '14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = line.color || '#0f172a';

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(line.label, isRtl ? WIDTH - PADDING - 16 : PADDING + 16, curSumY);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(line.value, isRtl ? PADDING + 16 : WIDTH - PADDING - 16, curSumY);
    ctx.restore();

    curSumY += line.isBold ? 38 : 30;
  }

  y += sumBoxH + 20;

  // ZATCA QR Code
  if (qrImg) {
    const qSize = 140;
    const qrCardW = 220;
    const qrCardH = 210;
    const qrCardX = (WIDTH - qrCardW) / 2;
    drawRoundedRect(ctx, qrCardX, y, qrCardW, qrCardH, 10, '#ffffff', '#e2e8f0', 1.2);

    ctx.drawImage(qrImg, qrCardX + (qrCardW - qSize) / 2, y + 14, qSize, qSize);

    ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(isRtl ? 'فاتورة ضريبية مبسطة (ZATCA)' : 'ZATCA Simplified Tax Invoice', WIDTH / 2, y + qSize + 36);

    ctx.font = '11px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isRtl ? 'معتمدة إلكترونياً' : 'E-Invoice Verified', WIDTH / 2, y + qSize + 54);

    y += qrCardH + 20;
  }

  // Footer Note
  if (profile.invoiceFooterNote) {
    ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(profile.invoiceFooterNote, WIDTH / 2, y + 14);
    y += 24;
  }

  // Branding
  ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(isRtl ? 'الدفتر الذكي - The Smart Dafter' : 'The Smart Dafter Mobile POS', WIDTH / 2, y + 14);
  y += 30;

  const finalH = Math.max(400, y);
  const heightMm = Math.round((finalH / WIDTH) * 80);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, Math.max(120, heightMm)],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, 0, 80, heightMm, undefined, 'FAST');
  canvas.width = 0;
  canvas.height = 0;

  return doc;
}

// ============================================================================
// Mobile Phone Optimized PDF Generator (Ultra-sharp, Large Fonts, High Contrast)
// ============================================================================

async function generateMobilePhoneInvoicePdf(
  options: GenerateInvoicePdfOptions
): Promise<jsPDF> {
  const { profile, transaction, party, zatcaQrDataUrl, isVatApplied = false, lang = 'ar' } = options;
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';
  const naming = getDocumentNaming(transaction.type, lang, isVatApplied);
  const docTitle = naming.title;
  const items = transaction.items || [];
  const totalUnitsSold = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  const qrImg = zatcaQrDataUrl ? await loadImage(zatcaQrDataUrl) : null;
  const logoImg = profile.logoBase64 ? await loadImage(profile.logoBase64) : null;

  // 720px width: 2x sharp mobile canvas width tailored for phone screens
  const WIDTH = 720;
  const PADDING = 28;
  const C_WIDTH = WIDTH - PADDING * 2; // 664px

  // Estimate total canvas height
  const baseH = 920;
  const itemsH = items.length * 48;
  const summaryH = 320;
  const qrH = qrImg ? 260 : 60;
  const canvasHeight = Math.max(1150, baseH + itemsH + summaryH + qrH);

  if (typeof document === 'undefined') {
    const fallbackDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 240] });
    fallbackDoc.text(`Mobile Invoice: ${transaction.receiptNumber}`, 5, 10);
    return fallbackDoc;
  }

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, canvasHeight);
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  let y = 30;

  // 1. Header Banner: Business Identity & Logo
  if (logoImg) {
    const lSize = 74;
    const lBoxX = isRtl ? WIDTH - PADDING - lSize : PADDING;
    drawRoundedRect(ctx, lBoxX, y, lSize, lSize, 10, '#ffffff', '#e2e8f0', 1);
    ctx.drawImage(logoImg, lBoxX + 4, y + 4, lSize - 8, lSize - 8);
  }

  const textStartX = logoImg
    ? (isRtl ? WIDTH - PADDING - 90 : PADDING + 90)
    : (isRtl ? WIDTH - PADDING : PADDING);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';

  // Business Name
  ctx.font = 'bold 28px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(fitText(ctx, profile.name, C_WIDTH - (logoImg ? 100 : 0)), textStartX, y + 32);

  // Business Details
  ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  let subY = y + 58;
  if (profile.phone) {
    ctx.fillText(`${isRtl ? 'هاتف / جوال: ' : 'Phone: '} ${profile.phone}`, textStartX, subY);
    subY += 24;
  }
  if (profile.taxNumber) {
    ctx.fillText(`${isRtl ? 'الرقم الضريبي: ' : 'VAT: '} ${profile.taxNumber}`, textStartX, subY);
  }
  ctx.restore();

  y += logoImg ? 96 : 84;

  // 2. Document Title Badge
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, 46, 8, naming.color || '#0f172a');
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.font = 'bold 20px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(docTitle, WIDTH / 2, y + 30);
  ctx.restore();
  y += 58;

  // 3. Receipt Number & Issue Date Strip
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, 42, 8, '#f8fafc', '#e2e8f0', 1.2);
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  // Receipt Number
  ctx.textAlign = isRtl ? 'right' : 'left';
  const rX = isRtl ? WIDTH - PADDING - 18 : PADDING + 18;
  ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(isRtl ? 'رقم الفاتورة: ' : 'Invoice No: ', rX, y + 26);

  ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", monospace';
  ctx.fillStyle = '#0f172a';
  const numOffset = isRtl ? -88 : 88;
  ctx.fillText(transaction.receiptNumber, rX + numOffset, y + 26);

  // Issue Date & Time
  ctx.textAlign = isRtl ? 'left' : 'right';
  const dX = isRtl ? PADDING + 18 : WIDTH - PADDING - 18;
  ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`${isRtl ? 'تاريخ الإصدار: ' : 'Date: '} ${formatPdfDate(transaction.date, lang)}`, dX, y + 26);
  ctx.restore();
  y += 54;

  // 4. Customer / Party Card
  const partyCardH = 96;
  drawRoundedRect(ctx, PADDING, y, C_WIDTH, partyCardH, 10, '#f8fafc', '#cbd5e1', 1.2);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  // Right Side: Party Details
  ctx.textAlign = isRtl ? 'right' : 'left';
  const recX = isRtl ? WIDTH - PADDING - 18 : PADDING + 18;

  ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    party.type === 'CUSTOMER'
      ? (isRtl ? 'العميل المكرم (ذمة مدينة):' : 'CUSTOMER:')
      : (isRtl ? 'المورد المعتمد (ذمة دائنة):' : 'SUPPLIER:'),
    recX,
    y + 24
  );

  ctx.font = 'bold 22px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(fitText(ctx, party.name, C_WIDTH - 240), recX, y + 54);

  if (party.phone) {
    ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`${isRtl ? 'الجوال: ' : 'Phone: '} ${party.phone}`, recX, y + 80);
  }

  // Left Side: Current Balance Card Callout
  const balBoxW = 200;
  const balBoxH = 72;
  const balBoxX = isRtl ? PADDING + 14 : WIDTH - PADDING - 14 - balBoxW;
  const balBoxY = y + 12;
  drawRoundedRect(ctx, balBoxX, balBoxY, balBoxW, balBoxH, 8, '#ffffff', '#cbd5e1', 1);

  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(isRtl ? 'الرصيد القائم الحالي:' : 'Current Balance:', balBoxX + balBoxW / 2, balBoxY + 22);

  const balColor = party.currentBalance > 0
    ? (party.type === 'CUSTOMER' ? '#b91c1c' : '#b45309')
    : '#047857';

  ctx.font = 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = balColor;
  ctx.fillText(formatCurrency(party.currentBalance, currency, lang), balBoxX + balBoxW / 2, balBoxY + 46);

  ctx.font = '11px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  const balStatus = party.currentBalance === 0
    ? (isRtl ? 'حساب خالص بالكامل' : 'Account Settled')
    : (party.type === 'CUSTOMER' ? (isRtl ? '(مستحق بذمة العميل)' : '(Owed by Customer)') : (isRtl ? '(مستحق للمورد)' : '(Owed to Supplier)'));
  ctx.fillText(balStatus, balBoxX + balBoxW / 2, balBoxY + 64);

  ctx.restore();
  y += partyCardH + 18;

  // 5. Line Items Table (Mathematically aligned columns)
  if (items.length > 0) {
    // Total table width = 664px
    // # (44) + Name (260) + Qty (70) + Price (140) + Total (150) = 664
    const itemCols: ColumnDef[] = [
      { key: 'idx', width: 44, title: '#', align: 'center' },
      { key: 'name', width: 260, title: isRtl ? 'اسم الصنف / البضاعة' : 'Item Description', align: isRtl ? 'right' : 'left' },
      { key: 'qty', width: 70, title: isRtl ? 'الكمية' : 'Qty', align: 'center' },
      { key: 'price', width: 140, title: isRtl ? 'السعر' : 'Price', align: 'center' },
      { key: 'total', width: 150, title: isRtl ? 'الإجمالي' : 'Total', align: 'center' },
    ];

    const computedCols = computeColumnBounds(itemCols, PADDING, C_WIDTH, isRtl);

    // Table Header Bar
    const TH_HEIGHT = 44;
    drawRoundedRect(ctx, PADDING, y, C_WIDTH, TH_HEIGHT, 6, '#1e293b');

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    for (const col of computedCols) {
      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(col.title, col.center, y + 28);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(col.title, col.right - 12, y + 28);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(col.title, col.left + 12, y + 28);
      }
    }
    ctx.restore();
    y += TH_HEIGHT;

    // Table Rows
    const TR_HEIGHT = 44;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (i % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(PADDING, y, C_WIDTH, TR_HEIGHT);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(PADDING, y, C_WIDTH, TR_HEIGHT);

      ctx.save();
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      for (const col of computedCols) {
        let text = '';
        let fontStr = '14px Cairo, Tahoma, "Segoe UI", sans-serif';
        let clr = '#0f172a';

        if (col.key === 'idx') {
          text = String(i + 1);
          clr = '#64748b';
        } else if (col.key === 'name') {
          text = fitText(ctx, it.name, col.width - 24);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
        } else if (col.key === 'qty') {
          text = String(it.quantity);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", monospace';
        } else if (col.key === 'price') {
          text = formatCurrency(it.unitPrice, currency, lang);
          fontStr = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
        } else if (col.key === 'total') {
          text = formatCurrency(it.subtotal, currency, lang);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
        }

        ctx.font = fontStr;
        ctx.fillStyle = clr;

        if (col.align === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(text, col.center, y + 28);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(text, col.right - 12, y + 28);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(text, col.left + 12, y + 28);
        }
      }
      ctx.restore();
      y += TR_HEIGHT;
    }
    y += 18;
  } else {
    // Payment Receipt / Voucher Highlight
    const payH = 110;
    drawRoundedRect(ctx, PADDING, y, C_WIDTH, payH, 10, '#f8fafc', '#cbd5e1', 1.2);
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isRtl ? 'المبلغ المستلم / المدفوع:' : 'Voucher Amount:', WIDTH / 2, y + 36);

    ctx.font = 'bold 36px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = transaction.type === 'PAYMENT_RECEIVED' ? '#047857' : '#b91c1c';
    ctx.fillText(formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, lang), WIDTH / 2, y + 80);
    ctx.restore();
    y += payH + 20;
  }

  // 6. Unified Financial Summary Card (Zero-overlap dynamic rows)
  const isVatInclusive = Boolean(isVatApplied && transaction.taxAmount && transaction.taxAmount > 0 && (transaction.taxRate ?? 0) > 0);
  const subtotal = items.length > 0 ? items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0) : (transaction.subtotalBeforeTax ?? transaction.totalAmount);
  const remainingDebt = Math.max(0, transaction.totalAmount - transaction.paidAmount);

  interface FinSummaryRow {
    label: string;
    value: string;
    isDivider?: boolean;
    isTotal?: boolean;
    isLarge?: boolean;
    color?: string;
  }

  const summaryRows: FinSummaryRow[] = [];

  // Row 1: Quantity Sold
  if (totalUnitsSold > 0) {
    summaryRows.push({
      label: isRtl ? 'إجمالي الكمية المباعة:' : 'Quantity Sold:',
      value: `${totalUnitsSold} ${isRtl ? 'قطعة' : 'Units'}`,
      color: '#047857',
    });
  }

  // Row 2: Subtotal
  summaryRows.push({
    label: isRtl ? 'المجموع الفرعي للأصناف:' : 'Subtotal:',
    value: formatCurrency(subtotal, currency, lang),
    color: '#1e293b',
  });

  // Row 3: Discount
  if (transaction.discountAmount && transaction.discountAmount > 0) {
    summaryRows.push({
      label: isRtl ? 'الخصم / التخفيض:' : 'Discount:',
      value: `- ${formatCurrency(transaction.discountAmount, currency, lang)}`,
      color: '#b91c1c',
    });
  }

  // Row 4: VAT (Only when applicable)
  if (isVatInclusive) {
    summaryRows.push({
      label: `${isRtl ? 'ضريبة القيمة المضافة ' : 'VAT '}(${transaction.taxRate || 15}%):`,
      value: `+ ${formatCurrency(transaction.taxAmount!, currency, lang)}`,
      color: '#475569',
    });
  }

  // Divider before Total
  summaryRows.push({ label: '', value: '', isDivider: true });

  // Row 5: Grand Total
  summaryRows.push({
    label: isRtl ? 'الإجمالي الصافي النهائي:' : 'Final Grand Total:',
    value: formatCurrency(transaction.totalAmount, currency, lang),
    isTotal: true,
    color: '#0f172a',
  });

  // Row 6: Paid Amount
  if (transaction.paidAmount > 0) {
    summaryRows.push({
      label: isRtl ? 'المدفوع نقداً:' : 'Paid Now:',
      value: formatCurrency(transaction.paidAmount, currency, lang),
      color: '#047857',
    });
  }

  // Row 7: Remaining Debt
  if (remainingDebt > 0) {
    summaryRows.push({
      label: isRtl ? 'المتبقي مقيد بالآجل:' : 'Remaining On-Account:',
      value: formatCurrency(remainingDebt, currency, lang),
      isLarge: true,
      color: '#b91c1c',
    });
  }

  // Compute exact height
  let cardH = 34; // top header
  for (const r of summaryRows) {
    if (r.isDivider) cardH += 22;
    else if (r.isTotal) cardH += 46;
    else if (r.isLarge) cardH += 40;
    else cardH += 34;
  }
  cardH += 14;

  drawRoundedRect(ctx, PADDING, y, C_WIDTH, cardH, 12, '#f8fafc', '#cbd5e1', 1.2);

  // Summary Card Header Bar
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(isRtl ? 'ملخص الفاتورة المالي:' : 'FINANCIAL SUMMARY:', isRtl ? WIDTH - PADDING - 18 : PADDING + 18, y + 26);
  ctx.restore();

  let lineY = y + 54;

  for (const row of summaryRows) {
    if (row.isDivider) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PADDING + 16, lineY - 6);
      ctx.lineTo(WIDTH - PADDING - 16, lineY - 6);
      ctx.stroke();
      lineY += 22;
      continue;
    }

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    if (row.isTotal) {
      // Highlight background strip for grand total
      drawRoundedRect(ctx, PADDING + 10, lineY - 24, C_WIDTH - 20, 36, 6, '#f1f5f9');
      ctx.font = 'bold 20px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = row.color || '#0f172a';
    } else if (row.isLarge) {
      ctx.font = 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = row.color || '#b91c1c';
    } else {
      ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = row.color || '#334155';
    }

    // Label
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(row.label, isRtl ? WIDTH - PADDING - 20 : PADDING + 20, lineY);

    // Value
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(row.value, isRtl ? PADDING + 20 : WIDTH - PADDING - 20, lineY);

    ctx.restore();

    lineY += row.isTotal ? 46 : (row.isLarge ? 40 : 34);
  }

  y += cardH + 22;

  // 7. ZATCA QR Code & Official Verification
  if (qrImg) {
    const qrCardW = 260;
    const qrCardH = 240;
    const qrCardX = (WIDTH - qrCardW) / 2;
    drawRoundedRect(ctx, qrCardX, y, qrCardW, qrCardH, 12, '#ffffff', '#e2e8f0', 1.2);

    const qSize = 145;
    ctx.drawImage(qrImg, qrCardX + (qrCardW - qSize) / 2, y + 16, qSize, qSize);

    ctx.save();
    ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(isRtl ? 'رمز الفاتورة الإلكترونية المعتمد (ZATCA)' : 'ZATCA E-Invoice QR Code', WIDTH / 2, y + qSize + 42);

    ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isRtl ? 'فاتورة ضريبية مبسطة معتمدة' : 'Verified Simplified Tax Invoice', WIDTH / 2, y + qSize + 64);
    ctx.restore();

    y += qrCardH + 20;
  }

  // Footer notes & quotation terms
  if (profile.invoiceFooterNote || transaction.quotationTerms) {
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#475569';
    if (profile.invoiceFooterNote) {
      ctx.fillText(profile.invoiceFooterNote, WIDTH / 2, y);
      y += 24;
    }
    if (transaction.quotationTerms) {
      ctx.fillText(`شروط العرض: ${transaction.quotationTerms}`, WIDTH / 2, y);
      y += 24;
    }
    ctx.restore();
  }

  // System branding footer
  ctx.save();
  ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(
    isRtl ? 'تم إصدار الوثيقة آلياً عبر نظام الدفتر الذكي (The Smart Dafter)' : 'Issued electronically via The Smart Dafter',
    WIDTH / 2,
    y + 20
  );
  ctx.restore();
  y += 44;

  const finalH = Math.max(500, y);
  const heightMm = Math.round((finalH / WIDTH) * 100);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, Math.max(140, heightMm)],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, 0, 100, heightMm, undefined, 'FAST');
  canvas.width = 0;
  canvas.height = 0;

  return doc;
}

// ============================================================================
// A4 Sheet Standard Invoice Generator
// ============================================================================

export async function generateInvoicePdf(
  options: GenerateInvoicePdfOptions
): Promise<jsPDF> {
  if (options.format === 'THERMAL_80MM') {
    return generateThermal80mmInvoicePdf(options);
  }
  if (options.format === 'MOBILE_PHONE' || !options.format) {
    return generateMobilePhoneInvoicePdf(options);
  }

  const { profile, transaction, party, zatcaQrDataUrl, isVatApplied = false, lang = 'ar' } = options;
  const isRtl = lang === 'ar';
  const currency = profile.currency || 'SAR';
  const naming = getDocumentNaming(transaction.type, lang, isVatApplied);
  const docTitle = naming.title;

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

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font readiness fallback
    }
  }

  const qrImg = zatcaQrDataUrl ? await loadImage(zatcaQrDataUrl) : null;
  const logoImg = profile.logoBase64 ? await loadImage(profile.logoBase64) : null;

  const { canvas, ctx } = createA4Canvas();
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  let currentY = 55;

  // Header Banner
  ctx.save();
  let textStartX = isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X;

  if (logoImg) {
    const logoSize = 88;
    const logoX = isRtl ? A4_WIDTH - A4_MARGIN_X - logoSize : A4_MARGIN_X;
    drawRoundedRect(ctx, logoX, currentY, logoSize, logoSize, 10, '#ffffff', '#e2e8f0', 1);
    ctx.drawImage(logoImg, logoX + 4, currentY + 4, logoSize - 8, logoSize - 8);
    textStartX = isRtl ? A4_WIDTH - A4_MARGIN_X - logoSize - 22 : A4_MARGIN_X + logoSize + 22;
  }

  ctx.font = 'bold 32px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(profile.name, textStartX, currentY + 34);

  ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  let bSubY = currentY + 62;
  if (profile.phone) {
    ctx.fillText(`${isRtl ? 'الهاتف: ' : 'Phone: '} ${profile.phone}`, textStartX, bSubY);
    bSubY += 24;
  }
  if (profile.taxNumber) {
    ctx.fillText(`${isRtl ? 'الرقم الضريبي: ' : 'VAT: '} ${profile.taxNumber}`, textStartX, bSubY);
  }

  // Document Badge
  const badgeW = 260;
  const badgeH = 50;
  const badgeX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X - badgeW;
  drawRoundedRect(ctx, badgeX, currentY, badgeW, badgeH, 8, naming.color || '#0f172a');

  ctx.font = 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(docTitle, badgeX + badgeW / 2, currentY + 32);

  // Number & Date
  ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = isRtl ? 'left' : 'right';
  const metaX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X;
  ctx.fillText(`#${transaction.receiptNumber}`, metaX, currentY + 80);

  ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(formatPdfDate(transaction.date, lang), metaX, currentY + 104);
  ctx.restore();

  currentY += 135;

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A4_MARGIN_X, currentY);
  ctx.lineTo(A4_WIDTH - A4_MARGIN_X, currentY);
  ctx.stroke();

  currentY += 22;

  // Party Details Cards
  const cardW = (A4_CONTENT_WIDTH - 20) / 2;
  const cardH = 104;

  const partyCardX = isRtl ? A4_WIDTH - A4_MARGIN_X - cardW : A4_MARGIN_X;
  drawRoundedRect(ctx, partyCardX, currentY, cardW, cardH, 10, '#f8fafc', '#cbd5e1', 1.2);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const pTextX = isRtl ? partyCardX + cardW - 20 : partyCardX + 20;

  ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(naming.recipientLabel, pTextX, currentY + 28);

  ctx.font = 'bold 22px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(party.name, pTextX, currentY + 58);

  ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(party.phone || '-', pTextX, currentY + 86);
  ctx.restore();

  // Transaction Details Card
  const metaCardX = isRtl ? A4_MARGIN_X : A4_MARGIN_X + cardW + 20;
  drawRoundedRect(ctx, metaCardX, currentY, cardW, cardH, 10, '#f8fafc', '#cbd5e1', 1.2);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  const mTextX = isRtl ? metaCardX + cardW - 20 : metaCardX + 20;

  ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(isRtl ? 'تفاصيل العملية:' : 'TRANSACTION DETAILS:', mTextX, currentY + 28);

  ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(
    `${isRtl ? 'طريقة السداد: ' : 'Payment Method: '} ${transaction.paymentMethod || (isRtl ? 'آجل مسجل بالدفتر' : 'Credit / On-Account')}`,
    mTextX,
    currentY + 58
  );

  ctx.fillText(
    `${isRtl ? 'الحالة: ' : 'Status: '} ${transaction.isVoided ? (isRtl ? 'ملغاة' : 'VOIDED') : (isRtl ? 'معتمدة ومسجلة' : 'Confirmed')}`,
    mTextX,
    currentY + 86
  );
  ctx.restore();

  currentY += cardH + 25;

  // Line Items Table
  const items = transaction.items || [];
  const totalUnitsSold = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  if (items.length > 0) {
    // Total = 1120px
    const a4Cols: ColumnDef[] = [
      { key: 'index', width: 60, title: '#', align: 'center' },
      { key: 'name', width: 480, title: isRtl ? 'اسم الصنف / البضاعة' : 'Item Description', align: isRtl ? 'right' : 'left' },
      { key: 'qty', width: 160, title: isRtl ? 'الكمية' : 'Quantity', align: 'center' },
      { key: 'price', width: 200, title: isRtl ? 'سعر الوحدة' : 'Unit Price', align: 'center' },
      { key: 'total', width: 220, title: isRtl ? 'الإجمالي' : 'Total', align: 'center' },
    ];

    const computedCols = computeColumnBounds(a4Cols, A4_MARGIN_X, A4_CONTENT_WIDTH, isRtl);

    drawRoundedRect(ctx, A4_MARGIN_X, currentY, A4_CONTENT_WIDTH, 44, 6, '#1e293b');
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';

    for (const col of computedCols) {
      if (col.align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(col.title, col.center, currentY + 28);
      } else if (col.align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(col.title, col.right - 14, currentY + 28);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(col.title, col.left + 14, currentY + 28);
      }
    }
    ctx.restore();
    currentY += 44;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rY = currentY;

      if (i % 2 === 1) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(A4_MARGIN_X, rY, A4_CONTENT_WIDTH, 42);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(A4_MARGIN_X, rY, A4_CONTENT_WIDTH, 42);

      ctx.save();
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      for (const col of computedCols) {
        let text = '';
        let fontStr = '15px Cairo, Tahoma, "Segoe UI", sans-serif';
        let clr = '#1e293b';

        if (col.key === 'index') {
          text = String(i + 1);
          clr = '#64748b';
        } else if (col.key === 'name') {
          text = fitText(ctx, item.name, col.width - 24);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
        } else if (col.key === 'qty') {
          text = String(item.quantity);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", monospace';
        } else if (col.key === 'price') {
          text = formatCurrency(item.unitPrice, currency, lang);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
        } else if (col.key === 'total') {
          text = formatCurrency(item.subtotal, currency, lang);
          fontStr = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
        }

        ctx.font = fontStr;
        ctx.fillStyle = clr;

        if (col.align === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(text, col.center, rY + 27);
        } else if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(text, col.right - 14, rY + 27);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(text, col.left + 14, rY + 27);
        }
      }
      ctx.restore();
      currentY += 42;
    }
    currentY += 15;
  } else {
    // Payment Receipt / Voucher
    const payH = 110;
    drawRoundedRect(ctx, A4_MARGIN_X, currentY, A4_CONTENT_WIDTH, payH, 10, '#f8fafc', '#cbd5e1', 1.2);
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.font = 'bold 16px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(isRtl ? 'المبلغ المستلم / المدفوع:' : 'Voucher Amount:', A4_WIDTH / 2, currentY + 38);

    ctx.font = 'bold 36px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = transaction.type === 'PAYMENT_RECEIVED' ? '#047857' : '#b91c1c';
    ctx.fillText(
      formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, lang),
      A4_WIDTH / 2,
      currentY + 84
    );
    ctx.restore();
    currentY += payH + 20;
  }

  currentY += 15;

  // Financial Breakdown Box & ZATCA QR Code Block
  const isVatInclusive = Boolean(isVatApplied && transaction.taxAmount && transaction.taxAmount > 0 && (transaction.taxRate ?? 0) > 0);
  const subtotal = items.length > 0 ? items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0) : (transaction.subtotalBeforeTax ?? transaction.totalAmount);
  const remaining = Math.max(0, transaction.totalAmount - transaction.paidAmount);

  const summaryBoxW = 540;
  const qrBoxW = 340;
  const sumY = currentY;

  interface A4SummaryRow {
    label: string;
    value: string;
    isBold?: boolean;
    isDivider?: boolean;
    color?: string;
  }

  const a4SummaryRows: A4SummaryRow[] = [];
  if (totalUnitsSold > 0) {
    a4SummaryRows.push({ label: isRtl ? 'إجمالي الكمية المباعة:' : 'Total Quantity Sold:', value: `${totalUnitsSold} ${isRtl ? 'قطعة' : 'Units'}`, color: '#047857' });
  }
  a4SummaryRows.push({ label: isRtl ? 'المجموع الفرعي للأصناف:' : 'Subtotal:', value: formatCurrency(subtotal, currency, lang) });
  if (transaction.discountAmount && transaction.discountAmount > 0) {
    a4SummaryRows.push({ label: isRtl ? 'الخصم / التخفيض:' : 'Discount:', value: `- ${formatCurrency(transaction.discountAmount, currency, lang)}`, color: '#b91c1c' });
  }
  if (isVatInclusive) {
    a4SummaryRows.push({ label: `${isRtl ? 'ضريبة القيمة المضافة ' : 'VAT '}(${transaction.taxRate || 15}%):`, value: `+ ${formatCurrency(transaction.taxAmount!, currency, lang)}` });
  }
  a4SummaryRows.push({ label: '', value: '', isDivider: true });
  a4SummaryRows.push({ label: isRtl ? 'الإجمالي الصافي النهائي:' : 'Final Grand Total:', value: formatCurrency(transaction.totalAmount, currency, lang), isBold: true, color: '#0f172a' });
  if (transaction.paidAmount > 0) {
    a4SummaryRows.push({ label: isRtl ? 'المدفوع نقداً:' : 'Paid Now:', value: formatCurrency(transaction.paidAmount, currency, lang), color: '#047857' });
  }
  if (remaining > 0) {
    a4SummaryRows.push({ label: isRtl ? 'المتبقي مقيد بالآجل:' : 'Remaining On-Account:', value: formatCurrency(remaining, currency, lang), isBold: true, color: '#b91c1c' });
  }

  let summaryBoxH = 36;
  for (const r of a4SummaryRows) {
    summaryBoxH += r.isDivider ? 20 : (r.isBold ? 40 : 32);
  }
  summaryBoxH += 12;

  const sumBoxX = isRtl ? A4_MARGIN_X : A4_WIDTH - A4_MARGIN_X - summaryBoxW;
  drawRoundedRect(ctx, sumBoxX, sumY, summaryBoxW, summaryBoxH, 10, '#f8fafc', '#cbd5e1', 1.2);

  let curLineY = sumY + 32;
  for (const r of a4SummaryRows) {
    if (r.isDivider) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sumBoxX + 16, curLineY - 4);
      ctx.lineTo(sumBoxX + summaryBoxW - 16, curLineY - 4);
      ctx.stroke();
      curLineY += 20;
      continue;
    }

    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.font = r.isBold ? 'bold 18px Cairo, Tahoma, "Segoe UI", sans-serif' : 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = r.color || '#1e293b';

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(r.label, isRtl ? sumBoxX + summaryBoxW - 22 : sumBoxX + 22, curLineY);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(r.value, isRtl ? sumBoxX + 22 : sumBoxX + summaryBoxW - 22, curLineY);
    ctx.restore();

    curLineY += r.isBold ? 40 : 32;
  }

  // ZATCA QR Code Box
  const qrBoxX = isRtl ? A4_WIDTH - A4_MARGIN_X - qrBoxW : A4_MARGIN_X;
  drawRoundedRect(ctx, qrBoxX, sumY, qrBoxW, summaryBoxH, 10, '#ffffff', '#cbd5e1', 1.2);

  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';

  if (qrImg) {
    const qrSize = 145;
    ctx.drawImage(qrImg, qrBoxX + (qrBoxW - qrSize) / 2, sumY + 20, qrSize, qrSize);

    ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(
      isRtl ? 'رمز الفاتورة الإلكترونية (ZATCA)' : 'ZATCA E-Invoice QR Code',
      qrBoxX + qrBoxW / 2,
      sumY + 195
    );

    ctx.font = '12px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      isRtl ? 'فاتورة ضريبية مبسطة معتمدة' : 'Verified Simplified Tax Invoice',
      qrBoxX + qrBoxW / 2,
      sumY + 218
    );
  } else {
    ctx.font = 'bold 15px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      isRtl ? 'الدفتر الذكي' : 'The Smart Dafter',
      qrBoxX + qrBoxW / 2,
      sumY + 95
    );
    ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
    ctx.fillText(
      isRtl ? 'نظام الفوترة وإدارة الحسابات' : 'E-Invoicing & Ledger System',
      qrBoxX + qrBoxW / 2,
      sumY + 124
    );
  }
  ctx.restore();

  // Bank Info & Footer Notes
  currentY = sumY + summaryBoxH + 25;

  if (profile.iban || profile.invoiceFooterNote) {
    ctx.save();
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';
    const noteX = isRtl ? A4_WIDTH - A4_MARGIN_X : A4_MARGIN_X;

    if (profile.iban) {
      ctx.font = 'bold 14px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(
        `${isRtl ? 'الحساب البنكي: ' : 'Bank: '} ${profile.bankName || ''} | IBAN: ${profile.iban}`,
        noteX,
        currentY
      );
      currentY += 22;
    }

    if (profile.invoiceFooterNote) {
      ctx.font = '13px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(profile.invoiceFooterNote, noteX, currentY);
      currentY += 20;
    }

    if (transaction.type === 'QUOTATION') {
      const qValidity = transaction.quotationValidityDays || 15;
      const qTermsText = transaction.quotationTerms
        ? (isRtl ? `شروط العرض: ${transaction.quotationTerms} | مدة السريان: ${qValidity} يوماً` : `Terms: ${transaction.quotationTerms} | Validity: ${qValidity} days`)
        : (isRtl ? `مدة سريان عرض السعر: ${qValidity} يوماً من تاريخ الإصدار` : `Quote Validity Period: ${qValidity} days from issue date`);

      ctx.font = 'bold 13px Cairo, Tahoma, "Segoe UI", sans-serif';
      ctx.fillStyle = '#4338ca';
      ctx.fillText(qTermsText, noteX, currentY);
    }
    ctx.restore();
  }

  // Draw Page Footer
  drawA4Footer(ctx, 1, 1, isRtl);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  canvas.width = 0;
  canvas.height = 0;

  return doc;
}

// ============================================================================
// Universal PDF Share & Download Manager
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

    // 1. Native Web Share API
    const canShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === 'function';

    if (canShare) {
      let shareFailed = false;
      let userAborted = false;
      try {
        const sharePromise = navigator.share({
          title,
          text: title,
          files: [file],
        }).catch((err) => {
          if (err?.name === 'AbortError') {
            userAborted = true;
          } else {
            shareFailed = true;
            console.warn('Native share dismissed or deferred error:', err);
          }
        });

        await Promise.race([
          sharePromise,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        if (userAborted || !shareFailed) {
          return { success: true, blob, method: 'native_share' };
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: true, blob, method: 'native_share' };
        }
        console.warn('Native share dismissed or resumed with notice:', err);
      }
    }

    // 2. Direct anchor download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
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

export { verifyPdfBlobIntegrity, formatBlobSize } from './pdfIntegrity';
export type { PdfIntegrityResult, IntegrityCheckStatus } from './pdfIntegrity';

export default {
  generateInvoicePdf,
  generateStatementPdf,
  shareOrDownloadPdf,
  exportElementToPdf,
  sharePdfFile,
  verifyPdfBlobIntegrity,
};
