const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const { shapeBidi } = require('./arabicShaper.cjs');

const targetPdfPath = path.join(__dirname, '..', 'شركة_البصمة_السادسة_للخضار_والفواكه_Statement_الشرعبي.pdf');
const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
});

if (fs.existsSync(fontPath)) {
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');
  doc.addFileToVFS('arial.ttf', fontBase64);
  doc.addFont('arial.ttf', 'Arial', 'normal', undefined, 'Identity-H');
  doc.setFont('Arial');
}

// Colors
const DARK = [15, 23, 42];        // #0f172a
const SLATE = [71, 85, 105];      // #475569
const LIGHT_BG = [248, 250, 252]; // #f8fafc
const BORDER = [203, 213, 225];    // #cbd5e1
const RED = [185, 28, 28];        // #b91c1c
const GREEN = [4, 120, 87];       // #047857

// Top Header Banner
doc.setFillColor(...DARK);
doc.rect(14, 14, 182, 14, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(13);
doc.text(shapeBidi('كشف حساب مالي - الدفتر الذكي (The Smart Dafter)'), 105, 23, { align: 'center' });

// Store Header Info (RTL)
doc.setTextColor(...DARK);
doc.setFontSize(15);
doc.text(shapeBidi('شركة البصمة السادسة للخضار والفواكه'), 196, 38, { align: 'right' });

doc.setFontSize(9.5);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('هاتف: 0501234567  |  الرقم الضريبي: 310123456700003'), 196, 44.5, { align: 'right' });
doc.text(shapeBidi('تاريخ الإصدار: 2026-09-04  |  العملة الأساسية: ر.س (SAR)'), 196, 50, { align: 'right' });

// Divider line
doc.setDrawColor(...BORDER);
doc.setLineWidth(0.5);
doc.line(14, 54, 196, 54);

// Account Summary Card (RTL Layout)
doc.setFillColor(...LIGHT_BG);
doc.setDrawColor(...BORDER);
doc.roundedRect(14, 58, 182, 28, 3, 3, 'FD');

// Right Side: Party Info
doc.setFontSize(8.5);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('بيانات العميل / الحساب:'), 190, 65, { align: 'right' });

doc.setFontSize(12);
doc.setTextColor(...DARK);
doc.text(shapeBidi('الشرعبي (عميل - ذمة مدينة)'), 190, 72, { align: 'right' });

doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('رقم الجوال: 0559876543  |  الحالة: نشط'), 190, 80, { align: 'right' });

// Left Side: Current Balance
doc.setFontSize(8.5);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('الرصيد القائم الحالي:'), 20, 65, { align: 'left' });

doc.setFontSize(14);
doc.setTextColor(...RED);
doc.text('1,650.00 SAR', 20, 73, { align: 'left' });

doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('مستحق بذمة العميل للمتجر (مدين)'), 20, 80, { align: 'left' });

// Table Header Bar (RTL)
doc.setFillColor(...DARK);
doc.rect(14, 92, 182, 8.5, 'F');
doc.setTextColor(255, 255, 255);
doc.setFontSize(8.5);

// Column X positions in RTL:
// Widths: Index(10), Date(24), Ref(28), Desc(60), Debit(20), Credit(20), Balance(20) = 182 total
// Left margins:
// Balance: 14 to 34 (align left at 16)
// Credit:  34 to 54 (align left at 36)
// Debit:   54 to 74 (align left at 56)
// Desc:    74 to 134 (align right at 132)
// Ref:     134 to 162 (align right at 160)
// Date:    162 to 186 (align right at 184)
// #:       186 to 196 (align center at 191)

doc.text(shapeBidi('#'), 191, 97.5, { align: 'center' });
doc.text(shapeBidi('التاريخ'), 184, 97.5, { align: 'right' });
doc.text(shapeBidi('رقم السند'), 160, 97.5, { align: 'right' });
doc.text(shapeBidi('البيان والتفاصيل'), 132, 97.5, { align: 'right' });
doc.text(shapeBidi('مدين (+)'), 56, 97.5, { align: 'left' });
doc.text(shapeBidi('دائن (-)'), 36, 97.5, { align: 'left' });
doc.text(shapeBidi('الرصيد'), 16, 97.5, { align: 'left' });

