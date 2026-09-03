import { BusinessProfile, Party, Product, Transaction } from '../src/types.js';

// Mock localStorage
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
};

// ... we could try to import SQLiteLedgerStore, but it's typescript and needs compilation.
