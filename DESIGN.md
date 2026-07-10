# Knouz Design System — "Artisan Utility"

Source: Stitch exports in `stitch-designs/` (7 screens + 1 design-token doc). Extracted and reconciled below. This file is the single source of truth for the frontend redesign — use these exact values, don't approximate.

Brand personality: sophisticated, reliable, precise — a luxury boutique aesthetic applied to a data-heavy inventory/costing tool. Corporate/Modern, minimalist, generous whitespace, light mode only (no dark mode wired up despite `dark:` classes present in some exports — see Inconsistencies).

---

## Colors

All 7 screens use an **identical** token set (verified byte-for-byte across dashboard, products/inventory, clients, add-product modal, new-sale, sales/invoices, invoice-preview). This is a solid, ready-to-use palette.

### Brand accents
| Token | Hex | Use |
|---|---|---|
| `artisan-gold` | `#C5A059` | Primary actions, "New Sale"/"Add Product" buttons, active nav item, key figures (revenue, product codes on hover) |
| `deep-charcoal` | `#1A1C1E` | Primary buttons ("Complete Sale"), sidebar dark variant, headline text emphasis |
| `muted-bronze` | `#8E7341` | Secondary accents (used for product code color in invoice preview) |
| `success-emerald` | `#2D6A4F` | In-stock status, positive trend indicators |
| `warning-amber` | `#B07D05` | Low-stock status, "requires attention" |

### Surfaces (Material-3-style ramp)
| Token | Hex |
|---|---|
| `background` / `surface` | `#f8f9fa` |
| `surface-bright` | `#f8f9fa` |
| `surface-dim` | `#d9dadb` |
| `surface-container-lowest` | `#ffffff` (cards, sidebar, table rows) |
| `surface-container-low` | `#f3f4f5` (table headers, input backgrounds) |
| `surface-container` | `#edeeef` (hover states, active nav bg) |
| `surface-container-high` | `#e7e8e9` |
| `surface-container-highest` | `#e1e3e4` |
| `surface-variant` | `#e1e3e4` |
| `surface-border` | `#E2E8F0` (all 1px borders/dividers) |

### Text
| Token | Hex |
|---|---|
| `on-surface` / `on-background` / `primary` | `#191c1d` / `#191c1d` / `#000101` (primary text/headings — use `on-surface` for body, `primary` reserved for the literal near-black brand tone in headings per exports) |
| `on-surface-variant` | `#44474a` (secondary/meta text, labels) |
| `outline` | `#75777a` |
| `outline-variant` | `#c5c6ca` |

### Semantic
| Token | Hex |
|---|---|
| `error` | `#ba1a1a` (Sold Out badge, delete/remove actions) |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |
| `secondary` | `#775a19` |
| `secondary-container` | `#fed488` (client avatar-initial chips) |

Full raw token dump (rarely referenced directly, kept for completeness): `primary-container #1a1c1e`, `on-primary-container #838486`, `inverse-surface #2e3132`, `inverse-on-surface #f0f1f2`, `tertiary #000101`, `tertiary-container #1b1c1c`, `on-tertiary-container #848484`, `primary-fixed #e2e2e5`, `primary-fixed-dim #c6c6c9`, `secondary-fixed #ffdea5`, `secondary-fixed-dim #e9c176`, `tertiary-fixed #e3e2e2`, `tertiary-fixed-dim #c7c6c6`.

---

## Typography

Three-typeface system, consistent across all screens.

| Family | Weights used | Purpose |
|---|---|---|
| **Manrope** | 500, 600, 700 | Headlines, display text, nav brand, button labels |
| **Inter** | 400, 500, 600 | Body text, form inputs, table cells |
| **JetBrains Mono** | 400, 500 | Product codes (`RNG-0001`), invoice numbers, table column headers (`code-label`) |

