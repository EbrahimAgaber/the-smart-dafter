# Comprehensive E2E Testing Infrastructure (4-Tier Verification Suite)

**Project**: Coffee POS & Kitchen Display System (KDS)  
**Track**: Mobile-First Coffee POS & Real-Time Kitchen Workflow E2E Testing Track  
**Artifact**: `TEST_INFRA.md`  
**Test Runner Command**: `npx tsx tests/run_all_tests.ts` (or `npx tsx coffee-pos/tests/e2e_harness.ts`)  
**Authoritative Specification Sources**: `ORIGINAL_REQUEST.md` (Lines 127–189), `PROJECT.md`, `spec_miner_pos/handoff.md`, `explorer_realtime_kds/handoff.md`  

---

## 1. Executive Overview & Testing Philosophy

The **Coffee POS & Kitchen Display System (KDS)** is a high-velocity, 100% mobile-first POS and kitchen orchestration system built for specialty coffee shops, drive-thrus, and quick-service cafes. Operating on smartphones and tablets (5.5"+ touchscreens), it manages multi-station real-time synchronization, recipe-based raw ingredient depletion (BOM), customer credit ledgers (آجل) categorized by Saudi neighborhoods, and ZATCA Phase 1 & 2 compliant tax receipts.

To guarantee zero regression, rock-solid sub-second workflow execution, and regulatory compliance, the testing infrastructure implements the standard **4-Tier Verification Framework**:

```
+-------------------------------------------------------------------------------+
|                      4-TIER COFFEE POS & KDS VERIFICATION                     |
+-------------------------------------------------------------------------------+
| Tier 1: Feature Coverage (>=5 Tests per Functional Domain)                    |
|         - Drive-thru ordering, customizer modal, Saudi vehicle plate tagging  |
|         - KDS dark Kanban, live timers, urgency colors, Web Audio chime, bump |
|         - Cashier ready queue, quick-cash calculator, Mada, split, debt       |
|         - Owner analytics, X-Report, Z-Report, master PIN governance          |
|         - ESC/POS thermal formatting (58/80mm), Arabic RTL, ZATCA TLV QR      |
|         - Customer debt (آجل) balance update & credit limit enforcement       |
|         - Recipe BOM relational mapping & atomic raw ingredient depletion     |
+-------------------------------------------------------------------------------+
| Tier 2: Boundary Value Analysis (BVA) & Corner Cases (>=5 Tests per Domain)   |
|         - Exact payment, underpayment rejection, 500 SAR large bill change     |
|         - Credit limit boundary (exact limit allowed vs limit + 0.01 rejected)|
|         - Saudi plate formatting (empty, Arabic chars, 50-char max string)    |
|         - KDS urgency stopwatch transitions: 2:59 green, 3:00 yellow, 5:00 red|
|         - KDS 60-second bump undo window: 59s valid vs 60s expired            |
|         - Recipe stock exact 0, negative stock prevention, stock void rollback|
+-------------------------------------------------------------------------------+
| Tier 3: Pairwise Combinatorial Cross-Feature Interactions                     |
|         - Drive-Thru customizer -> KDS bump -> Cashier cash -> BOM depletion  |
|         - Drive-Thru plate tag -> KDS bump -> Cashier debt -> Region ledger   |
|         - KDS bump -> Barista recall -> Cashier ready queue drop              |
|         - Order completion -> Void order -> BOM restoration & debt rollback  |
+-------------------------------------------------------------------------------+
| Tier 4: Real-World High-Stress Workload Scenarios (>=5 Complex Scenarios)     |
|         - Scenario 1: Morning rush hour (5 concurrent drive-thru orders)      |
|         - Scenario 2: Catering bulk order with split payment (Cash + Mada)    |
|         - Scenario 3: Regional delivery batch charged to credit in حي الياسمين|
|         - Scenario 4: Shift handover (mid-shift X-Report -> EOD Z-Report)     |
|         - Scenario 5: High-stress out-of-stock guard & void recovery rush     |
+-------------------------------------------------------------------------------+
```

---

## 2. Category-Partition Test Analysis

The system is decomposed into 7 functional domains. Each domain is partitioned into distinct operational categories, environmental conditions, and test choices:

### Domain 1: Drive-Thru Ordering & Beverage Customizer
- **Category 1.1: Product Catalog Selection**
  - *Choices*: Hot Coffee (Espresso, Spanish Latte, Flat White), Iced Coffee (Iced Macchiato, Cold Brew), Manual Drip (V60 Ethiopian), Pastries (Butter Croissant).
- **Category 1.2: Size Modifier & Price Deltas**
  - *Choices*: Small (8oz, +0 SAR), Medium (12oz, +3 SAR), Large (16oz, +5 SAR).
- **Category 1.3: Milk Alternatives & Surcharges**
  - *Choices*: Whole Milk (default, +0 SAR), Skimmed (+0 SAR), Oat Milk (+3 SAR), Almond Milk (+3 SAR), Coconut Milk (+3 SAR).
- **Category 1.4: Sweetness Levels**
  - *Choices*: 0% (بدون سكر), 25% (خفيف), 50% (وسط), 100% (عادي), 150% (زيادة).
- **Category 1.5: Temperature & Ice Profile**
  - *Choices*: Hot, Extra Hot, Iced, Light Ice, No Ice.
- **Category 1.6: Espresso Strength & Syrups**
  - *Choices*: Single (+0), Double Shot (+4 SAR), Triple Shot (+7 SAR), Vanilla (+3 SAR), Pistachio (+5 SAR).
- **Category 1.7: Vehicle & Order Tagging**
  - *Choices*: Saudi plate number (`أ ب ج 1234`), Buzzer/Pager token (`#14`), Dine-in table, Customer name.
- **Category 1.8: Tap Ergonomics**
  - *Choices*: Sub-5 tap order sequence for a 2-item customized drive-thru order.

### Domain 2: Kitchen Display System (KDS)
- **Category 2.1: Visual Theme & Queue Discipline**
  - *Choices*: Pure dark theme (`#0F172A`), chronological order sorting by `createdAt` timestamp.
- **Category 2.2: Live Urgency Stopwatch**
  - *Choices*: `< 180s` (Green), `180s .. 299s` (Yellow), `>= 300s` (Red pulsating).
- **Category 2.3: Audio Chime Trigger**
  - *Choices*: Web Audio API 3-tone ascending chime triggered strictly on `ORDER_CREATED` event arrival.
- **Category 2.4: Bump Action**
  - *Choices*: Single-tap transition from `IN_PREPARATION` to `READY_FOR_PICKUP`.
- **Category 2.5: Undo / Recall Window**
  - *Choices*: Restores bumped ticket back to `IN_PREPARATION` if requested within `< 60s`; rejected if `>= 60s`.

### Domain 3: Cashier Station & Quick Checkout
- **Category 3.1: Auto Ready Queue**
  - *Choices*: Real-time list of orders in `READY_FOR_PICKUP` status with vehicle plate / token badge.
- **Category 3.2: Quick-Cash Calculator**
  - *Choices*: Preset SAR denominations: [10, 20, 50, 100, 200, 500], "Exact Cash" button, change due computation (`Change = Tendered - Total`).
- **Category 3.3: Payment Methods**
  - *Choices*: Cash (`CASH`), Card/Mada (`CARD`), Split (`SPLIT`: Cash + Card), Customer Debt (`DEBT`: آجل).
- **Category 3.4: Sub-3-Tap Checkout**
  - *Choices*: Tap Ready Order -> Tap Denomination -> Tap Settle & Print.

### Domain 4: Owner Station Analytics, X/Z Reports & PIN Governance
- **Category 4.1: Real-Time Operational KPIs**
  - *Choices*: Gross Sales SAR, Total Orders, Average Order Value (AOV), Average Preparation Time, Payment Method Breakdown.
- **Category 4.2: Mid-Shift X-Report**
  - *Choices*: Non-resetting shift snapshot; tracks cash in drawer, card total, credit total, voided items without closing shift.
- **Category 4.3: End-of-Day Z-Report**
  - *Choices*: Final shift closure; physical cash count input, over/short variance calculation, shift lock flag.
- **Category 4.4: Master PIN Governance**
  - *Choices*: 4-digit master PIN challenge (`7788`) protecting Station 4 access, discount overrides, and manager voids.

### Domain 5: Thermal Printing (58/80mm), Arabic RTL & ZATCA TLV QR
- **Category 5.1: Thermal Raster Formatting**
  - *Choices*: 58mm ESC/POS (32-character columns), 80mm ESC/POS (48-character columns) with centered store header and cut commands.
- **Category 5.2: Arabic Glyph Shaping & BiDi Reordering**
  - *Choices*: Unicode Presentation Forms-B mapping (`arabicShaper.ts`), Lam-Alef ligatures, numeric BiDi preservation.
- **Category 5.3: ZATCA Phase 1 & 2 TLV Base64 QR Code**
  - *Choices*: 5 TLV Tags (Tag 1 Seller Name, Tag 2 VAT Number 15 digits, Tag 3 ISO Timestamp, Tag 4 Total with VAT, Tag 5 VAT Amount).
- **Category 5.4: Digital Receipt Channels**
  - *Choices*: WhatsApp direct link (`https://wa.me/<phone>?text=...`), Web Share PDF attachment.

### Domain 6: Customer Debt (آجل) & Regional Classification
- **Category 6.1: Customer Master Data**
  - *Choices*: Customer name, mobile phone, regional neighborhood (e.g. `حي الياسمين`, `حي النرجس`, `حي الصحافة`), credit limit, current debt balance.
- **Category 6.2: Charge to Debt Transaction**
  - *Choices*: `newBalance = currentBalance + orderTotal`; validated against `creditLimit`.
- **Category 6.3: Debt Repayment Voucher**
  - *Choices*: `newBalance = currentBalance - paymentAmount`.
- **Category 6.4: Regional Receivables Filtering**
  - *Choices*: Filter accounts receivable ledger by Saudi neighborhood.

### Domain 7: Recipe Bill of Materials (BOM) & Inventory Depletion
- **Category 7.1: BOM Mapping per Item & Size**
  - *Choices*: Spanish Latte (Medium: 18g coffee beans, 150ml milk, 30ml condensed milk, 1 cup, 1 lid; Large: 24g beans, 220ml milk, 45ml condensed milk, 1 large cup, 1 lid).
- **Category 7.2: Atomic Stock Depletion**
  - *Choices*: Deducts raw materials on `COMPLETED` order state transition.
- **Category 7.3: Low Stock Warnings & Distributor Reorder Suggestions**
  - *Choices*: Flag `isLowStock = true` when `currentStock <= minThreshold`; compute suggested order `optimalStock - currentStock`.
- **Category 7.4: Stock Restoration on Void**
  - *Choices*: When order transitioned to `VOIDED`, automatically reverse depleted ingredient quantities.

---

## 3. Boundary Value Analysis (BVA) & Corner Cases

| Boundary ID | Domain | Input Value / Parameter | Boundary Condition | Expected System Behavior | Authoritative Reference |
|---|---|---|---|---|---|
| **BVA-PAY-01** | Payment | Tendered == Total (e.g., 28.00 SAR for 28.00 SAR) | Exact payment amount | Change due == 0.00 SAR; Checkout approved | R1, PROJECT.md #12 |
| **BVA-PAY-02** | Payment | Tendered < Total (e.g., 25.00 SAR for 28.00 SAR) | Underpayment | Transaction rejected; Error "Insufficient cash tendered" | R1, S3-F02 |
| **BVA-PAY-03** | Payment | Tendered == 500.00 SAR for 15.00 SAR order | Maximum Saudi bill | Change due == 485.00 SAR; Valid calculation | R1, S3-F02 |
| **BVA-PAY-04** | Payment | Tendered == 0.00 SAR | Zero amount | Transaction rejected | Invariant |
| **BVA-PAY-05** | Split Pay | Cash (20.00) + Mada (15.00) == 35.00 SAR Total | Exact split coverage | Approved; records multi-tender ledger entries | R1, S3-F03 |
| **BVA-CRD-01** | Debt (آجل) | Balance (900) + Order (100) == Limit (1000) | Exact credit limit | Approved; new balance = 1000.00 SAR | R4, PROJECT.md #30 |
| **BVA-CRD-02** | Debt (آجل) | Balance (900) + Order (100.01) > Limit (1000) | Limit exceeded by 0.01 SAR | Rejected; Error "Credit limit exceeded" | R4, PROJECT.md #30 |
| **BVA-CRD-03** | Debt (آجل) | Customer credit limit == 0.00 SAR | Zero credit allowance | Any debt charge rejected | R4, PROJECT.md #30 |
| **BVA-CRD-04** | Debt (آجل) | Pre-paid customer balance == -50.00 SAR | Deposit in store favor | Debt charge of 30.00 SAR yields -20.00 SAR | R4, Accounting Math |
| **BVA-PLT-01** | Tagging | Vehicle plate == "" (empty string) | Empty plate field | Order allowed with fallback auto-generated token | R2, S1-F03 |
| **BVA-PLT-02** | Tagging | Plate == "أ ب ج 1234" | Standard Saudi plate | Formatted and preserved on KDS and receipt | R2, S1-F03 |
| **BVA-PLT-03** | Tagging | Plate == 50 alphanumeric characters | Maximum string length | Preserved or safely truncated without UI crash | UX Audit |
| **BVA-KDS-01** | Urgency Timer | Elapsed == 179s (2:59) | Green upper boundary | Urgency level = `'green'` | R1, S2-F02 |
| **BVA-KDS-02** | Urgency Timer | Elapsed == 180s (3:00) | Yellow lower boundary | Urgency level = `'yellow'` | R1, S2-F02 |
| **BVA-KDS-03** | Urgency Timer | Elapsed == 299s (4:59) | Yellow upper boundary | Urgency level = `'yellow'` | R1, S2-F02 |
| **BVA-KDS-04** | Urgency Timer | Elapsed == 300s (5:00) | Red lower boundary | Urgency level = `'red'`, pulsating animation flag | R1, S2-F02 |
| **BVA-KDS-05** | Urgency Timer | Elapsed == 930s (15:30) | High rush delay | Urgency level remains `'red'` | S2-F02 |
| **BVA-UND-01** | KDS Bump Undo| Elapsed since bump == 0s | Immediate undo | Restored to `IN_PREPARATION` | R1, S2-F06 |
| **BVA-UND-02** | KDS Bump Undo| Elapsed since bump == 59s | Undo upper boundary | Restored to `IN_PREPARATION` | R1, S2-F06 |
| **BVA-UND-03** | KDS Bump Undo| Elapsed since bump == 60s | Expiry exact boundary | Rejected; Undo window expired | R1, S2-F06 |
| **BVA-UND-04** | KDS Bump Undo| Elapsed since bump == 61s | Past expiry | Rejected; Undo window expired | R1, S2-F06 |
| **BVA-BOM-01** | Inventory | Stock (18g) - Required (18g) == 0g | Exact 0 stock boundary | Stock depleted to 0g; `isLowStock=true`, `outOfStock=true` | R5, PROJECT.md #33 |
| **BVA-BOM-02** | Inventory | Stock (15g) < Required (18g) | Insufficient stock | Depletion rejected or critical stockout error | R5, PROJECT.md #33 |
| **BVA-BOM-03** | Inventory | Stock before (100g) -> depleted 18g -> void order | Stock void restoration | Stock restored to exactly 100g | R5, PROJECT.md #34 |

---

## 4. Pairwise Combinatorial Interaction Matrix (Tier 3)

Combinatorial interaction testing verifies that orthogonal features operate correctly when combined in stateful, asynchronous workflows:

```
[Drive-Thru Ordering] ----+
                          |--> [KDS Kitchen Display] ----+
[Vehicle Tagging] --------+                              |--> [Cashier Settlement] ----> [BOM Inventory & Accounting]
                                                         |
[Modifier Customizer] -----------------------------------+
```

### Pair 1: Drive-Thru Customizer -> KDS Bump -> Cashier Cash -> BOM Stock Depletion
- **Input**: Customer orders Spanish Latte (Large, Oat Milk, +1 Extra Shot, Vanilla Syrup).
- **Flow**:
  1. Attendant selects custom modifiers. Item price calculated dynamically: 20 (base) + 5 (large) + 3 (oat) + 4 (shot) + 3 (vanilla) = 35.00 SAR.
  2. Order created (`NEW_ORDER`) and broadcast to KDS in <1s.
  3. KDS shows high-contrast modifier chips (Oat Milk, Extra Shot, Vanilla).
  4. Barista bumps order to `READY_FOR_PICKUP`.
  5. Cashier receives ticket in Ready Queue and settles with 50.00 SAR cash (15.00 SAR change).
  6. State transitions to `COMPLETED`.
- **Expected Invariant**:
  - Depleted ingredients: 24g coffee beans (18g base + 6g extra shot), 220ml Oat Milk (0ml whole milk), 45ml condensed milk, 1 large cup, 1 lid.
  - Zero whole milk deducted.

### Pair 2: Saudi Plate Tag -> KDS Bump -> Cashier Debt Settlement -> Regional Receivables
- **Input**: Vehicle with plate `ق م ر 9999` tagged for Customer "مؤسسة الأفق" residing in `حي الياسمين`.
- **Flow**:
  1. Drive-thru attendant tags vehicle plate and links customer profile.
  2. KDS displays plate badge prominently on dark Kanban card.
  3. Barista bumps ticket; Cashier selects "Charge to Debt (بيع آجل)".
  4. Balance increases from 450.00 SAR to 510.00 SAR (Order total: 60.00 SAR).
- **Expected Invariant**:
  - Customer current balance becomes 510.00 SAR.
  - Regional accounts receivable filter for `حي الياسمين` aggregates the 510.00 SAR debt.

### Pair 3: Order Bump -> Barista Recall -> Cashier Ready Queue Removal
- **Input**: Barista inadvertently taps "Bump" on order #105.
- **Flow**:
  1. Order #105 moves to `READY_FOR_PICKUP` and appears on Cashier screen.
  2. Within 20 seconds, barista taps "Undo Bump" in the KDS Recent Bumps drawer.
  3. Order #105 reverts to `IN_PREPARATION`.
- **Expected Invariant**:
  - Cashier Ready Queue immediately drops order #105.
  - KDS Kanban restores order #105 with its original elapsed stopwatch timer intact.

### Pair 4: Order Completion -> Void Order -> BOM Stock Restoration & Debt Rollback
- **Input**: Order #108 completed via Customer Credit (آجل) is cancelled due to spilled beverage.
- **Flow**:
  1. Order #108 was completed (raw ingredients depleted, customer balance incremented).
  2. Store manager enters master PIN (`7788`) and executes "Void Order".
  3. State transitions from `COMPLETED` to `VOIDED`.
- **Expected Invariant**:
  - Exact ingredient quantities depleted by order #108 are credited back to raw stock.
  - Customer debt balance is decremented by the exact order total.

---

## 5. Real-World High-Stress Workload Scenarios (Tier 4)

### Scenario 4.1: Morning Rush Hour (5 Concurrent Drive-Thru Orders)
- **Context**: 8:00 AM peak rush. Two drive-thru attendants submit 5 orders in rapid succession (< 30 seconds).
- **Test Workload**:
  - Order 1: 2x Flat White (Medium, Whole Milk) [Plate: `أ ب ج 1234`]
  - Order 2: 1x Spanish Latte (Large, Oat Milk), 1x Croissant [Plate: `د هـ و 5678`]
  - Order 3: 1x V60 Ethiopian [Token: `#03`]
  - Order 4: 2x Iced Caramel Macchiato [Plate: `س ص ع 9111`]
  - Order 5: 1x Americano (Double Shot) [Token: `#05`]
- **Verification**:
  - Zero ID collisions or race conditions.
  - KDS renders 5 cards chronologically with independent elapsed stopwatches.
  - Progressive bumping and cashier settlements (Cash, Card, Debt).
  - Final aggregate sales and raw material inventory match mathematical expectations.

### Scenario 4.2: Catering Bulk Order with Split Payment (Cash + Mada)
- **Context**: Corporate breakfast catering order for 25 beverages and 15 pastries. Total = 550.00 SAR.
- **Test Workload**:
  - Client pays 200.00 SAR in Cash and 350.00 SAR via Mada Card.
  - Cashier enters split settlement.
- **Verification**:
  - Cashier validates exact payment coverage (200 + 350 == 550).
  - Generates itemized 80mm ESC/POS receipt and valid ZATCA TLV Base64 QR code with Tag 4 = "550.00" and Tag 5 = "71.74" (15% VAT).
  - Bulk BOM depletion verifies linear multiplier scaling.

### Scenario 4.3: Regional Delivery Batch to حي الياسمين with Ledger Update
- **Context**: Afternoon batch delivery dispatched to 3 client offices in `حي الياسمين`.
- **Test Workload**:
  - Client A: 120.00 SAR charged to debt.
  - Client B: 85.00 SAR charged to debt.
  - Client C: 210.00 SAR charged to debt.
- **Verification**:
  - All 3 customer balances increment accordingly.
  - Regional filter for `حي الياسمين` displays exactly 415.00 SAR total receivables.
  - Customers in other regions (e.g. `حي النرجس`) are not affected.

### Scenario 4.4: Shift Handover (Mid-Shift X-Report -> End-of-Day Z-Report)
- **Context**: Morning shift ends at 4:00 PM; evening shift starts.
- **Test Workload**:
  - Shift opens with 500.00 SAR cash float.
  - During shift: 1,200.00 SAR Cash sales, 1,800.00 SAR Mada sales, 400.00 SAR Debt sales, 100.00 SAR cash payout for emergency ice.
  - Mid-shift manager inspects X-Report: Expected drawer cash = 500 + 1200 - 100 = 1,600.00 SAR. Shift remains open.
  - End of day: Cashier conducts physical cash count = 1,595.00 SAR.
  - Z-Report closure generated: Discrepancy = -5.00 SAR (Short). Shift status locked to `CLOSED`.
- **Verification**:
  - X-Report does not reset counters.
  - Z-Report accurately records over/short discrepancy and locks shift from further mutations.

### Scenario 4.5: High-Stress Stockout Guard & Void Recovery Rush
- **Context**: High demand exhausts specialty Pistachio syrup (remaining stock = 1 serving).
- **Test Workload**:
  - Order A requests 1x Pistachio Latte -> depletes remaining stock to 0g.
  - Order B requests 1x Pistachio Latte -> rejected by system due to zero stock.
  - Order A is cancelled / voided before pickup -> stock restored to 1 serving.
  - Order B is resubmitted -> now succeeds.
- **Verification**:
  - Atomic inventory guard prevents negative stock.
  - Void event triggers idempotent stock restoration.

---

## 6. Test Suite Architecture & CLI Runner

### Directory Layout
```
c:\Users\bin-g\OneDrive\سطح المكتب\book\the-smart-dafter\
├── TEST_INFRA.md               # This authoritative test infrastructure specification
├── TEST_READY.md               # Test readiness, status, and feature coverage checklist
├── tests/
│   └── run_all_tests.ts        # Primary CLI entrypoint
└── coffee-pos/
    └── tests/
        ├── e2e_harness.ts          # Core assertion framework, test runner & simulation harness
        ├── tier1_features.test.ts  # Tier 1: Feature Coverage (7 domains, >=5 tests each)
        ├── tier2_boundaries.test.ts# Tier 2: Boundary & Corner Cases (6 domains, >=5 tests each)
        ├── tier3_pairwise.test.ts  # Tier 3: Cross-Feature Combinations & State Machine Pairs
        └── tier4_workloads.test.ts # Tier 4: Real-World Workloads (5 complex scenarios)
```

### CLI Execution Command
```bash
# Execute full 4-tier E2E verification suite from project root:
npx tsx tests/run_all_tests.ts

# Or directly execute test harness:
npx tsx coffee-pos/tests/e2e_harness.ts
```

### Test Pass Criteria
- **100% Pass Rate**: All tests across Tiers 1–4 must execute and exit with code `0`.
- **Zero Mock Cheats**: Pure, deterministic testing of business logic, state transitions, mathematical formulas, and ZATCA/Arabic specifications.
- **Execution Time**: Entire test suite must execute in `< 10 seconds`.
