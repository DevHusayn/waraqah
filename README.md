# Waraqah

Professional quotations and invoicing for freelancers and businesses in Nigeria — create estimates and invoices, convert accepted quotes, manage clients and products, export PDFs, and track payments. Includes free and premium tiers with Paystack subscriptions.

**Stack:** React 18 + Vite (web), Express + MongoDB (API), Expo (mobile app in `apps/mobile`).

---

## Features

- **Auth** — Register, login, forgot/reset password (JWT)
- **Quotations** — Create, send, accept/reject, public share links, convert to invoice
- **Invoices** — Create, edit, drafts, statuses (pending / paid / overdue / cancelled), receipts
- **Clients & products** — CRUD with validation
- **Dashboard** — Revenue, pending amounts, recent documents, overdue alerts
- **PDF export** — Branded quotations, invoices, and receipts (premium: logo, stamp, signature)
- **Settings** — Company profile, bank details, branding, plan & billing history
- **Premium** — Paystack subscription (launch price **₦2,000/month**; list price ₦5,000)
- **Admin** — User management (suspend, plan override)

---

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Paystack](https://paystack.com) account (for premium billing)
- SMTP (e.g. Gmail app password) for password-reset emails

---

## Local development

### 1. Backend (`InvoicePro-backend`)

```bash
cd InvoicePro-backend
cp .env.example .env
# Edit MONGO_URI, JWT_SECRET, PAYSTACK_*, SMTP_*, FRONTEND_URL
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

### 2. Frontend (this repo)

```bash
cd InvoicePro
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### 3. Mobile (optional)

```bash
cd InvoicePro/apps/mobile
cp .env.example .env
npm install
npm run start
```

See [apps/mobile/README.md](./apps/mobile/README.md) and [Expo docs](https://docs.expo.dev/).

---

## Environment variables

### Frontend (`.env` / Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Backend URL + `/api`, e.g. `https://your-api.vercel.app/api` |
| `VITE_SENTRY_DSN` | No | Sentry DSN for production error monitoring |

### Backend

See `InvoicePro-backend/.env.example`. Key vars: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `PAYSTACK_*`, `SMTP_*`, `ALLOW_DEV_PLAN=false` in production.

---

## Production deployment

See **[DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md)** for Vercel frontend + backend setup (env vars, CORS, health checks).

Paystack setup: **[PAYSTACK-SETUP.md](./PAYSTACK-SETUP.md)** (₦2,000/month launch pricing).

---

## Build

```bash
npm run build    # web → dist/
npm run preview  # preview production build locally
```

---

## Project structure

```
InvoicePro/
├── src/                 # Web app (Vite + React)
├── packages/shared/     # Shared validation, pricing, invoice logic
├── apps/mobile/         # Expo React Native app
├── DEPLOYMENT-VERCEL.md
├── PAYSTACK-SETUP.md
└── REBRANDING.md
```

PDF generation lives in `src/utils/pdfTemplates/standardPdf.js` with logo/stamp helpers in `src/utils/pdfLogo.js`.

---

## Monitoring & errors

- **Error boundary** — Unexpected React errors show a recovery screen instead of a blank page.
- **Sentry** (optional) — Set `VITE_SENTRY_DSN` in production to capture client errors. Create a project at [sentry.io](https://sentry.io), add the DSN to Vercel, and redeploy.

## Authentication

The web app uses **httpOnly cookies** for session tokens (not `localStorage`). Login/register set secure cookies on the API domain; the frontend sends `credentials: 'include'` and a CSRF header on mutating requests. The mobile app continues to use Bearer tokens from the login response.

**Note:** Frontend and API must be configured with matching CORS (`FRONTEND_URL`, `credentials: true`). On Vercel, cookies use `SameSite=None; Secure` when the API and app are on different domains.

---

## License

MIT