### Type scale
| Token | Size | Line-height | Weight | Family | Letter-spacing |
|---|---|---|---|---|---|
| `display-lg` | 48px | 56px | 700 | Manrope | -0.02em |
| `headline-lg` | 32px | 40px | 600 | Manrope | — |
| `headline-lg-mobile` | 28px | 36px | 600 | Manrope | — |
| `headline-md` | 24px | 32px | 600 | Manrope | — |
| `headline-sm` | 20px | 28px | 600 | Manrope | — |
| `body-lg` | 18px | 28px | 400 | Inter | — |
| `body-md` | 16px | 24px | 400 | Inter | — |
| `body-sm` | 14px | 20px | 400 | Inter | — |
| `code-label` | 13px | 16px | 500 | JetBrains Mono | 0.05em |

Icons: Material Symbols Outlined (Google Font), default `FILL 0, wght 400, GRAD 0, opsz 24`; filled (`FILL 1`) for the active nav icon only.

---

## Spacing

4px baseline grid.

| Token | Value |
|---|---|
| `base` / `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` / `gutter` | 24px |
| `xl` | 32px |
| `sidebar-width` | 260px |
| `max-content-width` | 1440px |

Rhythm: dashboards/cards use "spacious" 24–32px padding; data tables use "condensed" — 8px vertical / 16-24px horizontal cell padding (`py-md px-lg` on `<td>`, i.e. 16px/24px — note the prose in the Stitch design doc says 8px cell padding but every actual table markup uses `py-md` (16px); **use 16px vertical / 24px horizontal, matching the real markup, not the doc prose**).

---

## Border Radius

⚠️ **The Stitch exports define TWO different radius scales that disagree with each other.** Use the one in the "Resolved" column — it's what every actual screen renders with.

| Key | YAML front-matter (`artisan_executive/DESIGN.md`) | Embedded Tailwind config (all 7 `code.html` files) | Resolved (use this) |
|---|---|---|---|
| `DEFAULT` | 0.25rem (4px) | 0.125rem (2px) | **0.125rem / 2px** (matches actual config used to render) |
| `lg` | 0.5rem (8px) | 0.25rem (4px) | **0.25rem / 4px** — used on all buttons, inputs, small tags |
| `xl` | 0.75rem (12px) | 0.5rem (8px) | **0.5rem / 8px** — used on all cards, modals, tables, KPI tiles |
| `full` | 9999px | 0.75rem (12px) | **9999px (true pill/circle)** — see below |

**`full` is a real bug in the export, not a stylistic choice — fix it, don't reproduce it.** The embedded Tailwind config sets `full: 0.75rem`, which every screen's markup then relies on for `rounded-full`. That value happens to fully round small 24px-tall status pills (0.75rem = half of 24px), but the same class is also applied to 32–40px circular avatars and icon badges (`w-10 h-10 rounded-full`), which would render as barely-rounded squares, not circles, at 12px radius. Implement `full` as **true 9999px** (i.e. don't override Tailwind's default `rounded-full` at all) so both pills and circles render correctly.

## Shadows / Elevation

Flat, tonal-layer approach — no heavy shadows.
- **Level 0 (page background):** `#F8F9FA`, no shadow.
- **Level 1 (cards, tables, sidebar):** white surface + `1px solid #E2E8F0` border, optional `shadow-sm`.
- **Level 2 (modals):** white surface, `shadow-xl`, dark scrim backdrop `bg-deep-charcoal/40` + `backdrop-blur-md`.
- Invoice preview / print surface uses a slightly heavier ambient shadow (`0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`) since it visually represents a physical A4 sheet.

---

## Components

