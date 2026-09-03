import { BusinessProfile, Party, Product, Transaction } from '../types';

const STORAGE_KEYS = {
  PARTIES: 'daftar_smart_parties_v1',
  PRODUCTS: 'daftar_smart_products_v1',
  TRANSACTIONS: 'daftar_smart_transactions_v1',
  BUSINESS_PROFILE: 'daftar_smart_profile_v1',
  LANGUAGE: 'daftar_smart_lang_v1',
};

export const defaultBusinessProfile: BusinessProfile = {
  name: 'مؤسسة النور للتجارة والتوزيع',
  phone: '+966 50 123 4567',
  taxNumber: '301294819200003',
  iban: 'SA44 8000 0123 6080 1012 3456',
  bankName: 'مصرف الراجحي - Al Rajhi Bank',
  logoBase64: '',
  invoiceFooterNote: 'البضاعة المباعة تخضع لشروط السداد المعتمدة في السجل التجاري. نرجو إرسال إشعار التحويل البنكي فور السداد.',
  currency: 'SAR',
};

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'أرز بسمتي كلاسيك (شوال 10 كجم)',
    unit: 'كيس',
    defaultSalePrice: 85.0,
    defaultCostPrice: 68.0,
    barcode: '6281001001',
  },
  {
    id: 'prod-2',
    name: 'زيت دوار الشمس نقي (كرتون 4 × 2.9 لتر)',
    unit: 'كرتون',
    defaultSalePrice: 110.0,
    defaultCostPrice: 92.0,
    barcode: '6281001002',
  },
  {
    id: 'prod-3',
    name: 'حليب كامل الدسم طويل الأجل (كرتون 12 لتر)',
    unit: 'كرتون',
    defaultSalePrice: 64.0,
    defaultCostPrice: 52.0,
    barcode: '6281001003',
  },
  {
    id: 'prod-4',
    name: 'سكر أبيض ناعم (شوال 5 كجم)',
    unit: 'كيس',
    defaultSalePrice: 24.5,
    defaultCostPrice: 19.0,
    barcode: '6281001004',
  },
  {
    id: 'prod-5',
    name: 'مياه شرب معبأة (كرتون 40 × 330 مل)',
    unit: 'كرتون',
    defaultSalePrice: 16.0,
    defaultCostPrice: 12.5,
    barcode: '6281001005',
  },
  {
    id: 'prod-6',
    name: 'شاي أسود فرط فاخر (علبة 400 جم)',
    unit: 'علبة',
    defaultSalePrice: 22.0,
    defaultCostPrice: 16.5,
    barcode: '6281001006',
  },
];

