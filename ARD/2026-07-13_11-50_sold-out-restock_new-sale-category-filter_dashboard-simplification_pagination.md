# Session: Sold-out restock flow, category-first product picker in New Sale, dashboard KPI simplification, pagination

---
## Add a "Sold Out Items" dashboard section with a restock flow
**File(s):** apps/api/src/modules/products/products.service.ts, apps/api/src/modules/products/products.routes.ts, apps/api/src/modules/dashboard/dashboard.routes.ts, apps/web/src/pages/Dashboard.tsx, apps/web/src/components/RestockModal.tsx (new)
**What changed:** Added `GET /api/dashboard/sold-out` (all products with `status: SOLD`) and `POST /api/products/:id/restock` (`{ quantity }`, adds to the product's purchased quantity and recomputes `status`). The Dashboard now has a "Sold Out Items" section listing each sold-out product with a "Restock" button that opens `RestockModal` to enter an additional quantity. Also fixed a latent bug in `updateProduct`: editing a product's quantity via the Inventory edit modal previously never recomputed `status`, so a restocked-via-edit product could stay stuck as `SOLD` — this session later removed quantity editing from that endpoint entirely (see below), which resolves it a different way.
**Why:** User wanted visibility into what's sold out directly on the dashboard, plus a quick way to add stock without going through the full product edit form.
**Impact:** No schema changes (reuses existing `quantity`/`quantitySold`/`status` fields). Verified end-to-end against the live dev DB: created a throwaway product, sold it out, confirmed it appeared in the sold-out query, restocked it, confirmed `status` flipped and it dropped off the list, then cleaned up. Both apps typecheck clean.
**Status:** Approved

---
## New Sale: pick a category before a product
**File(s):** apps/web/src/pages/NewSale.tsx
**What changed:** The single "Add Product" dropdown is now preceded by a "Category" dropdown. The product select is disabled until a category is chosen, and only lists in-stock products from that category. Changing category resets the product selection.
**Why:** User wanted a category-first filter when adding line items to a sale, since scrolling one long product list was unwieldy.
**Impact:** Frontend-only. Typechecks clean, verified via Vite HMR with no console errors.
**Status:** Approved

---
## Simplify dashboard KPIs: drop "Low Stock" and "In Stock Items" cards
**File(s):** apps/web/src/pages/Dashboard.tsx, apps/api/src/modules/dashboard/dashboard.routes.ts
**What changed:** Removed the "Low Stock (≤ 2)" KPI card and its `lowStockCount` computation, then later removed "In Stock Items" and its `inStockCount` computation from `/api/dashboard/summary` too. The KPI row is now: Total Products, Total Stock (units), Stock Value, Sold Out Items, Sales This Month, Revenue This Month.
**Why:** User found "Total Stock (units)" (sum of remaining units across every product) and "In Stock Items" (count of product rows with status exactly `IN_STOCK`, excluding partially-sold rows) confusing side by side — asked for the difference to be explained, then asked to simplify by dropping the redundant one. Chose to remove "In Stock Items" outright (of three options offered) and keep the single units-based stock metric.
**Impact:** API response field removed; nothing else in the app consumed `inStockCount`/`lowStockCount`. Both apps typecheck clean; api container rebuilt and confirmed healthy after each change.
**Status:** Approved

---
## Inventory page: pagination + total-units-purchased count
**File(s):** apps/web/src/pages/Inventory.tsx, apps/web/src/components/ui/Pagination.tsx (new)
**What changed:** Inventory table now paginates at 20 rows/page (Prev/Next + "Page X of Y"), resetting to page 1 on search/category filter changes. The footer now reads "Showing 1-20 of 47 products (312 total units purchased)" — the unit count sums each row's `quantity` (Quantity Purchased) across *all* filtered rows, not just the current page, so a single product row bought in bulk (e.g. quantity 10) counts as 10 toward that total rather than 1.
**Why:** User wanted 20 rows/page and a total count that reflects actual unit volume ("include duplications") rather than distinct product rows.
**Impact:** Frontend-only. Extracted a reusable `Pagination` component since the same Prev/Next footer pattern was about to be needed in three places.
**Status:** Approved

---
## Paginate Sold Out Items and Recent Transactions at 6/page
**File(s):** apps/web/src/pages/Dashboard.tsx, apps/web/src/pages/Sales.tsx
**What changed:** Dashboard's Sold Out Items table and Sales page's Recent Transactions (both the mobile card list and desktop table) now paginate at 6 rows/page using the shared `Pagination` component, each with its own "Showing X-Y of Z" footer.
**Why:** User asked for 6 lines/page in both sections.
**Impact:** Frontend-only, typechecks clean, verified via Vite HMR.
**Status:** Approved

---
## Lock product quantity after creation; restock only from the dashboard's Sold Out section
**File(s):** apps/web/src/components/ProductFormModal.tsx, apps/api/src/modules/products/products.routes.ts, apps/api/src/modules/products/products.service.ts
**What changed:** "Quantity Purchased" in the product edit modal is now disabled (still editable when *adding* a new product), with a note pointing to the dashboard restock flow. Backend enforces this too: `quantity` was removed entirely from `UpdateProductInput` and the `PUT /api/products/:id` zod schema, so it can never be changed via that endpoint even by a direct API call. `restockProduct` now rejects with 400 ("Only sold-out products can be restocked") unless the product's `status` is `SOLD`.
**Why:** User wanted a single, unambiguous path for adding stock — via the Sold Out Items restock action — rather than also being able to bump quantity through the general edit form.
**Impact:** API contract change: `PUT /api/products/:id` no longer accepts `quantity` (silently ignored if sent, since zod strips unknown... actually rejected — extra keys are just not in the parsed output, so a stray `quantity` field is dropped, not an error). Verified against the live dev DB: restocking an `IN_STOCK` product is correctly rejected, restocking a genuinely `SOLD` product still works and flips its status. Both apps typecheck clean; api container rebuilt and confirmed healthy.
**Status:** Approved
