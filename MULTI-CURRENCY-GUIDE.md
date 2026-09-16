# Currency Guide

Waraqah uses **one operating currency per business**. Client-facing invoices can use a different currency. Accounting always uses the business currency via a user-entered exchange rate. There is **no live FX feed**.

## Defaults

| Setting | Default |
|---------|---------|
| Country | Nigeria (`NG`) |
| Currency | Nigerian Naira (`NGN`) |

Existing accounts stay on Naira until they change Country or Currency in Settings.

Choosing a country suggests that country’s currency. You can override it (for example a UAE business invoicing in USD).

## Where currency is set

**Settings → Business Settings → Company Profile**

- **Country** — searchable list of countries
- **Currency** — searchable list of ISO 4217 currencies

New invoices, quotations, receipts, and purchase orders inherit the business currency. You can still change currency on an individual document. If you do, Waraqah asks how many units of the business currency equal 1 unit of the document currency (for example, 1 USD = 1500 NGN).

- PDFs, emails, and the public client view stay in the **document** currency
- Dashboard, profit, statements, and rankings use the **converted business-currency** amounts
- Payments are recorded in the document currency and converted with **that document’s stored rate**
- Existing documents keep the currency they were saved with. Older foreign-currency documents without a rate are **left out** of business-currency totals

Expenses, payroll, and product catalog prices stay in the business currency.

## Creating invoices

1. Fill in invoice details (client, dates, status)
2. Choose **Currency** next to Rate if it should differ from the business default, then enter the exchange rate
3. Set tax rate and add line items — rates and totals on the PDF use that document’s currency
4. Save or download PDF — amounts use the document currency (PDFs show the ISO code, e.g. `GHS 10,000.00`, because some symbols cannot print in Helvetica). Earnings use the converted business-currency total.

## Features

- Consistent formatting on dashboard, lists, forms, and PDFs
- Custom tax rates per invoice
- PDF exports use the ISO code label for print clarity

## Dashboard

Revenue, expenses, and profit totals use the **business** currency. Converted documents are included using the stored rate. Documents in another currency with **no** stored rate are omitted from those totals.

## Tips

- Enter rates in the currency shown on the document
- When the document currency differs from Settings, enter 1 document unit in business currency (1 USD in NGN)
- Waraqah subscription billing (Upgrade / Paystack) stays in Nigerian Naira
- Changing currency does not rewrite historical documents

## For developers

- Catalog and formatters: `packages/shared/src/currency.js`, `packages/shared/src/documentCurrency.js`, and `packages/shared/src/country.js`
- Business field: `defaultCurrency` (plus `country`) on the company profile
- Document fields: `currency`, `exchangeRate`, `baseCurrency`, `baseTotal` (and related `base*` amounts)
- UI hook: `useBusinessCurrency()` / `useDocumentExchangeRate()`
- Fallback constant: `APP_CURRENCY` (`NGN`)
