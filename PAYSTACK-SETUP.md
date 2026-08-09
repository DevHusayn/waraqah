# Paystack subscriptions — setup steps

Waraqah Premium: **₦5,000/month** or **₦50,000/year** (2 months free), auto-renewing via Paystack Subscription Plans.

---

## Step 1 — Paystack account

1. Sign up at [paystack.com](https://paystack.com).
2. Complete business verification (required for live payments).
3. Stay in **Test mode** while developing.

---

## Step 2 — API keys

1. Open [Dashboard → Settings → API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers).
2. Copy **Test Secret Key** (`sk_test_…`) and **Test Public Key** (`pk_test_…`).
3. Add to `InvoicePro-backend/.env`:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
FRONTEND_URL=http://localhost:5173
```

---

## Step 3 — Subscription plans

The backend uses `PREMIUM_AMOUNT_NGN = 5000` and `PREMIUM_YEARLY_AMOUNT_NGN = 50000` in `services/paystack.js`. Your Paystack plan amounts must match.

**Option A — Automatic (recommended for dev)**  
Start the backend once. It reuses or creates matching plans and logs:

```text
PAYSTACK_PLAN_CODE=PLN_xxxxxxxx
PAYSTACK_PLAN_CODE_YEARLY=PLN_xxxxxxxx
```

Copy those lines into `.env` and restart the server.

**Option B — Paystack Dashboard**  
1. Go to **Plans** → **Create plan**.  
2. Monthly: Name `Waraqah Premium Monthly`, Amount **₦5,000**, Interval **Monthly**  
3. Yearly: Name `Waraqah Premium Yearly`, Amount **₦50,000**, Interval **Annually**  
4. Copy the **Plan codes** (`PLN_…`) into `.env`:

```env
PAYSTACK_PLAN_CODE=PLN_xxxxxxxx
PAYSTACK_PLAN_CODE_YEARLY=PLN_xxxxxxxx
```

If you change the price in code, create **new** Paystack plans and update the plan codes.

---

## Step 4 — Webhook (renewals & cancellations)

Paystack needs your server URL to send renewal events.

**Local dev (ngrok):**

```bash
ngrok http 5000
```

Use the HTTPS URL in Paystack:

```text
https://xxxx.ngrok-free.app/api/payments/webhook
```

**Production:**

```text
https://your-api-domain.com/api/payments/webhook
```

Enable events:

- `charge.success`
- `subscription.create`
- `subscription.disable`
- `invoice.payment_failed`

---

## Step 5 — Run the stack

```bash
# Terminal 1 — API
cd InvoicePro-backend
npm run dev

# Terminal 2 — App
cd InvoicePro
npm run dev
```

---

## Test mode plan toggle (no payment)

With `ALLOW_DEV_PLAN=true` in backend `.env` and Paystack **test** keys (`sk_test_…`), a **Free | Premium** switch appears on:

- **Settings** → Plan and Billing  
- **Upgrade** page  

Use it to test logo upload and PDF branding without paying. Set `ALLOW_DEV_PLAN=false` in production.

---

## Step 6 — Test a subscription

1. Log in at http://localhost:5173  
2. Sidebar → **Upgrade**  
3. **Pay with Paystack**  
4. Test card: `4084084084084081` (any future expiry, any CVV)  
5. After redirect, Premium is active  
6. Paystack will charge **₦5,000 every month** (or **₦50,000 every year**) until the user cancels  

**Cancel auto-renewal:** Settings → Plan and Billing → **Cancel auto-renewal** (Premium stays until `premiumUntil`).

**Billing history:** Settings → Plan and Billing shows past subscription charges.

---

## Step 7 — Go live

1. Switch Paystack to **Live mode**.  
2. Replace keys with `sk_live_…` / `pk_live_…`.  
3. Create the **live** plans at ₦5,000/month and ₦50,000/year (or set live `PAYSTACK_PLAN_CODE` / `PAYSTACK_PLAN_CODE_YEARLY`).  
4. Set live webhook URL.  
5. Set `ALLOW_DEV_PLAN=false` in production `.env`.

---

## How it works in the app

| Step | What happens |
|------|----------------|
| User pays | Paystack Checkout with your **Plan** attached |
| First charge | Subscription created; user gets 30 days Premium |
| Each period | Paystack charges the plan amount; webhook extends Premium |
| User cancels | `subscription.disable` → no more charges; access until period ends |

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| “Paystack not configured” | Add `PAYSTACK_SECRET_KEY` and restart API |
| Payment works but no renewal | Configure webhook URL + events |
| Plan not found | Set `PAYSTACK_PLAN_CODE` in `.env` (amount must be ₦5,000) |
| Cancel fails | User must have subscribed via Paystack (has `SUB_` code on file) |
| Paystack succeeds but browser does not return to the app | Use the **same URL** for the app when you click Upgrade (e.g. always `http://localhost:5173`). The app sends `callbackOrigin` to the API so Paystack redirects to that host. If Vite uses another port (5174), open the app on that port before paying, or set `FRONTEND_URL` in backend `.env` to match. Restart the API after changing `.env`. |
| Lands on app but “Please sign in” | Sign in from the link on the callback page — your payment reference is kept in the URL. |
