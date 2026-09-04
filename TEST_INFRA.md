# Comprehensive E2E Testing Infrastructure (4-Tier Verification Suite)

**Project**: The Smart Dafter (الدفتر الذكي)  
**Track**: Opaque-Box E2E Testing & Verification Track  
**Artifact**: `TEST_INFRA.md`  
**Runner**: `scripts/verify-dafter.cjs` (`node scripts/verify-dafter.cjs`)  
**Specification Sources**: `ORIGINAL_REQUEST.md`, `PROJECT.md`, Explorer Survey Reports  

---

## 1. Executive Overview & Philosophy

The Smart Dafter is a mission-critical retail accounting and invoicing PWA operating in standalone mobile and desktop browser environments. Because it manages legal tax documents (Saudi ZATCA e-invoicing compliance) and ledger accounts (credit sales, supplier payables, receipts, and vouchers), test verification must guarantee zero regression, mathematical precision, and complete elimination of memory leaks and client-side secret exposure.

This testing infrastructure follows an authoritative **4-Tier Verification Methodology**:

```
+-------------------------------------------------------------------------------+
|                        4-TIER VERIFICATION ARCHITECTURE                       |
+-------------------------------------------------------------------------------+
| Tier 1: Acceptance Criteria Bug Checks (AST, Regex, Static Code Analysis)     |
|         Bugs 1-8 verification: ZATCA taxNumber, App ternary, ar-SA dates,     |
|         IDB hydration observer, license enforcement, revokeObjectURL,        |
|         secret obfuscation, html2canvas complete removal.                     |
+-------------------------------------------------------------------------------+
| Tier 2: Boundary & Financial Math Verification (Domain Invariants)            |
|         Subtotals, discount capping, 2-decimal VAT rounding (15%),             |
|         positive debt convention, running balance deltas, voiding reversal.    |
+-------------------------------------------------------------------------------+
| Tier 3: Build & Type Integrity Checks (Compiler & Interface Conformance)     |
|         Programmatic execution of `npx tsc --noEmit` and strict checking      |
|         of interface contracts across storage, license, and PDF layers.       |
+-------------------------------------------------------------------------------+
| Tier 4: Simulated Merchant Ledger Workflow (Stateful E2E Simulation)         |
|         Multi-step merchant day lifecycle simulation: credit sale, supply,   |
|         receipt voucher, payment voucher, transaction voiding rollback,       |
|         ledger running balance reconciliation, and dashboard KPI aggregation. |
+-------------------------------------------------------------------------------+
```

---

## 2. Authoritative Specification Sources

All expected outputs, invariant rules, and acceptance thresholds are strictly derived from:
1. **`ORIGINAL_REQUEST.md`**: Section R1 (Bugs 1–8), Section R2 (PDF Rewrite), Section R3 (UX Audit), Section R4 (Financial Math), and Acceptance Criteria.
2. **`PROJECT.md`**: Architecture, Feature Inventory (Features 1–28), Interface Contracts (`sqliteStorage.ts ↔ App.tsx`, `licenseManager.ts`, `pdfGenerator.ts`), and Milestone boundaries.
3. **ZATCA Electronic Invoicing Regulations (Phase 1 & 2)**: Tag 1 (Seller Name), Tag 2 (VAT Registration / Tax Number), Tag 3 (Timestamp), Tag 4 (Total Amount with VAT), Tag 5 (VAT Amount).

---

## 3. Tier-by-Tier Specification & Test Catalog

### Tier 1: Acceptance Criteria Bug Checks (Structural & Code Audit)

Tier 1 validates that all 8 root-cause bugs identified in the audit are resolved in the source files.

