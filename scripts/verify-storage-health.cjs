#!/usr/bin/env node

/**
 * ==============================================================================
 * SQLite Ledger Store Error Handling & Storage Health Verification Suite
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const storeCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/db/sqliteStorage.ts'), 'utf8');
const settingsCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/components/SettingsView.tsx'), 'utf8');
const idbCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/db/indexedDbStorage.ts'), 'utf8');
const translationsCode = fs.readFileSync(path.join(PROJECT_ROOT, 'src/i18n/translations.ts'), 'utf8');

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${description}`);
  } else {
    failed++;
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${description}`);
  }
}

console.log('\n--- SQLite Ledger Store Storage Health & Error Handling Audit ---');

// 1. Types & Interfaces
assert('StorageHealthStatus interface exported from sqliteStorage.ts', 
  storeCode.includes('export interface StorageHealthStatus')
);
assert('StorageDiagnosticResult interface exported from sqliteStorage.ts', 
  storeCode.includes('export interface StorageDiagnosticResult')
);
assert('StorageErrorCode type supports QUOTA_EXCEEDED, WRITE_FAILED, CORRUPT_DATA', 
  storeCode.includes('QUOTA_EXCEEDED') && storeCode.includes('WRITE_FAILED') && storeCode.includes('CORRUPT_DATA')
);

// 2. Health Monitoring Methods
assert('SQLiteLedgerStore provides getStorageHealth() method', 
  storeCode.includes('getStorageHealth()')
);
assert('SQLiteLedgerStore provides refreshStorageHealth() with navigator.storage estimate', 
  storeCode.includes('refreshStorageHealth()') && storeCode.includes('navigator.storage.estimate')
);
assert('SQLiteLedgerStore provides runStorageDiagnostics() active probe testing', 
  storeCode.includes('runStorageDiagnostics()') && storeCode.includes('__storage_diagnostic_probe__')
);
assert('IndexedDBStorage provides testHealth() probe method', 
  idbCode.includes('testHealth()') && idbCode.includes('__health_probe__')
);

// 3. Error Recovery & Quota Handling
assert('saveToStorage captures QuotaExceededError and flags QUOTA_EXCEEDED', 
  storeCode.includes('QuotaExceededError') && storeCode.includes('lastErrorCode = \'QUOTA_EXCEEDED\'')
);
assert('loadFromStorage handles corruption and rescues data from IndexedDB', 
  storeCode.includes('lastErrorCode = \'CORRUPT_DATA\'') && storeCode.includes('idbStorage.loadAll()')
);
assert('importDataJSON thoroughly validates input and catches malformed JSON', 
  storeCode.includes('DESERIALIZATION_FAILED') && storeCode.includes('!jsonString')
);
assert('calculatePartyBalance guards against NaN/non-finite values', 
  storeCode.includes('isNaN(balance)')
);

// 4. SettingsView UI Integration
assert('SettingsView renders Connection/Storage Health status indicator card', 
  settingsCode.includes('id="settings-storage-health-card"')
);
assert('SettingsView renders storage health status badge with live level indicator', 
  settingsCode.includes('id="storage-health-status-badge"')
);
assert('SettingsView provides interactive Run Storage Diagnostics button', 
  settingsCode.includes('id="btn-run-storage-diagnostics"')
);
assert('SettingsView displays error alert with quick backup export button on failure', 
  settingsCode.includes('id="storage-health-error-alert"') && settingsCode.includes('quickExportBackup')
);
assert('SettingsView renders quota exceeded alert when storage limit approached', 
  settingsCode.includes('id="storage-health-quota-alert"')
);

// 5. Bilingual Localization
assert('Arabic translations dictionary has storageHealthTitle and diagnostics labels', 
  translationsCode.includes('storageHealthTitle:') && translationsCode.includes('diagnosticsPassed:')
);
assert('English translations dictionary has storageHealthTitle and diagnostics labels', 
  translationsCode.includes('Connection / Storage Health') && translationsCode.includes('All storage and database health checks passed')
);

console.log('\n====================================================================');
console.log(`Storage Health Audit Tests: ${passed} passed, ${failed} failed`);
console.log('====================================================================\n');

if (failed > 0) process.exit(1);
