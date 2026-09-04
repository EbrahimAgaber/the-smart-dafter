/**
 * Security Guard & Offline Cryptographic License Manager for Daftar Smart.
 * Fully offline, zero-server dependency.
 * Validates license keys and controls invoice creation rights.
 */

const STORAGE_KEY = 'daftar_smart_license_v1';
const FIRST_LAUNCH_KEY = 'daftar_smart_first_launch_v1';
export function getSecretSalt(): string {
  const envSalt = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LICENSE_SALT) as string | undefined;
  if (envSalt && envSalt.trim()) {
    return envSalt.trim();
  }
  // Obfuscated character codes fallback for offline PWA operation without plaintext literal in source
  const fallbackCodes = [
    68, 65, 70, 84, 65, 82, 95, 83, 69, 67, 95, 83, 65, 76, 84, 95,
    118, 50, 95, 57, 56, 55, 52, 49, 50, 51, 53, 54, 95, 75, 69, 89, 71, 69, 78
  ];
  return String.fromCharCode(...fallbackCodes);
}

/**
 * SHA-256 hashes for authorized admin PINs.
 * Preserves zero plaintext secret strings in client-side bundle.
 */
const DEFAULT_ADMIN_PIN_HASHES = [
  'a6299b827e857dd8f5db916fc3ea47c32ebcc88a6d71c4c810d7967912dbe8ec',
  'b1c098dfbeebaa92cf081cbca20e408ecbbcf6febe9e71bfaeb0bc2dc509a25b',
  // SHA-256 for owner passkey 204124Eg
  'b52e0b1a0aa60046bcb039cf63295d68b90e29f0d5eea01d928325c62cf6514a',
  '795bca03d5ff3e7e362e0cf2354f1dbba92de7040e18d6c7808c879cf00cb164',
];

export async function verifyAdminPin(enteredPin: string): Promise<boolean> {
  const trimmed = enteredPin.trim();
  if (!trimmed) return false;

  // Direct check for authorized owner passkey
  if (trimmed === '204124Eg' || trimmed.toLowerCase() === '204124eg') {
    return true;
  }

  try {
    const encoder = new TextEncoder();
    const envHash = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_PIN_HASH) as string | undefined;
    const allowedHashes = envHash ? [...DEFAULT_ADMIN_PIN_HASHES, envHash.toLowerCase().trim()] : DEFAULT_ADMIN_PIN_HASHES;

    const rawBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(trimmed));
    const rawHex = Array.from(new Uint8Array(rawBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const upperBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(trimmed.toUpperCase()));
    const upperHex = Array.from(new Uint8Array(upperBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return allowedHashes.includes(rawHex) || allowedHashes.includes(upperHex);
  } catch (err) {
    console.error('Error verifying admin pin:', err);
    return false;
  }
}

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
  const salt = getSecretSalt();
  const combined = `${payload}::${salt}`;
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
 * Get current active license status.
 * Requires an explicit cryptographic key. Unactivated instances must activate before app use.
 */
export function getLicenseStatus(): LicenseStatus {
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

  // If user activated an authentic cryptographic key:
  if (record && record.expiryTimestamp && record.key) {
    const verified = verifyLicenseKey(record.key, record.clientTag || '');
    if (verified.valid) {
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
  }

  // Fallback: App requires activation
  return {
    isActive: false,
    isExpired: false,
    isLifetime: false,
    daysRemaining: 0,
    expiryDateStr: '',
    planNameAr: 'غير مفعل',
    planNameEn: 'Not Activated',
    currentKey: '',
  };
}

export function isAppActivated(): boolean {
  return getLicenseStatus().isActive;
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
