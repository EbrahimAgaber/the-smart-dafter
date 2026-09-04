const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

const targetPdfPath = path.join(__dirname, '..', 'شركة_البصمة_السادسة_للخضار_والفواكه_Statement_الشرعبي.pdf');

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true,
});

// Primary colors
const DARK = [15, 23, 42];      // #0f172a
const SLATE = [71, 85, 105];    // #475569
const LIGHT_BG = [248, 250, 252]; // #f8fafc
const BORDER = [203, 213, 225];  // #cbd5e1
const RED = [185, 28, 28];      // #b91c1c
const GREEN = [4, 120, 87];     // #047857

// Top Header
doc.setFillColor(...DARK);
doc.rect(14, 14, 182, 14, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.text('ACCOUNT STATEMENT - THE SMART DAFTER', 105, 23, { align: 'center' });

// Store Information
doc.setTextColor(...DARK);
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.text('Sharikat Al-Basmah Al-Sadisah (Vegetables & Fruits)', 14, 38);

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...SLATE);
doc.text('Phone: 0501234567 | CR / Tax Number: 310123456700003', 14, 44);
doc.text('Date of Issue: 2026-09-04 | Currency: SAR', 14, 50);

// Divider line
doc.setDrawColor(...BORDER);
doc.setLineWidth(0.5);
doc.line(14, 54, 196, 54);

// Account Summary Box
doc.setFillColor(...LIGHT_BG);
doc.setDrawColor(...BORDER);
doc.roundedRect(14, 58, 182, 28, 3, 3, 'FD');

doc.setFontSize(9);
doc.setTextColor(...SLATE);
doc.text('ACCOUNT / PARTY:', 20, 65);
doc.text('CURRENT OUTSTANDING BALANCE:', 130, 65);

doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...DARK);
doc.text('Al-Sharabi (Customer - Receivable)', 20, 72);

doc.setFontSize(14);
doc.setTextColor(...RED);
doc.text('1,650.00 SAR', 130, 73);

doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.setFont('helvetica', 'normal');
doc.text('Phone: 0559876543 | Status: Active Debtor', 20, 80);
doc.text('Customer Owes Merchant (Debit Balance)', 130, 80);

// Table Header
doc.setFillColor(...DARK);
doc.rect(14, 92, 182, 8, 'F');
doc.setTextColor(255, 255, 255);
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');

doc.text('#', 18, 97);
doc.text('Date', 26, 97);
doc.text('Ref #', 50, 97);
doc.text('Description / Transaction', 75, 97);
doc.text('Debit (+)', 138, 97, { align: 'right' });
doc.text('Credit (-)', 165, 97, { align: 'right' });
doc.text('Balance', 192, 97, { align: 'right' });

// Table Rows
const rows = [
  { index: '0', date: '2026-08-20', ref: 'OPENING', desc: 'Opening Balance', debit: '500.00', credit: '-', bal: '500.00' },
  { index: '1', date: '2026-08-25', ref: 'INV-2026-0101', desc: 'Credit Sale: Mixed Produce', debit: '1,500.00', credit: '-', bal: '2,000.00' },
  { index: '2', date: '2026-08-28', ref: 'REC-2026-0042', desc: 'Payment Received: Cash Installment', debit: '-', credit: '800.00', bal: '1,200.00' },
  { index: '3', date: '2026-09-02', ref: 'INV-2026-0158', desc: 'Credit Sale: Tomatoes & Cucumbers', debit: '450.00', credit: '-', bal: '1,650.00' },
];

let y = 100;
doc.setFont('helvetica', 'normal');

rows.forEach((row, i) => {
  if (i % 2 === 1) {
    doc.setFillColor(...LIGHT_BG);
    doc.rect(14, y, 182, 8, 'F');
  }
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y + 8, 196, y + 8);

  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.text(row.index, 18, y + 5.5);
  doc.text(row.date, 26, y + 5.5);
  doc.text(row.ref, 50, y + 5.5);
  doc.text(row.desc, 75, y + 5.5);

  doc.setTextColor(row.debit !== '-' ? RED[0] : SLATE[0], row.debit !== '-' ? RED[1] : SLATE[1], row.debit !== '-' ? RED[2] : SLATE[2]);
  doc.text(row.debit, 138, y + 5.5, { align: 'right' });

  doc.setTextColor(row.credit !== '-' ? GREEN[0] : SLATE[0], row.credit !== '-' ? GREEN[1] : SLATE[1], row.credit !== '-' ? GREEN[2] : SLATE[2]);
  doc.text(row.credit, 165, y + 5.5, { align: 'right' });

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(row.bal, 192, y + 5.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  y += 8;
});

// Totals Bar
doc.setFillColor(241, 245, 249);
doc.setDrawColor(...BORDER);
doc.rect(14, y, 182, 9, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...DARK);
doc.text('TOTAL SUMMARY:', 50, y + 6);

doc.setTextColor(...RED);
doc.text('2,450.00 SAR', 138, y + 6, { align: 'right' });

doc.setTextColor(...GREEN);
doc.text('800.00 SAR', 165, y + 6, { align: 'right' });

doc.setTextColor(...DARK);
doc.text('1,650.00 SAR', 192, y + 6, { align: 'right' });

y += 18;

// Bank & Signature Section
doc.setFillColor(...LIGHT_BG);
doc.setDrawColor(...BORDER);
doc.roundedRect(14, y, 100, 24, 2, 2, 'FD');
doc.roundedRect(120, y, 76, 24, 2, 2, 'FD');

doc.setFontSize(8);
doc.setTextColor(...DARK);
doc.text('BANK DETAILS:', 18, y + 6);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...SLATE);
doc.text('Bank: Al-Rajhi Bank', 18, y + 12);
doc.text('IBAN: SA0380000000608010167519', 18, y + 18);

doc.setFont('helvetica', 'bold');
doc.setTextColor(...DARK);
doc.text('AUTHORIZED SIGNATURE & STAMP', 125, y + 6);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...SLATE);
doc.text('Sharikat Al-Basmah Al-Sadisah', 125, y + 14);
doc.text('Date: 2026-09-04', 125, y + 19);

// Footer
doc.setDrawColor(...BORDER);
doc.line(14, 280, 196, 280);
doc.setFontSize(8);
doc.setTextColor(...SLATE);
doc.text('The Smart Dafter (الدفتر الذكي) - Automated Accounting & Invoicing System', 14, 285);
doc.text('Page 1 of 1', 196, 285, { align: 'right' });

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(targetPdfPath, buffer);
console.log('Sample PDF successfully generated at:', targetPdfPath, 'Size:', buffer.length, 'bytes');
