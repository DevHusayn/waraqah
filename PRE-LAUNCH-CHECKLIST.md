# Waraqah — Pre-launch checklist

Use this before announcing publicly or turning on live Paystack billing.

**Production URLs**
- Frontend: https://mywaraqah.com
- API: https://api.mywaraqah.com/api
- Health: https://api.mywaraqah.com/api/health

---

## 1. Deploy latest code

- [ ] Commit and push frontend changes (legal pages, registration consent, test PDF cleanup)
- [ ] **Redeploy frontend** on Vercel (env changes alone do not update old builds)
- [ ] **Redeploy backend** if backend changed since last deploy

---

## 2. Frontend environment (Vercel → Settings → Environment Variables)

| Variable | Required | Production value |
|----------|----------|------------------|
| `VITE_API_URL` | Yes | `https://api.mywaraqah.com/api` |
| `VITE_SENTRY_DSN` | No | Your Sentry DSN (recommended) |
| `VITE_GOOGLE_CLIENT_ID` | No | Same as backend `GOOGLE_CLIENT_ID` if using Google sign-in |
| `VITE_APPLE_CLIENT_ID` | No | Same as backend `APPLE_CLIENT_ID` if using Apple sign-in |

After changing any variable → **Redeploy frontend**.

---

## 3. Backend environment (Vercel → backend project)

| Variable | Required | Production value |
|----------|----------|------------------|
| `MONGO_URI` | Yes | Atlas `mongodb+srv://...` (not `localhost`) |
| `JWT_SECRET` | Yes | 32+ random characters (unique, not dev secret) |
| `FRONTEND_URL` | Yes | `https://mywaraqah.com` (no trailing slash) |
| `RESEND_API_KEY` | Yes | Live Resend key; domain `mywaraqah.com` verified |
| `EMAIL_FROM` | Yes | e.g. `Waraqah <notifications@mywaraqah.com>` |
| `ALLOW_DEV_PLAN` | Yes | **`false`** |
| `CRON_SECRET` | Yes | Long random string (Vercel Cron auth) |
| `PAYSTACK_SECRET_KEY` | Yes | `sk_live_...` for real billing (or `sk_test_...` for test mode) |
| `PAYSTACK_PUBLIC_KEY` | Yes | Matching public key |
| `PAYSTACK_PLAN_CODE` | Yes | Premium plan code from Paystack dashboard |
| `CORS_ALLOW_VERCEL` | Optional | `true` if you use `*.vercel.app` preview URLs |

The backend **refuses to start in production** if `JWT_SECRET` is too short, `ALLOW_DEV_PLAN=true`, or `RESEND_API_KEY` is missing.

---

## 4. Paystack

- [ ] Webhook URL: `https://api.mywaraqah.com/api/payments/webhook`
- [ ] Webhook events enabled: `charge.success`, subscription events, `invoice.payment_failed`
- [ ] Live keys in backend env if charging real ₦
- [ ] Test a full upgrade: `/upgrade` → Paystack → `/upgrade/callback` → Premium active

---

## 5. Resend (email)

- [ ] Domain `mywaraqah.com` verified in Resend
- [ ] `notifications@mywaraqah.com` (or your `EMAIL_FROM`) can send
- [ ] Test: register → verification email arrives
- [ ] Test: forgot password email arrives
- [ ] Test: send invoice to client (if auto-email enabled)

---

## 6. MongoDB Atlas

- [ ] Dedicated DB user with **readWrite on `waraqah` only** (not `atlasAdmin`)
- [ ] Strong password stored only in Vercel env
- [ ] Network access allows Vercel (often `0.0.0.0/0` for serverless)
- [ ] Backups enabled on cluster

---

## 7. Vercel Cron (payment reminders)

Configured in backend `vercel.json`: daily `GET /api/cron/payment-reminders`

- [ ] `CRON_SECRET` set on backend Vercel project
- [ ] Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` to cron routes

---

## 8. Smoke test on production (15 minutes)

Run on https://mywaraqah.com (use phone or incognito):

- [ ] Landing page loads; footer **Terms** and **Privacy** links work
- [ ] `/terms` and `/privacy` load without login
- [ ] Register → checkbox on step 4 → verify email → sign in
- [ ] Create client → create invoice → download PDF
- [ ] Mark invoice paid → receipt PDF
- [ ] Settings → company profile, bank details save correctly
- [ ] Upgrade to Premium (test or live Paystack)
- [ ] API health on phone: https://api.mywaraqah.com/api/health → `{"ok":true}`
- [ ] Login Network tab: requests go to `https://api.mywaraqah.com/api/...` (not `localhost`)

---

## 9. Automated tests (local, before deploy)

```bash
cd InvoicePro
npm test
```

Expected: **39 tests passing** (shared + backend).

---

## 10. Not in scope for web MVP

- **Mobile App Store / Play Store** — needs `eas init` and real EAS project ID
- **Recurring invoices** — disabled in code; do not advertise yet

---

## Quick verify commands

```bash
# Health
curl https://api.mywaraqah.com/api/health

# Tests
npm test
```

When every box above is checked, you are ready for a public web launch.
