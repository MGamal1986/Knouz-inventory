# Session: Restock any product from Inventory, editable cost/price/discount on restock, Top Selling dashboard section

---
## Allow restocking any product (not just sold-out) with editable cost/price/discount
**File(s):** apps/api/src/modules/products/products.service.ts, apps/api/src/modules/products/products.routes.ts
**What changed:** `restockProduct` no longer requires `status === "SOLD"` — any non-deleted product can now be restocked. Its signature changed from `(id, additionalQuantity)` to `(id, input: RestockInput)`, where `RestockInput` adds optional `originalCost`, `profitPercent`, `discountType`, `discountValue`. When provided, these are used to recompute `sellingPrice` (via the existing `calculateSellingPrice`) and validated with `assertValidDiscount`, then persisted alongside the new `quantity`/`status`. The `POST /:id/restock` route's zod schema was extended to accept these same optional fields.
**Why:** User wanted a single restock flow usable on every product (in-stock or sold out) that also lets them correct/update the cost, selling price, and discount for the new batch being added — e.g. restocking at a different purchase cost.
**Impact:** API contract change: `POST /api/products/:id/restock` now accepts (but doesn't require) `originalCost`, `profitPercent`, `discountType`, `discountValue` in addition to `quantity`. No longer rejects with 400 for non-SOLD products. Verified against the live dev DB (via a direct service-layer script in the api container, since the container image needed rebuilding to pick up the change): restocking a `SOLD` product now succeeds and correctly recomputes `status`/`sellingPrice`/discount fields; restocking an `IN_STOCK` product (previously a hard 400) now also succeeds. Both apps typecheck clean.
**Status:** Approved

---
## Move the Restock action from Dashboard's Sold Out Items to every row in Inventory
**File(s):** apps/web/src/pages/Inventory.tsx, apps/web/src/pages/Dashboard.tsx, apps/web/src/components/RestockModal.tsx
**What changed:** Inventory's product table now has a Restock icon button on every row (alongside Edit/Delete), opening `RestockModal` for that product. `RestockModal` was extended beyond a bare quantity field to also show Original Cost, Profit %, a calculated Selling Price, and Discount type/value, prefilled from the product's current values and submitted together with the added quantity. Dashboard's "Sold Out Items" table lost its Restock button/column (and the now-unused `RestockModal` wiring) and is now a read-only list of what's sold out.
**Why:** User wanted restocking available for every product from the Inventory page rather than only for sold-out items surfaced on the Dashboard, since restocking isn't only relevant once something is fully sold out.
**Impact:** Frontend-only. `ProductFormModal`'s stale "restock sold-out items from the dashboard" hint text/comment was updated to point at the new Inventory-page action. Verified via Vite HMR (no console errors) and both apps typecheck clean.
**Status:** Approved

---
## Add a "Top Selling" section (products & categories) to the Dashboard
**File(s):** apps/api/src/modules/dashboard/dashboard.routes.ts, apps/web/src/pages/Dashboard.tsx
**What changed:** Added `GET /api/dashboard/top-selling`, which walks all `SaleItem`s (not filtered by product `deletedAt`, consistent with the existing profit/revenue calculations), nets out refunded quantities, and returns the top 5 products and top 5 categories by net units sold, all-time. The Dashboard now renders a "Top Selling" card below "Stock by Category" with two ranked lists (`#1`, `#2`, ... with unit counts), each with its own empty state.
**Why:** User wanted visibility into which products/categories sell best, to inform purchasing and restocking decisions.
**Impact:** New read-only endpoint, no schema changes. Verified the aggregation logic against real sale history on the live dev DB via a direct script in the api container (24 sale items aggregated correctly into per-product and per-category totals, sorted descending). Both apps typecheck clean.
**Status:** Approved