const initialParties: Party[] = [
  {
    id: 'party-cust-1',
    type: 'CUSTOMER',
    name: 'بقالة الأمل - خالد العتيبي',
    phone: '+966 55 441 2389',
    address: 'الرياض - حي السليمانية - شارع الستين',
    notes: 'عميل منتظم، السداد أسبوعي كل خميس',
    currentBalance: 1450.0,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'party-cust-2',
    type: 'CUSTOMER',
    name: 'سوبرماركت الرياض الحديث - أبو فهد',
    phone: '+966 54 887 9123',
    address: 'الرياض - حي الملز - مقابل الحديقة',
    notes: 'طلبيات كبيرة، يفضل سندات إلكترونية عبر الواتساب',
    currentBalance: 3200.0,
    createdAt: '2026-08-05T11:30:00.000Z',
  },
  {
    id: 'party-cust-3',
    type: 'CUSTOMER',
    name: 'مطعم ومطبخ الضيافة - الشيف عمر',
    phone: '+966 56 312 7788',
    address: 'الرياض - حي المروج',
    notes: 'توريد أرز وزيوت دوري',
    currentBalance: 820.0,
    createdAt: '2026-08-10T14:15:00.000Z',
  },
  {
    id: 'party-cust-4',
    type: 'CUSTOMER',
    name: 'تموينات الفلاح - أبو فيصل',
    phone: '+966 50 998 1234',
    address: 'الرياض - حي النسيم الشرقي',
    notes: 'حساب مسدد بالكامل',
    currentBalance: 0.0,
    createdAt: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 'party-dist-1',
    type: 'DISTRIBUTOR',
    name: 'شركة المراعي الوطنية للتوزيع',
    phone: '+966 11 470 0000',
    address: 'المنطقة الصناعية الثانية - مستودع A4',
    notes: 'المورد الرئيسي لمنتجات الحليب والألبان والعصائر',
    currentBalance: 4600.0,
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'party-dist-2',
    type: 'DISTRIBUTOR',
    name: 'مؤسسة اليمامة للمشروبات والمياه',
    phone: '+966 11 265 8900',
    address: 'مخرج 18 - الدائري الشرقي',
    notes: 'مورد كراتين المياه المعدنية والعصائر المعلبة',
    currentBalance: 1250.0,
    createdAt: '2026-08-08T10:00:00.000Z',
  },
];

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    partyId: 'party-cust-1',
    type: 'SALE_CREDIT',
    date: '2026-08-20T10:30:00.000Z',
    items: [
      { name: 'أرز بسمتي كلاسيك (شوال 10 كجم)', quantity: 10, unitPrice: 85.0, subtotal: 850.0 },
      { name: 'حليب كامل الدسم طويل الأجل (كرتون 12 لتر)', quantity: 5, unitPrice: 64.0, subtotal: 320.0 },
      { name: 'سكر أبيض ناعم (شوال 5 كجم)', quantity: 10, unitPrice: 24.5, subtotal: 245.0 },
    ],
    totalAmount: 1415.0,
    paidAmount: 415.0,
    remainingBalanceDelta: 1000.0,
    notes: 'فاتورة تسليم بضاعة دورية - دفعة نقدية فورية 415 والباقي آجل',
    receiptNumber: 'INV-2026-0101',
    paymentMethod: 'CASH',
  },
  {
    id: 'tx-2',
    partyId: 'party-cust-1',
    type: 'SALE_CREDIT',
    date: '2026-08-25T14:00:00.000Z',
    items: [
      { name: 'زيت دوار الشمس نقي (كرتون 4 × 2.9 لتر)', quantity: 5, unitPrice: 110.0, subtotal: 550.0 },
      { name: 'مياه شرب معبأة (كرتون 40 × 330 مل)', quantity: 10, unitPrice: 16.0, subtotal: 160.0 },
    ],
    totalAmount: 710.0,
    paidAmount: 260.0,
    remainingBalanceDelta: 450.0,
    notes: 'فاتورة توريد إضافية',
    receiptNumber: 'INV-2026-0108',
    paymentMethod: 'CASH',
  },
  {
    id: 'tx-3',
    partyId: 'party-cust-2',
    type: 'SALE_CREDIT',
    date: '2026-08-26T09:15:00.000Z',
    items: [
      { name: 'أرز بسمتي كلاسيك (شوال 10 كجم)', quantity: 25, unitPrice: 85.0, subtotal: 2125.0 },
      { name: 'زيت دوار الشمس نقي (كرتون 4 × 2.9 لتر)', quantity: 15, unitPrice: 110.0, subtotal: 1650.0 },
      { name: 'سكر أبيض ناعم (شوال 5 كجم)', quantity: 20, unitPrice: 24.5, subtotal: 490.0 },
    ],
    totalAmount: 4265.0,
    paidAmount: 1065.0,
    remainingBalanceDelta: 3200.0,
    notes: 'طلبية سوبرماركت الرياض الكبرى لشهر أغسطس',
    receiptNumber: 'INV-2026-0112',
    paymentMethod: 'BANK_TRANSFER',
  },
  {
    id: 'tx-4',
    partyId: 'party-cust-3',
    type: 'SALE_CREDIT',
    date: '2026-08-27T16:45:00.000Z',
    items: [
      { name: 'أرز بسمتي كلاسيك (شوال 10 كجم)', quantity: 12, unitPrice: 85.0, subtotal: 1020.0 },
      { name: 'شاي أسود فرط فاخر (علبة 400 جم)', quantity: 10, unitPrice: 22.0, subtotal: 220.0 },
    ],
    totalAmount: 1240.0,
    paidAmount: 420.0,
    remainingBalanceDelta: 820.0,
    notes: 'توريد مطعم الضيافة',
    receiptNumber: 'INV-2026-0119',
    paymentMethod: 'CASH',
  },
  {
    id: 'tx-5',
    partyId: 'party-dist-1',
    type: 'SUPPLY_CREDIT',
    date: '2026-08-22T08:30:00.000Z',
    items: [
      { name: 'حليب كامل الدسم طويل الأجل (كرتون 12 لتر)', quantity: 100, unitPrice: 52.0, subtotal: 5200.0 },
    ],
    totalAmount: 5200.0,
    paidAmount: 600.0,
    remainingBalanceDelta: 4600.0,
    notes: 'استلام بضاعة حليب من شركة المراعي بالآجل',
    receiptNumber: 'SUP-2026-0034',
    paymentMethod: 'BANK_TRANSFER',
  },
  {
    id: 'tx-6',
    partyId: 'party-dist-2',
    type: 'SUPPLY_CREDIT',
    date: '2026-08-24T11:00:00.000Z',
    items: [
      { name: 'مياه شرب معبأة (كرتون 40 × 330 مل)', quantity: 100, unitPrice: 12.5, subtotal: 1250.0 },
    ],
    totalAmount: 1250.0,
    paidAmount: 0.0,
    remainingBalanceDelta: 1250.0,
    notes: 'شحنة مياه شرب معبأة بالآجل',
    receiptNumber: 'SUP-2026-0041',
    paymentMethod: 'CASH',
  },
  {
    id: 'tx-7',
    partyId: 'party-cust-4',
    type: 'SALE_CREDIT',
    date: '2026-08-18T10:00:00.000Z',
    items: [
      { name: 'سكر أبيض ناعم (شوال 5 كجم)', quantity: 20, unitPrice: 24.5, subtotal: 490.0 },
    ],
    totalAmount: 490.0,
    paidAmount: 0.0,
    remainingBalanceDelta: 490.0,
    notes: 'فاتورة آجل تموينات الفلاح',
    receiptNumber: 'INV-2026-0095',
    paymentMethod: 'CASH',
  },
  {
    id: 'tx-8',
    partyId: 'party-cust-4',
    type: 'PAYMENT_RECEIVED',
    date: '2026-08-29T17:00:00.000Z',
    items: [],
    totalAmount: 490.0,
    paidAmount: 490.0,
    remainingBalanceDelta: -490.0,
    notes: 'سند قبض نقدي - تسديد كامل الحساب نقداً من أبو فيصل',
    receiptNumber: 'REC-2026-0055',
    paymentMethod: 'CASH',
  },
];

