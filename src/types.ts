export type PartyType = 'CUSTOMER' | 'DISTRIBUTOR';

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  phone: string;
  address: string;
  notes: string;
  openingBalance?: number; // Initial opening debt/credit at onboarding
  currentBalance: number; // Deterministically calculated: For customer: positive = customer owes merchant (receivable/له). For distributor: positive = merchant owes distributor (payable/عليه).
  avatarColor?: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  defaultSalePrice: number;
  defaultCostPrice: number;
  barcode: string;
  isDeleted?: boolean;
}

export type TransactionType =
  | 'SALE_CREDIT'       // فاتورة بيع آجل (Goods sold to customer on credit)
  | 'SUPPLY_CREDIT'     // فاتورة توريد آجل (Goods received from distributor on credit)
  | 'PAYMENT_RECEIVED'  // سند قبض (Cash/transfer received from customer)
  | 'PAYMENT_PAID';     // سند صرف (Cash/transfer paid to distributor)

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';

export interface LineItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  partyId: string;
  type: TransactionType;
  date: string; // ISO string
  items: LineItem[];
  subtotalBeforeTax?: number;
  discountAmount?: number;
  taxRate?: number; // e.g. 15 for 15% VAT
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalanceDelta: number; // The exact delta added/subtracted to party's balance
  notes: string;
  receiptNumber: string; // e.g., INV-2026-0001, REC-2026-0001, SUP-2026-0001, PAY-2026-0001
  paymentMethod?: PaymentMethod;
  isVoided?: boolean;
  voidedAt?: string;
  voidReason?: string;
}

export type Currency = 'SAR' | 'EGP' | 'AED' | 'KWD' | 'USD' | 'EUR' | string;

export interface BusinessProfile {
  name: string;
  ownerName?: string;
  phone: string;
  taxNumber: string;
  isVatEnabled?: boolean;
  defaultTaxRate?: number; // default 15%
  iban: string;
  bankName: string;
  logoBase64: string;
  invoiceFooterNote: string;
  currency: Currency;
  address?: string;
}

export interface LedgerEntry {
  transaction: Transaction;
  party: Party;
  debit: number;   // مدين (+)
  credit: number;  // دائن (-)
  runningBalance: number; // رصيد متحرك
}

export type ActiveTab = 'dashboard' | 'parties' | 'products' | 'settings';
export type Language = 'ar' | 'en';
