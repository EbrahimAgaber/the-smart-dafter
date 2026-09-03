import { BusinessProfile, Language, Party, Transaction } from '../types';

export function formatCurrency(amount: number, currency = 'SAR', lang: Language = 'ar'): string {
  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const currencySymbols: Record<string, { ar: string; en: string }> = {
    SAR: { ar: 'ر.س', en: 'SAR' },
    EGP: { ar: 'ج.م', en: 'EGP' },
    AED: { ar: 'د.إ', en: 'AED' },
    KWD: { ar: 'د.ك', en: 'KWD' },
    USD: { ar: '$', en: 'USD' },
    EUR: { ar: '€', en: 'EUR' },
  };

  const symbol = currencySymbols[currency]
    ? currencySymbols[currency][lang]
    : currency;

  if (lang === 'ar') {
    return `${formattedNum} ${symbol}`;
  }
  return `${symbol} ${formattedNum}`;
}

export function formatDate(dateString: string, lang: Language = 'ar'): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(lang === 'ar' ? 'en-GB' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string, lang: Language = 'ar'): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function sanitizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, plus signs, brackets
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('05')) {
    // Saudi local number -> add 966
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('01')) {
    // Egypt local number -> add 20
    cleaned = '20' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Builds professional WhatsApp message for sharing Invoice or Account Statement
 */
export function buildWhatsAppMessage(
  party: Party,
  transaction: Transaction | null,
  profile: BusinessProfile,
  lang: Language = 'ar'
): string {
  const isArabic = lang === 'ar';
  const currency = profile.currency || 'SAR';

  if (transaction) {
    const isSale = transaction.type === 'SALE_CREDIT';
    const isReceipt = transaction.type === 'PAYMENT_RECEIVED';

    if (isArabic) {
      let msg = `*${profile.name}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += isSale ? `📄 *فاتورة مبيعات آجل*\n` : `🧾 *سند سداد مالي*\n`;
      msg += `📌 رقم القيد: *${transaction.receiptNumber}*\n`;
      msg += `👤 العميل المكرم: *${party.name}*\n`;
      msg += `📅 التاريخ: ${formatDate(transaction.date, 'ar')}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      if (transaction.items && transaction.items.length > 0) {
        msg += `*تفاصيل الأصناف والكميات:*\n`;
        transaction.items.forEach((item, index) => {
          msg += `${index + 1}. ${item.name} (${item.quantity} × ${formatCurrency(item.unitPrice, currency, 'ar')}) = *${formatCurrency(item.subtotal, currency, 'ar')}*\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      msg += `💰 إجمالي الفاتورة: *${formatCurrency(transaction.totalAmount, currency, 'ar')}*\n`;
      msg += `💵 المبلغ المسدد نقدًا: *${formatCurrency(transaction.paidAmount, currency, 'ar')}*\n`;
      msg += `⏳ المتبقي كآجل: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'ar')}*\n`;
      msg += `📊 *إجمالي رصيدكم الحالي لدينا:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;

      if (profile.iban) {
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
      msg += isSale ? `📄 *Credit Sale Invoice*\n` : `🧾 *Payment Voucher*\n`;
      msg += `📌 Ref #: *${transaction.receiptNumber}*\n`;
      msg += `👤 Account: *${party.name}*\n`;
      msg += `📅 Date: ${formatDate(transaction.date, 'en')}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      if (transaction.items && transaction.items.length > 0) {
        msg += `*Line Items:*\n`;
        transaction.items.forEach((item, index) => {
          msg += `${index + 1}. ${item.name} (${item.quantity} × ${formatCurrency(item.unitPrice, currency, 'en')}) = *${formatCurrency(item.subtotal, currency, 'en')}*\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      msg += `💰 Total Amount: *${formatCurrency(transaction.totalAmount, currency, 'en')}*\n`;
      msg += `💵 Paid Now: *${formatCurrency(transaction.paidAmount, currency, 'en')}*\n`;
      msg += `⏳ Remaining Credit: *${formatCurrency(transaction.totalAmount - transaction.paidAmount, currency, 'en')}*\n`;
      msg += `📊 *Your Total Outstanding Balance:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;

      if (profile.iban) {
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🏦 *Bank Information:*\n`;
        msg += `Bank: ${profile.bankName}\n`;
        msg += `IBAN: \`${profile.iban}\`\n`;
      }

      msg += `\n✨ Thank you for your continued business!`;
      return encodeURIComponent(msg);
    }
  } else {
    // Statement message
    if (isArabic) {
      let msg = `*${profile.name}*\n`;
      msg += `📋 *إشعار كشف حساب مالي - آجل*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 الحساب: *${party.name}*\n`;
      msg += `📱 الهاتف: ${party.phone}\n`;
      msg += `📅 تاريخ الاستخراج: ${formatDate(new Date().toISOString(), 'ar')}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      if (party.type === 'CUSTOMER') {
        msg += `📊 *الرصيد المستحق عليكم (المطلوب سداده):* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
      } else {
        msg += `📊 *الرصيد المستحق لكم طرفنا:* *${formatCurrency(party.currentBalance, currency, 'ar')}*\n`;
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
      msg += `📱 Phone: ${party.phone}\n`;
      msg += `📅 As of: ${formatDate(new Date().toISOString(), 'en')}\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📊 *Current Outstanding Balance:* *${formatCurrency(party.currentBalance, currency, 'en')}*\n`;

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
}