| Test ID | Target File | Bug Description | Expected Invariant / Pattern | Authoritative Reference |
|---|---|---|---|---|
| **T1.1** | `src/components/InvoicePdfModal.tsx` | ZATCA QR `profile.vatNumber` vs `taxNumber` | Zero references to `profile.vatNumber`; references `profile.taxNumber` in `generateZatcaTlvQrString`. | R1.1, PROJECT.md #1 |
| **T1.2** | `src/App.tsx` | Redundant ternary in `remainingBalanceDelta` (~line 181) | No occurrence of `isCustomerReceipt ? -data.amount : -data.amount`; clean assignment `remainingBalanceDelta: -data.amount`. | R1.2, PROJECT.md #2 |
| **T1.3** | `src/utils/formatters.ts` | Date locale inconsistency in `formatDate` | Arabic locale branch uses `'ar-SA'` instead of `'en-GB'`. | R1.3, PROJECT.md #3 |
| **T1.4** | `src/db/sqliteStorage.ts` & `src/App.tsx` | IndexedDB hydration desynchronization | `SQLiteLedgerStore` exposes `subscribe(listener)` method and triggers listeners upon async IDB completion; `App.tsx` subscribes to refresh store data. | R1.4, PROJECT.md #4 |
| **T1.5** | `src/App.tsx` | License validation bypass on receipts/vouchers | `checkCanCreateInvoice()` is enforced before opening `receipt` and `voucher` modals and during receipt creation. | R1.5, PROJECT.md #5 |
| **T1.6** | `src/components/InvoicePdfModal.tsx` & `StatementPdfModal.tsx` | Object URL memory leak in PDF modals | Every `URL.createObjectURL` is paired with a corresponding `URL.revokeObjectURL` in `useEffect` cleanup or update lifecycle. | R1.6, PROJECT.md #6 |
| **T1.7** | `src/utils/licenseManager.ts` & `AdminKeyGeneratorModal.tsx` | Client-side plaintext secret exposure | Plaintext `'7788'`, `'DAFTAR-2026'`, and plaintext `'SECRET_SALT'` literals are eradicated; PIN verification uses SHA-256 hash or external config. | R1.7, PROJECT.md #7 |
| **T1.8** | Entire `src/` directory & `package.json` | Removal of fragile `html2canvas` pipeline | Zero imports of `html2canvas` in `src/`; PDF generation uses native direct drawing API. | R2, PROJECT.md #8, #20 |

---

### Tier 2: Boundary & Financial Math Verification

Tier 2 executes algorithmic verification of every financial calculation, rounding rule, and balance delta in the application.

#### Mathematical Formulas & Invariants:
1. **Line Item Subtotal**:
   $$\text{subtotal} = \text{round}_2(\text{quantity} \times \text{unitPrice})$$
2. **Invoice Subtotal**:
   $$\text{subtotal}_{\text{items}} = \text{round}_2\left(\sum \text{subtotal}_i\right)$$
3. **Discount Capping**:
   $$\text{discount}_{\text{capped}} = \min(\text{subtotal}_{\text{items}}, \max(0, \text{discount}_{\text{entered}}))$$
   $$\text{netBeforeTax} = \max(0, \text{round}_2(\text{subtotal}_{\text{items}} - \text{discount}_{\text{capped}}))$$
   *Invariant: Net before tax can NEVER be negative, even if user inputs an extreme discount.*
4. **VAT Calculation**:
   $$\text{taxAmount} = \text{round}_2\left(\text{netBeforeTax} \times \frac{\text{taxRate}}{100}\right)$$
   *Standard rate in KSA is 15.0%. Half-up 2-decimal rounding is strictly enforced.*
5. **Total Invoice Amount**:
   $$\text{totalAmount} = \text{round}_2(\text{netBeforeTax} + \text{taxAmount})$$
6. **Party Balance Convention (Positive Debt Model)**:
   - **Customer (`CUSTOMER`)**: `currentBalance` = Net amount owed *to* the merchant (Receivables).
     - Credit Sale: $\Delta = +(\text{totalAmount} - \text{paidAmount})$
     - Payment Received: $\Delta = -\text{paidAmount}$
   - **Distributor (`DISTRIBUTOR`)**: `currentBalance` = Net amount merchant owes *to* distributor (Payables).
     - Supply Intake: $\Delta = +(\text{totalAmount} - \text{paidAmount})$
     - Payment Paid: $\Delta = -\text{paidAmount}$
