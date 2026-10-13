import { BusinessProfile, Language, Party, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from './formatters';

export interface DocumentNaming {
  type: TransactionType;
  title: string;
  badge: string;
  shortLabel: string;
  prefix: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  recipientLabel: string;
  financialImpactNotice?: string;
  isEstimateOnly?: boolean;
}

/**
 * Smart Document Naming Engine
 * Resolves exact localized titles, prefixes, badges, and roles across:
 * - QUOTATION (عرض سعر / تقدير مالي - QOT)
 * - RETURN_SALE (إشعار دائن ضريبي مبسط / مرتجع مبيعات - RET)
 * - SALE_CREDIT (فاتورة ضريبية مبسطة / فاتورة بيع آجل - INV)
 * - SUPPLY_CREDIT (سند توريد بالآجل / فاتورة مورد - SUP)
 * - PAYMENT_RECEIVED (سند قبض مالي - REC)
 * - PAYMENT_PAID (سند صرف نقدي - PAY)
 */
export function getDocumentNaming(
  type: TransactionType,
  lang: Language = 'ar',
  isVatApplied = false
): DocumentNaming {
  const isArabic = lang === 'ar';

  switch (type) {
    case 'QUOTATION':
      return {
        type: 'QUOTATION',
        title: isArabic ? 'عرض سعر / تقدير مالي' : 'Quotation / Price Estimate',
        badge: isArabic ? 'عرض سعر (تقديري)' : 'Quotation (Estimate)',
        shortLabel: isArabic ? 'عرض سعر' : 'Quotation',
        prefix: 'QOT',
        icon: '📋',
        color: '#4f46e5',
        badgeBg: 'bg-indigo-50',
        badgeBorder: 'border-indigo-200',
        badgeText: 'text-indigo-800',
        recipientLabel: isArabic ? 'العميل المستهدف:' : 'Customer:',
        financialImpactNotice: isArabic
          ? 'عرض سعر تقديري - لا يؤثر على رصيد الحساب المالي'
          : 'Quotation estimate - No financial impact on account balance',
        isEstimateOnly: true,
      };

    case 'RETURN_SALE':
      return {
        type: 'RETURN_SALE',
        title: isArabic ? 'إشعار دائن ضريبي مبسط (مرتجع)' : 'Simplified Tax Credit Note',
        badge: isArabic ? 'إشعار دائن (مرتجع)' : 'Credit Note (Return)',
        shortLabel: isArabic ? 'إشعار دائن' : 'Credit Note',
        prefix: 'RET',
        icon: '🔄',
        color: '#e11d48',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-200',
        badgeText: 'text-rose-800',
        recipientLabel: isArabic ? 'العميل المكرم:' : 'Customer:',
        financialImpactNotice: isArabic
          ? 'إشعار دائن معتمد يخصم القيمة من رصيد العميل'
          : 'Approved credit note deducting value from customer balance',
      };

    case 'SUPPLY_CREDIT':
      return {
        type: 'SUPPLY_CREDIT',
        title: isArabic ? 'سند توريد بضاعة بالآجل' : 'Credit Supply Note',
        badge: isArabic ? 'سند توريد آجل' : 'Supply Credit Note',
        shortLabel: isArabic ? 'سند توريد' : 'Supply Note',
        prefix: 'SUP',
        icon: '🚚',
        color: '#0284c7',
        badgeBg: 'bg-sky-50',
        badgeBorder: 'border-sky-200',
        badgeText: 'text-sky-800',
        recipientLabel: isArabic ? 'المورد المكرم:' : 'Supplier / Distributor:',
      };

    case 'PAYMENT_RECEIVED':
      return {
        type: 'PAYMENT_RECEIVED',
        title: isArabic ? 'سند قبض مالي' : 'Payment Receipt Voucher',
        badge: isArabic ? 'سند قبض مالي' : 'Payment Receipt',
        shortLabel: isArabic ? 'سند قبض' : 'Receipt Voucher',
        prefix: 'REC',
        icon: '🧾',
        color: '#059669',
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-200',
        badgeText: 'text-emerald-800',
        recipientLabel: isArabic ? 'استلمنا من العميل:' : 'Received From Customer:',
      };

    case 'PAYMENT_PAID':
      return {
        type: 'PAYMENT_PAID',
        title: isArabic ? 'سند صرف نقدي' : 'Payment Disbursement Voucher',
        badge: isArabic ? 'سند صرف نقدي' : 'Disbursement Voucher',
        shortLabel: isArabic ? 'سند صرف' : 'Payment Voucher',
        prefix: 'PAY',
        icon: '💸',
        color: '#7c3aed',
        badgeBg: 'bg-purple-50',
        badgeBorder: 'border-purple-200',
        badgeText: 'text-purple-800',
        recipientLabel: isArabic ? 'صرفنا إلى المورد:' : 'Paid To Supplier:',
      };

    case 'SALE_CREDIT':
    default:
      return {
        type: 'SALE_CREDIT',
        title: isVatApplied
          ? (isArabic ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice')
          : (isArabic ? 'فاتورة بيع آجل' : 'Credit Sale Invoice'),
        badge: isVatApplied
          ? (isArabic ? 'فاتورة ضريبية' : 'Tax Invoice')
          : (isArabic ? 'فاتورة بيع آجل' : 'Credit Sale'),
        shortLabel: isArabic ? 'فاتورة بيع' : 'Sale Invoice',
        prefix: 'INV',
        icon: '📄',
        color: '#0f172a',
        badgeBg: 'bg-cyan-50',
        badgeBorder: 'border-cyan-200',
        badgeText: 'text-cyan-800',
        recipientLabel: isArabic ? 'العميل المكرم:' : 'Customer:',
      };
  }
}

/**
 * Smart Message Customization Engine
 * Dynamically builds contextually accurate WhatsApp notifications and summary texts.
 * Handles quotations without false debt claims, credit notes with deduction deltas,
 * supply intakes for distributors, payment receipts, and customer statements.
 */
export function buildSmartWhatsAppMessage(
  party: Party,
  transaction: Transaction | null,
  profile: BusinessProfile,
  lang: Language = 'ar'
): string {
  const isArabic = lang === 'ar';
  const currency = profile.currency || 'SAR';

  // 1. Transaction Message
  if (transaction) {
    const isVatApplied = Boolean(transaction.taxAmount && transaction.taxAmount > 0);
    const naming = getDocumentNaming(transaction.type, lang, isVatApplied);

    if (isArabic) {
      let msg = `*${profile.name}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `${naming.icon} *${naming.title}*\n`;
      msg += `📌 رقم القيد: *${transaction.receiptNumber}*\n`;
      msg += `👤 ${naming.recipientLabel} *${party.name}*\n`;
      msg += `📅 التاريخ: ${formatDate(transaction.date, 'ar')}\n`;

      if (transaction.dueDate) {
        msg += `⏳ تاريخ الاستحقاق: ${formatDate(transaction.dueDate, 'ar')}\n`;
      }
      if (transaction.isVoided) {
        msg += `⚠️ *حالة القيد: ملغي ومبطل*\n`;
      }
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      // Line items details (Quotations, Sales, Supplies, Credit Notes)
      if (transaction.items && transaction.items.length > 0) {
        msg += `*تفاصيل الأصناف والكميات:*\n`;
        transaction.items.forEach((item, index) => {
          msg += `${index + 1}. ${item.name} (${item.quantity} × ${formatCurrency(item.unitPrice, currency, 'ar')}) = *${formatCurrency(item.subtotal, currency, 'ar')}*\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      // Financial breakdown customized per document type
      if (transaction.type === 'QUOTATION') {
        msg += `💰 إجمالي العرض التقديري: *${formatCurrency(transaction.totalAmount, currency, 'ar')}*\n`;
        if (transaction.taxAmount && transaction.taxAmount > 0) {
          msg += `🏷️ يشمل ضريبة القيمة المضافة: ${formatCurrency(transaction.taxAmount, currency, 'ar')}\n`;
        }
        const validityDays = transaction.quotationValidityDays || 15;
        msg += `⏱️ *مدة السريان:* صالح لمدة ${validityDays} يوماً من تاريخ الإصدار.\n`;
        if (transaction.quotationTerms) {
          msg += `📜 *شروط العرض:* ${transaction.quotationTerms}\n`;
        }
        msg += `ℹ️ *ملاحظة:* هذا عرض سعر تقديري لا يترتب عليه أي التزام مالي حالي حتى اعتماده وتحويله لفاتورة مبيعات.\n`;
      } else if (transaction.type === 'RETURN_SALE') {
        msg += `💰 إجمالي المرتجع: *${formatCurrency(transaction.totalAmount, currency, 'ar')}*\n`;
        if (transaction.paidAmount > 0) {
          msg += `💵 تم استرداد نقدًا: *${formatCurrency(transaction.paidAmount, currency, 'ar')}*\n`;
        }
        const creditedAmount = transaction.totalAmount - transaction.paidAmount;
        if (creditedAmount > 0) {
          msg += `📉 المخصوم من رصيدكم الدائن: *${formatCurrency(creditedAmount, currency, 'ar')}*\n`;
        }
        msg += `📊 *رصيدكم الحالي بعد قيد الإشعار:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      } else if (transaction.type === 'SUPPLY_CREDIT') {
        msg += `💰 إجمالي فاتورة التوريد: *${formatCurrency(transaction.totalAmount, currency, 'ar')}*\n`;
        msg += `💵 المسدد فورًا للمورد: *${formatCurrency(transaction.paidAmount, currency, 'ar')}*\n`;
        msg += `⏳ المتبقي مستحق لكم طرفنا: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'ar')}*\n`;
        msg += `📊 *إجمالي المستحق لكم طرفنا حالياً:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      } else if (transaction.type === 'PAYMENT_RECEIVED') {
        msg += `💵 المبلغ المستلم نقدًا / تحويل: *${formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, 'ar')}*\n`;
        if (transaction.paymentMethod) {
          const methodLabel = transaction.paymentMethod === 'BANK_TRANSFER' ? 'تحويل بنكي' : transaction.paymentMethod === 'CHEQUE' ? 'شيك' : 'نقداً';
          msg += `💳 طريقة الاستلام: ${methodLabel}\n`;
        }
        msg += `📊 *المتبقي بذمتكم بعد هذا السند:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      } else if (transaction.type === 'PAYMENT_PAID') {
        msg += `💸 المبلغ المصروف للمورد: *${formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, 'ar')}*\n`;
        if (transaction.paymentMethod) {
          const methodLabel = transaction.paymentMethod === 'BANK_TRANSFER' ? 'تحويل بنكي' : transaction.paymentMethod === 'CHEQUE' ? 'شيك' : 'نقداً';
          msg += `💳 طريقة الصرف: ${methodLabel}\n`;
        }
        msg += `📊 *المتبقي لكم بذمتنا بعد هذا السند:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      } else {
        // SALE_CREDIT
        msg += `💰 إجمالي الفاتورة: *${formatCurrency(transaction.totalAmount, currency, 'ar')}*\n`;
        msg += `💵 المبلغ المسدد نقدًا: *${formatCurrency(transaction.paidAmount, currency, 'ar')}*\n`;
        msg += `⏳ المتبقي كآجل: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'ar')}*\n`;
        msg += `📊 *إجمالي رصيدكم الحالي لدينا:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      }

      if (transaction.notes) {
        msg += `📝 ملاحظات: _${transaction.notes}_\n`;
      }

      // Bank details only for receivable items if needed
      if (profile.iban && transaction.type !== 'QUOTATION' && transaction.type !== 'PAYMENT_PAID') {
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🏦 *بيانات التحويل البنكي:*\n`;
        msg += `البنك: ${profile.bankName}\n`;
        msg += `الآيبان: \`${profile.iban}\`\n`;
      }

      if (profile.invoiceFooterNote) {
        msg += `\n_${profile.invoiceFooterNote}_\n`;
      }

      msg += `\n✨ شكرًا لتعاملكم الراقي معنا!`;
      return encodeURIComponent(msg);
    } else {
      // English
      let msg = `*${profile.name}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `${naming.icon} *${naming.title}*\n`;
      msg += `📌 Ref #: *${transaction.receiptNumber}*\n`;
      msg += `👤 ${naming.recipientLabel} *${party.name}*\n`;
      msg += `📅 Date: ${formatDate(transaction.date, 'en')}\n`;

      if (transaction.dueDate) {
        msg += `⏳ Due Date: ${formatDate(transaction.dueDate, 'en')}\n`;
      }
      if (transaction.isVoided) {
        msg += `⚠️ *Status: VOIDED*\n`;
      }
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      if (transaction.items && transaction.items.length > 0) {
        msg += `*Line Items:*\n`;
        transaction.items.forEach((item, index) => {
          msg += `${index + 1}. ${item.name} (${item.quantity} × ${formatCurrency(item.unitPrice, currency, 'en')}) = *${formatCurrency(item.subtotal, currency, 'en')}*\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      if (transaction.type === 'QUOTATION') {
        msg += `💰 Estimated Total: *${formatCurrency(transaction.totalAmount, currency, 'en')}*\n`;
        if (transaction.taxAmount && transaction.taxAmount > 0) {
          msg += `🏷️ VAT Included: ${formatCurrency(transaction.taxAmount, currency, 'en')}\n`;
        }
        const validityDays = transaction.quotationValidityDays || 15;
        msg += `⏱️ *Validity Period:* Valid for ${validityDays} days from date of issue.\n`;
        if (transaction.quotationTerms) {
          msg += `📜 *Terms & Conditions:* ${transaction.quotationTerms}\n`;
        }
        msg += `ℹ️ *Note:* Price quotation only. No financial debit or obligation until officially approved and converted to invoice.\n`;
      } else if (transaction.type === 'RETURN_SALE') {
        msg += `💰 Return Total: *${formatCurrency(transaction.totalAmount, currency, 'en')}*\n`;
        if (transaction.paidAmount > 0) {
          msg += `💵 Refunded Cash: *${formatCurrency(transaction.paidAmount, currency, 'en')}*\n`;
        }
        const creditedAmount = transaction.totalAmount - transaction.paidAmount;
        if (creditedAmount > 0) {
          msg += `📉 Deducted from Balance: *${formatCurrency(creditedAmount, currency, 'en')}*\n`;
        }
        msg += `📊 *Current Balance After Credit Note:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
      } else if (transaction.type === 'SUPPLY_CREDIT') {
        msg += `💰 Supply Invoice Total: *${formatCurrency(transaction.totalAmount, currency, 'en')}*\n`;
        msg += `💵 Paid Now to Supplier: *${formatCurrency(transaction.paidAmount, currency, 'en')}*\n`;
        msg += `⏳ Remaining Payable: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'en')}*\n`;
        msg += `📊 *Total Balance Owed to You:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
      } else if (transaction.type === 'PAYMENT_RECEIVED') {
        msg += `💵 Received Amount: *${formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, 'en')}*\n`;
        if (transaction.paymentMethod) {
          msg += `💳 Payment Method: ${transaction.paymentMethod}\n`;
        }
        msg += `📊 *Remaining Outstanding Balance:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
      } else if (transaction.type === 'PAYMENT_PAID') {
        msg += `💸 Disbursed Amount: *${formatCurrency(transaction.paidAmount || transaction.totalAmount, currency, 'en')}*\n`;
        if (transaction.paymentMethod) {
          msg += `💳 Payment Method: ${transaction.paymentMethod}\n`;
        }
        msg += `📊 *Remaining Payable Balance:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
      } else {
        // SALE_CREDIT
        msg += `💰 Total Amount: *${formatCurrency(transaction.totalAmount, currency, 'en')}*\n`;
        msg += `💵 Paid Now: *${formatCurrency(transaction.paidAmount, currency, 'en')}*\n`;
        msg += `⏳ Remaining Credit: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'en')}*\n`;
        msg += `📊 *Your Total Outstanding Balance:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
      }

      if (transaction.notes) {
        msg += `📝 Notes: _${transaction.notes}_\n`;
      }

      if (profile.iban && transaction.type !== 'QUOTATION' && transaction.type !== 'PAYMENT_PAID') {
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🏦 *Bank Information:*\n`;
        msg += `Bank: ${profile.bankName}\n`;
        msg += `IBAN: \`${profile.iban}\`\n`;
      }

      if (profile.invoiceFooterNote) {
        msg += `\n_${profile.invoiceFooterNote}_\n`;
      }

      msg += `\n✨ Thank you for your continued business!`;
      return encodeURIComponent(msg);
    }
  }

  // 2. Account Statement Message (party-level notice)
  if (isArabic) {
    let msg = `*${profile.name}*\n`;
    msg += `📋 *إشعار كشف حساب مالي - آجل*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 الحساب: *${party.name}*\n`;
    msg += `📱 الهاتف: ${party.phone || '-'}\n`;
    msg += `📅 تاريخ الاستخراج: ${formatDate(new Date().toISOString(), 'ar')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (party.type === 'CUSTOMER') {
      msg += `📊 *الرصيد المستحق عليكم (المطلوب سداده):* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
    } else {
      msg += `📊 *الرصيد المستحق لكم طرفنا (مطلوب صرفه):* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
    }

    if (profile.iban) {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🏦 *للسداد عبر التحويل البنكي:*\n`;
      msg += `البنك: ${profile.bankName}\n`;
      msg += `الآيبان: \`${profile.iban}\`\n`;
    }

    msg += `\nنأمل التكرم بمطابقة الحساب وموافاتنا بأي ملاحظات.\nدمتم بود.`;
    return encodeURIComponent(msg);
  } else {
    let msg = `*${profile.name}*\n`;
    msg += `📋 *Account Statement Notice*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 Account: *${party.name}*\n`;
    msg += `📱 Phone: ${party.phone || '-'}\n`;
    msg += `📅 As of: ${formatDate(new Date().toISOString(), 'en')}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (party.type === 'CUSTOMER') {
      msg += `📊 *Current Outstanding Balance (Receivable):* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
    } else {
      msg += `📊 *Current Outstanding Balance (Payable):* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;
    }

    if (profile.iban) {
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🏦 *Bank Details:*\n`;
      msg += `Bank: ${profile.bankName}\n`;
      msg += `IBAN: \`${profile.iban}\`\n`;
    }

    msg += `\nThank you for your business.`;
    return encodeURIComponent(msg);
  }
}
