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
2. Click **Add Product** — opens a dialog: description, category, supplier, purchase date, original cost, required profit %, quantity purchased, and an invoice image upload. Selling price is calculated live as you type (cost × (1 + profit%)) — you never enter it directly.
3. Submit — the system auto-generates the next code in that category's range (e.g. `RNG-0007`) and the product appears in the table immediately with full stock.
4. To fix a mistake later: the pencil icon on any row reopens the same dialog prefilled, for both the details and a new invoice image if needed. The trash icon deletes it.
5. Use the search box (by code or description) and the category filter to narrow the table down; **Export CSV** exports exactly what's currently showing (respects search/filter).

---

## 5. Selling cycle — recording a sale

1. New or returning client? New → add them once on **Clients** (`/clients`, name + mobile required, address optional). Returning → they're already in the picker.
2. Click **New Sale** (sidebar button, or the "Record New Sale" shortcut on the Sales page) → opens `/sales/new`, a dedicated checkout screen.
3. Pick the client from the dropdown.
4. Add products to the cart one at a time from the product picker (only items with stock show up); adjust quantity with the +/- steppers, remove a line with the × — the system won't let you exceed available stock.
5. Review the subtotal/total, click **Complete Sale**.
6. Behind the scenes, in one transaction: stock is deducted, each product's status flips to In Stock / Partially Sold / Sold Out as appropriate, an invoice number is issued, and a PDF is generated.
7. You land on the **Invoice Preview** (`/sales/:id/preview`) — a styled, print-ready view of that invoice. **Print** opens the browser print dialog; **Download PDF** saves the generated file.
8. Every past sale stays in **Sales** (`/sales`) history: Today's Revenue card, and a table with a "view" icon (reopens that invoice preview) and a "download" icon (grabs the PDF directly) per row.

---

## 6. Ongoing monitoring

- **Dashboard** (`/`) — 8 KPI tiles pulled live from the database: total products, total stock units, stock value, in-stock count, sold-out count, low-stock count (≤2 units), sales this month, revenue this month. "Add Item" jumps to Inventory.
- **Inventory** — search/filter any time to check live stock, cost, and selling price per item; export the current view to CSV for offline reporting.
- **Clients** — export the directory to CSV any time.
- **Sales** — Today's Revenue at a glance, full transaction history, re-view or re-download any past invoice.
- **Account** (`/account`) — change your own password, and (as admin) create additional admin logins. No separate "staff" role exists yet — every logged-in admin has full access.

---

## 7. What the UI deliberately does *not* show

Kept out because the backend doesn't track it (rather than faking it with placeholder data):
- Tax, discount, or payment method on a sale.
- A due date on an invoice.
- Client email (only name/mobile/address are stored).
- Pagination (the API returns full result sets; tables show a real count instead of fake page controls).
- Trend/comparison arrows on the dashboard (e.g. "+12% vs yesterday") — no historical snapshot is stored to compare against.
- A profile photo for admin users — the top bar shows initials instead.
