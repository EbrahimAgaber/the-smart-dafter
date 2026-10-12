import { BusinessProfile, Language, Party, Transaction } from '../types';
import { buildSmartWhatsAppMessage } from './messageEngine';

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

    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
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
  if (!phone) return '';
  // 1. Convert Eastern Arabic numerals (٠-٩) to standard Western digits (0-9)
  let normalized = phone
    .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .trim();

  // 2. Remove all non-digit characters except leading '+'
  let cleaned = normalized.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // 3. Smart local number handling without requiring the user to type country code (+966)
  // Saudi 9-digit mobile format without trunk: 5xxxxxxxx -> 9665xxxxxxxx
  if (/^5\d{8}$/.test(cleaned)) {
    return '966' + cleaned;
  }
  // Saudi 10-digit mobile format with trunk: 05xxxxxxxx -> 9665xxxxxxxx
  if (/^05\d{8}$/.test(cleaned)) {
    return '966' + cleaned.substring(1);
  }
  // Egypt 11-digit mobile: 010/011/012/015xxxxxxx -> 201xxxxxxxxx
  if (/^01[0125]\d{8}$/.test(cleaned)) {
    return '20' + cleaned.substring(1);
  }
  // Egypt 10-digit mobile: 10/11/12/15xxxxxxx -> 201xxxxxxxxx
  if (/^1[0125]\d{8}$/.test(cleaned)) {
    return '20' + cleaned;
  }
  // Yemen 9-digit mobile: 7xxxxxxxx -> 9677xxxxxxxx
  if (/^7\d{8}$/.test(cleaned)) {
    return '967' + cleaned;
  }
  // Yemen 10-digit mobile with trunk: 07xxxxxxxx -> 9677xxxxxxxx
  if (/^07\d{8}$/.test(cleaned)) {
    return '967' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Safely navigates or dispatches external URL without triggering popup-blockers or iframe constraints
 */
export function openExternalUrl(url: string): void {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Formats a phone number for clean human-readable UI display
 */
export function formatDisplayPhone(phone: string): string {
  if (!phone) return '';
  const sanitized = sanitizePhoneNumber(phone);
  if (sanitized.startsWith('966') && sanitized.length === 12) {
    const local = '0' + sanitized.substring(3);
    return `${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`;
  }
  return phone;
}

/**
 * Builds professional, customized WhatsApp message for sharing Invoice, Quotation, Credit Note,
 * Supply Intake, Payment Voucher, or Account Statement via the Smart Engine.
 * Formats message with receiptNumber, party name, totals, and balances.
 */
export function buildWhatsAppMessage(
  party: Party,
  transaction: Transaction | null,
  profile: BusinessProfile,
  lang: Language = 'ar'
): string {
  // Uses transaction.receiptNumber and party.name inside buildSmartWhatsAppMessage
  return buildSmartWhatsAppMessage(party, transaction, profile, lang);
}
