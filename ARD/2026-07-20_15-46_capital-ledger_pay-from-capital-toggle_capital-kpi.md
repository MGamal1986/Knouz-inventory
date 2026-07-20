# Session: Working-capital ledger, "Pay from capital" toggle on purchases/restocks, Capital dashboard KPI

---
## Add an append-only capital ledger (CapitalMovement) as the source of truth for working capital
**File(s):** apps/api/prisma/schema.prisma, apps/api/prisma/seed.ts, apps/api/src/modules/capital/capital.service.ts
**What changed:** New `CapitalMovement` model plus a `CapitalMovementType` enum (`INITIAL`, `SALE`, `REFUND`, `PURCHASE`, `RESTOCK`). Each row is one signed money movement (`amount` Decimal(10,2): positive = money in, negative = money out) with an optional `description`, `saleId`, `productId`, and a `createdAt` index. The current working-capital balance is the signed sum of every movement — never stored as a single mutable number, so it's always auditable and reconstructable. New `capital.service.ts` exposes `recordCapitalMovement(db, input)` (accepts a Prisma tx client so movements are written in the same transaction as the sale/refund/purchase they belong to), `getCapitalBalance()` (aggregates the sum), and a lazy `ensureInitialMovement` that writes the opening `INITIAL` balance exactly once the first time capital is read — so a DB that predates this feature self-seeds. Opening balance is `INITIAL_CAPITAL = 950` (EGP); `seed.ts` also seeds it idempotently.
**Why:** User wanted to track the business's cash/working capital, not just revenue and profit — a running balance that goes down when stock is bought and up when it's sold, with a full audit trail (restocks in particular previously kept no history of their own).
**Impact:** Schema change — apply with `prisma db push` (additive, new table + enum; no migrations folder in this project). No existing data touched. The balance is computed, not stored, so it can always be reconciled by summing the ledger.
**Status:** Approved

---
## Post every sale, refund, purchase, and restock to the capital ledger
**File(s):** apps/api/src/modules/sales/sales.service.ts, apps/api/src/modules/products/products.service.ts
**What changed:** `createSale` now records a `SALE` movement of `+totalAmount` inside the sale transaction; `createRefund` records a `REFUND` movement of `-refundAmount` (rolling back what the sale had added) inside the refund transaction. `createProduct` and `restockProduct` were wrapped in `prisma.$transaction` and, when funded from capital, record a `PURCHASE` / `RESTOCK` movement of `-(originalCost × quantity)` — the restock uses the cost supplied for that batch (falling back to the product's existing cost), not any earlier batch's cost. Each movement carries a human-readable description (e.g. `Sale <invoiceNumber>`, `Restock <code> × <qty>`) and links back via `saleId`/`productId`.
**Why:** Capital only stays accurate if every money-moving action updates it atomically with the action itself — a sale that succeeds must not leave the ledger un-posted.
**Impact:** All four flows now run inside a transaction that also writes the ledger; a failure in either half rolls back both. Sales/refunds always post (money genuinely moves). Purchases/restocks post only when funded from capital (see next entry).
**Status:** Approved

---
## Add a "Pay from capital" toggle to Add Product and Restock
**File(s):** apps/api/src/modules/products/products.routes.ts, apps/api/src/modules/products/products.service.ts, apps/web/src/components/ProductFormModal.tsx, apps/web/src/components/RestockModal.tsx, apps/web/src/components/ui/Toggle.tsx
**What changed:** Both the create and restock schemas gained an optional `fromCapital` flag, defaulting to `true` (create coerces the multipart `"true"/"false"` string; restock receives a real JSON boolean). When `true`, the purchase/restock cost is deducted from capital as a `PURCHASE`/`RESTOCK` movement; when `false`, it's treated as an outside ("instantaneous") expense that leaves the capital balance untouched (no ledger row). New reusable `Toggle` UI component (accessible switch: styled checkbox + sliding knob, label, helper line). The Add Product dialog (creation only — hidden when editing) and the Restock dialog each render a "Pay from capital" toggle whose helper text shows the exact EGP amount that will be deducted (`originalCost × quantity`) when on, or explains the balance is unchanged when off.
**Why:** Not every purchase is funded from the business's working capital — some stock is bought with outside money. The user needs to say, per purchase/restock, whether it should draw down capital or not.
**Impact:** API contract additions (both endpoints accept an optional `fromCapital`, default true — existing callers unchanged in behavior). Frontend-only Toggle component reused in two dialogs. Quantity/cost are still creation-time only for products; the toggle is not shown when editing an existing product.
**Status:** Approved

---
## Replace the "Revenue This Month" dashboard KPI with a "Capital" tile
**File(s):** apps/api/src/modules/dashboard/dashboard.routes.ts, apps/web/src/pages/Dashboard.tsx
**What changed:** `GET /api/dashboard/summary` now also returns `capital` (from `getCapitalBalance()`, computed alongside the existing month stats). The Dashboard's 7th KPI card was switched from "Revenue This Month" to **Capital** (icon `account_balance_wallet`), showing the live working-capital balance. `revenueThisMonth` is still computed and returned by the API but no longer surfaced as its own tile (the Revenue Explorer card below the KPIs remains the place to explore revenue by range/category/client/product).
**Why:** With a real capital ledger in place, the headline dashboard figure the user wanted at a glance is current working capital rather than a bare month-to-date revenue number.
**Impact:** Dashboard `summary` payload gains `capital`; the frontend `Summary` type and KPI row updated to match. Supersedes an earlier interim attempt (commit e1aedba) that approximated "capital" by turning the revenue tile into all-time revenue minus the cost of stock bought after a fixed 2026-07-19 cutoff — that CAPITAL_CUTOFF_DATE approach was reverted in favor of this proper ledger, and is not present in the current app.
**Status:** Approved