7. **Transaction Voiding Reversal**:
   - Marking any transaction as `isVoided = true` immediately removes its delta from the balance:
     $$\Delta_{\text{reversal}} = -\Delta_{\text{original}}$$
8. **Opening Balance**:
   $$\text{currentBalance} = \text{openingBalance} + \sum_{t \in \text{active}} \Delta_t$$

| Test ID | Test Case Name | Input / Scenario | Expected Output |
|---|---|---|---|
| **T2.1** | Standard Item Subtotal | Qty: `3.5`, Price: `12.50` | `43.75 SAR` |
| **T2.2** | Floating Point Summation Guard | 3 items: `0.10`, `0.20`, `0.70` | Exactly `1.00 SAR` (no IEEE-754 drift `0.9999999999999999`) |
| **T2.3** | Discount Capping (Over-Discount) | Subtotal: `100.00`, Discount: `150.00` | Discount capped at `100.00`, Net before tax: `0.00 SAR` |
| **T2.4** | Discount Capping (Exact Subtotal) | Subtotal: `50.00`, Discount: `50.00` | Net before tax: `0.00 SAR`, Tax: `0.00 SAR`, Total: `0.00 SAR` |
| **T2.5** | Standard VAT Calculation (15%) | Net: `1000.00`, Rate: `15%` | Tax: `150.00 SAR`, Total: `1150.00 SAR` |
| **T2.6** | Half-Up Rounding Boundary (Up) | Net: `10.33`, Rate: `15%` ($1.5495$) | Tax: `1.55 SAR`, Total: `11.88 SAR` |
| **T2.7** | Half-Up Rounding Boundary (Down) | Net: `10.01`, Rate: `15%` ($1.5015$) | Tax: `1.50 SAR`, Total: `11.51 SAR` |
| **T2.8** | Zero Tax Rate (VAT Disabled) | Net: `250.00`, Rate: `0%` | Tax: `0.00 SAR`, Total: `250.00 SAR` |
| **T2.9** | Customer Credit Sale Delta | Total: `1035.00`, Upfront Paid: `200.00` | Delta: `+835.00 SAR` (Customer debt increases) |
| **T2.10** | Customer Full Cash Sale Delta | Total: `500.00`, Upfront Paid: `500.00` | Delta: `0.00 SAR` (Customer debt unaffected) |
| **T2.11** | Customer Payment Receipt Delta | Paid: `400.00` | Delta: `-400.00 SAR` (Customer debt decreases) |
| **T2.12** | Distributor Supply Delta | Total: `3000.00`, Upfront Paid: `500.00` | Delta: `+2500.00 SAR` (Merchant payable increases) |
| **T2.13** | Distributor Payment Voucher Delta | Paid: `1000.00` | Delta: `-1000.00 SAR` (Merchant payable decreases) |
| **T2.14** | Transaction Voiding Reversal | Voiding Sale (+835.00 SAR) | Net balance rolls back by `-835.00 SAR` |
| **T2.15** | Opening Balance Preservation | Opening: `250.00`, Transactions: `+100`, `-50` | Balance: `300.00 SAR` |

---

### Tier 3: Build & Type Integrity Checks

Tier 3 executes programmatic verification of the TypeScript compiler and checks conformance with declared interface contracts in `PROJECT.md`.

| Test ID | Test Target | Verification Command / Check | Acceptance Threshold |
|---|---|---|---|
| **T3.1** | TypeScript Compilation | `npx tsc --noEmit` | Exit code 0, 0 compilation errors, 0 type diagnostic warnings. |
| **T3.2** | Hydration Contract | AST / Type presence of `LedgerStoreSubscriber` | `subscribe(callback: () => void): () => void` in `sqliteStorage.ts`. |
| **T3.3** | Security Hash Contract | AST / Type presence of `verifyAdminPin` | `verifyAdminPin(enteredPin: string): Promise<boolean>` in `licenseManager.ts`. |
| **T3.4** | Native PDF Engine Contract | AST / Type presence of `generateInvoicePdf`, `generateStatementPdf`, `shareOrDownloadPdf` | Exported functions returning `Promise<jsPDF>` without DOM element dependencies. |

