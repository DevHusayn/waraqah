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

## Checklist

- [ ] `VITE_API_URL` set on **frontend** Vercel project → **redeploy frontend**
- [ ] `MONGO_URI` is Atlas, not localhost
- [ ] `FRONTEND_URL` matches your Vercel app URL
- [ ] `https://your-backend.vercel.app/api/health` works on your phone
- [ ] Login request in Network tab points to the HTTPS backend
