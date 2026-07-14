# Knouz Inventory — Application Workflow

How the app is actually structured and used, screen by screen, as currently built. For *why* the app exists, see `knouz-app-objective-workflow.md`. For the visual design system, see `DESIGN.md`.

---

## 1. Authentication

- **Login** (`/login`) — username/password, cookie-based session (httpOnly, auto-refreshed). Default account is `admin` / `0000`; change it from Account after first login.
- Every other route is wrapped in `ProtectedRoute` — if you're not logged in, you're redirected to `/login` with a `?redirect=` back to where you were headed.
- **Sign Out** — bottom of the sidebar, ends the session and returns to Login.

---

## 2. Navigation map

The sidebar (always visible on desktop, bottom tab bar on mobile) has six destinations, plus Account and Sign Out below a divider:

| Nav item | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Business health at a glance |
| Categories | `/categories` | Define product categories + their code ranges |
| Suppliers | `/suppliers` | Manage supplier contacts |
| Inventory | `/inventory` | Full product catalog: add, edit, delete, search, filter, export |
| Clients | `/clients` | Client directory: add, edit, delete, export |
| Sales | `/sales` | Sales history + entry point to a new sale |
| Account | `/account` | Change password, manage admin accounts |

A gold **"New Sale"** button sits above the nav list on every page and always jumps straight to `/sales/new`. `/products` (from before the redesign) still resolves — it silently redirects to `/inventory`, since product management now lives there.

---

## 3. One-time setup

1. **Categories** (`/categories`) — add a category with a name, a base code (e.g. `RNG`), and a code range (e.g. 1–999). The system uses this to auto-generate product codes like `RNG-0007`. You can rename a category later, but **the base code and range lock permanently once set** — that's what guarantees product codes are never reused or duplicated.
2. **Suppliers** (`/suppliers`) — add each supplier's name, phone, and address. Fully editable later.

Both pages: add via the form at the top, edit via the pencil icon on any row (prefills the form, submit becomes "Save Changes"), delete via the trash icon. Categories can't be deleted once they have products attached. Both have an **Export CSV** button top-right for a spreadsheet copy of the current list.

---

## 4. Buying cycle — adding stock

1. Go to **Inventory** (`/inventory`).
2. Click **Add Product** — opens a dialog: description, category, supplier, purchase date, original cost, quantity purchased, selling price, an optional discount (percentage or fixed EGP amount), and an invoice image upload. Profit % is calculated live as you type ((selling price ÷ original cost − 1) × 100) — you never enter it directly.
3. Submit — the system auto-generates the next code in that category's range (e.g. `RNG-0007`) and the product appears in the table immediately with full stock.
4. To fix a mistake later: the pencil icon on any row reopens the same dialog prefilled, for both the details and a new invoice image if needed. **Quantity purchased is locked once the product exists** — it's shown greyed out in the edit dialog, since quantity is only ever changed one way from here on (see "Restocking a sold-out item" below). Everything else (description, category, supplier, cost, price, discount, invoice image) stays editable. The trash icon deletes the product — it disappears from Inventory, the dashboard's Sold Out Items section, and all stock/product counts immediately, and its code can never be reissued to a new product. Under the hood this is a soft delete: the row is kept (not removed) so past sales, invoices, and profit/revenue history involving that product are completely unaffected.
5. Use the search box (by code or description) and the category filter to narrow the table down; the table paginates at 20 rows/page, and the footer shows both the row count and the total units purchased across the current filter (e.g. "Showing 1-20 of 47 products (312 total units purchased)" — a product bought in a batch of 10 counts as 10 toward that total, not 1). **Export CSV** exports the full filtered list regardless of which page you're on.

**Discounts** are a per-product setting, not a one-off event: whatever percentage/fixed discount is set on a product here automatically applies every time that product is sold, on every future invoice — until it's changed or cleared here again. A discounted product shows its original price struck through next to the discounted price in the Inventory table.

### 4.1 Restocking a sold-out item

Once a product's stock reaches zero (`status: SOLD`), the **only** way to add more units to it is from the **Dashboard**'s Sold Out Items section (see §6) — not the Inventory edit dialog. Click **Restock** on that product's row, enter the additional quantity, confirm. This is enforced server-side too: the restock endpoint rejects the request unless the product is actually sold out, and the product-edit endpoint no longer accepts a quantity field at all.

---

## 5. Selling cycle — recording a sale

