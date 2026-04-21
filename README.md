# 🌸 Florería Perla – Admin System

Production-ready inventory & order management for a flower shop.  
Built with **Next.js 14 · Prisma · Neon PostgreSQL · NextAuth · Netlify**.

---

## 📐 Architecture

```
Browser (Mobile-first PWA)
        │
        ▼
Netlify CDN  ──►  Next.js App Router (static pages + SSR)
                         │
                         ▼
             Netlify Functions (Next.js API routes)
                         │
                         ▼
              Neon PostgreSQL (serverless Postgres)
              via Prisma ORM (connection pooling)
```

**Key design decisions:**
- **Stateless JWT sessions** — compatible with serverless (no sticky sessions needed)
- **Connection pooling** — Neon's pgBouncer prevents cold-start connection exhaustion
- **FIFO stock deduction** — confirmed orders consume oldest batches first (least waste)
- **Polling every 30 s** — lightweight real-time alternative, no WebSocket needed

---

## 🗂️ Folder Structure

```
floreria-perla-admin/
├── app/
│   ├── (dashboard)/          # Protected route group
│   │   ├── layout.tsx        # Auth guard + sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── flowers/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── seasons/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── users/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── flowers/route.ts
│   │   ├── flowers/[id]/route.ts
│   │   ├── inventory/route.ts
│   │   ├── inventory/waste/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   ├── orders/[id]/confirm/route.ts
│   │   ├── seasons/route.ts
│   │   ├── alerts/route.ts
│   │   └── users/route.ts
│   ├── login/page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   └── ui/
│       ├── badge.tsx, button.tsx, card.tsx, form.tsx, modal.tsx, toaster.tsx
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Prisma singleton
│   ├── session.ts            # Auth guards for API routes
│   ├── utils.ts              # Formatters + audit logger
│   └── validations.ts        # Zod schemas
├── middleware.ts             # Route protection
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── netlify.toml
└── .env.example
```

---

## 🚀 Step-by-Step Netlify Deployment

### 1. Create Neon PostgreSQL database

1. Go to [neon.tech](https://neon.tech) → **Create project**
2. Copy **Connection string** (pooled) → `DATABASE_URL`
3. Copy **Direct connection string** → `DIRECT_URL`

### 2. Fork / push to GitHub

```bash
git init
git add .
git commit -m "feat: initial floreria perla admin"
git remote add origin https://github.com/YOU/floreria-perla-admin.git
git push -u origin main
```

### 3. Connect to Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Select your repo
3. Netlify auto-detects `netlify.toml` — confirm:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`

### 4. Set Environment Variables in Netlify

Go to **Site configuration → Environment variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | `postgresql://...` (no pgbouncer) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally |
| `NEXTAUTH_URL` | `https://your-site.netlify.app` |
| `LOW_STOCK_THRESHOLD` | `2` |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | `30000` |

### 5. Run database migrations

```bash
# From your local machine with .env filled in
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

Or add to Netlify **Build command**:
```
prisma migrate deploy && npm run build
```

### 6. Deploy

Click **Deploy site** in Netlify. First build ~2-3 min.

**Default login after seed:**
- Email: `admin@floreria.com`
- Password: `Admin1234!`
- ⚠️ Change this immediately after first login

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signin` | — | Login (NextAuth) |
| GET | `/api/dashboard` | Any | KPI summary |
| GET | `/api/inventory` | Any | List batches with freshness |
| POST | `/api/inventory` | Any | Add incoming stock |
| POST | `/api/inventory/waste` | Any | Register waste |
| GET | `/api/flowers` | Any | List flowers |
| POST | `/api/flowers` | Owner | Create flower |
| PATCH | `/api/flowers/:id` | Owner | Update flower |
| DELETE | `/api/flowers/:id` | Owner | Soft delete flower |
| GET | `/api/orders` | Any | List orders (filterable) |
| POST | `/api/orders` | Any | Create order |
| GET | `/api/orders/:id` | Any | Order detail |
| PATCH | `/api/orders/:id` | Any | Update status |
| POST | `/api/orders/:id/confirm` | Any | Confirm + deduct stock (FIFO) |
| GET | `/api/seasons` | Any | List seasons |
| POST | `/api/seasons` | Owner | Create season |
| GET | `/api/alerts` | Any | Low stock / expiring / seasons |
| GET | `/api/users` | Owner | List users |
| POST | `/api/users` | Owner | Create user |
| PATCH | `/api/users/:id` | Owner | Update role / active status |

---

## 🔄 Real-time Updates Strategy

The app uses **client-side polling** (configurable via `NEXT_PUBLIC_POLL_INTERVAL_MS`):

- Dashboard, Inventory, and Alerts pages poll every 30 s automatically
- No WebSocket infrastructure needed → serverless compatible
- Interval clears on component unmount (no memory leaks)

To reduce latency further, decrease `NEXT_PUBLIC_POLL_INTERVAL_MS` to `10000` (10 s).

---

## 🔐 Security

- Passwords hashed with **bcrypt (cost 12)**
- Sessions signed with **HS256 JWT** (NEXTAUTH_SECRET, never exposed to client)
- All API routes require valid session (401 if missing)
- Owner-only routes return 403 for EMPLOYEE role
- Input validated with **Zod** at every API boundary
- **Soft deletes** only — no data is permanently erased from audit trail
- No SQL injection possible — Prisma uses parameterized queries

---

## 🌸 Color Legend

| Color | Meaning |
|-------|---------|
| 🟢 Green | Fresh (≥2 days remaining) |
| 🟡 Yellow | Near expiration (<2 days) |
| 🔴 Red | Expired |
