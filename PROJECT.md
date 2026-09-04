# Project: Coffee POS & Kitchen Display System (KDS)

## Architecture
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Motion
- **Target Form Factor**: 100% Mobile-first (5.5"+ smartphones, phablets, and tablets) with role-locked stations
- **Realtime Sync**: Dual-layer `IRealtimeTransport`:
  - Production: Supabase Realtime (Broadcast channels for <100ms events + Postgres Changes CDC for durable state)
  - Demo/Offline: Native browser `BroadcastChannel` cross-tab sync (<50ms) + localStorage persistence
- **Station Roles**:
  1. **Drive-Thru / Order Taker**: Rapid customized ordering with plate/token tagging (<5 taps)
  2. **Kitchen Display System (KDS)**: Dark-mode Kanban, live elapsed timers, color urgency (<3m Green, 3-5m Yellow, >5m Red), Web Audio chime, single-tap bump
  3. **Cashier Station**: Auto-refreshing Ready queue, quick-cash calculator (10, 20, 50, 100 SAR, <3 taps), Card/Mada, split payments, customer credit (آجل)
  4. **Owner Management**: Sales velocity, shift reports (X/Z Reports), recipe-based COGS profit margins, raw stock alerts, PIN governance
- **Receipt & Printing Engine**:
  - 58mm & 80mm ESC/POS raster generation with Arabic glyph shaping via `arabicShaper.ts`
  - ZATCA Phase 1 & 2 TLV Base64 QR code via `zatca.ts`
  - WhatsApp direct link (`wa.me/<phone>?text=...`) and Web Share API with PDF via `arabicFont.ts`
- **Inventory & Accounting**:
  - Recipe-based Bill of Materials (BOM) with automatic stock depletion on `COMPLETED` orders
  - Customer credit ledger (آجل) with regional neighborhood classification (e.g. حي الياسمين, حي النرجس) and credit limit enforcement

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | S1-F01 Fast Catalog Grid | Swipeable category pills (Hot, Cold, Drip, Tea, Pastry) with visual cards | M2 | Survey / S1 |
| 2 | S1-F02 Modifier Modal | Sizes (S/M/L), milk (Oat/Almond/Whole), sweet (0-150%), temp, extra shots, syrups | M2 | Survey / S1 |
| 3 | S1-F03 Tagging System | Saudi plate number, vehicle color/model, buzzer/pager token, customer name | M2 | Survey / S1 |
| 4 | S1-F04 Rapid Dispatch | Sub-5 taps workflow for 2-item customized drive-thru order | M2 | Survey / S1 |
| 5 | S2-F01 KDS Dark Kanban | Glare-free dark theme (`#0F172A`), chronological ticket order | M2 | Survey / S2 |
| 6 | S2-F02 Live Urgency Timers | Elapsed MM:SS stopwatch: Green <3m, Yellow 3-5m, Red >5m pulsating | M2 | Survey / S2 |
| 7 | S2-F03 Modifier Visual Hierarchy | High-contrast quantity counter, colored modifier chips, callout barista notes | M2 | Survey / S2 |
| 8 | S2-F04 Audio Chime Synth | Web Audio API 3-tone ascending chime (zero external audio file dependency) | M2 | Survey / S2 |
| 9 | S2-F05 Single-Tap Bump | One-tap transition from `IN_PREPARATION` to `READY_FOR_PICKUP` | M2 | Survey / S2 |
| 10 | S2-F06 Recall/Undo Drawer | 60-second undo drawer to restore bumped orders to prep queue | M2 | Survey / S2 |
| 11 | S3-F01 Auto Ready Queue | Auto-refreshing queue of orders ready for pickup with plate/token badge | M3 | Survey / S3 |
| 12 | S3-F02 Quick-Cash Calculator | Denomination buttons (10, 20, 50, 100, 200, 500 SAR) + exact change in <3 taps | M3 | Survey / S3 |
| 13 | S3-F03 Payment Methods | Cash, Card/Mada, Split payment (Cash+Mada), and Customer Debt (آجل) | M3 | Survey / S3 |
| 14 | S3-F04 Rapid Checkout | 3-tap checkout sequence for cash settlements | M3 | Survey / S3 |
| 15 | S4-F01 Live Sales Velocity | Gross revenue, order count, AOV, orders/hour, payment breakdown | M4 | Survey / S4 |
| 16 | S4-F02 Shift Audits X/Z Reports | Non-resetting X-Report and final shift closure Z-Report with cash reconciliation | M4 | Survey / S4 |
| 17 | S4-F03 Recipe COGS & Margins | Real-time ingredient cost calculation and gross margin per item | M4 | Survey / S4 |
| 18 | S4-F04 Raw Stock Alert Center | Real-time ingredient levels, low-stock threshold warnings, reorder suggestions | M4 | Survey / S4 |
| 19 | S4-F05 Master PIN Governance | 4-digit PIN authentication protecting Owner station and sensitive overrides | M1 | Survey / S4 |
| 20 | Role Isolation & Persistence | Station locking to device, URL parameter routing, inactivity auto-lock | M1 | Survey / R1 |
| 21 | State Machine Engine | Deterministic transitions: NEW -> PREP -> READY -> COMPLETED / VOIDED | M1 | Survey / R2 |
| 22 | Dual-Layer Realtime Transport | Sub-second sync via Supabase Realtime + fallback BroadcastChannel engine | M1 | Survey / R1 |
| 23 | ESC/POS 58mm Thermal Print | Raw byte / canvas raster generation for 58mm mobile thermal printers | M3 | Survey / R3 |
| 24 | ESC/POS 80mm Thermal Print | 80mm thermal receipt format with Arabic shaping and itemized table | M3 | Survey / R3 |
| 25 | Arabic Glyph Shaping | Contextual Arabic letter joining & BiDi tokenization via `arabicShaper.ts` | M3 | Survey / R3 |
| 26 | ZATCA TLV Base64 QR Code | Saudi Phase 1 & 2 compliant QR code generation via `zatca.ts` | M3 | Survey / R3 |
| 27 | WhatsApp Direct Receipt | Instant chat link `wa.me/<phone>?text=...` with formatted order summary | M3 | Survey / R3 |
| 28 | Mobile Web Share PDF | Native share sheet with PDF receipt attachment via `arabicFont.ts` | M3 | Survey / R3 |
| 29 | Customer Debt Directory | Customer management with regional neighborhood classification (حي الياسمين...) | M4 | Survey / R4 |
| 30 | Charge to Debt Checkout | Real-time balance increase with credit limit validation | M4 | Survey / R4 |
| 31 | Regional Receivables Filter | Filter accounts receivable and delivery routes by neighborhood | M4 | Survey / R4 |
| 32 | Recipe BOM Mapping | Relational ingredient mapping per menu item and size | M4 | Survey / R5 |
| 33 | Atomic Stock Depletion | Automatic deduction of raw ingredients upon order reaching `COMPLETED` | M4 | Survey / R5 |
| 34 | Stock Reversal on Void | Automatic ingredient and balance restoration upon order `VOIDED` | M4 | Survey / R5 |
| 35 | Distributor Reorder Advice | Automatic purchase order suggestions for depleted ingredients | M4 | Survey / R5 |
| 36 | Mobile Responsive Shell | 5.5"+ responsive mobile chassis with safe area insets and zero horizontal scroll | M1 | Survey / UX |
| 37 | E2E Test Suite (Tiers 1-4) | Comprehensive test suite covering all features, boundaries, pairs, scenarios | E2E | Dual Track |
| 38 | Adversarial Coverage Hardening | Tier 5 adversarial stress testing and concurrency simulation | M5 | Dual Track |
| 39 | Forensic Integrity Verification | Systematic static, runtime, and anti-mock integrity verification | M5 | Audit |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Test Suite Infrastructure & Test Cases | Test runner, Tiers 1-4 test cases (Feature, Boundary, Pairwise, Real-World), TEST_READY.md | none | DONE |
| M1 | Core Scaffolding, Models, Realtime Transport & Role Isolation | Project scaffold in `coffee-pos`, types, state machine, IRealtimeTransport, station routing & PIN lock | none | DONE |
| M2 | Drive-Thru Ordering & Kitchen Display System (KDS) | Fast catalog (<5 taps), modifier modal, plate tagging, dark KDS Kanban, timers, color urgency, audio chime, bump to ready | M1 | DONE |
| M3 | Cashier Quick-Checkout, ESC/POS Printing & Digital Receipts | Auto Ready queue, quick-cash (<3 taps), Card/Mada/Split, 58/80mm ESC/POS with Arabic & ZATCA QR, WhatsApp & Web Share | M1, M2 | IN_PROGRESS |
| M4 | Customer Debt (آجل), Regional Ledger & Recipe BOM Inventory | Customer regional directory, credit limit validation, recipe BOM mapping, atomic stock depletion on complete, X/Z reports | M1, M2, M3 | PLANNED |
| M5 | 100% E2E Pass, Adversarial Hardening (Tier 5) & Forensic Audit | Full test pass against TEST_READY.md, concurrency stress, adversarial tests, forensic integrity veto check | M1, M2, M3, M4, E2E | PLANNED |

## Interface Contracts

### IRealtimeTransport
```typescript
export type RealtimeEventType = 
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_BUMPED'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'STOCK_UPDATED'
  | 'CUSTOMER_CREDIT_UPDATED';

export interface RealtimeEnvelope<T = any> {
  id: string;
  type: RealtimeEventType;
  timestamp: string;
  stationId: string;
  payload: T;
  syncSource: 'supabase' | 'broadcast_channel' | 'local_memory';
}

export interface IRealtimeTransport {
  publish<T>(event: Omit<RealtimeEnvelope<T>, 'id' | 'timestamp' | 'syncSource'>): Promise<void>;
  subscribe<T>(eventType: RealtimeEventType, handler: (event: RealtimeEnvelope<T>) => void): () => void;
  getTransportName(): 'supabase' | 'broadcast_channel' | 'local_memory';
}
```

### Order State Transitions
```typescript
export type OrderStatus = 'NEW_ORDER' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'VOIDED';

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    NEW_ORDER: ['IN_PREPARATION', 'VOIDED'],
    IN_PREPARATION: ['READY_FOR_PICKUP', 'VOIDED'],
    READY_FOR_PICKUP: ['COMPLETED', 'IN_PREPARATION', 'VOIDED'],
    COMPLETED: ['VOIDED'],
    VOIDED: []
  };
  return allowed[current].includes(next);
}
```

### Recipe BOM Depletion
```typescript
export interface RecipeItem {
  ingredientId: string;
  quantityRequired: number; // e.g., 18 (grams), 150 (ml), 1 (piece)
}

export interface DepletionResult {
  ingredientId: string;
  previousStock: number;
  newStock: number;
  depletedQuantity: number;
  isLowStock: boolean;
}
```

## Code Layout
`c:\Users\bin-g\OneDrive\سطح المكتب\book\the-smart-dafter\coffee-pos/`
```
coffee-pos/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── types.ts                    # Universal domain types (Order, Item, Station, Customer, Recipe)
│   ├── state/
│   │   ├── orderStateMachine.ts    # Formal deterministic state transitions
│   │   ├── store.ts                # In-memory reactive state with persistence
│   │   └── mockData.ts             # Initial coffee menu, recipes, ingredients, customers
│   ├── realtime/
│   │   ├── transport.ts            # IRealtimeTransport interface
│   │   ├── supabaseTransport.ts    # Supabase Realtime implementation
│   │   └── broadcastTransport.ts   # Native BroadcastChannel cross-tab implementation
│   ├── stations/
│   │   ├── DriveThruStation.tsx    # Station 1: Fast catalog, modifiers, car plate (<5 taps)
│   │   ├── KdsStation.tsx          # Station 2: Dark Kanban, timers, color urgency, chime, bump
│   │   ├── CashierStation.tsx      # Station 3: Ready queue, quick-cash (<3 taps), split, debt
│   │   └── OwnerStation.tsx        # Station 4: Analytics, X/Z reports, BOM margins, stock
│   ├── components/
│   │   ├── StationRouter.tsx       # Station lock, PIN authentication modal, role switcher
│   │   ├── ModifierModal.tsx       # Size, milk, sweet, temp, shots, syrup customizer
│   │   ├── ReceiptModal.tsx        # ESC/POS 58/80mm preview, WhatsApp link, PDF Web Share
│   │   └── QuickCashCalculator.tsx # 10, 20, 50, 100 SAR buttons + change display
│   ├── audio/
│   │   └── chimeSynth.ts           # Web Audio API 3-tone ascending chime
│   ├── printing/
│   │   ├── escpos.ts               # 58mm & 80mm ESC/POS raster byte generator
│   │   ├── zatcaQr.ts              # TLV Base64 QR generator (importing zatca.ts)
│   │   └── pdfReceipt.ts           # jsPDF Arabic receipt generator (importing arabicShaper & arabicFont)
│   ├── inventory/
│   │   └── bomEngine.ts            # Recipe mapping, atomic depletion, low stock alerts
│   ├── customers/
│   │   └── debtLedger.ts           # Customer credit (آجل), regional filtering, credit limits
│   └── utils/
│       ├── arabicShaper.ts         # Direct copy/import from the-smart-dafter
│       ├── arabicFont.ts           # Direct copy/import from the-smart-dafter
│       ├── zatca.ts                # Direct copy/import from the-smart-dafter
│       └── formatters.ts           # Currency, SAR, phone sanitizer, WhatsApp link builder
└── tests/
    ├── e2e_harness.ts              # E2E test runner
    ├── tier1_features.test.ts      # Feature coverage
    ├── tier2_boundaries.test.ts    # Boundary & edge cases
    ├── tier3_pairwise.test.ts      # Cross-feature combinations
    └── tier4_workloads.test.ts     # Real-world application scenarios
```
