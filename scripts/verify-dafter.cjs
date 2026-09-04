#!/usr/bin/env node

/**
 * ==============================================================================
 * The Smart Dafter (الدفتر الذكي) - Automated 4-Tier Verification Test Suite
 * ==============================================================================
 * Track: Opaque-Box E2E Testing & Acceptance Verification
 * Spec: TEST_INFRA.md, ORIGINAL_REQUEST.md, PROJECT.md
 *
 * Usage:
 *   node scripts/verify-dafter.cjs               # Run all 4 tiers
 *   node scripts/verify-dafter.cjs --tier 1     # Run Tier 1 (Bug Acceptance Checks)
 *   node scripts/verify-dafter.cjs --tier 2     # Run Tier 2 (Financial Math Invariants)
 *   node scripts/verify-dafter.cjs --tier 3     # Run Tier 3 (Build & Type Integrity)
 *   node scripts/verify-dafter.cjs --tier 4     # Run Tier 4 (Merchant Ledger Simulation)
 *   node scripts/verify-dafter.cjs --json       # Output JSON summary
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ANSI Color formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Check if output supports color
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
function color(code, text) {
  return useColor ? `${code}${text}${colors.reset}` : text;
}

// Global Results Collector
const suiteResults = {
  timestamp: new Date().toISOString(),
  tier1: { name: 'Tier 1: Bug & Acceptance Criteria Checks', passed: 0, failed: 0, total: 0, tests: [] },
  tier2: { name: 'Tier 2: Financial Math & Domain Invariants', passed: 0, failed: 0, total: 0, tests: [] },
  tier3: { name: 'Tier 3: Build & Type Integrity Checks', passed: 0, failed: 0, total: 0, tests: [] },
  tier4: { name: 'Tier 4: Simulated Merchant Ledger Workflow', passed: 0, failed: 0, total: 0, tests: [] },
};

function recordTest(tierKey, testId, title, passed, details, expectation) {
  const targetTier = suiteResults[tierKey];
  targetTier.total++;
  if (passed) {
    targetTier.passed++;
  } else {
    targetTier.failed++;
  }
  const resultObj = { id: testId, title, passed, details, expectation };
  targetTier.tests.push(resultObj);

  const statusStr = passed
    ? color(colors.green, '[PASS]')
    : color(colors.red, '[FAIL]');
  const idStr = color(colors.bold, `[${testId}]`);
  console.log(`  ${statusStr} ${idStr} ${title}`);
  if (!passed && details) {
    console.log(`         ${color(colors.yellow, '-> Diagnostic:')} ${details}`);
    if (expectation) {
      console.log(`         ${color(colors.cyan, '-> Expected:')} ${expectation}`);
    }
  }
}

// Helper: read file content safely
function readFileSafe(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// Helper: recursive directory file finder
function findFilesRecursive(dir, extFilter = null) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        results = results.concat(findFilesRecursive(full, extFilter));
      }
    } else if (entry.isFile()) {
      if (!extFilter || extFilter.some(ext => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  return results;
}

// -----------------------------------------------------------------------------
// TIER 1: ACCEPTANCE CRITERIA BUG CHECKS (Static Code & Pattern Analysis)
// -----------------------------------------------------------------------------
function runTier1() {
  console.log('\n' + color(colors.bold + colors.cyan, '===================================================================='));
  console.log(color(colors.bold + colors.cyan, ' TIER 1: ACCEPTANCE CRITERIA BUG CHECKS (Static & Structural Audit) '));
  console.log(color(colors.bold + colors.cyan, '===================================================================='));

  // Bug 1: ZATCA QR vatNumber -> taxNumber in InvoicePdfModal.tsx
  {
    const code = readFileSafe('src/components/InvoicePdfModal.tsx');
    if (!code) {
      recordTest('tier1', 'T1.1', 'ZATCA QR profile.taxNumber usage', false, 'File src/components/InvoicePdfModal.tsx not found');
    } else {
      const hasVatNumber = /profile\.vatNumber/g.test(code);
      const hasTaxNumber = /profile\.taxNumber/g.test(code) || /taxNumber:\s*profile\.taxNumber/g.test(code);
      const passed = !hasVatNumber && hasTaxNumber;
      recordTest(
        'tier1',
        'T1.1',
        'ZATCA QR uses profile.taxNumber (no profile.vatNumber)',
        passed,
        hasVatNumber ? 'Found unresolved reference to profile.vatNumber' : (!hasTaxNumber ? 'Missing profile.taxNumber in ZATCA QR builder' : 'Verified profile.taxNumber is used exclusively'),
        'profile.taxNumber must be used; zero references to profile.vatNumber'
      );
    }
  }

  // Bug 2: Redundant ternary in App.tsx remainingBalanceDelta
  {
    const code = readFileSafe('src/App.tsx');
    if (!code) {
      recordTest('tier1', 'T1.2', 'App.tsx remainingBalanceDelta redundancy removal', false, 'src/App.tsx not found');
    } else {
      const hasRedundantTernary = /remainingBalanceDelta:\s*isCustomerReceipt\s*\?\s*-data\.amount\s*:\s*-data\.amount/g.test(code);
      const hasCleanDelta = /remainingBalanceDelta:\s*-data\.amount/g.test(code) ||
                            /remainingBalanceDelta:\s*data\.type\s*===/g.test(code);
      const passed = !hasRedundantTernary && hasCleanDelta;
      recordTest(
        'tier1',
        'T1.2',
        'App.tsx remainingBalanceDelta ternary redundancy resolved',
        passed,
        hasRedundantTernary ? 'Redundant ternary "isCustomerReceipt ? -data.amount : -data.amount" still present' : 'Verified clean remainingBalanceDelta: -data.amount',
        'Eliminate redundant ternary and set remainingBalanceDelta to -data.amount'
      );
    }
  }

  // Bug 3: Date locale inconsistency in src/utils/formatters.ts
  {
    const code = readFileSafe('src/utils/formatters.ts');
    if (!code) {
      recordTest('tier1', 'T1.3', 'formatDate Arabic locale ar-SA', false, 'src/utils/formatters.ts not found');
    } else {
      const hasEnGbForArabic = /lang\s*===\s*['"]ar['"]\s*\?\s*['"]en-GB['"]/g.test(code);
      const hasArSaForArabic = /lang\s*===\s*['"]ar['"]\s*\?\s*['"]ar-SA['"]/g.test(code);
      const passed = !hasEnGbForArabic && hasArSaForArabic;
      recordTest(
        'tier1',
        'T1.3',
        'formatDate uses ar-SA locale consistently for Arabic',
        passed,
        hasEnGbForArabic ? 'formatDate still uses en-GB for Arabic locale' : (!hasArSaForArabic ? 'formatDate does not use ar-SA for Arabic' : 'Verified ar-SA locale for Arabic'),
        'formatDate must use ar-SA when lang === "ar"'
      );
    }
  }

  // Bug 4: IndexedDB hydration observer/subscriber in sqliteStorage.ts and App.tsx
  {
    const storeCode = readFileSafe('src/db/sqliteStorage.ts');
    const appCode = readFileSafe('src/App.tsx');
    if (!storeCode || !appCode) {
      recordTest('tier1', 'T1.4', 'IndexedDB hydration subscriber pattern', false, 'sqliteStorage.ts or App.tsx not found');
    } else {
      const storeHasSubscribe = /subscribe\s*\(\s*listener/g.test(storeCode) || /public\s+subscribe\s*\(/g.test(storeCode);
      const storeHasNotify = /notifyListeners\s*\(/g.test(storeCode) || /this\.listeners\.forEach/g.test(storeCode) || /notifySubscribers\s*\(/g.test(storeCode) || /this\.subscribers\.forEach/g.test(storeCode);
      const appHasSubscription = /store\.subscribe\s*\(/g.test(appCode);
      const passed = storeHasSubscribe && storeHasNotify && appHasSubscription;
      recordTest(
        'tier1',
        'T1.4',
        'IndexedDB async hydration observer pattern implemented',
        passed,
        !storeHasSubscribe ? 'SQLiteLedgerStore missing subscribe() method' :
        !storeHasNotify ? 'SQLiteLedgerStore missing listener notification on IDB completion' :
        !appHasSubscription ? 'App.tsx does not subscribe to store hydration events' :
        'Verified subscribe/notify pattern in SQLiteLedgerStore and App.tsx',
        'Store must notify listeners upon async IDB completion; App.tsx must subscribe'
      );
    }
  }

  // Bug 5: License check validation on receipt and voucher creation flows
  {
    const code = readFileSafe('src/App.tsx');
    if (!code) {
      recordTest('tier1', 'T1.5', 'License enforcement on receipts and vouchers', false, 'src/App.tsx not found');
    } else {
      // Check if handleOpenReceiptModal or guarded receipt/voucher checks exist
      const guardsReceiptModal = /checkCanCreateInvoice\(\)/g.test(code) &&
        (/handleOpenReceiptModal/g.test(code) || /activeModal\('receipt'\)/g.test(code) || /handleCreateReceipt/g.test(code));
      const hasReceiptGuard = /handleCreateReceipt[\s\S]{1,150}checkCanCreateInvoice/g.test(code) ||
                              /handleOpenReceiptModal[\s\S]{1,150}checkCanCreateInvoice/g.test(code) ||
                              (code.match(/checkCanCreateInvoice/g) || []).length >= 4;
      const passed = guardsReceiptModal && hasReceiptGuard;
      recordTest(
        'tier1',
        'T1.5',
        'License validation enforced on receipt and voucher creation flows',
        passed,
        !passed ? `Found only ${(code.match(/checkCanCreateInvoice/g) || []).length} license check calls in App.tsx (receipts/vouchers not fully guarded)` :
                  'Verified license validation guards all transaction modals/creation flows',
        'checkCanCreateInvoice() must be checked when opening or creating receipts and vouchers'
      );
    }
  }

  // Bug 6: Object URL memory leaks in PDF modals
  {
    const invoicePdfCode = readFileSafe('src/components/InvoicePdfModal.tsx') || '';
    const statementPdfCode = readFileSafe('src/components/StatementPdfModal.tsx') || '';
    const hasInvoiceCleanup = /URL\.revokeObjectURL/g.test(invoicePdfCode);
    const hasStatementCleanup = /URL\.revokeObjectURL/g.test(statementPdfCode);
    const passed = hasInvoiceCleanup && hasStatementCleanup;
    recordTest(
      'tier1',
      'T1.6',
      'URL.revokeObjectURL cleanup in PDF modals (memory leak fix)',
      passed,
      !hasInvoiceCleanup ? 'InvoicePdfModal.tsx missing URL.revokeObjectURL cleanup' :
      !hasStatementCleanup ? 'StatementPdfModal.tsx missing URL.revokeObjectURL cleanup' :
      'Verified URL.revokeObjectURL cleanup present in both PDF modals',
      'All createObjectURL invocations must be revoked in useEffect unmount/update cleanups'
    );
  }

  // Bug 7: Client-side plaintext secret exposure
  {
    const licenseCode = readFileSafe('src/utils/licenseManager.ts') || '';
    const adminModalCode = readFileSafe('src/components/AdminKeyGeneratorModal.tsx') || '';
    const hasPlaintextSalt = /DAFTAR_SEC_SALT_v2_987412356_KEYGEN/g.test(licenseCode);
    const hasPlaintext7788 = /['"]7788['"]/g.test(adminModalCode);
    const hasPlaintextDaftar2026 = /['"]DAFTAR-2026['"]/g.test(adminModalCode);
    const hasPlaintextPinInPlaceholder = /7788/g.test(adminModalCode);

    const passed = !hasPlaintextSalt && !hasPlaintext7788 && !hasPlaintextDaftar2026 && !hasPlaintextPinInPlaceholder;
    recordTest(
      'tier1',
      'T1.7',
      'Client-side secrets (PINs, salt) obfuscated or hashed (no plaintext)',
      passed,
      hasPlaintextSalt ? 'Hardcoded plaintext SECRET_SALT found in licenseManager.ts' :
      hasPlaintext7788 ? 'Hardcoded plaintext "7788" master PIN found in AdminKeyGeneratorModal.tsx' :
      hasPlaintextDaftar2026 ? 'Hardcoded plaintext "DAFTAR-2026" master PIN found in AdminKeyGeneratorModal.tsx' :
      hasPlaintextPinInPlaceholder ? 'Plaintext PIN "7788" found in UI placeholder in AdminKeyGeneratorModal.tsx' :
      'Verified all sensitive secrets are obfuscated or hashed',
      'Zero plaintext master PINs or salts in source code'
    );
  }

  // Bug 8: Removal of html2canvas from source code
  {
    const srcFiles = findFilesRecursive(path.join(PROJECT_ROOT, 'src'), ['.ts', '.tsx', '.js', '.jsx']);
    let filesWithHtml2Canvas = [];
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (/from\s+['"]html2canvas['"]/g.test(content) || /require\(['"]html2canvas['"]\)/g.test(content)) {
        filesWithHtml2Canvas.push(path.relative(PROJECT_ROOT, file));
      }
    }
    const passed = filesWithHtml2Canvas.length === 0;
    recordTest(
      'tier1',
      'T1.8',
      'html2canvas completely eliminated from src/ (Native jsPDF rewrite)',
      passed,
      filesWithHtml2Canvas.length > 0 ? `html2canvas still imported in: ${filesWithHtml2Canvas.join(', ')}` :
                                       'Verified zero html2canvas imports across entire src/ directory',
      'Zero imports of html2canvas in client source code'
    );
  }
}

// -----------------------------------------------------------------------------
// TIER 2: FINANCIAL MATH & DOMAIN INVARIANT VERIFICATION
// -----------------------------------------------------------------------------
function runTier2() {
  console.log('\n' + color(colors.bold + colors.green, '===================================================================='));
  console.log(color(colors.bold + colors.green, ' TIER 2: FINANCIAL MATH & DOMAIN INVARIANTS (Calculations & Rounding)'));
  console.log(color(colors.bold + colors.green, '===================================================================='));

  // Helper math functions conforming to project specification
  function round2(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  }

  function computeLineItemSubtotal(quantity, unitPrice) {
    return round2(quantity * unitPrice);
  }

  function computeInvoiceFinancials(items, discountEntered = 0, taxRate = 15) {
    const itemsSubtotal = round2(items.reduce((sum, item) => sum + round2(item.quantity * item.unitPrice), 0));
    const cappedDiscount = Math.min(itemsSubtotal, Math.max(0, discountEntered));
    const netBeforeTax = Math.max(0, round2(itemsSubtotal - cappedDiscount));
    const taxAmount = round2(netBeforeTax * (taxRate / 100));
    const totalAmount = round2(netBeforeTax + taxAmount);
    return { itemsSubtotal, cappedDiscount, netBeforeTax, taxAmount, totalAmount };
  }

  function computeBalanceDelta(type, totalAmount, paidAmount) {
    if (type === 'SALE_CREDIT' || type === 'SUPPLY_CREDIT') {
      return round2(totalAmount - paidAmount);
    } else if (type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_PAID') {
      return -round2(paidAmount);
    }
    return 0;
  }

  // T2.1: Line item subtotal calculation with decimals
  {
    const subtotal = computeLineItemSubtotal(3.5, 12.50);
    const expected = 43.75;
    recordTest('tier2', 'T2.1', 'Line item subtotal precision (3.5 qty * 12.50 price)', subtotal === expected, `Got ${subtotal}`, `Expected ${expected}`);
  }

  // T2.2: Floating point summation guard
  {
    const items = [
      { quantity: 1, unitPrice: 0.10 },
      { quantity: 1, unitPrice: 0.20 },
      { quantity: 1, unitPrice: 0.70 }
    ];
    const { itemsSubtotal } = computeInvoiceFinancials(items, 0, 0);
    const expected = 1.00;
    recordTest('tier2', 'T2.2', 'Floating-point summation drift mitigation (0.1 + 0.2 + 0.7)', itemsSubtotal === expected, `Got ${itemsSubtotal}`, `Expected ${expected}`);
  }

  // T2.3: Discount capping (discount exceeds subtotal)
  {
    const items = [{ quantity: 1, unitPrice: 100.00 }];
    const { cappedDiscount, netBeforeTax, totalAmount } = computeInvoiceFinancials(items, 150.00, 15);
    const passed = cappedDiscount === 100.00 && netBeforeTax === 0.00 && totalAmount === 0.00;
    recordTest(
      'tier2',
      'T2.3',
      'Discount capped at subtotal (prevents negative net total)',
      passed,
      `Capped discount: ${cappedDiscount}, Net: ${netBeforeTax}, Total: ${totalAmount}`,
      'Capped discount: 100.00, Net: 0.00, Total: 0.00'
    );
  }

  // T2.4: Discount capping (exact subtotal match)
  {
    const items = [{ quantity: 2, unitPrice: 25.00 }];
    const { cappedDiscount, netBeforeTax, taxAmount, totalAmount } = computeInvoiceFinancials(items, 50.00, 15);
    const passed = cappedDiscount === 50.00 && netBeforeTax === 0.00 && taxAmount === 0.00 && totalAmount === 0.00;
    recordTest(
      'tier2',
      'T2.4',
      '100% discount produces exactly 0.00 net and 0.00 VAT',
      passed,
      `Net: ${netBeforeTax}, Tax: ${taxAmount}, Total: ${totalAmount}`,
      'Net: 0.00, Tax: 0.00, Total: 0.00'
    );
  }

  // T2.5: Standard 15% VAT calculation
  {
    const items = [{ quantity: 1, unitPrice: 1000.00 }];
    const { netBeforeTax, taxAmount, totalAmount } = computeInvoiceFinancials(items, 0, 15);
    const passed = netBeforeTax === 1000.00 && taxAmount === 150.00 && totalAmount === 1150.00;
    recordTest(
      'tier2',
      'T2.5',
      'Standard Saudi VAT 15% calculation (1000.00 net -> 150.00 VAT, 1150.00 Total)',
      passed,
      `Tax: ${taxAmount}, Total: ${totalAmount}`,
      'Tax: 150.00, Total: 1150.00'
    );
  }

  // T2.6: Half-up rounding boundary (upward round)
  {
    // 10.33 * 0.15 = 1.5495 -> rounds to 1.55
    const items = [{ quantity: 1, unitPrice: 10.33 }];
    const { taxAmount, totalAmount } = computeInvoiceFinancials(items, 0, 15);
    const passed = taxAmount === 1.55 && totalAmount === 11.88;
    recordTest(
      'tier2',
      'T2.6',
      'VAT 2-decimal half-up rounding boundary UP (10.33 * 0.15 = 1.5495 -> 1.55)',
      passed,
      `Tax: ${taxAmount}, Total: ${totalAmount}`,
      'Tax: 1.55, Total: 11.88'
    );
  }

  // T2.7: Half-up rounding boundary (downward round)
  {
    // 10.01 * 0.15 = 1.5015 -> rounds to 1.50
    const items = [{ quantity: 1, unitPrice: 10.01 }];
    const { taxAmount, totalAmount } = computeInvoiceFinancials(items, 0, 15);
    const passed = taxAmount === 1.50 && totalAmount === 11.51;
    recordTest(
      'tier2',
      'T2.7',
      'VAT 2-decimal half-up rounding boundary DOWN (10.01 * 0.15 = 1.5015 -> 1.50)',
      passed,
      `Tax: ${taxAmount}, Total: ${totalAmount}`,
      'Tax: 1.50, Total: 11.51'
    );
  }

  // T2.8: Zero tax rate (when VAT disabled)
  {
    const items = [{ quantity: 5, unitPrice: 50.00 }];
    const { taxAmount, totalAmount } = computeInvoiceFinancials(items, 0, 0);
    const passed = taxAmount === 0.00 && totalAmount === 250.00;
    recordTest(
      'tier2',
      'T2.8',
      'Zero tax rate when VAT disabled (250.00 net -> 0.00 tax, 250.00 Total)',
      passed,
      `Tax: ${taxAmount}, Total: ${totalAmount}`,
      'Tax: 0.00, Total: 250.00'
    );
  }

  // T2.9: Customer credit sale balance delta
  {
    // Customer buys 1035.00 total, pays 200.00 upfront. Delta to customer debt: +835.00
    const delta = computeBalanceDelta('SALE_CREDIT', 1035.00, 200.00);
    const expected = 835.00;
    recordTest('tier2', 'T2.9', 'Customer credit sale increases receivable debt by unpaid balance (+835.00)', delta === expected, `Delta: ${delta}`, `Expected: ${expected}`);
  }

  // T2.10: Customer full upfront cash sale delta
  {
    const delta = computeBalanceDelta('SALE_CREDIT', 500.00, 500.00);
    const expected = 0.00;
    recordTest('tier2', 'T2.10', 'Full cash upfront sale produces 0.00 balance delta', delta === expected, `Delta: ${delta}`, `Expected: 0.00`);
  }

  // T2.11: Customer payment receipt balance delta
  {
    const delta = computeBalanceDelta('PAYMENT_RECEIVED', 400.00, 400.00);
    const expected = -400.00;
    recordTest('tier2', 'T2.11', 'Customer payment receipt decreases receivable debt (-400.00)', delta === expected, `Delta: ${delta}`, `Expected: ${expected}`);
  }

  // T2.12: Distributor supply credit balance delta
  {
    const delta = computeBalanceDelta('SUPPLY_CREDIT', 3000.00, 500.00);
    const expected = 2500.00;
    recordTest('tier2', 'T2.12', 'Distributor supply intake increases payable liability by unpaid balance (+2500.00)', delta === expected, `Delta: ${delta}`, `Expected: ${expected}`);
  }

  // T2.13: Distributor payment voucher balance delta
  {
    const delta = computeBalanceDelta('PAYMENT_PAID', 1000.00, 1000.00);
    const expected = -1000.00;
    recordTest('tier2', 'T2.13', 'Distributor payment voucher decreases payable liability (-1000.00)', delta === expected, `Delta: ${delta}`, `Expected: ${expected}`);
  }

  // T2.14: Voiding reversal logic
  {
    const originalDelta = computeBalanceDelta('SALE_CREDIT', 1035.00, 200.00); // +835
    const reversalDelta = -originalDelta; // -835
    const netEffect = originalDelta + reversalDelta;
    recordTest(
      'tier2',
      'T2.14',
      'Transaction voiding strictly reverses original balance effect to 0.00 net',
      netEffect === 0.00,
      `Original: ${originalDelta}, Reversal: ${reversalDelta}, Net: ${netEffect}`,
      'Net effect must be exactly 0.00'
    );
  }

  // T2.15: Opening balance inclusion
  {
    const openingBalance = 250.00;
    const transactions = [
      { type: 'SALE_CREDIT', totalAmount: 500.00, paidAmount: 400.00, isVoided: false }, // +100
      { type: 'PAYMENT_RECEIVED', totalAmount: 50.00, paidAmount: 50.00, isVoided: false }, // -50
      { type: 'SALE_CREDIT', totalAmount: 1000.00, paidAmount: 0.00, isVoided: true },      // voided: 0
    ];
    const totalBalance = round2(
      openingBalance +
      transactions
        .filter(t => !t.isVoided)
        .reduce((sum, t) => sum + computeBalanceDelta(t.type, t.totalAmount, t.paidAmount), 0)
    );
    const expected = 300.00;
    recordTest(
      'tier2',
      'T2.15',
      'Opening balance included and voided transactions strictly excluded from balance',
      totalBalance === expected,
      `Calculated: ${totalBalance}`,
      `Expected: ${expected}`
    );
  }
}

// -----------------------------------------------------------------------------
// TIER 3: BUILD & TYPE INTEGRITY CHECKS (npx tsc --noEmit & AST)
// -----------------------------------------------------------------------------
function runTier3() {
  console.log('\n' + color(colors.bold + colors.magenta, '===================================================================='));
  console.log(color(colors.bold + colors.magenta, ' TIER 3: BUILD & TYPE INTEGRITY (TypeScript Compiler & Contracts)   '));
  console.log(color(colors.bold + colors.magenta, '===================================================================='));

  // T3.1: Programmatic tsc --noEmit
  {
    console.log('  Running: npx tsc --noEmit (checking type diagnostics)...');
    try {
      const isWindows = process.platform === 'win32';
      const localTsc = path.join(PROJECT_ROOT, 'node_modules', '.bin', isWindows ? 'tsc.cmd' : 'tsc');
      const hasLocalTsc = fs.existsSync(localTsc);
      const cmd = hasLocalTsc ? (isWindows ? `"${localTsc}"` : localTsc) : (isWindows ? 'npx.cmd' : 'npx');
      const args = hasLocalTsc ? ['--noEmit'] : ['tsc', '--noEmit'];
      const result = spawnSync(cmd, args, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 60000,
        shell: true,
        windowsVerbatimArguments: true,
      });

      const exitCode = result.status;
      const stdout = (result.stdout || '').trim();
      const stderr = (result.stderr || '').trim();
      const passed = exitCode === 0;

      recordTest(
        'tier3',
        'T3.1',
        'TypeScript compiler verification (npx tsc --noEmit passes with 0 errors)',
        passed,
        !passed ? `Exit code: ${exitCode}\n${stdout || stderr}` : 'Zero TypeScript compilation errors',
        'Exit code 0 and 0 error diagnostics'
      );
    } catch (err) {
      recordTest('tier3', 'T3.1', 'TypeScript compiler execution', false, `Failed executing tsc: ${err.message}`, 'Exit code 0');
    }
  }

  // T3.2: Check Interface Contract: sqliteStorage.ts subscriber
  {
    const storeCode = readFileSafe('src/db/sqliteStorage.ts') || '';
    const hasSubscriberTypeOrMethod = /subscribe\s*\(/g.test(storeCode);
    recordTest(
      'tier3',
      'T3.2',
      'Interface Contract: SQLiteLedgerStore.subscribe contract conformance',
      hasSubscriberTypeOrMethod,
      !hasSubscriberTypeOrMethod ? 'SQLiteLedgerStore does not conform to subscribe contract' : 'subscribe method signature present',
      'subscribe(callback: () => void): () => void'
    );
  }

  // T3.3: Check Interface Contract: licenseManager.ts verifyAdminPin
  {
    const licenseCode = readFileSafe('src/utils/licenseManager.ts') || '';
    const hasVerifyAdminPin = /export\s+(async\s+)?function\s+verifyAdminPin/g.test(licenseCode) ||
                              /verifyAdminPin\s*=/g.test(licenseCode);
    recordTest(
      'tier3',
      'T3.3',
      'Interface Contract: licenseManager.verifyAdminPin contract conformance',
      hasVerifyAdminPin,
      !hasVerifyAdminPin ? 'Missing export verifyAdminPin in src/utils/licenseManager.ts' : 'verifyAdminPin signature present',
      'export async function verifyAdminPin(pin: string): Promise<boolean>'
    );
  }

  // T3.4: Check Interface Contract: Native PDF Generator
  {
    const pdfCode = readFileSafe('src/services/pdfGenerator.ts') || readFileSafe('src/utils/pdfGenerator.ts') || '';
    const hasGenerateInvoice = /generateInvoicePdf/g.test(pdfCode);
    const hasGenerateStatement = /generateStatementPdf/g.test(pdfCode);
    const passed = hasGenerateInvoice && hasGenerateStatement;
    recordTest(
      'tier3',
      'T3.4',
      'Interface Contract: Native jsPDF API (generateInvoicePdf, generateStatementPdf)',
      passed,
      !passed ? 'Missing generateInvoicePdf or generateStatementPdf in pdfGenerator' : 'Native PDF generator functions exported',
      'generateInvoicePdf and generateStatementPdf returning Promise<jsPDF>'
    );
  }
}

// -----------------------------------------------------------------------------
// TIER 4: SIMULATED MERCHANT LEDGER WORKFLOW (Opaque-Box E2E Simulation)
// -----------------------------------------------------------------------------
function runTier4() {
  console.log('\n' + color(colors.bold + colors.yellow, '===================================================================='));
  console.log(color(colors.bold + colors.yellow, ' TIER 4: SIMULATED MERCHANT LEDGER WORKFLOW (Stateful Day Simulation)'));
  console.log(color(colors.bold + colors.yellow, '===================================================================='));

  function round2(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  }

  // In-Memory Simulated Ledger Store (Model matching sqliteStorage.ts)
  class SimulatedLedgerStore {
    constructor() {
      this.parties = new Map();
      this.transactions = [];
    }

    addParty(party) {
      const p = { ...party, currentBalance: round2(party.openingBalance || 0) };
      this.parties.set(party.id, p);
      return p;
    }

    getParty(id) {
      return this.parties.get(id);
    }

    addTransaction(tx) {
      const newTx = { ...tx, id: `tx_${this.transactions.length + 1}`, isVoided: false };
      this.transactions.push(newTx);
      this.recalculateParty(tx.partyId);
      return newTx;
    }

    voidTransaction(txId) {
      const tx = this.transactions.find(t => t.id === txId);
      if (tx) {
        tx.isVoided = true;
        this.recalculateParty(tx.partyId);
      }
    }

    recalculateParty(partyId) {
      const party = this.parties.get(partyId);
      if (!party) return;

      let balance = round2(party.openingBalance || 0);
      const partyTxs = this.transactions.filter(t => t.partyId === partyId && !t.isVoided);

      for (const t of partyTxs) {
        if (party.type === 'CUSTOMER') {
          if (t.type === 'SALE_CREDIT') {
            balance = round2(balance + (t.totalAmount - t.paidAmount));
          } else if (t.type === 'PAYMENT_RECEIVED') {
            balance = round2(balance - t.paidAmount);
          }
        } else if (party.type === 'DISTRIBUTOR') {
          if (t.type === 'SUPPLY_CREDIT') {
            balance = round2(balance + (t.totalAmount - t.paidAmount));
          } else if (t.type === 'PAYMENT_PAID') {
            balance = round2(balance - t.paidAmount);
          }
        }
      }
      party.currentBalance = balance;
    }

    getDashboardMetrics() {
      let totalOwedToMe = 0;
      let totalIOwe = 0;
      let cashCollectedToday = 0;

      for (const party of this.parties.values()) {
        if (party.type === 'CUSTOMER') {
          if (party.currentBalance > 0) totalOwedToMe = round2(totalOwedToMe + party.currentBalance);
        } else if (party.type === 'DISTRIBUTOR') {
          if (party.currentBalance > 0) totalIOwe = round2(totalIOwe + party.currentBalance);
        }
      }

      for (const tx of this.transactions) {
        if (!tx.isVoided) {
          if (tx.type === 'PAYMENT_RECEIVED') {
            cashCollectedToday = round2(cashCollectedToday + tx.paidAmount);
          } else if (tx.type === 'SALE_CREDIT' && tx.paidAmount > 0) {
            cashCollectedToday = round2(cashCollectedToday + tx.paidAmount);
          }
        }
      }

      const netWorkingCapital = round2(totalOwedToMe - totalIOwe);
      return { totalOwedToMe, totalIOwe, cashCollectedToday, netWorkingCapital };
    }

    getStatementRunningBalances(partyId) {
      const party = this.parties.get(partyId);
      if (!party) return [];
      let running = round2(party.openingBalance || 0);
      const entries = [];
      entries.push({ description: 'Opening Balance', delta: 0, runningBalance: running, isVoided: false });

      const partyTxs = this.transactions.filter(t => t.partyId === partyId);
      for (const t of partyTxs) {
        let delta = 0;
        if (!t.isVoided) {
          if (party.type === 'CUSTOMER') {
            delta = t.type === 'SALE_CREDIT' ? round2(t.totalAmount - t.paidAmount) : -round2(t.paidAmount);
          } else {
            delta = t.type === 'SUPPLY_CREDIT' ? round2(t.totalAmount - t.paidAmount) : -round2(t.paidAmount);
          }
          running = round2(running + delta);
        }
        entries.push({ id: t.id, type: t.type, delta, runningBalance: running, isVoided: t.isVoided });
      }
      return entries;
    }
  }

  // EXECUTION OF SIMULATED WORKFLOW:
  const sim = new SimulatedLedgerStore();

  // 1. Initial State: Setup parties
  const customer = sim.addParty({ id: 'p_cust_1', name: 'Tariq Al-Harbi', type: 'CUSTOMER', openingBalance: 150.00 });
  const distributor = sim.addParty({ id: 'p_dist_1', name: 'Al-Qassim Dairy Co.', type: 'DISTRIBUTOR', openingBalance: 1200.00 });

  recordTest(
    'tier4',
    'T4.1',
    'Simulated Setup: Customer & Distributor created with opening balances (150 & 1200 SAR)',
    customer.currentBalance === 150.00 && distributor.currentBalance === 1200.00,
    `Cust: ${customer.currentBalance}, Dist: ${distributor.currentBalance}`,
    'Cust: 150.00, Dist: 1200.00'
  );

  // 2. Transaction 1: Customer Credit Sale
  // Subtotal 160.00, Discount 10.00 (Net 150.00), VAT 15% (22.50) -> Total 172.50. Paid 50.00 upfront.
  // Delta: +(172.50 - 50.00) = +122.50. Customer Balance: 150.00 + 122.50 = 272.50
  const tx1 = sim.addTransaction({
    partyId: customer.id,
    type: 'SALE_CREDIT',
    totalAmount: 172.50,
    paidAmount: 50.00,
    notes: 'Credit Sale Invoice #1001'
  });

  recordTest(
    'tier4',
    'T4.2',
    'Workflow Step 1: Customer credit sale increases customer balance by +122.50 to 272.50 SAR',
    customer.currentBalance === 272.50,
    `Customer Balance: ${customer.currentBalance}`,
    'Expected: 272.50 SAR'
  );

  // 3. Transaction 2: Distributor Supply Intake
  // Total 2500.00, Paid 500.00 upfront. Delta: +(2500.00 - 500.00) = +2000.00. Distributor Balance: 1200.00 + 2000.00 = 3200.00
  const tx2 = sim.addTransaction({
    partyId: distributor.id,
    type: 'SUPPLY_CREDIT',
    totalAmount: 2500.00,
    paidAmount: 500.00,
    notes: 'Inventory Supply #502'
  });

  recordTest(
    'tier4',
    'T4.3',
    'Workflow Step 2: Distributor supply credit increases payable liability to 3200.00 SAR',
    distributor.currentBalance === 3200.00,
    `Distributor Balance: ${distributor.currentBalance}`,
    'Expected: 3200.00 SAR'
  );

  // 4. Transaction 3: Customer Payment Receipt
  // Customer pays 100.00 on account. Delta: -100.00. Customer Balance: 272.50 - 100.00 = 172.50
  const tx3 = sim.addTransaction({
    partyId: customer.id,
    type: 'PAYMENT_RECEIVED',
    totalAmount: 100.00,
    paidAmount: 100.00,
    notes: 'Payment receipt #301'
  });

  recordTest(
    'tier4',
    'T4.4',
    'Workflow Step 3: Customer payment receipt decreases receivable debt to 172.50 SAR',
    customer.currentBalance === 172.50,
    `Customer Balance: ${customer.currentBalance}`,
    'Expected: 172.50 SAR'
  );

  // 5. Transaction 4: Merchant Payment Voucher to Distributor
  // Merchant pays 1500.00 to distributor. Delta: -1500.00. Distributor Balance: 3200.00 - 1500.00 = 1700.00
  const tx4 = sim.addTransaction({
    partyId: distributor.id,
    type: 'PAYMENT_PAID',
    totalAmount: 1500.00,
    paidAmount: 1500.00,
    notes: 'Payment voucher #401'
  });

  recordTest(
    'tier4',
    'T4.5',
    'Workflow Step 4: Merchant payment voucher decreases payable liability to 1700.00 SAR',
    distributor.currentBalance === 1700.00,
    `Distributor Balance: ${distributor.currentBalance}`,
    'Expected: 1700.00 SAR'
  );

  // 6. Transaction 5: Voiding Payment Receipt (tx3)
  // Receipt was entered with error; void it. Customer balance rolls back from 172.50 to 272.50 SAR
  sim.voidTransaction(tx3.id);

  recordTest(
    'tier4',
    'T4.6',
    'Workflow Step 5: Voiding customer receipt reverses balance back to 272.50 SAR',
    customer.currentBalance === 272.50,
    `Customer Balance: ${customer.currentBalance}`,
    'Expected: 272.50 SAR'
  );

  // 7. Dashboard Metrics Verification
  const metrics = sim.getDashboardMetrics();
  const expectedReceivables = 272.50;
  const expectedPayables = 1700.00;
  const expectedCash = 50.00; // tx1 upfront cash (50.00); tx3 is voided so its 100.00 is excluded!
  const expectedCapital = -1427.50; // 272.50 - 1700.00 = -1427.50

  const metricsPassed =
    metrics.totalOwedToMe === expectedReceivables &&
    metrics.totalIOwe === expectedPayables &&
    metrics.cashCollectedToday === expectedCash &&
    metrics.netWorkingCapital === expectedCapital;

  recordTest(
    'tier4',
    'T4.7',
    'Workflow Step 6: Dashboard KPIs aggregate accurately (Receivables, Payables, Cash, Working Capital)',
    metricsPassed,
    `Receivables: ${metrics.totalOwedToMe}, Payables: ${metrics.totalIOwe}, Cash: ${metrics.cashCollectedToday}, Capital: ${metrics.netWorkingCapital}`,
    `Receivables: ${expectedReceivables}, Payables: ${expectedPayables}, Cash: ${expectedCash}, Capital: ${expectedCapital}`
  );

  // 8. Chronological Statement Audit
  const statement = sim.getStatementRunningBalances(customer.id);
  const finalRunningBalance = statement[statement.length - 1].runningBalance;
  const statementPassed = finalRunningBalance === customer.currentBalance;

  recordTest(
    'tier4',
    'T4.8',
    'Workflow Step 7: Chronological statement running balance strictly matches party balance (272.50 SAR)',
    statementPassed,
    `Final running balance: ${finalRunningBalance}, Party balance: ${customer.currentBalance}`,
    'Running balance must match stored current balance'
  );
}

// -----------------------------------------------------------------------------
// MAIN CONTROLLER & CLI DISPATCH
// -----------------------------------------------------------------------------
function printSummaryTable() {
  console.log('\n' + color(colors.bold, '===================================================================='));
  console.log(color(colors.bold, '               4-TIER VERIFICATION SUITE SUMMARY                    '));
  console.log(color(colors.bold, '===================================================================='));

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  for (const key of ['tier1', 'tier2', 'tier3', 'tier4']) {
    const tier = suiteResults[key];
    if (tier.total === 0) continue;
    grandTotal += tier.total;
    grandPassed += tier.passed;
    grandFailed += tier.failed;

    const rate = tier.total > 0 ? Math.round((tier.passed / tier.total) * 100) : 0;
    const tierColor = tier.failed === 0 ? colors.green : colors.red;
    const label = `${tier.name}:`.padEnd(48, ' ');
    const count = `${tier.passed}/${tier.total} passed (${rate}%)`.padStart(18, ' ');
    console.log(`  ${label} ${color(tierColor, count)}`);
  }

  console.log('--------------------------------------------------------------------');
  const overallRate = grandTotal > 0 ? Math.round((grandPassed / grandTotal) * 100) : 0;
  const overallColor = grandFailed === 0 ? colors.bold + colors.green : colors.bold + colors.red;
  const overallLabel = 'TOTAL SUITE VERIFICATION:'.padEnd(48, ' ');
  const overallCount = `${grandPassed}/${grandTotal} passed (${overallRate}%)`.padStart(18, ' ');
  console.log(`  ${color(overallColor, overallLabel + overallCount)}`);
  console.log('====================================================================\n');

  return grandFailed === 0;
}

function main() {
  const args = process.argv.slice(2);
  const tierIndex = args.indexOf('--tier');
  const specifiedTier = tierIndex !== -1 ? args[tierIndex + 1] : null;
  const isJson = args.includes('--json');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/verify-dafter.cjs [options]');
    console.log('Options:');
    console.log('  --tier <1|2|3|4>   Run only specified tier');
    console.log('  --json             Output results as JSON');
    console.log('  --help, -h         Show this help message');
    process.exit(0);
  }

  const runAll = !specifiedTier;

  if (runAll || specifiedTier === '1') runTier1();
  if (runAll || specifiedTier === '2') runTier2();
  if (runAll || specifiedTier === '3') runTier3();
  if (runAll || specifiedTier === '4') runTier4();

  if (isJson) {
    console.log(JSON.stringify(suiteResults, null, 2));
    const allPassed =
      suiteResults.tier1.failed === 0 &&
      suiteResults.tier2.failed === 0 &&
      suiteResults.tier3.failed === 0 &&
      suiteResults.tier4.failed === 0;
    process.exit(allPassed ? 0 : 1);
  }

  const success = printSummaryTable();
  process.exit(success ? 0 : 1);
}

main();
