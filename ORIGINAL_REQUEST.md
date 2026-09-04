# Original User Request

## 2026-09-04T05:01:39Z

Comprehensive production-ready QA review and bug-fix pass on **"The Smart Dafter" (الدفتر الذكي)** — a bilingual (Arabic RTL / English LTR) React/TypeScript PWA for merchants to manage credit sales, invoicing, payment receipts, party ledgers, and account statements. The app uses jsPDF + html2canvas for PDF generation, localStorage + IndexedDB for data persistence, and targets both Android and iOS as a standalone PWA. Fix all identified bugs, rewrite the PDF generation pipeline for reliability, audit every screen for premium UX on both platforms, and verify all financial math is correct.

Working directory: c:\Users\bin-g\OneDrive\سطح المكتب\book\the-smart-dafter
Integrity mode: demo

## Requirements

### R1. Fix all identified bugs across the codebase

The following bugs have been identified through code audit and must all be fixed:

1. **ZATCA QR `vatNumber` → `taxNumber`**: In `src/components/InvoicePdfModal.tsx` (~line 76), `profile.vatNumber` is used but `BusinessProfile` in `src/types.ts` defines `taxNumber`. The VAT registration number is always undefined/empty in ZATCA QR codes. Fix to use `profile.taxNumber`.

2. **Ternary redundancy in `App.tsx` (~line 181)**: `remainingBalanceDelta: isCustomerReceipt ? -data.amount : -data.amount` — both branches return the same value. Determine the correct logic for customer receipt vs payment voucher and fix.

3. **Date locale inconsistency in `src/utils/formatters.ts` (~line 33)**: `formatDate` uses `'en-GB'` when `lang === 'ar'`, but `formatShortDate` correctly uses `'ar-SA'`. Make date formatting consistent for Arabic locale.

4. **IndexedDB hydration desynchronization in `src/db/sqliteStorage.ts`**: When localStorage is cleared but IndexedDB retains data, the UI won't render IndexedDB data until page refresh. Implement proper async hydration with state notification so the UI updates when IndexedDB data loads.

5. **License enforcement gap**: `checkCanCreateInvoice()` is only enforced on sale and supply modals. Payment receipts (`PaymentReceiptModal`) and payment vouchers bypass license checks entirely. Enforce license validation consistently across all transaction creation flows.

6. **Object URL memory leaks in PDF modals**: `URL.createObjectURL()` is called on every render cycle in `InvoicePdfModal.tsx` and `StatementPdfModal.tsx` without corresponding `URL.revokeObjectURL()` cleanup. Add proper cleanup in useEffect return functions.

7. **Client-side secret exposure**: `SECRET_SALT` and master PINs (`7788` / `DAFTAR-2026`) are hardcoded in client source. Move sensitive secrets to environment variables or a server-side validation flow, and at minimum obfuscate the admin access pattern.

8. **Multi-page PDF row splitting**: The current canvas-slicing approach in `pdfGenerator.ts` cuts table rows and text in half across page breaks. This must be resolved as part of R2.

### R2. Rewrite PDF generation from html2canvas to jsPDF direct drawing API

Replace the current fragile `html2canvas` → canvas → jsPDF pipeline with jsPDF's native text/shape drawing API for both invoice PDFs and statement PDFs. The new implementation must:

- Render Arabic text correctly with proper RTL cursive joining (use embedded fonts or a reliable Arabic font approach with jsPDF).
- Handle multi-page content with intelligent page breaks that never split table rows, text lines, or signature blocks.
- Generate ZATCA Phase 1 & 2 compliant QR codes embedded directly in the PDF.
- Support all existing PDF features: A4 portrait layout, invoice details, line items table, VAT breakdown, totals, party info, business header with logo, payment info, and footer notes.
- Support statement PDFs: party header, chronological ledger table with running balance, opening balance, totals summary.
- Maintain the native mobile sharing flow (`navigator.share` with File) and fallback download mechanisms.
- Eliminate the 450ms pre-render timer hack — generate PDFs synchronously or with a clean async pattern.

### R3. Full UX audit and fixes for all screens on Android and iOS

Review every screen and modal in the app for premium UX quality on both Android (Chrome/Samsung Browser) and iOS (Safari). This covers:

- **All 7 main views/tabs**: Dashboard, Party Directory, Party Ledger, Product Catalog, Settings, and the MobileFrame shell.
- **All 9 modals**: InvoiceCreator, PaymentReceipt, InvoicePdf, StatementPdf, PhonePairing, StoreSetupWizard, SecurityGuard, AdminKeyGenerator, PWAInstallBanner.
- **Cross-cutting concerns**: RTL/LTR layout consistency, safe area padding (notches, gesture bars), touch target sizing (minimum 44×44px), tap feedback, scroll behavior, loading states, empty states, error states, animation smoothness, color contrast and readability, font rendering.
- **Button audit**: Every button and interactive element must trigger its intended action. No dead buttons, no missing handlers, no broken navigation paths.
- **Responsive behavior**: Correct rendering in both the simulated mobile chassis (desktop) and native standalone PWA mode (mobile).

