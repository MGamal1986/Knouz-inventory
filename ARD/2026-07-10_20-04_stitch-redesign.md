# Session: Stitch design redesign of the Knouz frontend

Source: `stitch-designs/` exports (7 screens + design-token doc) mapped onto `apps/web/`. Full analysis and reconciled token set captured in `DESIGN.md` at project root (colors, typography, spacing, radius, components, and 7 flagged inconsistencies between the Stitch exports themselves).

---
## Add Tailwind CSS + self-hosted fonts/icons
**File(s):** apps/web/tailwind.config.js, apps/web/postcss.config.js, apps/web/package.json, apps/web/src/styles.css
**What changed:** Added Tailwind CSS v3 (classic JS config) with the full DESIGN.md token set (colors/spacing/fontFamily/fontSize/borderRadius). Added `@fontsource/manrope`, `@fontsource/inter`, `@fontsource/jetbrains-mono`, and `material-symbols` as real npm dependencies (bundled by Vite), replacing the Google Fonts/Material Symbols CDN links the Stitch exports used. `styles.css` is now the Tailwind entry point.
**Why:** The project's own docs (`knouz-app-objective-workflow.md`) require the app to run fully locally with no internet dependency; Stitch's CDN font/icon links would silently break offline.
**Impact:** New build dependencies; production bundle grew by the embedded font/icon assets (~4MB total, dominated by the Material Symbols variable font). No runtime network calls for styling/fonts/icons.
**Status:** Proposed

---
## Fix `rounded-full` radius bug from the Stitch export
**File(s):** apps/web/tailwind.config.js
**What changed:** Implemented `borderRadius.full` as `9999px` instead of the `0.75rem` the Stitch exports actually shipped.
**Why:** The exported value renders 32–40px circular avatars/icon badges as rounded squares, not circles — confirmed as a bug in all 7 Stitch screens, documented in `DESIGN.md`.
**Impact:** Avatars and icon-circle chrome render as true circles; status pills unaffected either way at their size.
**Status:** Proposed

---
## Build shared UI component library
**File(s):** apps/web/src/components/ui/{Icon,Button,Card,Badge,FormField,Table,Modal,KpiCard,Avatar}.tsx
**What changed:** New reusable primitives styled from DESIGN.md tokens, used by every restyled page instead of duplicating Tailwind class strings.
**Why:** User's clean-code rules require extracting repeated patterns into shared components rather than duplicating class strings across pages.
**Impact:** All page-level styling now flows through these 9 components; changing a token/style in one place updates every page.
**Status:** Proposed

---
## Rebuild layout shell
**File(s):** apps/web/src/components/{Sidebar,TopBar,MobileBottomNav,Layout}.tsx, apps/web/src/components/ProtectedRoute.tsx
**What changed:** Replaced the old plain-CSS sidebar/topbar in `Layout.tsx` with three new components matching the Stitch chrome (260px sidebar, gold "New Sale" CTA, condensed top bar, mobile bottom tab bar). `ProtectedRoute`'s loading spinner ported from the deleted custom CSS classes to Tailwind's `animate-spin`.
**Why:** Visual redesign per Stitch; old `.sidebar`/`.content` classes were removed along with the rest of `styles.css`.
**Impact:** Nav item set changed from 8 links to 6 + Account/Sign Out (Products retired as a nav destination — see Inventory merge below). Auth boundary (`ProtectedRoute` wrapping `Layout`) is unchanged.
**Status:** Proposed

---
## Merge Products into Inventory; new Add/Edit Product modal
**File(s):** apps/web/src/pages/Inventory.tsx (rewritten), apps/web/src/pages/Products.tsx (deleted), apps/web/src/components/ProductFormModal.tsx (new), apps/web/src/App.tsx
**What changed:** `/products` route now redirects to `/inventory`. The Inventory page combines the old read-only stock table with full product CRUD: search + category filter (both backed by the existing `/api/inventory` endpoint), row edit/delete actions, and an "Add Product" button opening a modal (create and edit, reusing the same form) with the invoice-image upload.
**Why:** User approved merging these during planning — Stitch's design has one "Inventory" screen with an Add Product modal, no separate Products nav item; the current app had them as two disconnected pages.
**Impact:** Bookmarks to `/products` still work (redirected). All existing product CRUD/upload/stock logic preserved, just relocated and restyled. Removed the fake "Showing 1–4 of 124" pagination from Stitch's mockup since the API returns full result sets — replaced with a real item count.
**Status:** Proposed

---
## New Sale split out into its own page; Invoice Preview added
**File(s):** apps/web/src/pages/NewSale.tsx (new), apps/web/src/pages/InvoicePreview.tsx (new), apps/web/src/pages/Sales.tsx (rewritten), apps/web/src/utils/invoice.ts (new), apps/web/src/App.tsx
**What changed:** The inline "New Sale" cart form that used to live inside `Sales.tsx` is now its own full-page POS-style route (`/sales/new`), matching Stitch. `Sales.tsx` is now history-only: Today's Revenue (computed client-side from existing sale data), a "Record New Sale" shortcut, and a Recent Transactions table with new "View" (→ Invoice Preview) and existing "Download PDF" actions. `/sales/:id/preview` is a new A4-styled invoice view built from the existing `GET /api/sales/:id` endpoint (no backend changes). On completing a sale, the app now navigates to the invoice preview instead of silently auto-downloading the PDF.
**Why:** Matches the Stitch "New Sale" and "Invoice Preview" screens; surfacing the invoice before download is a small deliberate UX improvement over the old blind auto-download.
**Impact:** Behavior change: completing a sale no longer auto-downloads a PDF — it now opens the styled preview, where download is one click away. Also fixed dead code while touched: the old `downloadInvoice` read a non-existent `localStorage` token and set a manual `Authorization` header; auth is 100% httpOnly-cookie based, so this never did anything — replaced with a shared `downloadInvoicePdf()` helper using the existing cookie-authenticated `api` client.
**Status:** Proposed

---
## Restyled Dashboard, Categories, Suppliers, Clients, Account, Login (no logic changes)
**File(s):** apps/web/src/pages/{Dashboard,Categories,Suppliers,Clients,Account,Login}.tsx
**What changed:** Visual redesign only, using the new shared components and DESIGN.md tokens. Dashboard's KPI grid now covers all 8 real fields from `/api/dashboard/summary` (previously a plain list); dropped Stitch's Recent Sales table, Top Categories chart, and all fabricated trend deltas (`+12 this week`, etc.) since the backend doesn't return that data. Client Directory dropped the "Total Purchases" column (no such aggregate exists). Sidebar/nav label for the account page stays "Account" (real functionality), not Stitch's unimplemented "Settings" placeholder.
**Why:** Apply the redesign consistently; avoid fabricating data the backend can't back up.
**Impact:** No API contract or business-logic changes on any of these pages.
**Status:** Proposed

---
## Data/logic conflicts intentionally omitted (Stitch shows features the backend doesn't support)
- No tax, discount, or payment-method fields on `Sale`/`SaleItem` — dropped from New Sale and Invoice Preview.
- No due date on `Sale` — dropped from Invoice Preview.
- No client email — New Sale's client picker uses mobile number instead.
- No pagination anywhere in the API — dropped Stitch's fake pagination footers in favor of real counts.
- No admin profile photo — top-bar avatar uses initials instead.
**Status:** Proposed (all as designed, no further action needed unless the user wants these backed by real data later)
