import { BusinessProfile, Party, Product, Transaction, DailyClosingSession, DebtAgingBucket } from '../types';
import { idbStorage } from './indexedDbStorage';

const STORAGE_KEYS = {
  PARTIES: 'daftar_smart_parties_v1',
  PRODUCTS: 'daftar_smart_products_v1',
  TRANSACTIONS: 'daftar_smart_transactions_v1',
  BUSINESS_PROFILE: 'daftar_smart_profile_v1',
  LANGUAGE: 'daftar_smart_lang_v1',
  DAILY_CLOSINGS: 'daftar_smart_daily_closings_v1',
};

export const defaultBusinessProfile: BusinessProfile = {
  name: '',
  phone: '',
  taxNumber: '',
  crNumber: '',
  address: '',
  isVatEnabled: true,
  defaultTaxRate: 15,
  iban: '',
  bankName: '',
  logoBase64: '',
  invoiceFooterNote: '',
  currency: 'SAR',
};

const initialProducts: Product[] = [];

const initialParties: Party[] = [];

const initialTransactions: Transaction[] = [];

/**
 * Deterministic Ledger Balance Calculation:
 * Calculates the exact current balance for a party strictly from atomic transactions and opening balance.
 *
 * For Customers (عملاء):
 * - Initial: openingBalance
 * - SALE_CREDIT: increases balance by (totalAmount - paidAmount)
 * - PAYMENT_RECEIVED: decreases balance by paidAmount
 *
 * For Distributors (موردين):
 * - Initial: openingBalance
 * - SUPPLY_CREDIT: increases balance by (totalAmount - paidAmount) (amount we owe to distributor)
 * - PAYMENT_PAID: decreases balance by paidAmount (amount we paid to distributor)
 */
export function calculatePartyBalance(party: Party, partyTransactions: Transaction[]): number {
  let balance = Number(party.openingBalance) || 0;
  // Sort chronologically ascending
  const sorted = [...partyTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of sorted) {
    if (tx.isVoided) continue;
    if (party.type === 'CUSTOMER') {
      if (tx.type === 'SALE_CREDIT') {
        balance += (tx.totalAmount - tx.paidAmount);
      } else if (tx.type === 'PAYMENT_RECEIVED') {
        balance -= tx.paidAmount;
      } else if (tx.type === 'RETURN_SALE') {
        // Return decreases customer debt (reversal of unpaid portion or credit refund)
        balance -= (tx.totalAmount - tx.paidAmount);
      }
      // QUOTATION has 0 impact on accounting balance
    } else {
      // DISTRIBUTOR
      if (tx.type === 'SUPPLY_CREDIT') {
        balance += (tx.totalAmount - tx.paidAmount);
      } else if (tx.type === 'PAYMENT_PAID') {
        balance -= tx.paidAmount;
      }
    }
  }

  // Prevent floating point discrepancies and NaN anomalies
  if (isNaN(balance) || !isFinite(balance)) return 0;
  return Math.round(balance * 100) / 100;
}

export type StorageHealthLevel = 'healthy' | 'warning' | 'error';

export type StorageErrorCode =
  | 'NONE'
  | 'QUOTA_EXCEEDED'
  | 'STORAGE_UNAVAILABLE'
  | 'INDEXEDDB_ERROR'
  | 'CORRUPT_DATA'
  | 'DESERIALIZATION_FAILED'
  | 'WRITE_FAILED';

export interface StorageHealthStatus {
  status: StorageHealthLevel;
  activeEngine: 'DUAL_PERSISTENCE' | 'INDEXEDDB_ONLY' | 'LOCALSTORAGE_ONLY' | 'IN_MEMORY';
  localStorageOperational: boolean;
  indexedDbOperational: boolean;
  localStorageBytesUsed: number;
  estimatedQuotaBytes?: number;
  estimatedUsageBytes?: number;
  quotaUsagePercent?: number;
  partiesCount: number;
  transactionsCount: number;
  productsCount: number;
  lastSuccessfulSave: string | null;
  lastSuccessfulLoad: string | null;
  lastError: string | null;
  lastErrorCode: StorageErrorCode;
  consecutiveFailures: number;
  isReconciled: boolean;
  lastDiagnosticTimestamp?: string;
}

export interface StorageDiagnosticResult {
  timestamp: string;
  allPassed: boolean;
  localStorageTest: { passed: boolean; latencyMs: number; error?: string };
  indexedDbTest: { passed: boolean; latencyMs: number; error?: string };
  balanceReconciliationTest: { passed: boolean; discrepancyCount: number };
  storageUsage: { usedBytes: number; quotaBytes?: number; percent?: number };
  recommendation?: string;
}

export interface LedgerStoreSubscriber {
  (): void;
}

function calculateLocalStorageBytes(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    let bytes = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) {
        bytes += (key.length + item.length) * 2;
      }
    }
    return bytes;
  } catch {
    return 0;
  }
}

export class SQLiteLedgerStore {
  private static instance: SQLiteLedgerStore;

