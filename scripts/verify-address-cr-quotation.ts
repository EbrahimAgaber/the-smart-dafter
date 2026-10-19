import { SQLiteLedgerStore, calculatePartyBalance } from '../src/db/sqliteStorage';
import { getDocumentNaming, buildSmartWhatsAppMessage } from '../src/utils/messageEngine';
import { generateZatcaTlvQrString } from '../src/utils/zatca';
import { BusinessProfile, Party, LineItem } from '../src/types';

function runAssertions() {
  console.log('🧪 Starting Verification: Address, CR Number & Quotation vs Invoice Distinction...\n');

  const store = SQLiteLedgerStore.getInstance();

  // Test 1: Update Business Profile with CR Number and Address
  console.log('Test 1: Updating Profile with Address and CR Number');
  const updatedProfile: BusinessProfile = {
    name: 'مؤسسة إبراهيم التجارية للتمور',
    phone: '0501234567',
    taxNumber: '300123456789003',
    crNumber: '1010987654',
    address: 'الرياض - حي المروج - طريق الملك عبد العزيز',
    isVatEnabled: true,
    defaultTaxRate: 15,
    iban: 'SA0380000000608010167519',
    bankName: 'مصرف الراجحي',
    logoBase64: '',
    invoiceFooterNote: 'شكراً لاختياركم منتجاتنا الفاخرة',
    currency: 'SAR',
  };

  store.updateProfile(updatedProfile);
  const fetchedProfile = store.getProfile();

  if (fetchedProfile.crNumber !== '1010987654') {
    throw new Error(`CR Number mismatch: expected 1010987654, got ${fetchedProfile.crNumber}`);
  }
  if (fetchedProfile.address !== 'الرياض - حي المروج - طريق الملك عبد العزيز') {
    throw new Error(`Address mismatch: got ${fetchedProfile.address}`);
  }
  console.log('  [PASS] Business profile contains CR Number and Address');

  // Test 2: Add Customer & Quotation
  console.log('Test 2: Creating Quotation Transaction (Ensure zero debt impact & proper prefix)');
  const customer: Party = store.addParty({
    name: 'شركة الأفق للمقاولات',
    phone: '0555555555',
    address: 'الرياض - حي الصحافة',
    type: 'CUSTOMER',
    notes: 'عميل مشاريع رئيسي',
    openingBalance: 0,
  });

  const quotationItems: LineItem[] = [
    { name: 'تمر سكري ملكي فاخر كرتون 3 كجم', quantity: 20, unitPrice: 85, subtotal: 1700 },
    { name: 'تمر خلاص القصيم فاخر كرتون', quantity: 10, unitPrice: 60, subtotal: 600 },
  ];

  const subtotal = 2300;
  const taxRate = 15;
  const taxAmount = Math.round(subtotal * 0.15 * 100) / 100; // 345
  const totalAmount = subtotal + taxAmount; // 2645

  const quotation = store.addTransaction({
    partyId: customer.id,
    type: 'QUOTATION',
    items: quotationItems,
    subtotalBeforeTax: subtotal,
    discountAmount: 0,
    taxRate,
    taxAmount,
    totalAmount,
    paidAmount: 0,
    remainingBalanceDelta: 0,
    notes: 'عرض أسعار لتوريد تمور رمضان',
    quotationValidityDays: 30,
    quotationTerms: 'الأسعار شاملة التوصيل، والتسليم خلال 48 ساعة من التعميد',
  });

  if (!quotation.receiptNumber.startsWith('QOT-')) {
    throw new Error(`Quotation receiptNumber must start with QOT-, got: ${quotation.receiptNumber}`);
  }
  if (quotation.paidAmount !== 0) {
    throw new Error(`Quotation paidAmount must be 0, got: ${quotation.paidAmount}`);
  }
  if (quotation.quotationValidityDays !== 30) {
    throw new Error(`Quotation validity must be 30, got: ${quotation.quotationValidityDays}`);
  }

  // Check customer balance - MUST REMAIN 0
  const parties = store.getParties();
  const updatedCustomer = parties.find((p) => p.id === customer.id)!;
  if (updatedCustomer.currentBalance !== 0) {
    throw new Error(`Quotation altered customer balance! Expected 0, got ${updatedCustomer.currentBalance}`);
  }
  console.log(`  [PASS] Quotation created as ${quotation.receiptNumber} with 0 debt impact on balance`);

  // Test 3: Document Naming distinctions
  console.log('Test 3: Verify Naming Engine distinction between Quotation & Sell Invoice');
  const quoteNaming = getDocumentNaming('QUOTATION', 'ar', true);
  const invoiceNaming = getDocumentNaming('SALE_CREDIT', 'ar', true);

  if (!quoteNaming.title.includes('عرض سعر')) {
    throw new Error(`Expected quotation title to mention عرض سعر, got: ${quoteNaming.title}`);
  }
  if (!quoteNaming.isEstimateOnly) {
    throw new Error('Quotation naming must flag isEstimateOnly = true');
  }
  if (!invoiceNaming.title.includes('فاتورة ضريبية مبسطة')) {
    throw new Error(`Expected invoice title to be فاتورة ضريبية مبسطة, got: ${invoiceNaming.title}`);
  }
  console.log('  [PASS] Document naming cleanly distinguishes Quotation vs Tax Invoice');

  // Test 4: ZATCA QR rules
  console.log('Test 4: ZATCA QR Generation (Strictly Tax Invoices, Never Quotations)');
  const zatcaTlv = generateZatcaTlvQrString({
    sellerName: fetchedProfile.name,
    vatNumber: fetchedProfile.taxNumber,
    timestamp: new Date().toISOString(),
    totalAmount,
    vatAmount: taxAmount,
  });
  if (!zatcaTlv || zatcaTlv.length < 20) {
    throw new Error('Failed to generate valid ZATCA TLV payload');
  }
  console.log('  [PASS] ZATCA TLV Base64 generated correctly for Tax Invoice');

  // Test 5: Converting Quotation to Sale Invoice
  console.log('Test 5: Converting Quotation to Sale Invoice');
  const convertedInvoice = store.convertQuotationToInvoice(quotation.id);

  if (!convertedInvoice.receiptNumber.startsWith('INV-')) {
    throw new Error(`Converted invoice receiptNumber must start with INV-, got: ${convertedInvoice.receiptNumber}`);
  }
  if (convertedInvoice.type !== 'SALE_CREDIT') {
    throw new Error(`Converted invoice type must be SALE_CREDIT, got: ${convertedInvoice.type}`);
  }
  if (convertedInvoice.totalAmount !== totalAmount) {
    throw new Error(`Converted invoice total must match quotation total (${totalAmount}), got: ${convertedInvoice.totalAmount}`);
  }

  // After conversion, customer balance should now reflect the invoice debit
  const postConversionParties = store.getParties();
  const customerAfterConversion = postConversionParties.find((p) => p.id === customer.id)!;
  if (customerAfterConversion.currentBalance !== totalAmount) {
    throw new Error(`Expected customer balance to equal invoice total (${totalAmount}), got: ${customerAfterConversion.currentBalance}`);
  }
  console.log(`  [PASS] Quotation converted to ${convertedInvoice.receiptNumber}, customer balance updated to ${customerAfterConversion.currentBalance} SAR`);

  // Test 6: WhatsApp Smart Message Engine includes CR & Address
  console.log('Test 6: Verifying WhatsApp Message formatting with Address and CR');
  const rawMsg = decodeURIComponent(
    buildSmartWhatsAppMessage(customerAfterConversion, convertedInvoice, fetchedProfile, 'ar')
  );

  if (!rawMsg.includes('1010987654')) {
    throw new Error('WhatsApp message missing CR Number');
  }
  if (!rawMsg.includes('الرياض - حي المروج')) {
    throw new Error('WhatsApp message missing Store Address');
  }
  console.log('  [PASS] WhatsApp message includes Store Address and CR Number');

  console.log('\n🎉 ALL 6 VERIFICATION CHECKS PASSED!\n');
}

runAssertions();
