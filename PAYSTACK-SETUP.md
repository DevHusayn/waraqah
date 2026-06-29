# Paystack subscriptions — setup steps

Waraqah Premium: **₦2,000/month** (launch price; list price ₦5,000), auto-renewing via Paystack Subscription Plans.

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

## Step 3 — Subscription plan (₦2,000/month)

The backend uses `PREMIUM_AMOUNT_NGN = 2000` in `services/paystack.js`. Your Paystack plan amount must match.

**Option A — Automatic (recommended for dev)**  
Start the backend once. It creates the plan and logs:

```text
PAYSTACK_PLAN_CODE=PLN_xxxxxxxx
```

Copy that line into `.env` and restart the server.

**Option B — Paystack Dashboard**  
1. Go to **Plans** → **Create plan**.  
2. Name: `Waraqah Premium Monthly`  
3. Amount: **₦2,000**  
4. Interval: **Monthly**  
5. Copy the **Plan code** (`PLN_…`) into `.env`:

```env
PAYSTACK_PLAN_CODE=PLN_xxxxxxxx
```

If you change the price in code, create a **new** Paystack plan and update `PAYSTACK_PLAN_CODE`.

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
6. Paystack will charge **₦2,000 every month** until the user cancels  

**Cancel auto-renewal:** Settings → Plan and Billing → **Cancel auto-renewal** (Premium stays until `premiumUntil`).

**Billing history:** Settings → Plan and Billing shows past subscription charges.

---

## Step 7 — Go live

1. Switch Paystack to **Live mode**.  
2. Replace keys with `sk_live_…` / `pk_live_…`.  
3. Create the **live** plan at ₦2,000/month (or set live `PAYSTACK_PLAN_CODE`).  
4. Set live webhook URL.  
5. Set `ALLOW_DEV_PLAN=false` in production `.env`.

---

## How it works in the app

| Step | What happens |
|------|----------------|
| User pays | Paystack Checkout with your **Plan** attached |
| First charge | Subscription created; user gets 30 days Premium |
| Each month | Paystack charges ₦2,000; webhook extends Premium |
| User cancels | `subscription.disable` → no more charges; access until period ends |

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| “Paystack not configured” | Add `PAYSTACK_SECRET_KEY` and restart API |
| Payment works but no renewal | Configure webhook URL + events |
| Plan not found | Set `PAYSTACK_PLAN_CODE` in `.env` (amount must be ₦2,000) |
| Cancel fails | User must have subscribed via Paystack (has `SUB_` code on file) |
| Paystack succeeds but browser does not return to the app | Use the **same URL** for the app when you click Upgrade (e.g. always `http://localhost:5173`). The app sends `callbackOrigin` to the API so Paystack redirects to that host. If Vite uses another port (5174), open the app on that port before paying, or set `FRONTEND_URL` in backend `.env` to match. Restart the API after changing `.env`. |
| Lands on app but “Please sign in” | Sign in from the link on the callback page — your payment reference is kept in the URL. |