### Sidebar navigation (260px, fixed)
- White (`surface-container-lowest`) background, `1px` right border (`surface-border`).
- Brand block: logo mark + "Knouz" (`headline-md`, bold, `primary`) + "Artisan Utility" tagline (`body-sm`, `on-surface-variant`).
- Primary CTA button ("New Sale") directly under brand — gold or charcoal fill (inconsistent, see below), full width, `rounded-lg`.
- Nav links: icon + label, `body-md`, `rounded-lg`, `px-md py-sm`. Inactive: `on-surface-variant`, hover → `surface-container-high` bg + `primary` text. Active: bold, `artisan-gold` text, `surface-container` bg, filled icon (`FILL 1`), subtle `scale-[0.98]`.
- Nav item set (from Stitch, **7 items**, not matching current app's 8 routes — see Step 3 mapping): Dashboard, Categories, Suppliers, Inventory, Clients, Sales, then a divider, then Settings + Sign Out.
- Mobile: sidebar hidden below `md`; a bottom tab bar (4 items: Home/Stock/Clients/Sales) appears instead, plus a top app bar with hamburger.

### Top app bar (64px, sticky)
- `background/80` + `backdrop-blur-md`, bottom border.
- Left: search input (pill, `surface-container-low` bg, icon-prefixed) OR page title on mobile.
- Right: notification/help icon buttons, one primary action button (context-dependent: "Add Product"), 32px circular user avatar.

### Buttons
| Variant | Style |
|---|---|
| Primary (dark) | `bg-deep-charcoal text-white`, `rounded-lg`, used for "Complete Sale", high-emphasis confirm actions |
| Primary (gold) | `bg-artisan-gold text-deep-charcoal font-semibold`, used for "New Sale", "Add Product", "Add Product" (modal submit) |
| Secondary/ghost | transparent, `border border-surface-border`, `text-on-surface-variant`, hover `bg-surface-container-high` — "Cancel" |
| Icon button | `p-sm rounded-full`, `text-on-surface-variant`, hover `text-primary` + `bg-surface-container-low` |
| Destructive/remove | no filled variant seen — plain `text-error/70 hover:text-error` icon-only (line-item remove) |

### Inputs
- `bg-surface-container-low` (or literal `#F1F5F9` — see Inconsistencies), `border border-surface-border`, `rounded-lg`, `p-md`.
- Focus: `ring-2 ring-artisan-gold`, border transparent.
- Label: `body-sm font-medium text-on-surface-variant`, `mb-xs`.
- Disabled/computed (e.g. selling price): `bg-surface-container`, `text-on-surface-variant`, `cursor-not-allowed`.
- Search inputs: pill-shaped (`rounded-full`) in top bar, `rounded-lg` elsewhere.

### Cards
- `bg-surface-container-lowest`, `border border-surface-border`, `rounded-xl` (8px, per resolved scale), `shadow-sm`.
- KPI card: icon + label top row, big `headline-lg` value, small trend line (`success-emerald`/`warning-amber` + icon) underneath.
- Dark KPI variant (Monthly Revenue): `bg-deep-charcoal`, white text, gold accents, decorative blurred gold circle.

### Tables
- Wrapped in a card (`rounded-xl`, bordered, `overflow-hidden`/`overflow-x-auto`).
- Header row: `surface-container-low` bg (or literal `#F1F5F9`, see Inconsistencies), `code-label` typography, uppercase, `on-surface-variant`.
- Body rows: `divide-y divide-surface-border`, hover `bg-surface-container-low/50`.
- Product/invoice codes always rendered `code-label` (JetBrains Mono), colored `primary` or `muted-bronze`.
- Row-hover-reveal action button pattern (`opacity-0 group-hover:opacity-100`) for a trailing "more" / delete icon.
- Pagination footer inside the same card: "Showing X of Y" + prev/next.

### Status badges/chips (pill, `rounded-full` → fixed to 9999px)
| Status | Style |
|---|---|
| In Stock | `bg-success-emerald/10 text-success-emerald` |
| Low Stock | `bg-warning-amber/10 text-warning-amber` |
| Sold Out / Sold | `bg-error/10 text-error` |
| Processing (neutral) | `bg-surface-container-high text-on-surface-variant` |

### Modal (Add Product)
- Centered, `max-w-2xl`, `rounded-xl`, `shadow-xl`, scrim `bg-deep-charcoal/40 backdrop-blur-md`.
- Header: title + close icon, bottom border, `surface-container-low` bg.
- Body: 2-column form grid (`md:grid-cols-2`), full-width fields span both columns.
- Footer: right-aligned Cancel (ghost) + primary gold submit, `surface-container-low` bg, top border.
- Includes a dashed-border drag-and-drop upload zone for the invoice image.

### New Sale (POS-style split layout)
- Left pane (flex-grow): searchable product line-item table with qty stepper (+/- buttons) and inline remove.
- Right pane (fixed 400px): stacked cards — Client Details (search + inline "New Client"), Payment Method (3-way radio-as-card selector), Order Summary (subtotal/discount/tax/total) with primary dark "Complete Sale" button.

### Invoice preview / print document
- A4-proportioned white sheet (`max-width: 800px` on screen), centered, drop shadow; print styles strip chrome and shadow.
- Header: brand block left, "INVOICE" display heading + meta (No./Date Issued/Due) right.
- "Billed To" section with a gold left border accent.
- Line-items table, `code-label` codes in `muted-bronze`.
- Totals block: `surface-container-low` bg panel, subtotal/discount/tax/total rows, total in `artisan-gold`.
- Toolbar (screen-only, `no-print`): Print + Download PDF buttons.

---

## Inconsistencies flagged (not silently resolved)

1. **`rounded-full` radius bug** — embedded Tailwind config overrides `full` to `0.75rem` instead of a true pill/circle. Confirmed present in all 7 exports identically. **Resolution: implement as real 9999px** (see Border Radius section) so avatars/icon-circles render correctly; status pills are unaffected either way at their size.
2. **Design-doc prose vs. embedded Tailwind config disagree** on the entire radius scale (`DEFAULT`/`lg`/`xl` all off by one step — doc's `lg` is code's `xl`, etc.) and on table cell padding (doc says 8px, markup uses 16px). Resolved in favor of the embedded config + actual markup, since that's what was actually designed against pixel-for-pixel.
3. **Hardcoded `#F1F5F9`** appears in `dashboard` (Recent Sales table header) and `new_sale` (search inputs) instead of the named token `surface-container-low` (`#f3f4f5`) used for the same role everywhere else (`products_inventory`, `client_directory` table headers, `add_product_modal` inputs). These are two near-identical greys (1-2% lightness apart) that were clearly meant to be the same token. **Resolution: use `surface-container-low` (`#f3f4f5`) everywhere** — treat `#F1F5F9` as a stray, not a second intentional tone.
4. **Primary CTA button color in sidebar is inconsistent between screens**: gold (`bg-artisan-gold`) in `dashboard_knouz_inventory` and `client_directory_knouz`, but charcoal (`bg-deep-charcoal`) in `products_inventory_knouz` and `add_product_modal`. **Resolution: use gold** — gold is the majority (2 of 4 dedicated-sidebar screens use it as the primary "New Sale" CTA) and matches the documented brand rule ("Artisan Gold... reserved for primary actions").
5. **Dark-mode classes** (`dark:bg-deep-charcoal`, `dark:text-artisan-gold`, etc.) appear only on the two "Inventory-context" screens (`products_inventory_knouz`, `add_product_modal`), nowhere else, and there's no theme toggle in any screen. Treated as leftover/unused scaffolding from the Stitch generator — **not implementing dark mode** in this pass.
6. **Nav item set mismatch with the current app**: Stitch's sidebar has no "Products" link (product creation is a modal triggered from the top bar / a button, not its own nav destination) and no "My Account" link (Stitch has "Settings" instead). See Step 3 for how this maps to the existing 8-route app.
7. **Currency**: Stitch screens show `$`/EGP inconsistently (`add_product_modal` and dashboard use EGP explicitly, matching the real business; `client_directory`, `products_inventory`, `sales_invoices`, `invoice_preview`, `new_sale` use `$`). The app's real currency is **EGP** (per `originalCost`/`sellingPrice` fields and existing UI). **Resolution: EGP everywhere**, ignore the `$` placeholders from Stitch's generic mock data.
