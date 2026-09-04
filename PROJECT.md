# Project: The Smart Dafter (الدفتر الذكي) Production-Ready QA & Bug-Fix

## Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS (v4)
- **Data Layer**: In-memory store backed by localStorage & IndexedDB (`idbStorage.ts`, `sqliteStorage.ts`)
- **PDF Engine**: Native jsPDF direct vector drawing API with Arabic RTL font embedding, contextual shaping, BiDi token preservation, ZATCA TLV QR code embedding, and mobile Web Share / desktop download
- **Design System**: Mobile-first PWA with desktop mobile frame chassis, bidirectional RTL/LTR support, safe-area inset adaptation, and WCAG AA compliance

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | ZATCA QR `taxNumber` | Fix `profile.vatNumber` to `profile.taxNumber` in `InvoicePdfModal.tsx` | M1 | Survey / Bug 1 |
| 2 | App remainingBalanceDelta | Replace redundant ternary in `App.tsx:181` with `-data.amount` | M1 | Survey / Bug 2 |
| 3 | Date locale `ar-SA` | Fix `formatDate` in `src/utils/formatters.ts` to use `'ar-SA'` for Arabic | M1 | Survey / Bug 3 |
| 4 | IndexedDB async hydration | Add observer/subscriber pattern to `sqliteStorage.ts` to notify `App.tsx` on IDB load | M1 | Survey / Bug 4 |
| 5 | License enforcement gap | Enforce `checkCanCreateInvoice()` on receipt and voucher creation in `App.tsx` | M1 | Survey / Bug 5 |
| 6 | Object URL leak cleanup | Add `URL.revokeObjectURL()` cleanup in `useEffect` in PDF modals | M1 | Survey / Bug 6 |
| 7 | Secret exposure obfuscation | Externalize salt, SHA-256 hash check for admin PINs, remove hardcoded secret strings | M1 | Survey / Bug 7 |
| 8 | Native jsPDF engine | Direct vector drawing replacing `html2canvas` without DOM dependency | M2 | Survey / R2 |
| 9 | Arabic RTL cursive shaping | Contextual glyph joining and number-preserving BiDi in jsPDF via `arabicShaper.ts` | M2 | Survey / R2 |
| 10 | Arabic font embedding | Lazy-loaded TrueType Arabic font registered with jsPDF Identity-H | M2 | Survey / R2 |
| 11 | Intelligent multi-page layout | Atomic coordinate pagination preventing row/text slicing across pages (Bug 8) | M2 | Survey / Bug 8 |
| 12 | Repeated table headers | Re-draw table headers at top of subsequent pages on multi-page statements | M2 | Survey / R2 |
| 13 | Direct ZATCA QR embedding | Render TLV Phase 1/2 QR directly into jsPDF canvas vector space | M2 | Survey / R2 |
| 14 | Zero-timeout PDF generation | Eliminate 450ms `setTimeout` hacks in PDF modals | M2 | Survey / R2 |
| 15 | Web Share & desktop download | Native mobile `navigator.share` with File and desktop `doc.save()` fallback | M2 | Survey / R2 |
| 16 | Safe area insets | Add `env(safe-area-inset-bottom)` to all bottom sheets and mobile modals | M3 | Survey / R3 |
| 17 | 44px touch targets | Enlarge 27+ small buttons (void button, chips, close icons, action buttons) to >=44px | M3 | Survey / R3 |
| 18 | WCAG AA color contrast | Replace low contrast `text-*-300` on `bg-*-50` with high contrast `text-*-700` | M3 | Survey / R3 |
| 19 | Tailwind utility classes | Fix invalid classes (`hover:bg-slate-750`, `py-0.2`, `z-60`, `z-70`) | M3 | Survey / R3 |
| 20 | Dead UI elements | Implement `freshStart` toggle in StoreSetupWizard, date filter in StatementPdfModal | M3 | Survey / R3 |
| 21 | RTL switch mirroring | Fix toggle knob inversion in `SettingsView.tsx` by wrapping in `dir="ltr"` | M3 | Survey / R3 |
| 22 | PWA theme consistency | Update `manifest.json` theme and background colors to `#F8FAFC` | M3 | Survey / R3 |
| 23 | Modal loading suspense | Replace `<Suspense fallback={null}>` with animated spinner | M3 | Survey / R3 |
| 24 | Invoice calculations | Subtotal, discount capped at subtotal, VAT 2-decimal rounding, total computation | M4 | Survey / R4 |
| 25 | Balance reconciliation | Positive debt convention for customer receivables and distributor payables | M4 | Survey / R4 |
| 26 | Dashboard metrics | `totalOwedToMe`, `totalIOwe`, `cashCollectedToday`, `netWorkingCapital` | M4 | Survey / R4 |
| 27 | Transaction voiding | Reversal of transactions updating running balance | M4 | Survey / R4 |
| 28 | Comprehensive verification suite | Automated test script verifying all acceptance criteria, compilation, and build | E2E | Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Bug Fixes & Security Hardening | Bugs 1–7: ZATCA taxNumber, App ternary, formatters ar-SA, IDB hydration, license check, Object URL cleanup, secret obfuscation | none | DONE |
| M2 | Native jsPDF Engine Rewrite | Bug 8 & R2: arabicShaper.ts, arabicFont.ts, pdfGenerator.ts rewrite, remove html2canvas, modal integration | M1 | DONE |
| M3 | UX/UI Audit & Screen Remediation | R3: Safe areas, >=44px touch targets, WCAG AA contrast, Tailwind fixes, dead UI flows, RTL toggle | M1 | DONE |
| M4 | Financial Math & Verification Suite | R4 & Verification: Math validation, automated acceptance test script, full build test | M1, M2, M3 | DONE |
| M5 | Final E2E Test Pass & Victory Audit | 100% test pass, clean tsc --noEmit, clean npm run build, forensic audit veto check | M1, M2, M3, M4 | DONE |

