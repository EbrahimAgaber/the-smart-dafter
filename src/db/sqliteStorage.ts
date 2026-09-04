import { BusinessProfile, Party, Product, Transaction } from '../types';
import { idbStorage } from './indexedDbStorage';

const STORAGE_KEYS = {
  PARTIES: 'daftar_smart_parties_v1',
  PRODUCTS: 'daftar_smart_products_v1',
  TRANSACTIONS: 'daftar_smart_transactions_v1',
  BUSINESS_PROFILE: 'daftar_smart_profile_v1',
  LANGUAGE: 'daftar_smart_lang_v1',
};

export const defaultBusinessProfile: BusinessProfile = {
  name: '',
  phone: '',
  taxNumber: '',
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
      }
    } else {
      // DISTRIBUTOR
      if (tx.type === 'SUPPLY_CREDIT') {
        balance += (tx.totalAmount - tx.paidAmount);
      } else if (tx.type === 'PAYMENT_PAID') {
        balance -= tx.paidAmount;
      }
    }
  }

  // Prevent floating point discrepancies
  return Math.round(balance * 100) / 100;
}

export interface LedgerStoreSubscriber {
  (): void;
}

export class SQLiteLedgerStore {
  private static instance: SQLiteLedgerStore;

  private parties: Party[] = [];
  private products: Product[] = [];
  private transactions: Transaction[] = [];
  private profile: BusinessProfile = defaultBusinessProfile;
  private subscribers: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SQLiteLedgerStore {
    if (!SQLiteLedgerStore.instance) {
      SQLiteLedgerStore.instance = new SQLiteLedgerStore();
    }
    return SQLiteLedgerStore.instance;
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
    try {
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
      } else {
        // Initialize default seed data
        this.resetToDefaults();
      }

      // Reconcile and ensure all balances are deterministically accurate
      this.reconcileAllBalances();
    } catch (err) {
      console.error('Error loading SQLite ledger storage:', err);
      this.resetToDefaults();
    }

    // Also attempt to hydrate or migrate with IndexedDB in the background
    idbStorage.loadAll().then((idbData) => {
      if (idbData && (idbData.parties.length > 0 || idbData.transactions.length > 0)) {
        this.parties = idbData.parties;
        this.products = idbData.products;
        this.transactions = idbData.transactions;
        if (idbData.profile) this.profile = idbData.profile;
        this.reconcileAllBalances();
        this.saveToStorage(false);
      } else {
        // Seed IndexedDB from current state
        idbStorage.saveAll({
          parties: this.parties,
          products: this.products,
          transactions: this.transactions,
          profile: this.profile,
        }).catch(() => {});
      }
      this.notifySubscribers();
      this.notifyListeners();
    }).catch(() => {});
  }

  private saveToStorage(syncToIdb = true): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(this.parties));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(this.profile));
    } catch (err) {
      console.warn('localStorage save quota exceeded, safely persisting to IndexedDB:', err);
    }

    if (syncToIdb) {
      idbStorage.saveAll({
        parties: this.parties,
        products: this.products,
        transactions: this.transactions,
        profile: this.profile,
      }).catch((e) => console.error('Error saving to IndexedDB:', e));
    }
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
      txData.type === 'SALE_CREDIT'
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
        }
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
      const data = JSON.parse(jsonString);
      if (data.parties && Array.isArray(data.parties)) {
        this.parties = data.parties;
      }
      if (data.products && Array.isArray(data.products)) {
        this.products = data.products;
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        this.transactions = data.transactions;
      }
      if (data.profile) {
        this.profile = data.profile;
      }
      this.reconcileAllBalances();
      this.saveToStorage();
      return true;
    } catch (e) {
      console.error('Failed to import database JSON:', e);
      return false;
    }
  }
}
