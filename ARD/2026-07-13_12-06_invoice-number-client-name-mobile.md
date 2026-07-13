# Session: Invoice numbers embed client first name + mobile

---
## Change invoice number format to {FirstName}-{Mobile}-{Sequence}
**File(s):** apps/api/src/modules/sales/sales.service.ts
**What changed:** `nextInvoiceNumber` now takes the sale's client and builds the invoice number as the client's first name, their mobile number, and a zero-padded sequence (e.g. `Ahmed-01012345678-000008`), instead of the old plain `SALE-000008`. Added `clientFirstName` (first whitespace-separated token of `client.name`) and `sanitizeForInvoiceNumber` (strips characters unsafe for filenames/headers, since `invoiceNumber` doubles as the downloaded PDF's filename) helpers. The trailing sequence number is unchanged from before (`prisma.sale.count() + 1`, zero-padded to 6 digits) and still guarantees uniqueness even across repeat purchases by the same client.
**Why:** User wanted the invoice identifier to be recognizable by client at a glance (name + phone) rather than an opaque running number, across Sales history, the Refund modal, Invoice Preview, and the downloaded PDF filename — all of which just display/reuse `sale.invoiceNumber`, so no other file needed changes.
**Impact:** No schema or API contract change (`invoiceNumber` was already a free-form unique string). Verified against the live dev DB: created a throwaway client ("Ahmed Test Client" / `01012345678`) and product, ran two sales for that client, confirmed invoice numbers `Ahmed-01012345678-000008` and `Ahmed-01012345678-000009`, then deleted the test sales/refunds/product/client and their generated PDFs. Typechecks clean; api container rebuilt and confirmed healthy.
**Status:** Approved