## Interface Contracts

### sqliteStorage.ts ↔ App.tsx (Hydration Notification)
```typescript
export interface LedgerStoreSubscriber {
  (): void;
}
// SQLiteLedgerStore methods:
subscribe(callback: LedgerStoreSubscriber): () => void;
```

### licenseManager.ts (Secret Obfuscation)
```typescript
// Admin PIN hash verification using Web Crypto SHA-256:
export async function verifyAdminPin(enteredPin: string): Promise<boolean>;
// Salt retrieval with fallback:
export function getSecretSalt(): string;
```

### pdfGenerator.ts (Native jsPDF API)
```typescript
export interface GenerateInvoicePdfOptions {
  profile: BusinessProfile;
  transaction: Transaction;
  party: Party;
  zatcaQrDataUrl?: string;
  isVatApplied?: boolean;
}

export interface GenerateStatementPdfOptions {
  profile: BusinessProfile;
  party: Party;
  transactions: Transaction[];
  startDate?: string;
  endDate?: string;
}

export async function generateInvoicePdf(options: GenerateInvoicePdfOptions): Promise<jsPDF>;
export async function generateStatementPdf(options: GenerateStatementPdfOptions): Promise<jsPDF>;
export async function shareOrDownloadPdf(doc: jsPDF, fileName: string, title?: string): Promise<boolean>;
```

## Code Layout
- `src/components/`: UI views and modals (all owned per milestone scope)
- `src/db/`: Storage and database models (`sqliteStorage.ts`, `idbStorage.ts`)
- `src/services/`: Core services (PDF generation `pdfGenerator.ts`, etc.)
- `src/utils/`: Utilities (`formatters.ts`, `licenseManager.ts`, `arabicShaper.ts`, `fonts/`)
- `scripts/`: Verification runner (`scripts/verify-dafter.cjs`)