---

### Tier 4: Simulated Merchant Ledger Workflow (Opaque-Box E2E Simulation)

Tier 4 executes an end-to-end, realistic multi-step accounting lifecycle representing a full business day for an SME merchant using "The Smart Dafter".

```
               SIMULATED BUSINESS DAY WORKFLOW
               
    [0. Store Setup] -> Profile: Al-Noor Mart (VAT 15%, Tax: 300123456700003)
                        Customer: Tariq (Opening: 150 SAR)
                        Distributor: Al-Qassim Dairy (Opening: 1200 SAR)
           |
    [1. Credit Sale] -> Tariq buys goods: 160 SAR - 10 SAR discount + 22.50 VAT = 172.50 SAR
                        Upfront Paid: 50 SAR => Delta: +122.50 SAR
                        Tariq Debt: 150 + 122.50 = 272.50 SAR
           |
    [2. Inventory]   -> Al-Qassim supplies goods: 2500 SAR
                        Upfront Paid: 500 SAR => Delta: +2000 SAR
                        Payable Debt: 1200 + 2000 = 3200 SAR
           |
    [3. Receipt]     -> Tariq pays 100 SAR on account => Delta: -100 SAR
                        Tariq Debt: 272.50 - 100 = 172.50 SAR
           |
    [4. Voucher]     -> Merchant pays Al-Qassim 1500 SAR => Delta: -1500 SAR
                        Payable Debt: 3200 - 1500 = 1700 SAR
           |
    [5. Void Error]  -> Step 3 Receipt was entered mistakenly; Void Receipt.
                        Voiding Reversal: Tariq Debt rolls back to 272.50 SAR.
           |
    [6. Dashboard]   -> Receivables: 272.50 SAR | Payables: 1700.00 SAR
                        Cash Today: 50.00 SAR   | Working Capital: -1427.50 SAR
           |
    [7. Statement]   -> Audit chronological ledger statement rows & running balances.
```

---

## 4. Test Runner Specifications (`scripts/verify-dafter.cjs`)

The automated runner is implemented in `scripts/verify-dafter.cjs`. It is a self-contained Node.js script using CommonJS for compatibility across Windows, Linux, and macOS without requiring a transpilation step.

### Running the Suite:

```bash
# Run all 4 tiers:
node scripts/verify-dafter.cjs

# Run specific tiers:
node scripts/verify-dafter.cjs --tier 1
node scripts/verify-dafter.cjs --tier 2
node scripts/verify-dafter.cjs --tier 3
node scripts/verify-dafter.cjs --tier 4

# Output machine-readable JSON:
node scripts/verify-dafter.cjs --json
```

### Exit Codes:
- `0`: All executed tests passed successfully.
- `1`: One or more tests failed. Full failure details and diagnostics printed to standard output.

---

## 5. Milestone Gating & Continuous Verification

| Milestone | Gate Criteria | Verification Action |
|---|---|---|
| **M1: Bug Fixes & Security** | Tier 1 (Bugs 1–7) PASS | `node scripts/verify-dafter.cjs --tier 1` |
| **M2: Native jsPDF Engine** | Tier 1 (Bug 8 html2canvas removal) + PDF Engine Contract PASS | `node scripts/verify-dafter.cjs --tier 1` |
| **M3: UX / UI Polish** | Zero console/runtime regressions; all touch targets & RTL styling verified | Manual check & visual audit |
| **M4: Financial Math** | Tier 2 (Math Invariants) & Tier 4 (Ledger Simulation) PASS | `node scripts/verify-dafter.cjs --tier 2,4` |
| **M5: Final Victory Audit** | 100% of Tiers 1, 2, 3, and 4 PASS; clean build | `node scripts/verify-dafter.cjs` |