// Table Rows
const rows = [
  { index: '0', date: '2026-08-20', ref: 'OPENING', desc: 'رصيد افتتاحي سابق', debit: '500.00', credit: '-', bal: '500.00' },
  { index: '1', date: '2026-08-25', ref: 'INV-2026-0101', desc: 'فاتورة بيع آجل: خضار وفواكه مشكلة', debit: '1,500.00', credit: '-', bal: '2,000.00' },
  { index: '2', date: '2026-08-28', ref: 'REC-2026-0042', desc: 'سند قبض مالي: دفعة نقدية مسددة', debit: '-', credit: '800.00', bal: '1,200.00' },
  { index: '3', date: '2026-09-02', ref: 'INV-2026-0158', desc: 'فاتورة بيع آجل: طماطم وخيار بلدي', debit: '450.00', credit: '-', bal: '1,650.00' },
];

let y = 100.5;

rows.forEach((row, i) => {
  if (i % 2 === 1) {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(14, y, 182, 8, 'F');
  }
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 8, 196, y + 8);

  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.text(row.index === '0' ? '-' : row.index, 191, y + 5.5, { align: 'center' });
  doc.text(row.date, 184, y + 5.5, { align: 'right' });
  doc.text(row.ref, 160, y + 5.5, { align: 'right' });
  doc.text(shapeBidi(row.desc), 132, y + 5.5, { align: 'right' });

  doc.setTextColor(row.debit !== '-' ? RED[0] : SLATE[0], row.debit !== '-' ? RED[1] : SLATE[1], row.debit !== '-' ? RED[2] : SLATE[2]);
  doc.text(row.debit, 56, y + 5.5, { align: 'left' });

  doc.setTextColor(row.credit !== '-' ? GREEN[0] : SLATE[0], row.credit !== '-' ? GREEN[1] : SLATE[1], row.credit !== '-' ? GREEN[2] : SLATE[2]);
  doc.text(row.credit, 36, y + 5.5, { align: 'left' });

  doc.setTextColor(...DARK);
  doc.text(row.bal, 16, y + 5.5, { align: 'left' });

  y += 8;
});

// Totals Bar
doc.setFillColor(241, 245, 249);
doc.setDrawColor(...BORDER);
doc.rect(14, y, 182, 9, 'FD');

doc.setFontSize(8.5);
doc.setTextColor(...DARK);
doc.text(shapeBidi('المجموع الإجمالي للحركات:'), 132, y + 6, { align: 'right' });

doc.setTextColor(...RED);
doc.text('2,450.00', 56, y + 6, { align: 'left' });

doc.setTextColor(...GREEN);
doc.text('800.00', 36, y + 6, { align: 'left' });

doc.setTextColor(...DARK);
doc.text('1,650.00', 16, y + 6, { align: 'left' });

y += 18;

// Bank & Signature Section (RTL Layout)
doc.setFillColor(...LIGHT_BG);
doc.setDrawColor(...BORDER);
doc.roundedRect(100, y, 96, 26, 2, 2, 'FD'); // Bank Card (Right)
doc.roundedRect(14, y, 80, 26, 2, 2, 'FD');  // Stamp Card (Left)

// Bank Info
doc.setFontSize(8.5);
doc.setTextColor(...DARK);
doc.text(shapeBidi('بيانات الحساب والتحويل البنكي:'), 192, y + 6.5, { align: 'right' });
doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('البنك: مصرف الراجحي'), 192, y + 13, { align: 'right' });
doc.text('IBAN: SA0380000000608010167519', 192, y + 19.5, { align: 'right' });

// Stamp Info
doc.setFontSize(8.5);
doc.setTextColor(...DARK);
doc.text(shapeBidi('الختم والتوقيع المعتمد'), 54, y + 6.5, { align: 'center' });
doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('شركة البصمة السادسة للخضار والفواكه'), 54, y + 14, { align: 'center' });
doc.text('2026-09-04', 54, y + 20, { align: 'center' });

// Footer
doc.setDrawColor(...BORDER);
doc.line(14, 280, 196, 280);
doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text(shapeBidi('تم إصدار هذا الكشف آلياً عبر نظام الدفتر الذكي (The Smart Dafter) لإدارة الحسابات'), 196, 285, { align: 'right' });
doc.text(shapeBidi('صفحة 1 من 1'), 14, 285, { align: 'left' });

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(targetPdfPath, buffer);
console.log('Sample PDF successfully generated at:', targetPdfPath, 'Size:', buffer.length, 'bytes');
