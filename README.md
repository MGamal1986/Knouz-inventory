# Knouz Inventory & Costing System

Local-first inventory, product costing, client, and sales/invoicing system for Knouz.

**Stack:** React (Vite + TS) · Node.js/Express (TS) · PostgreSQL · Docker Compose
**Cost:** 100% free/open-source tools. No paid cloud services required — runs entirely on your Windows machine via Docker Desktop + WSL2.

---

## Project Structure

```
knouz-inventory/
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── api/                  # Node.js + Express + Prisma (PostgreSQL ORM)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts       # creates default admin (username: admin, password: 0000)
│   │   └── src/
│   │       ├── modules/      # one folder per feature (add new features here)
│   │       │   ├── auth/
│   │       │   ├── categories/
│   │       │   ├── suppliers/
│   │       │   ├── products/
│   │       │   ├── clients/
│   │       │   ├── sales/
│   │       │   ├── inventory/
│   │       │   └── dashboard/
│   │       ├── costing/      # business logic: product code gen, pricing
│   │       ├── middleware/   # auth guard, upload handling, error handler
│   │       ├── lib/          # prisma client, pdf generator
│   │       └── server.ts
│   └── web/                  # React frontend
│       └── src/
│           ├── pages/         # one file per page/screen
│           ├── components/    # shared UI (Layout, ProtectedRoute)
│           ├── context/        # AuthContext (JWT session)
│           └── api/            # axios client
```

Adding a new feature later = add a new folder under `apps/api/src/modules/<feature>` (routes + controller + service) and a matching page under `apps/web/src/pages/`. This mirrors the pattern used by every existing module, so it's copy-paste-and-adapt.

---

## First-Time Setup (Windows 11 + WSL2 + Docker Desktop)

1. Install **Docker Desktop** with the WSL2 backend enabled, and make sure you have a WSL2 Linux distro (e.g. Ubuntu) installed.
2. Clone this repo **inside your WSL2 filesystem** (not `/mnt/c/...`) for best performance:
   ```bash
   cd ~
   git clone <your-repo-url> knouz-inventory
   cd knouz-inventory
   ```
3. Copy the environment file and fill in values:
   ```bash
   cp .env.example .env
   ```
4. Build and start everything:
   ```bash
   docker compose up -d --build
   ```
5. Run the database migration and seed the default admin:
   ```bash
   docker compose exec api npx prisma migrate deploy
   docker compose exec api npx prisma db seed
   ```
6. Open the app: **http://localhost:3000**

   **Default login:**
   - Username: `admin`
   - Password: `0000`

   ⚠️ Change this password immediately after your first login (Settings → My Account), and you can create additional admin users from the same screen.

---

## Everyday Development

```bash
docker compose up -d          # start
docker compose logs -f api    # watch API logs
docker compose logs -f web    # watch frontend logs
docker compose down           # stop (data persists in Docker volumes)
```

Prisma Studio (visual DB browser, free, no signup):
```bash
docker compose exec api npx prisma studio
```

---

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial scaffold: Knouz inventory, costing, clients, sales/invoicing"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.env` is git-ignored on purpose — never commit real secrets. Only `.env.example` is tracked.

---

## Core Features in this Scaffold

- Predefined **Categories** with a base code (e.g. `RNG`) that auto-increments per category into a unique product code (e.g. `RNG-0001`).
- **Products**: description, category, supplier, purchase date, original cost, profit % → auto-computed selling price, quantity, invoice image upload, sold/unsold status.
- **Inventory dashboard**: searchable by product code, stock = quantity − sold.
- **Clients**: name, address, mobile.
- **Sales**: pick client + products/quantities → generates a PDF invoice with itemized lines, total, and timestamp; automatically deducts stock.
- **Auth**: JWT-based login, default admin seeded with password `0000`, ability to change password and add new admins.

## Free tools used (no paid services)
- PostgreSQL (open-source)
- Prisma ORM (open-source)
- Express (open-source)
- React + Vite (open-source)
- pdfkit (open-source, generates PDFs without headless Chrome)
- Docker Desktop (free for personal/small business use)
