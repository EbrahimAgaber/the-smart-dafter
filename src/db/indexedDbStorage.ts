import { BusinessProfile, Party, Product, Transaction } from '../types';

const DB_NAME = 'daftar_smart_db';
const DB_VERSION = 1;

export interface StoredData {
  parties: Party[];
  products: Product[];
  transactions: Transaction[];
  profile: BusinessProfile;
}

export class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment, falling back to memory/localStorage.');
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('parties')) {
            db.createObjectStore('parties', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('transactions')) {
            const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
            txStore.createIndex('partyId', 'partyId', { unique: false });
            txStore.createIndex('date', 'date', { unique: false });
          }
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (err) => {
          console.error('IndexedDB open failed, falling back:', err);
          resolve(null);
        };
      } catch (err) {
        console.error('IndexedDB initialization error:', err);
        resolve(null);
      }
    });
  }

  public async saveAll(data: StoredData): Promise<boolean> {
    const db = await this.dbPromise;
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['parties', 'products', 'transactions', 'metadata'], 'readwrite');

        tx.onerror = () => resolve(false);
        tx.oncomplete = () => resolve(true);

        // Parties
        const partyStore = tx.objectStore('parties');
        partyStore.clear();
        for (const p of data.parties) {
          partyStore.put(p);
        }

        // Products
        const prodStore = tx.objectStore('products');
        prodStore.clear();
        for (const pr of data.products) {
          prodStore.put(pr);
        }

        // Transactions
        const txStore = tx.objectStore('transactions');
        txStore.clear();
        for (const t of data.transactions) {
          txStore.put(t);
        }

        // Profile metadata
        const metaStore = tx.objectStore('metadata');
        metaStore.put({ key: 'profile', value: data.profile });
      } catch (e) {
        console.error('Failed writing to IndexedDB:', e);
        resolve(false);
      }
    });
  }

  public async loadAll(): Promise<StoredData | null> {
    const db = await this.dbPromise;
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(['parties', 'products', 'transactions', 'metadata'], 'readonly');
        let parties: Party[] = [];
        let products: Product[] = [];
        let transactions: Transaction[] = [];
        let profile: BusinessProfile | null = null;

        const partyReq = tx.objectStore('parties').getAll();
        partyReq.onsuccess = () => {
          parties = partyReq.result || [];
        };

        const prodReq = tx.objectStore('products').getAll();
        prodReq.onsuccess = () => {
          products = prodReq.result || [];
        };

        const txReq = tx.objectStore('transactions').getAll();
        txReq.onsuccess = () => {
          transactions = txReq.result || [];
        };

        const metaReq = tx.objectStore('metadata').get('profile');
        metaReq.onsuccess = () => {
          if (metaReq.result) {
            profile = metaReq.result.value;
          }
        };

        tx.oncomplete = () => {
          if (parties.length === 0 && products.length === 0 && transactions.length === 0 && !profile) {
            // DB is empty, signal to migrate or use defaults
            resolve(null);
          } else {
            resolve({
              parties,
              products,
              transactions,
              profile: profile as unknown as BusinessProfile,
            });
          }
        };

        tx.onerror = () => {
          resolve(null);
        };
      } catch (err) {
        console.error('Error reading from IndexedDB:', err);
        resolve(null);
      }
    });
  }
}

export const idbStorage = new IndexedDBStorage();
