# 💰 Currency Guide (Nigerian Naira)

Waraqah uses **Nigerian Naira (NGN)** only. All invoices, dashboard totals, and PDF exports display amounts in **₦**.

## 🇳🇬 Currency

| Code | Symbol | Name           |
|------|--------|----------------|
| NGN  | ₦      | Nigerian Naira |

Amounts are formatted with Nigerian locale grouping (e.g. **₦1,234,567.89**).

## ⚙️ Where currency is set

You do **not** choose a currency in Settings or when creating an invoice. The app always uses NGN.

- **Settings** shows currency as read-only: *₦ Nigerian Naira (NGN)*
- **New invoices** are saved with `currency: NGN` automatically
- **Business profile** stores `defaultCurrency: NGN` for API compatibility

## 💵 Creating invoices

When creating or editing an invoice:

1. Fill in invoice details (client, dates, status)
2. Set **Tax Rate** (percentage per invoice)
3. Add line items — rates and totals appear in **₦**
4. Save or download PDF — all amounts stay in naira

There is no currency dropdown on the invoice form.

## 🎯 Features

✅ **Consistent formatting** — ₦ on dashboard, invoice list, create/edit form, and PDFs  
✅ **Custom tax rates** — Set tax percentage per invoice  
✅ **PDF exports** — Line items and totals use the **NGN** code label in PDFs (e.g. `NGN 10,000.00`) for clarity when printing  

## 📊 Dashboard display

- **Revenue (Paid)** and **Pending Revenue** sum invoice totals in naira
- Each invoice row shows its total as **₦**
- Older invoices that were stored with another currency code are still **displayed** using naira formatting

## 💡 Tips

- **Tax rate**: Common values are 0%, 5%, 7.5%, 10%, or 15% — set per invoice as needed
- **Rates**: Enter item rates in naira (no conversion step)
- **PDFs**: Share or print PDFs; clients see amounts in Nigerian Naira

## 🔧 For developers

- Currency logic lives in `src/utils/currency.js`
- Constants: `APP_CURRENCY` (`NGN`), `CURRENCY_INFO`, `formatCurrency(amount)`
- Do not reintroduce multi-currency UI without updating this guide and the Settings/invoice flows

---

**Note:** Waraqah does not perform currency conversion. All amounts are treated as Nigerian Naira.