1. New or returning client? New → add them once on **Clients** (`/clients`, name + mobile required, address optional). Returning → they're already in the picker.
2. Click **New Sale** (sidebar button, or the "Record New Sale" shortcut on the Sales page) → opens `/sales/new`, a dedicated checkout screen.
3. Pick the client from the dropdown.
4. Add products to the cart one at a time: first pick a **Category**, which unlocks the **Add Product** dropdown listing only in-stock products from that category; pick one and click Add. Adjust quantity with the +/- steppers, remove a line with the × — the system won't let you exceed available stock.
5. Each line's discount defaults to whatever discount (if any) is configured on that product, but it's fully editable right there in the cart — type/percentage/amount can be changed or cleared per line. This only affects the current invoice; it never changes the product's own discount setting.
6. Review the subtotal / discount / total, click **Complete Sale**.
7. Behind the scenes, in one transaction: stock is deducted, each product's status flips to In Stock / Partially Sold / Sold Out as appropriate, an invoice number is issued in the form `{ClientFirstName}-{Mobile}-{sequence}` (e.g. `Ahmed-01012345678-000008` — the trailing 6-digit sequence keeps it unique even across repeat sales to the same client), and a PDF is generated using that same string as its filename.
8. You land on the **Invoice Preview** (`/sales/:id/preview`) — a styled, print-ready view of that invoice, itemizing any discount per line and in the total. **Print** opens the browser print dialog; **Download PDF** saves the generated file (Arabic product names/addresses render correctly, joined and right-to-left).
9. Every past sale stays in **Sales** (`/sales`) history: Today's Revenue card, and a "Recent Transactions" table (paginated at 6/page) with a "view" icon (reopens that invoice preview), a "download" icon (grabs the PDF directly), and a "refund" icon per row.

### 5.1 Refunds

Any past sale can be partially or fully refunded from **Sales** (`/sales`) — click the refund icon on a row to open the refund dialog, which lists every line item on that invoice with its sold quantity and how much is still refundable.

1. Enter the quantity to refund for one or more line items (partial refunds are fine — e.g. refund 1 of 3 sold).
2. Confirm — the system, in one transaction: adds the refunded quantity back to that product's available stock (at its existing cost/price — refunding never touches product pricing or discount config), records the refund, and deducts the amount actually paid for those units (i.e. after any discount that applied) from revenue.
3. The sale's row in Sales History then shows a "Refunded" badge with the original total struck through next to the net total. A sale can be refunded again later for any remaining un-refunded quantity.

---

## 6. Ongoing monitoring

- **Dashboard** (`/`) — 7 KPI tiles pulled live from the database: total products, total stock units, stock value, actual profit, sold-out count, sales this month, revenue this month (net of any refunds). Actual profit sums `(selling price − original cost)` across every unit ever sold, net of refunds — it's a running total of realized profit, unaffected by later deleting a product. Below that, a **Revenue Explorer** card lets you filter revenue by time range (today/week/month/year/custom dates), category, client, or product, showing gross revenue, refunded amount, and net revenue for whatever's selected. Below that, a **Sold Out Items** section lists every product with zero stock left (paginated at 6/page) with a one-click **Restock** action per row (see §4.1). Below that, a **Stock by Category** card grid shows units in stock and total original cost per category. "Add Item" jumps to Inventory.
- **Inventory** — search/filter any time to check live stock, cost, and selling price per item (paginated at 20/page); export the current view to CSV for offline reporting.
- **Clients** — export the directory to CSV any time.
- **Sales** — Today's Revenue at a glance (net of refunds), full transaction history (paginated at 6/page), re-view or re-download any past invoice, or refund one.
- **Account** (`/account`) — change your own password, and (as admin) create additional admin logins. No separate "staff" role exists yet — every logged-in admin has full access.

---

## 7. What the UI deliberately does *not* show

Kept out because the backend doesn't track it (rather than faking it with placeholder data):
- Tax or payment method on a sale.
- A due date on an invoice.
- Client email (only name/mobile/address are stored).
- Pagination on Categories, Suppliers, and Clients — those tables still render the full list with a real count. (Inventory, the dashboard's Sold Out Items, and Sales history do paginate — client-side, at 20/6/6 rows per page respectively — since those lists are the ones that grow large enough to matter; the API still returns the full filtered result set in each case.)
- Trend/comparison arrows on the dashboard (e.g. "+12% vs yesterday") — no historical snapshot is stored to compare against.
- A profile photo for admin users — the top bar shows initials instead.
