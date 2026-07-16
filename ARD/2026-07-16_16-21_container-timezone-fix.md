# Session: Align container clocks with local machine timezone

---
## Set explicit TZ=Africa/Cairo on api and db containers
**File(s):** docker-compose.yml, .env, .env.example
**What changed:** Added `TZ: ${TZ:-Africa/Cairo}` to the `environment` block of both the `api` and `db` services in `docker-compose.yml`, and added the corresponding `TZ=Africa/Cairo` key (with an explanatory comment) to `.env` and `.env.example`. The value is overridable per-deployment via `.env`.
**Why:** Investigated the app's timestamp handling end-to-end (Prisma `@default(now())` on Admin/Category/Supplier/Product/Client/Sale/Refund, server-side `new Date()` calls, and frontend display code) after being asked to confirm timestamps reflect the local machine's clock across invoices, restock, clients, and categories. Found the host machine is `Africa/Cairo` (UTC+3, confirmed via `timedatectl`), but neither `docker-compose.yml` nor the Dockerfiles set a timezone, so the `node:20-slim` (api) and `postgres:16-alpine` (db) containers defaulted to UTC. This caused a real 3-hour skew in two places that use the server's own local-time representation:
- `apps/api/src/lib/pdf.ts:91` — `data.createdAt.toLocaleString()` runs server-side to stamp invoice PDFs; would print UTC time instead of Cairo time.
- `apps/api/src/modules/dashboard/dashboard.routes.ts:31-33` — computes the "this month" boundary via `new Date().setDate(1); setHours(0,0,0,0)`, which resolves against the process's local timezone; a UTC container would misplace the boundary by 3 hours relative to Cairo midnight, risking miscounted month-start sales.
**Impact:** Empirically verified via `docker compose exec` before/after:
- Confirmed both `postgres:16-alpine` and `node:20-slim` honor a named `TZ` value out of the box (no extra `tzdata` package needed) — `date` and `Intl.DateTimeFormat().resolvedOptions().timeZone` both correctly reported Cairo/EEST inside throwaway containers.
- Ran a live Prisma `client.create()` inside the running `api` container and compared the returned `createdAt` epoch against the wall clock at insert time: diff was ~29ms, confirming the DB-stored instant was already correct (Postgres session `timezone` GUC stayed `UTC` even after this change — it's fixed at `initdb` time on the persisted volume, not re-read from `TZ` on restart — but `node-postgres` consistently interprets timezone-naive `timestamp` columns as UTC on both write and read, so the two effects cancel out; this was NOT changed and does not need to be, since flipping the GUC would break that consistency).
- After the change, confirmed inside the `api` container that `new Date().toLocaleString()` and the dashboard's start-of-month boundary both now resolve to Cairo local time instead of UTC.
- Rebuilt and restarted the full stack (`docker compose up -d --build`); all three containers (`db`, `api`, `web`) came up healthy.
- No schema or code changes required elsewhere — frontend date formatting (`toLocaleString`/`toLocaleDateString` in `InvoicePreview.tsx`, `Sales.tsx`, `Account.tsx`, `RevenueExplorer.tsx`) already runs in the browser and correctly uses the viewer's own local timezone.
- Deployers moving this stack to a server outside Egypt should override `TZ` in their `.env`.
**Status:** Approved