### R4. Verify all financial math and data integrity

Audit every financial calculation in the codebase to ensure correctness:

- Invoice subtotals, discount application, VAT calculation, and total computation in `InvoiceCreatorModal.tsx`.
- Party balance calculation logic in `sqliteStorage.ts` (`calculatePartyBalance`) — verify the running balance algorithm for both customers and distributors.
- Dashboard metrics aggregation (`getDashboardMetrics`) — verify totalOwedToMe, totalIOwe, cashCollectedToday, netWorkingCapital.
- Ledger running balance display in `PartyLedgerView.tsx` and `StatementPdfModal.tsx` — verify it matches the stored balance.
- Rounding consistency: all financial values must use consistent 2-decimal rounding throughout.
- Edge cases: zero amounts, negative balances, voided transactions, opening balances, currency formatting.

## Acceptance Criteria

### Bug Fixes
- [ ] ZATCA QR codes contain the correct tax registration number from `profile.taxNumber`
- [ ] The ternary in `App.tsx` for `remainingBalanceDelta` applies correct, distinct logic for customer receipts vs payment vouchers
- [ ] Arabic date formatting uses `'ar-SA'` locale consistently across all date formatting functions
- [ ] When localStorage is empty but IndexedDB has data, the UI loads and displays IndexedDB data without requiring a manual page refresh
- [ ] License validation is enforced before opening PaymentReceiptModal for both receipt vouchers and payment vouchers
- [ ] No `URL.createObjectURL()` calls exist without corresponding cleanup via `URL.revokeObjectURL()` in useEffect teardowns
- [ ] No plaintext secrets (salts, PINs) appear as string literals in client-side source code
- [ ] The app builds without TypeScript errors (`tsc --noEmit` passes)

### PDF Generation
- [ ] Invoice PDFs render with correctly joined Arabic cursive text (no disconnected glyphs)
- [ ] Multi-page invoices and statements have clean page breaks that never split table rows or text lines
- [ ] ZATCA QR code is embedded and scannable in generated invoice PDFs
- [ ] Statement PDFs display the complete ledger with running balance, opening balance, and totals
- [ ] PDFs can be shared via Web Share API on both Android and iOS
- [ ] PDFs can be downloaded as files on desktop browsers
- [ ] No pre-render timing hacks (setTimeout/450ms delays) in the PDF generation flow

### UX Quality
- [ ] All interactive elements (buttons, links, toggles, tabs) respond to user interaction and trigger the correct action
- [ ] RTL layout (Arabic) mirrors correctly with no overlapping elements, clipped text, or misaligned icons
- [ ] LTR layout (English) renders correctly with proper alignment and spacing
- [ ] Touch targets are at least 44×44px on all interactive elements
- [ ] No visual glitches when switching between Arabic and English languages
- [ ] Safe area insets are respected on devices with notches and gesture bars
- [ ] Empty states show meaningful messages (no blank screens)
- [ ] Loading states show appropriate indicators during async operations

### Math & Data Integrity
- [ ] Creating a credit sale invoice correctly updates the party balance by `(totalAmount - paidAmount)`
- [ ] Creating a payment receipt correctly decreases the customer's outstanding balance
- [ ] Creating a supply intake correctly increases the merchant's payable balance to the distributor
- [ ] Creating a payment voucher correctly decreases the merchant's payable balance
- [ ] Voiding a transaction correctly reverses its effect on the party balance
- [ ] Dashboard KPI totals (receivables, payables, cash collected today) match the sum of individual party balances and today's transactions
- [ ] Discount amount is capped at the items subtotal (cannot produce negative amounts)
- [ ] VAT calculation: `taxAmount = round(netBeforeTax × taxRate / 100, 2)` is applied consistently
- [ ] Opening balance is correctly included in the running balance calculation

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify no TypeScript compilation errors
- Run `npm run build` (or `npx vite build`) to verify the production build succeeds without errors
- Create a verification script that:
  - Greps for `vatNumber` references to confirm migration to `taxNumber`
  - Greps for `createObjectURL` and verifies each has a corresponding `revokeObjectURL`
  - Greps for hardcoded secret strings and confirms they've been removed/externalized
  - Validates that license check calls exist in all transaction creation flows
  - Checks that no `html2canvas` imports remain after the PDF rewrite
  - Verifies consistent Arabic locale usage in date formatters

### Manual Verification
- The user will test the built app on both an Android device and an iOS device to verify:
  - PDF generation and sharing works end-to-end
  - All buttons and navigation flows function correctly
  - Arabic/English switching works without visual glitches
  - Financial calculations produce correct results

## 2026-09-04T14:35:08Z