  private parties: Party[] = [];
  private products: Product[] = [];
  private transactions: Transaction[] = [];
  private dailyClosings: DailyClosingSession[] = [];
  private profile: BusinessProfile = defaultBusinessProfile;
  private subscribers: (() => void)[] = [];
  private onDataChangeCallback?: () => void;

  // Storage Health Audit Metrics
  private consecutiveFailures = 0;
  private lastSuccessfulSave: string | null = null;
  private lastSuccessfulLoad: string | null = null;
  private lastError: string | null = null;
  private lastErrorCode: StorageErrorCode = 'NONE';
  private lastDiagnosticTimestamp: string | null = null;
  private localStorageOperational = true;
  private indexedDbOperational = true;
  private cachedQuotaBytes?: number;
  private cachedUsageBytes?: number;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SQLiteLedgerStore {
    if (!SQLiteLedgerStore.instance) {
      SQLiteLedgerStore.instance = new SQLiteLedgerStore();
    }
    return SQLiteLedgerStore.instance;
  }

  public setOnDataChangeCallback(callback: () => void): void {
    this.onDataChangeCallback = callback;
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Error executing ledger store subscriber:', err);
      }
    });
  }

  private notifyListeners(): void {
    this.notifySubscribers();
  }

  private loadFromStorage(): void {
    let loadedFromLocalStorage = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedParties = localStorage.getItem(STORAGE_KEYS.PARTIES);
        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedProfile = localStorage.getItem(STORAGE_KEYS.BUSINESS_PROFILE);

        if (storedParties && storedProducts && storedTx) {
          this.parties = JSON.parse(storedParties);
          this.products = JSON.parse(storedProducts);
          this.transactions = JSON.parse(storedTx);
          if (storedProfile) {
            this.profile = JSON.parse(storedProfile);
          }
          const storedClosings = localStorage.getItem(STORAGE_KEYS.DAILY_CLOSINGS);
          if (storedClosings) {
            try {
              this.dailyClosings = JSON.parse(storedClosings);
            } catch (e) {
              console.warn('Error parsing daily closings:', e);
            }
          }
          loadedFromLocalStorage = true;
          this.localStorageOperational = true;
        } else {
          // Initialize default seed data
          this.resetToDefaults();
          loadedFromLocalStorage = true;
        }

        // Reconcile and ensure all balances are deterministically accurate
        this.reconcileAllBalances();
        this.lastSuccessfulLoad = new Date().toISOString();
      }
    } catch (err: any) {
      console.error('Error loading SQLite ledger from localStorage:', err);
      this.lastErrorCode = 'CORRUPT_DATA';
      this.lastError = err?.message || 'LocalStorage corruption detected; recovering...';
      this.localStorageOperational = false;
    }

    // Attempt hydration or automated recovery with IndexedDB in the background
    idbStorage.loadAll().then((idbData) => {
      if (idbData && (idbData.parties.length > 0 || idbData.transactions.length > 0)) {
        if (!loadedFromLocalStorage || this.transactions.length === 0) {
          // Rescue data from IndexedDB
          this.parties = idbData.parties;
          this.products = idbData.products;
          this.transactions = idbData.transactions;
          if (idbData.profile) this.profile = idbData.profile;
          this.reconcileAllBalances();
          this.saveToStorage(false);
          this.lastErrorCode = 'NONE';
          this.lastError = null;
        }
        this.indexedDbOperational = true;
      } else {
        // Seed IndexedDB from current state
        idbStorage.saveAll({
          parties: this.parties,
          products: this.products,
          transactions: this.transactions,
          profile: this.profile,
        }).then(() => {
          this.indexedDbOperational = true;
        }).catch(() => {
          this.indexedDbOperational = false;
        });
      }
      this.lastSuccessfulLoad = new Date().toISOString();
      this.notifySubscribers();
      this.notifyListeners();
    }).catch((err) => {
      console.warn('IndexedDB hydration failed:', err);
      this.indexedDbOperational = false;
    });
  }

  private saveToStorage(syncToIdb = true): void {
    let lsSuccess = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(this.parties));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
        localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(this.profile));
        localStorage.setItem(STORAGE_KEYS.DAILY_CLOSINGS, JSON.stringify(this.dailyClosings));
        this.localStorageOperational = true;
        lsSuccess = true;
        if (this.lastErrorCode === 'QUOTA_EXCEEDED' || this.lastErrorCode === 'WRITE_FAILED') {
          this.lastErrorCode = 'NONE';
          this.lastError = null;
        }
      }
    } catch (err: any) {
      const isQuota =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014;

      if (isQuota) {
        this.lastErrorCode = 'QUOTA_EXCEEDED';
        this.lastError = 'LocalStorage storage quota exceeded; preserved in persistent IndexedDB';
        console.warn('LocalStorage save quota exceeded, safely persisting to IndexedDB:', err);
      } else {
        this.lastErrorCode = 'WRITE_FAILED';
        this.lastError = err?.message || 'LocalStorage write error';
        this.localStorageOperational = false;
        console.error('LocalStorage write error:', err);
      }
    }

    if (syncToIdb) {
      idbStorage.saveAll({
        parties: this.parties,
        products: this.products,
        transactions: this.transactions,
        profile: this.profile,
      }).then((success) => {
        if (success) {
          this.indexedDbOperational = true;
          this.consecutiveFailures = 0;
          this.lastSuccessfulSave = new Date().toISOString();
          if (this.lastErrorCode !== 'QUOTA_EXCEEDED') {
            this.lastErrorCode = 'NONE';
            this.lastError = null;
          }
        } else {
          this.indexedDbOperational = false;
          if (!lsSuccess) {
            this.consecutiveFailures++;
            this.lastErrorCode = 'INDEXEDDB_ERROR';
            this.lastError = 'IndexedDB transaction failed';
          }
        }
      }).catch((e) => {
        console.error('Error saving to IndexedDB:', e);
        this.indexedDbOperational = false;
        if (!lsSuccess) {
          this.consecutiveFailures++;
          this.lastErrorCode = 'INDEXEDDB_ERROR';
          this.lastError = e?.message || 'IndexedDB transaction error';
        }
      });
    }

    if (lsSuccess) {
      this.consecutiveFailures = 0;
      this.lastSuccessfulSave = new Date().toISOString();
    }

    if (this.onDataChangeCallback) {
      try {
        this.onDataChangeCallback();
      } catch (err) {
        console.warn('Error in ledger store data change hook:', err);
      }
    }
  }

  /**
   * Returns instantaneous Storage Health snapshot.
   */
  public getStorageHealth(): StorageHealthStatus {
    const bytesUsed = calculateLocalStorageBytes();
    const hasLS = this.localStorageOperational;
    const hasIDB = this.indexedDbOperational;

    let activeEngine: StorageHealthStatus['activeEngine'] = 'DUAL_PERSISTENCE';
    if (hasLS && hasIDB) {
      activeEngine = 'DUAL_PERSISTENCE';
    } else if (hasIDB) {
      activeEngine = 'INDEXEDDB_ONLY';
    } else if (hasLS) {
      activeEngine = 'LOCALSTORAGE_ONLY';
    } else {
      activeEngine = 'IN_MEMORY';
    }

    let status: StorageHealthLevel = 'healthy';
    if (this.consecutiveFailures > 0 || (!hasLS && !hasIDB)) {
      status = 'error';
    } else if (
      this.lastErrorCode === 'QUOTA_EXCEEDED' ||
      !hasLS ||
      !hasIDB ||
      (this.cachedQuotaBytes && this.cachedUsageBytes && (this.cachedUsageBytes / this.cachedQuotaBytes) > 0.85)
    ) {
      status = 'warning';
    }

    let quotaPercent: number | undefined;
    if (this.cachedQuotaBytes && this.cachedUsageBytes && this.cachedQuotaBytes > 0) {
      quotaPercent = Math.round((this.cachedUsageBytes / this.cachedQuotaBytes) * 100);
    }

    return {
      status,
      activeEngine,
      localStorageOperational: this.localStorageOperational,
      indexedDbOperational: this.indexedDbOperational,
      localStorageBytesUsed: bytesUsed,
      estimatedQuotaBytes: this.cachedQuotaBytes,
      estimatedUsageBytes: this.cachedUsageBytes,
      quotaUsagePercent: quotaPercent,
      partiesCount: this.parties.filter((p) => !p.isDeleted).length,
      transactionsCount: this.transactions.filter((t) => !t.isVoided).length,
      productsCount: this.products.filter((p) => !p.isDeleted).length,
      lastSuccessfulSave: this.lastSuccessfulSave,
      lastSuccessfulLoad: this.lastSuccessfulLoad,
      lastError: this.lastError,
      lastErrorCode: this.lastErrorCode,
      consecutiveFailures: this.consecutiveFailures,
      isReconciled: true,
      lastDiagnosticTimestamp: this.lastDiagnosticTimestamp || undefined,
    };
  }

  /**
   * Refreshes navigator quota estimate and returns fresh health status.
   */
  public async refreshStorageHealth(): Promise<StorageHealthStatus> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) this.cachedQuotaBytes = est.quota;
        if (est.usage) this.cachedUsageBytes = est.usage;
      } catch {
        // Fallback gracefully
      }
    }
    return this.getStorageHealth();
  }

  /**
   * Runs active diagnostics: probes localStorage, IndexedDB, and balance reconciliation.
   */
  public async runStorageDiagnostics(): Promise<StorageDiagnosticResult> {
    const timestamp = new Date().toISOString();
    this.lastDiagnosticTimestamp = timestamp;

    // 1. LocalStorage Probe
    let lsPassed = false;
    let lsLatency = 0;
    let lsError: string | undefined;
    const lsStart = Date.now();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probeKey = '__storage_diagnostic_probe__';
        const probeVal = `test_${Date.now()}`;
        localStorage.setItem(probeKey, probeVal);
        const readVal = localStorage.getItem(probeKey);
        localStorage.removeItem(probeKey);
        if (readVal === probeVal) {
          lsPassed = true;
          this.localStorageOperational = true;
        } else {
          lsError = 'LocalStorage probe readback mismatch';
          this.localStorageOperational = false;
        }
      } else {
        lsError = 'window.localStorage is undefined or disabled';
        this.localStorageOperational = false;
      }
    } catch (e: any) {
      lsError = e?.message || 'LocalStorage access exception';
      this.localStorageOperational = false;
    }
    lsLatency = Math.max(1, Date.now() - lsStart);

    // 2. IndexedDB Probe
    const idbResult = await idbStorage.testHealth();
    this.indexedDbOperational = idbResult.operational;

    // 3. Ledger Balance Reconciliation Integrity Test
    let discrepancyCount = 0;
    for (const p of this.parties) {
      if (p.isDeleted) continue;
      const partyTxs = this.transactions.filter((t) => t.partyId === p.id);
      const computed = calculatePartyBalance(p, partyTxs);
      if (Math.abs(computed - p.currentBalance) > 0.009) {
        discrepancyCount++;
      }
    }

    // 4. Storage Quota Check
    await this.refreshStorageHealth();
    const usedBytes = calculateLocalStorageBytes();

    const allPassed = lsPassed && idbResult.operational && discrepancyCount === 0;

    let recommendation: string | undefined;
    if (!allPassed) {
      if (!lsPassed && !idbResult.operational) {
        recommendation = 'Critical: Both storage engines are unreachable. Export backup immediately.';
      } else if (!lsPassed) {
        recommendation = 'LocalStorage blocked or quota exceeded. Data is safely stored in IndexedDB.';
      } else if (!idbResult.operational) {
        recommendation = 'IndexedDB unavailable. Data is stored in LocalStorage.';
      } else if (discrepancyCount > 0) {
        recommendation = 'Minor balance discrepancies detected; run full balance reconciliation.';
      }
    }

    this.notifySubscribers();

    return {
      timestamp,
      allPassed,
      localStorageTest: { passed: lsPassed, latencyMs: lsLatency, error: lsError },
      indexedDbTest: { passed: idbResult.operational, latencyMs: idbResult.latencyMs, error: idbResult.error },
      balanceReconciliationTest: { passed: discrepancyCount === 0, discrepancyCount },
      storageUsage: {
        usedBytes,
        quotaBytes: this.cachedQuotaBytes,
        percent: this.cachedQuotaBytes && this.cachedUsageBytes ? Math.round((this.cachedUsageBytes / this.cachedQuotaBytes) * 100) : undefined,
      },
      recommendation,
    };
  }

  /**
   * Resets error flags and re-attempts synchronization.
   */
  public clearStorageError(): void {
    this.consecutiveFailures = 0;
    this.lastError = null;
    this.lastErrorCode = 'NONE';
    this.notifySubscribers();
  }

  /**
   * Forces manual sync to IndexedDB
   */
  public async forceSyncToIndexedDB(): Promise<boolean> {
    const success = await idbStorage.saveAll({
      parties: this.parties,
      products: this.products,
      transactions: this.transactions,
      profile: this.profile,
    });
    if (success) {
      this.indexedDbOperational = true;
      this.consecutiveFailures = 0;
      this.lastSuccessfulSave = new Date().toISOString();
    }
    this.notifySubscribers();
    return success;
  }

  public resetToDefaults(): void {
    this.parties = [...initialParties];
    this.products = [...initialProducts];
    this.transactions = [...initialTransactions];
    this.profile = { ...defaultBusinessProfile };
    this.reconcileAllBalances();
    this.saveToStorage();
  }

  public clearToFreshStart(newProfile?: Partial<BusinessProfile>): void {
    this.parties = [];
    this.products = [];
    this.transactions = [];
    if (newProfile) {
      this.profile = {
        ...defaultBusinessProfile,
        ...newProfile,
      };
    }
    this.saveToStorage();
  }

  public reconcileAllBalances(): void {
    this.parties = this.parties.map((p) => {
      const partyTxs = this.transactions.filter((t) => t.partyId === p.id);
      const computedBalance = calculatePartyBalance(p, partyTxs);
      return {
        ...p,
        currentBalance: computedBalance,
      };
    });
  }

  // --- Parties ---
  public getParties(): Party[] {
    return [...this.parties].filter(p => !p.isDeleted);
  }

  public getPartyById(id: string): Party | undefined {
    return this.parties.find((p) => p.id === id);
  }

  public addParty(party: Omit<Party, 'id' | 'currentBalance' | 'createdAt'>): Party {
    const opening = Number(party.openingBalance) || 0;
    const newParty: Party = {
      ...party,
      id: `party-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      openingBalance: opening,
      currentBalance: opening,
      createdAt: new Date().toISOString(),
    };
    this.parties.push(newParty);
    this.saveToStorage();
    return newParty;
  }

  public updateParty(id: string, updates: Partial<Omit<Party, 'id' | 'createdAt'>>): Party | undefined {
    const idx = this.parties.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.parties[idx] = {
      ...this.parties[idx],
      ...updates,
    };
    this.reconcileAllBalances();
    this.saveToStorage();
    return this.parties[idx];
  }

  public deleteParty(id: string): boolean {
    const idx = this.parties.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.parties[idx].isDeleted = true;
    this.saveToStorage();
    return true;
  }

  // --- Transactions ---
  public getTransactions(): Transaction[] {
    return [...this.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getTransactionsByParty(partyId: string): Transaction[] {
    return this.transactions
      .filter((t) => t.partyId === partyId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public addTransaction(
    txData: Omit<Transaction, 'id' | 'receiptNumber'> & { customReceiptNumber?: string }
  ): Transaction {
    const party = this.getPartyById(txData.partyId);
    if (!party) {
      throw new Error('Target party does not exist');
    }

    const prefix =
      txData.type === 'QUOTATION'
        ? 'QOT'
        : txData.type === 'RETURN_SALE'
        ? 'RET'
        : txData.type === 'SALE_CREDIT'
        ? 'INV'
        : txData.type === 'SUPPLY_CREDIT'
        ? 'SUP'
        : txData.type === 'PAYMENT_RECEIVED'
        ? 'REC'
        : 'PAY';

    const year = new Date().getFullYear();
    const count = this.transactions.filter((t) => t.type === txData.type).length + 1;
    const generatedReceipt = `${prefix}-${year}-${String(count).padStart(4, '0')}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partyId: txData.partyId,
      type: txData.type,
      date: txData.date || new Date().toISOString(),
      items: txData.items || [],
      subtotalBeforeTax: txData.subtotalBeforeTax,
      discountAmount: txData.discountAmount,
      taxRate: txData.taxRate,
      taxAmount: txData.taxAmount,
      totalAmount: Math.max(0, txData.totalAmount),
      paidAmount: Math.max(0, txData.paidAmount),
      remainingBalanceDelta: txData.remainingBalanceDelta,
      notes: txData.notes || '',
      receiptNumber: txData.customReceiptNumber || generatedReceipt,
      paymentMethod: txData.paymentMethod || 'CASH',
      quotationValidityDays: txData.quotationValidityDays,
      quotationTerms: txData.quotationTerms,
      isQuotationConverted: txData.isQuotationConverted,
      convertedTransactionId: txData.convertedTransactionId,
      dueDate: txData.dueDate,
      supplierInvoiceAttachment: txData.supplierInvoiceAttachment,
    };

    this.transactions.push(newTx);
    
    // Incrementally update balance instead of full reconciliation for performance
    const pIdx = this.parties.findIndex(p => p.id === txData.partyId);
    if (pIdx !== -1) {
      const p = this.parties[pIdx];
      if (p.type === 'CUSTOMER') {
        if (newTx.type === 'SALE_CREDIT') {
          p.currentBalance += (newTx.totalAmount - newTx.paidAmount);
        } else if (newTx.type === 'PAYMENT_RECEIVED') {
          p.currentBalance -= newTx.paidAmount;
        } else if (newTx.type === 'RETURN_SALE') {
          p.currentBalance -= (newTx.totalAmount - newTx.paidAmount);
        }
        // QUOTATION has 0 impact on customer balance
      } else {
        if (newTx.type === 'SUPPLY_CREDIT') {
          p.currentBalance += (newTx.totalAmount - newTx.paidAmount);
        } else if (newTx.type === 'PAYMENT_PAID') {
          p.currentBalance -= newTx.paidAmount;
        }
      }
      p.currentBalance = Math.round(p.currentBalance * 100) / 100;
    }

    this.saveToStorage();
    return newTx;
  }

  public voidTransaction(id: string, reason = 'إلغاء القيد بواسطة المستخدم'): boolean {
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.transactions[idx] = {
      ...this.transactions[idx],
      isVoided: true,
      voidedAt: new Date().toISOString(),
      voidReason: reason,
    };
    const party = this.parties.find(p => p.id === this.transactions[idx].partyId);
    if (party) {
      party.currentBalance = calculatePartyBalance(party, this.getTransactionsByParty(party.id));
    }
    this.saveToStorage();
    return true;
  }

  /**
   * Validates whether an invoice or document can be modified:
   * Modifications are strictly allowed for 5 days after issuance and if not voided.
   */
  public canModifyInvoice(tx: Transaction): {
    allowed: boolean;
    reason?: string;
    remainingDays?: number;
    remainingHours?: number;
  } {
    if (!tx) return { allowed: false, reason: 'الفاتورة غير موجودة' };
    if (tx.isVoided) {
      return { allowed: false, reason: 'لا يمكن تعديل فاتورة ملغاة ومبطلة' };
    }
    const txTime = new Date(tx.date).getTime();
    if (isNaN(txTime)) {
      return { allowed: false, reason: 'تاريخ الفاتورة غير صالح' };
    }
    const now = Date.now();
    const elapsedMs = now - txTime;
    const maxMs = 5 * 24 * 60 * 60 * 1000; // 5 calendar days (120 hours)
    if (elapsedMs > maxMs) {
      return {
        allowed: false,
        reason: 'انتهت مهلة التعديل (مسموح بتعديل الفاتورة خلال 5 أيام فقط من تاريخ إصدارها)',
        remainingDays: 0,
        remainingHours: 0,
      };
    }
    const remainingMs = Math.max(0, maxMs - elapsedMs);
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingDays = Math.ceil(remainingHours / 24);
    return {
      allowed: true,
      remainingDays,
      remainingHours,
    };
  }

  /**
   * Modifies an existing invoice within the 5-day grace period,
   * updates line items and totals, and recalculates the party balance.
   */
  public updateTransaction(
    id: string,
    updatedData: Partial<Transaction>
  ): Transaction {
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error('Transaction not found');
    }
    const existing = this.transactions[idx];
    const check = this.canModifyInvoice(existing);
    if (!check.allowed) {
      throw new Error(check.reason || 'Cannot modify this invoice (5-day window expired or voided)');
    }

    const updatedTx: Transaction = {
      ...existing,
      ...updatedData,
      id: existing.id,
      receiptNumber: existing.receiptNumber, // Retain official invoice sequence number
      partyId: updatedData.partyId || existing.partyId,
      type: updatedData.type || existing.type,
      date: existing.date, // Retain original issue timestamp
      updatedAt: new Date().toISOString(),
      isModified: true,
    };

    this.transactions[idx] = updatedTx;

    // Recalculate party balance
    const party = this.parties.find((p) => p.id === updatedTx.partyId);
    if (party) {
      party.currentBalance = calculatePartyBalance(party, this.getTransactionsByParty(party.id));
    }
    // If party was changed, recalculate previous party balance too
    if (updatedData.partyId && updatedData.partyId !== existing.partyId) {
      const oldParty = this.parties.find((p) => p.id === existing.partyId);
      if (oldParty) {
        oldParty.currentBalance = calculatePartyBalance(oldParty, this.getTransactionsByParty(oldParty.id));
      }
    }

    this.saveToStorage();
    return updatedTx;
  }

  public convertQuotationToInvoice(quotationId: string): Transaction {
    const qIdx = this.transactions.findIndex((t) => t.id === quotationId);
    if (qIdx === -1) {
      throw new Error('Quotation not found');
    }
    const quotation = this.transactions[qIdx];
    if (quotation.type !== 'QUOTATION') {
      throw new Error('Transaction is not a quotation');
    }
    if (quotation.isQuotationConverted) {
      throw new Error('Quotation has already been converted to an invoice');
    }

    // Create the new SALE_CREDIT transaction
    const newInvoice = this.addTransaction({
      partyId: quotation.partyId,
      type: 'SALE_CREDIT',
      date: new Date().toISOString(),
      items: quotation.items || [],
      subtotalBeforeTax: quotation.subtotalBeforeTax,
      discountAmount: quotation.discountAmount,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      paidAmount: 0, // Unpaid credit invoice by default
      remainingBalanceDelta: quotation.totalAmount,
      notes: quotation.notes
        ? `${quotation.notes} (محولة من عرض سعر #${quotation.receiptNumber})`
        : `محولة من عرض سعر #${quotation.receiptNumber}`,
      paymentMethod: quotation.paymentMethod || 'CASH',
    });

    // Mark quotation as converted
    this.transactions[qIdx] = {
      ...quotation,
      isQuotationConverted: true,
      convertedTransactionId: newInvoice.id,
    };
    this.saveToStorage();

    return newInvoice;
  }

  public deleteTransaction(id: string): boolean {
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const tx = this.transactions[idx];
    this.transactions.splice(idx, 1);
    
    const party = this.parties.find(p => p.id === tx.partyId);
    if (party) {
      party.currentBalance = calculatePartyBalance(party, this.getTransactionsByParty(party.id));
    }
    
    this.saveToStorage();
    return true;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.products].filter(p => !p.isDeleted);
  }

  public addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    this.products.push(newProduct);
    this.saveToStorage();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Product | undefined {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.products[idx] = { ...this.products[idx], ...updates };
    this.saveToStorage();
    return this.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.products[idx].isDeleted = true;
    this.saveToStorage();
    return true;
  }

  // --- Profile ---
  public getProfile(): BusinessProfile {
    return { ...this.profile };
  }

  public updateProfile(updates: Partial<BusinessProfile>): BusinessProfile {
    this.profile = { ...this.profile, ...updates };
    this.saveToStorage();
    return { ...this.profile };
  }

  // --- Summary Metrics for Dashboard ---
  public getDashboardMetrics() {
    const customers = this.parties.filter((p) => !p.isDeleted && p.type === 'CUSTOMER');
    const distributors = this.parties.filter((p) => !p.isDeleted && p.type === 'DISTRIBUTOR');

    // Total Money Owed to Me (مستحقات - له): Sum of positive active customer balances
    const totalOwedToMe = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);

    // Total Money I Owe (التزامات - عليه): Sum of positive active distributor balances
    const totalIOwe = distributors.reduce((sum, d) => sum + Math.max(0, d.currentBalance), 0);

    // Cash Collected Today: Payments received from customers today + upfront cash paid in sales today
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = this.transactions.filter(
      (t) => !t.isVoided && t.date.startsWith(today)
    );

    const cashCollectedToday = todaysTransactions
      .filter((t) => t.type === 'PAYMENT_RECEIVED' || (t.type === 'SALE_CREDIT' && t.paidAmount > 0))
      .reduce((sum, t) => sum + t.paidAmount, 0);

    return {
      totalOwedToMe: Math.round(totalOwedToMe * 100) / 100,
      totalIOwe: Math.round(totalIOwe * 100) / 100,
      cashCollectedToday: Math.round(cashCollectedToday * 100) / 100,
      netWorkingCapital: Math.round((totalOwedToMe - totalIOwe) * 100) / 100,
    };
  }

  // --- SQLite Export / Backup ---
  public exportDataJSON(): string {
    return JSON.stringify(
      {
        version: '1.0',
        engine: 'SQLite-Relational-Virtual',
        exportedAt: new Date().toISOString(),
        profile: this.profile,
        parties: this.parties,
        products: this.products,
        transactions: this.transactions,
      },
      null,
      2
    );
  }

  public importDataJSON(jsonString: string): boolean {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        this.lastErrorCode = 'DESERIALIZATION_FAILED';
        this.lastError = 'Invalid JSON: payload is empty or not a string';
        this.notifySubscribers();
        return false;
      }
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        this.lastErrorCode = 'DESERIALIZATION_FAILED';
        this.lastError = 'Invalid backup structure: root must be an object';
        this.notifySubscribers();
        return false;
      }
      if (data.parties && Array.isArray(data.parties)) {
        this.parties = data.parties;
      }
      if (data.products && Array.isArray(data.products)) {
        this.products = data.products;
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        this.transactions = data.transactions;
      }
      if (data.profile && typeof data.profile === 'object') {
        this.profile = { ...defaultBusinessProfile, ...data.profile };
      }
      this.reconcileAllBalances();
      this.saveToStorage();
      this.lastErrorCode = 'NONE';
      this.lastError = null;
      this.notifySubscribers();
      return true;
    } catch (e: any) {
      console.error('Failed to import database JSON:', e);
      this.lastErrorCode = 'DESERIALIZATION_FAILED';
      this.lastError = e?.message || 'Failed to parse JSON backup payload';
      this.notifySubscribers();
      return false;
    }
  }

  // --- Daily Cash Register Reconciliation (قفل الصندوق / Z-Report) ---
  public getDailyClosingSessions(): DailyClosingSession[] {
    return [...this.dailyClosings].sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }

  public saveDailyClosingSession(session: DailyClosingSession): void {
    const existingIndex = this.dailyClosings.findIndex((s) => s.id === session.id || s.date === session.date);
    if (existingIndex >= 0) {
      this.dailyClosings[existingIndex] = session;
    } else {
      this.dailyClosings.unshift(session);
    }
    this.saveToStorage();
    this.notifySubscribers();
  }

  // --- Debt Aging Analysis (أعمار الديون) ---
  public calculateDebtAging(partyId?: string): DebtAgingBucket {
    const now = new Date().getTime();
    const bucket: DebtAgingBucket = {
      current: 0,
      overdue30: 0,
      overdue60: 0,
      overdue90Plus: 0,
      total: 0,
    };

    // Filter relevant credit sales with unpaid portions
    const activeDebts = this.transactions.filter((tx) => {
      if (tx.isVoided || tx.type === 'QUOTATION') return false;
      if (tx.type !== 'SALE_CREDIT') return false;
      if (partyId && tx.partyId !== partyId) return false;
      const unpaid = tx.totalAmount - tx.paidAmount;
      return unpaid > 0;
    });

    for (const tx of activeDebts) {
      const unpaid = tx.totalAmount - tx.paidAmount;
      const refDate = tx.dueDate ? new Date(tx.dueDate).getTime() : new Date(tx.date).getTime();
      const diffDays = Math.max(0, Math.floor((now - refDate) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 30) {
        bucket.current += unpaid;
      } else if (diffDays <= 60) {
        bucket.overdue30 += unpaid;
      } else if (diffDays <= 90) {
        bucket.overdue60 += unpaid;
      } else {
        bucket.overdue90Plus += unpaid;
      }
      bucket.total += unpaid;
    }

    bucket.current = Math.round(bucket.current * 100) / 100;
    bucket.overdue30 = Math.round(bucket.overdue30 * 100) / 100;
    bucket.overdue60 = Math.round(bucket.overdue60 * 100) / 100;
    bucket.overdue90Plus = Math.round(bucket.overdue90Plus * 100) / 100;
    bucket.total = Math.round(bucket.total * 100) / 100;

    return bucket;
  }

  // --- Party Merging & Duplicate Resolution (دمج الحسابات) ---
  public mergeParties(sourcePartyId: string, targetPartyId: string): boolean {
    if (!sourcePartyId || !targetPartyId || sourcePartyId === targetPartyId) return false;

    const sourceParty = this.parties.find((p) => p.id === sourcePartyId);
    const targetParty = this.parties.find((p) => p.id === targetPartyId);
    if (!sourceParty || !targetParty) return false;

    // 1. Reassign all transactions from source to target
    this.transactions = this.transactions.map((tx) => {
      if (tx.partyId === sourcePartyId) {
        return {
          ...tx,
          partyId: targetPartyId,
          notes: tx.notes ? `${tx.notes} (مدمج من: ${sourceParty.name})` : `مدمج من: ${sourceParty.name}`,
        };
      }
      return tx;
    });

    // 2. Transfer opening balance
    targetParty.openingBalance = (targetParty.openingBalance || 0) + (sourceParty.openingBalance || 0);

    // 3. Append notes
    targetParty.notes = `${targetParty.notes || ''}\n[تم دمج حساب ${sourceParty.name} (${sourceParty.phone || ''}) بتاريخ ${new Date().toISOString().split('T')[0]}]`.trim();

    // 4. Mark source party as deleted
    sourceParty.isDeleted = true;
    sourceParty.notes = `${sourceParty.notes || ''}\n[حساب مدمج في: ${targetParty.name}]`.trim();

    // 5. Recalculate deterministic balances
    this.reconcileAllBalances();
    this.saveToStorage();
    this.notifySubscribers();
    return true;
  }

  // --- CSV / Excel Portability (with UTF-8 BOM) ---
  public exportPartiesCSV(): string {
    const BOM = '\uFEFF';
    const headers = ['المعرف', 'النوع', 'الاسم', 'رقم الجوال', 'الحي_المنطقة', 'العنوان', 'الرصيد_الحالي', 'الرصيد_الافتتاحي', 'ملاحظات'];
    const rows = this.parties
      .filter((p) => !p.isDeleted)
      .map((p) => [
        `"${p.id}"`,
        `"${p.type === 'CUSTOMER' ? 'عميل' : 'مورد'}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        `"${(p.region || '').replace(/"/g, '""')}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        p.currentBalance.toFixed(2),
        (p.openingBalance || 0).toFixed(2),
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  public exportProductsCSV(): string {
    const BOM = '\uFEFF';
    const headers = ['المعرف', 'اسم الصنف', 'الوحدة', 'سعر البيع الافتراضي', 'سعر التكلفة الافتراضي', 'الباركود'];
    const rows = this.products
      .filter((p) => !p.isDeleted)
      .map((p) => [
        `"${p.id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.unit || '').replace(/"/g, '""')}"`,
        p.defaultSalePrice.toFixed(2),
        p.defaultCostPrice.toFixed(2),
        `"${(p.barcode || '').replace(/"/g, '""')}"`,
      ]);

    return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  public importPartiesCSV(csvContent: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;
    try {
      const clean = csvContent.replace(/^\uFEFF/, '').trim();
      const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return { imported: 0, errors: ['الملف فارغ أو لا يحتوي على بيانات'] };

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Parse CSV line taking quotes into account
        const parts: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            if (inQuotes && line[c + 1] === '"') {
              curr += '"';
              c++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            parts.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        parts.push(curr.trim());

        const name = parts[2] || parts[0] || '';
        if (!name) continue;

        const phone = parts[3] || parts[1] || '';
        const region = parts[4] || '';
        const address = parts[5] || '';
        const opening = parseFloat(parts[7] || '0') || 0;
        const notes = parts[8] || '';
        const typeStr = (parts[1] || '').toLowerCase();
        const type: 'CUSTOMER' | 'DISTRIBUTOR' = typeStr.includes('مورد') || typeStr.includes('distributor') ? 'DISTRIBUTOR' : 'CUSTOMER';

        this.addParty({
          name,
          phone,
          region: region || undefined,
          address,
          openingBalance: opening,
          notes,
          type,
        });
        count++;
      }
    } catch (err: any) {
      errors.push(err?.message || 'خطأ أثناء تحليل ملف CSV');
    }
    return { imported: count, errors };
  }

  public importProductsCSV(csvContent: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;
    try {
      const clean = csvContent.replace(/^\uFEFF/, '').trim();
      const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return { imported: 0, errors: ['الملف فارغ أو لا يحتوي على بيانات'] };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"') {
            if (inQuotes && line[c + 1] === '"') {
              curr += '"';
              c++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            parts.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        parts.push(curr.trim());

        const name = parts[1] || parts[0] || '';
        if (!name) continue;

        const unit = parts[2] || 'قطعة';
        const salePrice = parseFloat(parts[3] || '0') || 0;
        const costPrice = parseFloat(parts[4] || '0') || 0;
        const barcode = parts[5] || '';

        this.addProduct({
          name,
          unit,
          defaultSalePrice: salePrice,
          defaultCostPrice: costPrice,
          barcode,
        });
        count++;
      }
    } catch (err: any) {
      errors.push(err?.message || 'خطأ أثناء تحليل ملف CSV');
    }
    return { imported: count, errors };
  }
}