/**
 * Deterministic Ledger Balance Calculation:
 * Calculates the exact current balance for a party strictly from atomic transactions.
 *
 * For Customers (عملاء):
 * - SALE_CREDIT: increases balance by (totalAmount - paidAmount)
 * - PAYMENT_RECEIVED: decreases balance by paidAmount
 *
 * For Distributors (موردين):
 * - SUPPLY_CREDIT: increases balance by (totalAmount - paidAmount) (amount we owe to distributor)
 * - PAYMENT_PAID: decreases balance by paidAmount (amount we paid to distributor)
 */
export function calculatePartyBalance(party: Party, partyTransactions: Transaction[]): number {
  let balance = 0;
  // Sort chronologically ascending
  const sorted = [...partyTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of sorted) {
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

export class SQLiteLedgerStore {
  private static instance: SQLiteLedgerStore;

  private parties: Party[] = [];
  private products: Product[] = [];
  private transactions: Transaction[] = [];
  private profile: BusinessProfile = defaultBusinessProfile;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SQLiteLedgerStore {
    if (!SQLiteLedgerStore.instance) {
      SQLiteLedgerStore.instance = new SQLiteLedgerStore();
    }
    return SQLiteLedgerStore.instance;
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
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(this.parties));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILE, JSON.stringify(this.profile));
    } catch (err) {
      console.error('Error saving to SQLite ledger storage:', err);
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
    return [...this.parties];
  }

  public getPartyById(id: string): Party | undefined {
    return this.parties.find((p) => p.id === id);
  }

  public addParty(party: Omit<Party, 'id' | 'currentBalance' | 'createdAt'>): Party {
    const newParty: Party = {
      ...party,
      id: `party-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      currentBalance: 0,
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
    this.parties.splice(idx, 1);
    // Remove all associated transactions
    this.transactions = this.transactions.filter((t) => t.partyId !== id);
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
      totalAmount: Math.max(0, txData.totalAmount),
      paidAmount: Math.max(0, txData.paidAmount),
      remainingBalanceDelta: txData.remainingBalanceDelta,
      notes: txData.notes || '',
      receiptNumber: txData.customReceiptNumber || generatedReceipt,
      paymentMethod: txData.paymentMethod || 'CASH',
    };

    this.transactions.push(newTx);
    this.reconcileAllBalances();
    this.saveToStorage();
    return newTx;
  }

  public deleteTransaction(id: string): boolean {
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.transactions.splice(idx, 1);
    this.reconcileAllBalances();
    this.saveToStorage();
    return true;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return [...this.products];
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
    this.products.splice(idx, 1);
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
    const customers = this.parties.filter((p) => p.type === 'CUSTOMER');
    const distributors = this.parties.filter((p) => p.type === 'DISTRIBUTOR');

    // Total Money Owed to Me (مستحقات - له): Sum of positive customer balances
    const totalOwedToMe = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);

    // Total Money I Owe (التزامات - عليه): Sum of positive distributor balances
    const totalIOwe = distributors.reduce((sum, d) => sum + Math.max(0, d.currentBalance), 0);

    // Cash Collected Today: Payments received from customers today + upfront cash paid in sales today
    const today = new Date().toISOString().split('T')[0];
    const todaysTransactions = this.transactions.filter((t) => t.date.startsWith(today));

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
