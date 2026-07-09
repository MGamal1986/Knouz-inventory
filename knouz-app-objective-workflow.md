# Knouz Inventory & Sales System
## Objective & Workflow Overview

---

## 1. Objective

Knouz runs as a jewelry, accessories, and gift-item dropshipping/resale business. Products are bought in bulk from local suppliers, marked up, and sold to individual clients. Until now this has been tracked manually (spreadsheets), which made it hard to answer simple questions with confidence: *What did this item actually cost me? How many do I have left? Who bought what, and when?*

This web application replaces that manual process with a single local system that:

- **Registers every purchased product** with a description, category, supplier, purchase date, and a supporting invoice image — nothing gets added to stock without a paper trail.
- **Assigns every product a unique, human-readable code** (e.g. `RNG-0001`) generated automatically from its category, so any item can be found instantly by typing its code.
- **Calculates the correct selling price automatically** from the original cost and a target profit percentage — no manual markup math, no guessing.
- **Tracks real stock levels in real time**, reducing available quantity the moment a sale is recorded, so the inventory view always reflects what's actually on hand.
- **Keeps a client directory** so repeat buyers don't need to be re-entered every time.
- **Generates a professional PDF invoice automatically** for every sale — itemized, timestamped, and tied to a specific client — replacing handwritten or ad-hoc receipts.
- **Gives a single dashboard view** of total stock value, what's sold, what's low on stock, and monthly revenue, so business health is visible at a glance instead of requiring manual pivot tables.
- **Runs entirely locally** on Mohamed's own Windows machine via Docker — no cloud hosting costs, no third-party dependency, and no internet connection required to use it day-to-day.

In short: the goal is **trustworthy, low-effort bookkeeping** — every product's true cost and every sale's true profit should be one click away, not a spreadsheet reconstruction project.

---

## 2. Workflow

### 2.1 One-Time Setup (done once, rarely revisited)

```
Log in as default admin (admin / 0000)
        │
        ▼
Change the default password (Account page)
        │
        ▼
Create Categories (e.g. Rings, Bracelets, Necklaces)
   → each category is given a base code (e.g. RNG, BRC)
        │
        ▼
Add Suppliers (name, phone, address)
```

### 2.2 Buying Cycle (repeats every time products are purchased)

```
Go to a supplier, buy new stock
        │
        ▼
Open the Products page → "Add Product"
        │
        ▼
Fill in:
  - Description
  - Category (from the predefined list)
  - Supplier
  - Purchase date
  - Original cost
  - Required profit % → selling price is calculated automatically
  - Quantity purchased
  - Upload a photo/scan of the supplier invoice
        │
        ▼
System auto-generates a unique product code (e.g. RNG-0007)
        │
        ▼
Product appears in Inventory with full stock available
```

### 2.3 Selling Cycle (repeats every time a client buys something)

```
New or returning client?
   ├─ New   → add them once on the Clients page (name, address, mobile)
   └─ Returning → already in the list, just select them
        │
        ▼
Open the Sales page → "New Sale"
        │
        ▼
Select the client
        │
        ▼
Search/select each product they're buying (by code or description)
   → set quantity for each line item
   → system checks stock is available before allowing it
        │
        ▼
Review the total, click "Complete Sale & Generate Invoice"
        │
        ▼
System automatically:
  - Deducts sold quantity from stock
  - Marks the product Sold / Partially Sold / In Stock accordingly
  - Generates a PDF invoice (client info, itemized products, total, timestamp)
        │
        ▼
Invoice downloads immediately, and stays available under Sales History
```

### 2.4 Ongoing Monitoring (whenever needed)

```
Dashboard → quick health check
  - Total stock value
  - Items sold vs. still in stock
  - Low-stock warnings
  - This month's revenue

Inventory page → search any product by its code
  - See live stock, cost, and selling price per item

Sales History → look up any past invoice and re-download its PDF
```

---

## 3. Roles

Currently the system supports a single **Admin** role (the business owner/operator). The default admin account (`admin` / `0000`) can:
- Manage categories, suppliers, products, clients, and sales
- Change their own password
- Create additional admin accounts (e.g. for a trusted family member or employee who helps run the shop)

There is currently no separate "read-only" or "staff" role — every logged-in admin has full access. This can be added later if the business grows to need it.

---

## 4. Design Principle Behind the Workflow

Every number in the system is **derived, not typed twice**:
- The product code is generated, never manually assigned — no duplicates possible.
- The selling price is calculated from cost + profit %, never entered directly — no mismatched math.
- Stock levels update themselves from actual sales — never manually adjusted, so they can't drift out of sync with reality.
- Every sale produces its own permanent invoice record — nothing has to be reconstructed later from memory or messages.

The result: at any moment, the dashboard and inventory numbers can be trusted at face value.
