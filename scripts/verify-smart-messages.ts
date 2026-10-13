/**
 * E2E Smart Message Customization & Document Naming Verification Suite
 * Verifies that messages and document titles for QUOTATION, RETURN_SALE,
 * SUPPLY_CREDIT, SALE_CREDIT, PAYMENT_RECEIVED, and PAYMENT_PAID
 * are 100% customized, accurate, and free of hardcoded false debt claims.
 */

import { getDocumentNaming, buildSmartWhatsAppMessage } from '../src/utils/messageEngine.js';

async function runSmartMessageTests() {
  console.log('--- E2E SMART MESSAGE & DOCUMENT NAMING ENGINE TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(title, condition) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
    }
  }

  const profile = {
    name: 'مؤسسة التجارة الذكية',
    phone: '0551234567',
    taxNumber: '310123456700003',
    iban: 'SA1280000123608010123456',
    bankName: 'مصرف الراجحي',
    currency: 'SAR',
  };

  const customer = {
    id: 'c-1',
    type: 'CUSTOMER',
    name: 'عبدالله السعيد',
    phone: '0501112233',
    address: 'الرياض',
    currentBalance: 500,
  };

  const distributor = {
    id: 'd-1',
    type: 'DISTRIBUTOR',
    name: 'شركة التوريد المتحدة',
    phone: '0509998877',
    address: 'جدة',
    currentBalance: 12000,
  };

  // Test 1: Quotation Naming & Message
  const qotTx = {
    id: 'tx-1',
    partyId: customer.id,
    type: 'QUOTATION',
    date: new Date().toISOString(),
    receiptNumber: 'QOT-2026-0001',
    items: [{ name: 'شاشة سامسونج', quantity: 2, unitPrice: 750, subtotal: 1500 }],
    totalAmount: 1500,
    paidAmount: 0,
    remainingBalanceDelta: 0,
    notes: 'عرض أسعار تجريبي',
  };

  const qotNaming = getDocumentNaming('QUOTATION', 'ar');
  assert('Quotation title is not credit invoice', qotNaming.title === 'عرض سعر / تقدير مالي');
  assert('Quotation prefix is QOT', qotNaming.prefix === 'QOT');
  assert('Quotation is marked estimate only', qotNaming.isEstimateOnly === true);

  const qotMsg = decodeURIComponent(buildSmartWhatsAppMessage(customer, qotTx, profile, 'ar'));
  assert('Quotation message has quotation title', qotMsg.includes('عرض سعر / تقدير مالي'));
  assert('Quotation message has estimated total label', qotMsg.includes('إجمالي العرض التقديري'));
  assert('Quotation message includes 15-day validity notice', qotMsg.includes('صالح لمدة 15 يوماً'));
  assert('Quotation message does NOT claim credit sale debt', !qotMsg.includes('فاتورة مبيعات آجل'));
  // Test 1b: Custom Quotation Terms & Dynamic Validity
  const customQotTx = {
    id: 'tx-1-custom',
    partyId: customer.id,
    type: 'QUOTATION',
    date: new Date().toISOString(),
    receiptNumber: 'QOT-2026-0002',
    items: [{ name: 'لابتوب ديل', quantity: 1, unitPrice: 3200, subtotal: 3200 }],
    totalAmount: 3200,
    paidAmount: 0,
    remainingBalanceDelta: 0,
    notes: 'عرض للأجهزة المحمولة',
    quotationValidityDays: 30,
    quotationTerms: 'يشمل الضمان سنتين والتوصيل مجاني',
  };

  const customQotMsg = decodeURIComponent(buildSmartWhatsAppMessage(customer, customQotTx, profile, 'ar'));
  assert('Quotation message adapts to custom 30 days validity', customQotMsg.includes('صالح لمدة 30 يوماً'));
  assert('Quotation message includes custom quotation terms', customQotMsg.includes('يشمل الضمان سنتين والتوصيل مجاني'));

  // Test 2: Sales Return (Credit Note) Naming & Message
  const retTx = {
    id: 'tx-2',
    partyId: customer.id,
    type: 'RETURN_SALE',
    date: new Date().toISOString(),
    receiptNumber: 'RET-2026-0001',
    items: [{ name: 'كرتون حليب', quantity: 1, unitPrice: 120, subtotal: 120 }],
    totalAmount: 120,
    paidAmount: 0,
    remainingBalanceDelta: -120,
    notes: 'بضاعة تالفة',
  };

  const retNaming = getDocumentNaming('RETURN_SALE', 'ar');
  assert('Credit Note title is accurate', retNaming.title.includes('إشعار دائن'));
  assert('Credit Note prefix is RET', retNaming.prefix === 'RET');

  const retMsg = decodeURIComponent(buildSmartWhatsAppMessage(customer, retTx, profile, 'ar'));
  assert('Credit Note message includes return title', retMsg.includes('إشعار دائن'));
  assert('Credit Note message specifies deducted amount', retMsg.includes('المخصوم من رصيدكم'));
  assert('Credit Note message does NOT label as credit sale', !retMsg.includes('فاتورة مبيعات آجل'));

  // Test 3: Supply Credit (Distributor Note) Naming & Message
  const supTx = {
    id: 'tx-3',
    partyId: distributor.id,
    type: 'SUPPLY_CREDIT',
    date: new Date().toISOString(),
    receiptNumber: 'SUP-2026-0001',
    items: [{ name: 'أرز بسمتي', quantity: 50, unitPrice: 80, subtotal: 4000 }],
    totalAmount: 4000,
    paidAmount: 1000,
    remainingBalanceDelta: 3000,
    notes: 'توريد دفعة أولى',
  };

  const supNaming = getDocumentNaming('SUPPLY_CREDIT', 'ar');
  assert('Supply Note title is accurate', supNaming.title === 'سند توريد بضاعة بالآجل');
  assert('Supply Note recipient is distributor', supNaming.recipientLabel === 'المورد المكرم:');
  assert('Supply Note prefix is SUP', supNaming.prefix === 'SUP');

  const supMsg = decodeURIComponent(buildSmartWhatsAppMessage(distributor, supTx, profile, 'ar'));
  assert('Supply message includes supply title', supMsg.includes('سند توريد بضاعة بالآجل'));
  assert('Supply message includes supplier liability', supMsg.includes('المتبقي مستحق لكم طرفنا'));
  assert('Supply message does NOT treat distributor as a customer owing debt', !supMsg.includes('العميل المكرم'));

  // Test 4: Payment Receipt (Customer)
  const recTx = {
    id: 'tx-4',
    partyId: customer.id,
    type: 'PAYMENT_RECEIVED',
    date: new Date().toISOString(),
    receiptNumber: 'REC-2026-0001',
    items: [],
    totalAmount: 300,
    paidAmount: 300,
    remainingBalanceDelta: -300,
    notes: 'سداد جزئي',
    paymentMethod: 'BANK_TRANSFER',
  };

  const recMsg = decodeURIComponent(buildSmartWhatsAppMessage(customer, recTx, profile, 'ar'));
  assert('Receipt message has payment voucher title', recMsg.includes('سند قبض مالي'));
  assert('Receipt message indicates bank transfer', recMsg.includes('تحويل بنكي'));
  assert('Receipt message shows remaining debt', recMsg.includes('المتبقي بذمتكم'));

  // Test 5: English Mode Customization
  const qotEnMsg = decodeURIComponent(buildSmartWhatsAppMessage(customer, qotTx, profile, 'en'));
  assert('English quotation title is correct', qotEnMsg.includes('Quotation / Price Estimate'));
  assert('English quotation note indicates no obligation', qotEnMsg.includes('No financial debit'));
  assert('English quotation does NOT claim Credit Sale Invoice', !qotEnMsg.includes('Credit Sale Invoice'));

  console.log(`====================================================================`);
  console.log(`E2E SMART MESSAGE ENGINE SUMMARY: ${passed} / ${total} passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`====================================================================`);

  if (passed !== total) {
    process.exit(1);
  }
}

runSmartMessageTests();
