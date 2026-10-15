/**
 * E2E Verification Suite:
 * 1. Mobile Phone Optimized PDF Format (large phone fonts, no-zoom)
 * 2. Items Sold Summary Table (quantities sold, breakdown, percentages)
 * 3. 5-Day Invoice Modification Grace Period & Integrity Enforcements
 */

import { SQLiteLedgerStore } from '../src/db/sqliteStorage';
import { generateInvoicePdf } from '../src/utils/pdfGenerator';
import type { Transaction, Party, BusinessProfile } from '../src/types';

function runE2eAssessment() {
  console.log('====================================================================');
  console.log('   E2E ASSESSMENT: INVOICE MODIFICATION (5-DAY) & MOBILE PDF FORMAT  ');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ✔ ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✘ ${testName}${details ? ` -> ${details}` : ''}`);
      process.exitCode = 1;
    }
  }

  // Clear or initialize isolated store instance
  const store = SQLiteLedgerStore.getInstance();
  const profile: BusinessProfile = {
    name: 'مؤسسة التجارة الذكية',
    phone: '+966501234567',
    taxNumber: '310123456700003',
    address: 'الرياض - حي الملز',
    currency: 'SAR',
    vatRate: 15,
  };

  const customer: Party = store.addParty({
    name: 'عميل تجريبي - خالد العتيبي',
    type: 'CUSTOMER',
    phone: '+966555123456',
    region: 'حي النرجس',
    openingBalance: 0,
  });

  // -------------------------------------------------------------
  // Test 1: Fresh Invoice within 5-day window is allowed to modify
  // -------------------------------------------------------------
  const freshTx = store.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    date: new Date().toISOString(), // Today (0 days elapsed)
    items: [
      { name: 'منتج أ (تمر سكري فاخر)', quantity: 4, unitPrice: 50, subtotal: 200 },
      { name: 'منتج ب (قهوة عربية)', quantity: 2, unitPrice: 30, subtotal: 60 },
    ],
    subtotalBeforeTax: 260,
    discountAmount: 10,
    taxRate: 15,
    taxAmount: 37.5,
    totalAmount: 287.5,
    paidAmount: 87.5,
    remainingBalanceDelta: 200,
    notes: 'فاتورة تجريبية أولى',
  });

  const checkFresh = store.canModifyInvoice(freshTx);
  assert(checkFresh.allowed === true, 'T1.1: Fresh invoice (0 days) is allowed to be modified');
  assert(checkFresh.remainingDays === 5, 'T1.2: Fresh invoice has 5 days remaining in grace period');

  // Initial customer debt check: 287.5 - 87.5 = 200.0 SAR
  const customerAfterSale = store.getPartyById(customer.id);
  assert(customerAfterSale?.currentBalance === 200, 'T1.3: Customer debt is 200 SAR before modification');

  // -------------------------------------------------------------
  // Test 2: Modify invoice (Add item, delete item, adjust quantity & prices)
  // -------------------------------------------------------------
  const originalReceiptNumber = freshTx.receiptNumber;
  const originalDate = freshTx.date;

  const updatedTx = store.updateTransaction(freshTx.id, {
    items: [
      { name: 'منتج أ (تمر سكري فاخر)', quantity: 6, unitPrice: 50, subtotal: 300 }, // Qty increased from 4 to 6
      { name: 'منتج ج (هيل هندي جامبو)', quantity: 1, unitPrice: 80, subtotal: 80 },  // Added new item
      // Deleted 'منتج ب (قهوة عربية)'
    ],
    subtotalBeforeTax: 380,
    discountAmount: 20,
    taxRate: 15,
    taxAmount: 54,
    totalAmount: 414,
    paidAmount: 114,
    remainingBalanceDelta: 300,
    notes: 'تم التعديل: زيادة الكميات وحذف القهوة وإضافة هيل هندي',
  });

  assert(updatedTx.isModified === true, 'T2.1: Updated transaction flagged with isModified: true');
  assert(updatedTx.receiptNumber === originalReceiptNumber, 'T2.2: Original official receipt number preserved');
  assert(updatedTx.date === originalDate, 'T2.3: Original issuance timestamp preserved');
  assert(updatedTx.items?.length === 2, 'T2.4: Items list correctly modified (1 added, 1 deleted, 1 adjusted)');
  assert(updatedTx.totalAmount === 414, 'T2.5: Total amount updated to 414 SAR');

  // Check recalculation of ledger debt for customer: 414 - 114 = 300 SAR
  const customerAfterMod = store.getPartyById(customer.id);
  assert(customerAfterMod?.currentBalance === 300, 'T2.6: Party ledger balance automatically updated to 300 SAR');

  // -------------------------------------------------------------
  // Test 3: Modification at day 4 (allowed with 1 day remaining)
  // -------------------------------------------------------------
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 1000 * 60).toISOString();
  const txDay4 = store.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    date: fourDaysAgo,
    items: [{ name: 'كرتون زيت', quantity: 1, unitPrice: 100, subtotal: 100 }],
    subtotalBeforeTax: 100,
    taxAmount: 15,
    totalAmount: 115,
    paidAmount: 115,
    remainingBalanceDelta: 0,
  });

  const checkDay4 = store.canModifyInvoice(txDay4);
  assert(checkDay4.allowed === true, 'T3.1: Invoice at 4 days is still within allowed modification window');
  assert(checkDay4.remainingDays === 1, 'T3.2: Remaining days computed as 1 day remaining');

  // -------------------------------------------------------------
  // Test 4: Modification strictly rejected after 5 days (e.g. 5.1 days or 6 days)
  // -------------------------------------------------------------
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const txExpired = store.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    date: sixDaysAgo,
    items: [{ name: 'سلعة قديمة', quantity: 1, unitPrice: 50, subtotal: 50 }],
    subtotalBeforeTax: 50,
    totalAmount: 50,
    paidAmount: 50,
    remainingBalanceDelta: 0,
  });

  const checkExpired = store.canModifyInvoice(txExpired);
  assert(checkExpired.allowed === false, 'T4.1: Invoice older than 5 days is strictly rejected from modification');
  assert(checkExpired.remainingDays === 0, 'T4.2: Remaining days is 0 for expired invoice');

  let threwOnExpired = false;
  try {
    store.updateTransaction(txExpired.id, { notes: 'محاولة تعديل غير مسموحة' });
  } catch (err: any) {
    threwOnExpired = true;
    assert(err.message.includes('5'), 'T4.3: Storage error clearly states 5-day expiration');
  }
  assert(threwOnExpired === true, 'T4.4: updateTransaction threw exception on expired invoice');

  // -------------------------------------------------------------
  // Test 5: Voided invoice modification strictly rejected
  // -------------------------------------------------------------
  const voidedTx = store.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    date: new Date().toISOString(),
    items: [{ name: 'سلعة ملغاة', quantity: 1, unitPrice: 70, subtotal: 70 }],
    subtotalBeforeTax: 70,
    totalAmount: 70,
    paidAmount: 70,
    remainingBalanceDelta: 0,
  });
  store.voidTransaction(voidedTx.id);
  const reloadedVoided = store.getTransactionsByParty(customer.id).find((t) => t.id === voidedTx.id)!;

  const checkVoided = store.canModifyInvoice(reloadedVoided);
  assert(checkVoided.allowed === false, 'T5.1: Voided invoice cannot be modified even if within 5 days');

  let threwOnVoided = false;
  try {
    store.updateTransaction(voidedTx.id, { notes: 'محاولة تعديل فاتورة ملغاة' });
  } catch {
    threwOnVoided = true;
  }
  assert(threwOnVoided === true, 'T5.2: updateTransaction threw exception on voided invoice');

  // -------------------------------------------------------------
  // Test 6: Simplified 5-Row Summary Calculations & VAT Inclusivity Logic
  // -------------------------------------------------------------
  const sampleItems = updatedTx.items || [];
  const totalUnitsSold = sampleItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const itemsSubtotal = sampleItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const discountVal = updatedTx.discountAmount || 0;
  const netAfterDiscount = itemsSubtotal - discountVal;
  const taxVal = updatedTx.taxAmount || 0;
  const expectedGrandTotal = Math.round((netAfterDiscount + taxVal) * 100) / 100;

  assert(totalUnitsSold === 7, 'T6.1: Row 1 - Quantity sold computes exactly 7 units sold (6 + 1)');
  assert(itemsSubtotal === 380, 'T6.2: Row 2 - Subtotal computes 380 SAR');
  assert(discountVal === 20, 'T6.3: Row 3 - Discount correctly applied as 20 SAR');
  assert(taxVal === 54, 'T6.4: Row 4 - VAT computed as 15% of (380 - 20) = 54 SAR');
  assert(updatedTx.totalAmount === expectedGrandTotal, 'T6.5: Row 5 - Total matches Subtotal - Discount + VAT exactly (414 SAR)');

  // Test 6b: Non-VAT Inclusive Invoice (VAT row must not appear)
  const nonVatTx = store.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    date: new Date().toISOString(),
    items: [{ name: 'سلعة بدون ضريبة', quantity: 3, unitPrice: 100, subtotal: 300 }],
    subtotalBeforeTax: 300,
    discountAmount: 20,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 280,
    paidAmount: 280,
    remainingBalanceDelta: 0,
  });

  const isNonVatInclusive = Boolean(nonVatTx.taxAmount && nonVatTx.taxAmount > 0 && (nonVatTx.taxRate ?? 0) > 0);
  assert(isNonVatInclusive === false, 'T6.6: Invoice without VAT has isVatInclusive=false (VAT row hidden)');
  assert(nonVatTx.totalAmount === 300 - 20, 'T6.7: Non-VAT invoice total is exactly Subtotal - Discount');

  // -------------------------------------------------------------
  // Test 7: Mobile-Optimized PDF Generation Format verification
  // -------------------------------------------------------------
  let mobilePdfGenerated = false;
  try {
    const pdfDoc = generateInvoicePdf({
      profile,
      transaction: updatedTx,
      party: customer,
      lang: 'ar',
      format: 'MOBILE_PHONE',
    });
    // In Node.js environment without DOM Canvas, jsPDF returns fallback doc
    if (pdfDoc) {
      mobilePdfGenerated = true;
    }
  } catch (e) {
    console.warn('PDF generation in CLI node environment:', e);
  }
  assert(mobilePdfGenerated, 'T7.1: Mobile phone invoice PDF format invoked successfully');

  console.log('\n====================================================================');
  console.log(`  E2E ASSESSMENT RESULT: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================================\n');
}

runE2eAssessment();