Build a modern, standalone mobile-first POS and Kitchen Display System (KDS) tailored for coffee shops, drive-thrus, and small restaurants. The application operates 100% on smartphones and tablets (eliminating expensive desktop PCs) using Supabase for sub-second real-time sync between Drive-Thru Attendants, Baristas/Kitchen, and Cashiers, with thermal/WhatsApp receipt generation, recipe-based inventory, regional debt tracking, and owner analytics.

Working directory: c:/Users/bin-g/OneDrive/سطح المكتب/book/coffee-pos
Integrity mode: demo

## Reused Battle-Tested Assets (Time-Saving Shortcut)
Import and leverage existing verified modules from `c:/Users/bin-g/OneDrive/سطح المكتب/book/the-smart-dafter`:
- `src/utils/arabicShaper.ts` (Arabic RTL glyph shaping & BiDi tokenization)
- `src/utils/fonts/arabicFont.ts` (Lazy-loaded TrueType Arabic font registration)
- `src/utils/zatca.ts` (ZATCA Phase 1 & 2 TLV Base64 QR code encoding)

## Requirements

### R1. Multi-Device Real-Time Synchronization & Role Isolation
- Use Supabase Realtime (Postgres Changes / Broadcast) for sub-second ticket state synchronization across mobile stations:
  1. **Drive-Thru / Order Taker Screen**: Mobile-optimized rapid ordering with car plate/token, beverage size, milk types, sweetness, and temperature modifiers.
  2. **Kitchen Display System (KDS)**: Dark-mode Kanban ticket board with live timers, visual urgency color codes (Green < 3m, Yellow 3-5m, Red > 5m), audio chime on new orders, and single-tap bump to "Ready".
  3. **Cashier Station**: Auto-refreshing queue of "Ready" orders, quick-cash calculator buttons (10, 20, 50, 100 SAR), Card/Mada, split payment, and customer credit (آجل).
  4. **Owner Management**: Live sales velocity, shift reports (X/Z Reports), profit margins, raw stock alerts, and PIN-protected access control.
- Role-based routing ensuring staff devices are locked to their specific station.

### R2. Order Lifecycle State Machine
- Strict state transitions: `NEW_ORDER` → `IN_PREPARATION` → `READY_FOR_PICKUP` → `COMPLETED` (or `VOIDED`/`CANCELLED`).
- Tagging support: Vehicle description / plate number (for drive-thru), buzzer/pager number, or customer name.
- Flexible item modifiers: sizes, milk choices (oat/almond/whole), syrups, extra shots, and barista text instructions.

### R3. Thermal Printing & Instant WhatsApp Receipts
- 58mm and 80mm ESC/POS thermal printing via Bluetooth / Network IP (port 9100) and Web Print API, featuring formatted Arabic headers, itemized table, and scannable ZATCA QR code.
- Instant digital receipt sharing via WhatsApp (`wa.me/<phone>?text=...`) and native mobile Web Share API with attached PDF.

### R4. Customer Debt/Credit (آجل) & Regional Filtering
- Customer directory with regional/neighborhood classification (e.g. *حي الياسمين*, *حي النرجس*).
- "Charge to Debt" (بيع آجل) payment option at checkout that updates customer ledger balance in real-time with credit limit validation.
- Regional filtering for accounts receivable, delivery routing, and targeted payment collection summaries.

### R5. Recipe-Based Inventory (Bill of Materials) & Stock Alerts
- Recipe mapping linking menu items to raw ingredients (e.g. 1 Spanish Latte deducts 18g coffee beans, 150ml milk, 30ml condensed milk, 1 cup, 1 lid).
- Automatic inventory depletion on order completion.
- Low-stock visual warnings and distributor restocking suggestions.

## Acceptance Criteria

### Real-Time Flow & Synchronization
- [ ] New order created on a mobile drive-thru interface appears on the Kitchen KDS in under 1 second with an audio chime.
- [ ] Marking an order as "Ready" on the KDS immediately updates the Cashier station's ready queue in under 1 second.
- [ ] Multiple attendants can submit orders concurrently without ID collisions or data overwrites.

### Mobile Ergonomics & Speed
- [ ] Drive-thru attendant can compose and submit a customized 2-item coffee order in under 5 taps.
- [ ] Cashier can complete a cash checkout with exact change calculation in under 3 taps.
- [ ] All views are fully responsive on 5.5"+ mobile screens with no awkward horizontal scrolling.

### Printing, ZATCA & Digital Receipts
- [ ] Thermal receipt preview renders correctly for both 58mm and 80mm formats with Arabic shaping and valid ZATCA TLV QR code.
- [ ] WhatsApp button initiates direct chat to the customer's phone number with formatted order summary and digital receipt link.

### Accounting, Debt & Recipes
- [ ] Completing a sale automatically deducts corresponding raw ingredients according to the defined recipe.
- [ ] Charging an order to customer credit accurately updates the customer's balance and attributes the transaction to the customer's designated region.

