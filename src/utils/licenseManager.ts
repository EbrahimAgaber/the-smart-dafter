/**
 * Security Guard & Offline Cryptographic License Manager for Daftar Smart.
 * Fully offline, zero-server dependency.
 * Validates license keys and controls invoice creation rights.
 */

const STORAGE_KEY = 'daftar_smart_license_v1';
const FIRST_LAUNCH_KEY = 'daftar_smart_first_launch_v1';
const SECRET_SALT = 'DAFTAR_SEC_SALT_v2_987412356_KEYGEN';

export type PlanDurationUnit = 'DAYS' | 'MONTHS' | 'YEARS' | 'LIFETIME';

export interface LicenseRecord {
  key: string;
  planCode: string;
  expiryTimestamp: number; // Unix timestamp in ms
  activatedAt: string;     // ISO date
  clientTag?: string;
  signature: string;
}

export interface LicenseStatus {
  isActive: boolean;
  isExpired: boolean;
  isLifetime: boolean;
  daysRemaining: number;
  expiryDateStr: string;
  planNameAr: string;
  planNameEn: string;
  currentKey: string;
}

// Deterministic cryptographic hash function (Murmur3-inspired 64-bit hex hash)
function computeDeterministicSignature(payload: string): string {
  const combined = `${payload}::${SECRET_SALT}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const part1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `${part1.slice(0, 4)}-${part2.slice(0, 4)}`;
}

// Format expiry timestamp to YYYYMMDD
function formatTimestampToHex(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// Parse YYYYMMDD back to Unix Timestamp (end of that day)
function parseDateStringToTimestamp(dateStr: string): number | null {
  if (dateStr.length !== 8) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const date = new Date(y, m, d, 23, 59, 59, 999);
  return isNaN(date.getTime()) ? null : date.getTime();
}

/**
 * Generate an authentic License Key (For Developer / App Owner Only)
 * Format: DFT-<PLAN>-<DATE_YYYYMMDD>-<SIG1>-<SIG2>
 * Example: DFT-30D-20261003-9A4B-3F1E
 */
export function generateLicenseKey(
  durationValue: number,
  durationUnit: PlanDurationUnit,
  clientTag: string = ''
): { key: string; expiryDate: string; planName: string } {
  const now = new Date();
  let expiry = new Date(now);
  let planCode = '';
  let planName = '';

  if (durationUnit === 'DAYS') {
    expiry.setDate(now.getDate() + durationValue);
    planCode = `${durationValue}D`;
    planName = `${durationValue} يوم`;
  } else if (durationUnit === 'MONTHS') {
    expiry.setMonth(now.getMonth() + durationValue);
    planCode = `${durationValue}M`;
    planName = `${durationValue} شهر`;
  } else if (durationUnit === 'YEARS') {
    expiry.setFullYear(now.getFullYear() + durationValue);
    planCode = `${durationValue}Y`;
    planName = `${durationValue} سنة`;
  } else {
    // LIFETIME
    expiry = new Date(2099, 11, 31);
    planCode = 'LIFE';
    planName = 'مدى الحياة (دائم)';
  }

  const dateStr = formatTimestampToHex(expiry.getTime());
  const payload = `${planCode}::${dateStr}::${clientTag.trim().toLowerCase()}`;
  const sig = computeDeterministicSignature(payload);

  const key = `DFT-${planCode}-${dateStr}-${sig}`;
  return {
    key,
    expiryDate: expiry.toLocaleDateString('ar-SA'),
    planName,
  };
}

/**
 * Validates and verifies a given License Key string.
 */
export function verifyLicenseKey(
  keyString: string,
  clientTag: string = ''
): { valid: boolean; planCode?: string; expiryTimestamp?: number; error?: string } {
  const cleanKey = keyString.trim().toUpperCase();
  const parts = cleanKey.split('-');

  // Expected format: DFT-<PLAN>-<YYYYMMDD>-<SIG1>-<SIG2>
  if (parts.length !== 5 || parts[0] !== 'DFT') {
    return { valid: false, error: 'صيغة المفتاح غير صحيحة' };
  }

  const [, planCode, dateStr, sig1, sig2] = parts;
  const signature = `${sig1}-${sig2}`;

  const expiryTimestamp = parseDateStringToTimestamp(dateStr);
  if (!expiryTimestamp) {
    return { valid: false, error: 'تاريخ المفتاح غير صالح' };
  }

  // Check signature with and without client tag to allow universal or store-specific keys
  const payload1 = `${planCode}::${dateStr}::${clientTag.trim().toLowerCase()}`;
  const payload2 = `${planCode}::${dateStr}::`;

  const expectedSig1 = computeDeterministicSignature(payload1);
  const expectedSig2 = computeDeterministicSignature(payload2);

  if (signature !== expectedSig1 && signature !== expectedSig2) {
    return { valid: false, error: 'رمز حماية المفتاح غير مطابق أو مزيف' };
  }

  return {
    valid: true,
    planCode,
    expiryTimestamp,
  };
}

/**
 * Get current active license status
 */
export function getLicenseStatus(): LicenseStatus {
  // Check if first launch, grant default 14-day free trial out of the box
  let firstLaunch = localStorage.getItem(FIRST_LAUNCH_KEY);
  if (!firstLaunch) {
    firstLaunch = new Date().toISOString();
    localStorage.setItem(FIRST_LAUNCH_KEY, firstLaunch);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  let record: LicenseRecord | null = null;

  if (stored) {
    try {
      record = JSON.parse(stored);
    } catch {
      record = null;
    }
  }

  const nowMs = Date.now();

  // If user activated an explicit key:
  if (record && record.expiryTimestamp) {
    const isLifetime = record.planCode === 'LIFE';
    const isExpired = !isLifetime && nowMs > record.expiryTimestamp;
    const diffMs = Math.max(0, record.expiryTimestamp - nowMs);
    const daysRemaining = isLifetime ? 9999 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const expiryDate = new Date(record.expiryTimestamp);
    const expiryDateStr = isLifetime
      ? 'رخصة دائمة (مفتوحة)'
      : expiryDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    return {
      isActive: !isExpired,
      isExpired,
      isLifetime,
      daysRemaining,
      expiryDateStr,
      planNameAr: isLifetime ? 'رخصة دائمة' : `باقة (${record.planCode})`,
      planNameEn: isLifetime ? 'Lifetime License' : `Plan (${record.planCode})`,
      currentKey: record.key,
    };
  }

  // Fallback: 14-Day Free Initial Trial
  const firstLaunchDate = new Date(firstLaunch).getTime();
  const trialDurationMs = 14 * 24 * 60 * 60 * 1000;
  const trialExpiryMs = firstLaunchDate + trialDurationMs;
  const isExpired = nowMs > trialExpiryMs;
  const diffMs = Math.max(0, trialExpiryMs - nowMs);
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const trialExpiryDate = new Date(trialExpiryMs);
  const expiryDateStr = trialExpiryDate.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    isActive: !isExpired,
    isExpired,
    isLifetime: false,
    daysRemaining,
    expiryDateStr,
    planNameAr: 'فترة تجريبية مجانية (14 يوم)',
    planNameEn: '14-Day Free Trial',
    currentKey: 'TRIAL-FREE-14D',
  };
}

/**
 * Apply and activate a new License Key
 */
export function activateLicenseKey(
  keyString: string,
  clientTag: string = ''
): { success: boolean; messageAr: string; messageEn: string; status?: LicenseStatus } {
  const result = verifyLicenseKey(keyString, clientTag);

  if (!result.valid || !result.expiryTimestamp || !result.planCode) {
    return {
      success: false,
      messageAr: result.error || 'مفتاح التفعيل غير صحيح',
      messageEn: 'Invalid license key',
    };
  }

  if (result.expiryTimestamp < Date.now() && result.planCode !== 'LIFE') {
    return {
      success: false,
      messageAr: 'عذرًا، هذا المفتاح منتهي الصلاحية بالفعل',
      messageEn: 'This license key has already expired',
    };
  }

  const newRecord: LicenseRecord = {
    key: keyString.trim().toUpperCase(),
    planCode: result.planCode,
    expiryTimestamp: result.expiryTimestamp,
    activatedAt: new Date().toISOString(),
    clientTag,
    signature: keyString.split('-').slice(3).join('-'),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecord));

  const updatedStatus = getLicenseStatus();

  return {
    success: true,
    messageAr: `تم تفعيل البرنامج بنجاح! صالحة حتى: ${updatedStatus.expiryDateStr}`,
    messageEn: `License activated successfully! Valid until: ${updatedStatus.expiryDateStr}`,
    status: updatedStatus,
  };
}

/**
 * Primary Guard: Checks whether the merchant is authorized to create new invoices.
 * When expired, returns false. (All read-only actions remain enabled!)
 */
export function checkCanCreateInvoice(): boolean {
  const status = getLicenseStatus();
  return status.isActive;
}
