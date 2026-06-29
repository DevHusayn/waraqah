# Deploying Waraqah on Vercel (frontend + backend)

"Failed to fetch" on login from your phone almost always means the **browser cannot reach your API**. Fix the checklist below.

---

## 1. Frontend: set `VITE_API_URL` (required)

Vite bakes env vars in at **build time**. If this is missing, the app calls `http://localhost:5000/api` — which only works on your PC, not on your phone.

1. Open your **frontend** project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**
2. Add:

| Name | Value (example) |
|------|------------------|
| `VITE_API_URL` | `https://your-backend-project.vercel.app/api` |

Use your **real backend URL** + `/api` at the end. Must be **HTTPS**.

Optional — error monitoring:

| Name | Value |
|------|--------|
| `VITE_SENTRY_DSN` | Your Sentry project DSN (from [sentry.io](https://sentry.io)) |

3. **Redeploy** the frontend (Deployments → … → Redeploy). Changing env vars does not update old builds until you redeploy.

---

## 2. Backend: environment variables

In your **backend** Vercel project (or Render/Railway if you use those):

| Variable | Notes |
|----------|--------|
| `MONGO_URI` | **MongoDB Atlas** connection string — `localhost` will not work in the cloud |
| `JWT_SECRET` | Long random string |
| `FRONTEND_URL` | Your live app URL, e.g. `https://your-app.vercel.app` (no trailing slash) |
| `CORS_ALLOW_VERCEL` | `true` — allows `*.vercel.app` preview URLs |
| `PAYSTACK_*` | Your keys |
| `ALLOW_DEV_PLAN` | `false` in production |

Redeploy the backend after changing env vars.

---

## 3. Quick tests

**Backend health** (in phone browser or laptop):

```text
https://your-backend.vercel.app/api/health
```

You should see `{"ok":true}`.

**Frontend API URL** — after redeploy, open your app → DevTools → Network → try login → request should go to `https://your-backend.../api/auth/login`, **not** `localhost`.

---

## 4. CORS

The API allows:

- `FRONTEND_URL`
- Extra origins in `ALLOWED_ORIGINS` (comma-separated)
- Any `*.vercel.app` host when `CORS_ALLOW_VERCEL=true`

`FRONTEND_URL` must match the URL in your browser exactly (including `https://`).

---

## 5. Backend on Vercel notes

- Use **MongoDB Atlas** (free tier is fine).
- Recurring invoice cron does **not** run on Vercel serverless; use Render/Railway for cron, or an external cron hitting a future endpoint.
- If the backend project fails to deploy, check Vercel build logs and that `MONGO_URI` is set.

---

## 6. Paystack (when you go live)

Set Paystack webhook to:

```text
https://your-backend.vercel.app/api/payments/webhook
```

Set `FRONTEND_URL` to your production app URL for payment redirects.

---

## 7. Security checklist

### Backend environment (Vercel)

| Variable | Production value |
|----------|------------------|
| `NODE_ENV` | `production` (optional; `VERCEL=1` also enables production checks) |
| `JWT_SECRET` | At least 32 random characters — never reuse dev secrets |
| `MONGO_URI` | Atlas `mongodb+srv://...` with a **dedicated app user** (read/write on `waraqah` only) |
| `FRONTEND_URL` | Your live frontend URL — required for CORS and Paystack redirects |
| `ALLOW_DEV_PLAN` | **`false`** — dev premium toggle must not work in production |
| `CORS_ALLOW_VERCEL` | `true` if you use Vercel preview URLs |

### MongoDB Atlas lockdown

1. Create a database user with **readWrite** on the `waraqah` database only (not `atlasAdmin`).
2. Use a strong password (32+ characters) and store it only in Vercel env vars.
3. **Network access:** Vercel serverless uses dynamic IPs, so Atlas often needs `0.0.0.0/0`. Mitigate with strong DB credentials, app authentication, and API rate limits — not IP allowlisting alone.
4. Use TLS (`mongodb+srv://`) — Atlas default.
5. Enable backups on your cluster; enable audit logs if your Atlas tier supports them.
6. Never commit `MONGO_URI` to git.

### API hardening (built into the backend)

- Security headers (`helmet`), HPP protection, MongoDB operator sanitization
- IP rate limits stored in MongoDB (works across Vercel instances)
- Input sanitization on clients, invoices, auth, and business settings
- Paystack webhook signature verification
- Generic error messages in production (no internal details leaked)

### Frontend (Vercel)

Security response headers are set in `vercel.json` (`X-Frame-Options`, CSP, etc.). Redeploy the frontend after changing them.

---

## Checklist

- [ ] `VITE_API_URL` set on **frontend** Vercel project → **redeploy frontend**
- [ ] `VITE_SENTRY_DSN` set (optional) for production error monitoring
- [ ] `MONGO_URI` is Atlas, not localhost
- [ ] `FRONTEND_URL` matches your Vercel app URL
- [ ] `https://your-backend.vercel.app/api/health` works on your phone
- [ ] Login request in Network tab points to the HTTPS backend
- [ ] `JWT_SECRET` is 32+ characters; `ALLOW_DEV_PLAN=false` on backend
- [ ] Atlas uses a restricted DB user; `MONGO_URI` is not localhost
