# Currency Guide

Waraqah uses **one operating currency per business**. Client-facing invoices can use a different currency. Accounting always uses the business currency via a user-entered exchange rate. There is **no live FX feed**.

## Defaults

| Setting | Default |
|---------|---------|
| Country | Nigeria (`NG`) |
| Currency | Nigerian Naira (`NGN`) |

Existing accounts stay on Naira until they change Country or Currency in Settings.

Choosing a country suggests that country’s currency. You can override it (for example a UAE business invoicing in USD).

## Changing the business currency

If the operating currency changes in **Company Profile** (including when a country change suggests a new currency) **and the account already has amounts**, Waraqah asks for an exchange rate before saving.

A new or empty account (no invoices, quotations, purchase orders, expenses, payroll, or products) can change currency freely — the label updates, and there is no rate prompt.

> How many units of the **new** currency equal 1 unit of the **old** currency?

Example: switching from NGN to USD, enter how many USD equal 1 NGN (for example `0.00067`). A live preview shows the conversion, including the inverse (1 USD ≈ 1,492.54 NGN).

That rate rebases **the books**:

- Dashboard, profit, statements, expenses, payroll, and catalog prices convert
- Invoices, quotations, receipts, and purchase orders keep the currency shown to the client
- Stored `base*` amounts and document exchange rates are rewritten so totals stay in the new business currency
- Foreign invoices already in the new currency snap to rate `1` (a $10 invoice stays $10)
- Waraqah subscription billing (Upgrade / Paystack) stays in Nigerian Naira

This is a one-rate conversion of existing amounts, not a historical restatement at daily market rates.

If the rate was typed wrong, **Company Profile** shows the last conversion with a **Update rate** action. Entering a new rate restates amounts from that switch by `newRate / oldRate`. Records created after the conversion are left unchanged. Client-facing invoice currencies stay the same.

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
- Changing the business currency converts books at the rate you enter; client-facing documents keep their original currency
- After a books conversion, use **Update rate** on Company Profile if the rate was wrong

## For developers

- Catalog and formatters: `packages/shared/src/currency.js`, `packages/shared/src/documentCurrency.js`, and `packages/shared/src/country.js`
- Business field: `defaultCurrency` (plus `country`) on the company profile
- Document fields: `currency`, `exchangeRate`, `baseCurrency`, `baseTotal` (and related `base*` amounts)
- Books rebase: `rebaseDocumentBooks()` plus `PUT /business-info` with `currencyExchangeRate` when `defaultCurrency` changes
- Rate correction: `correctDocumentBooksRate()` / `correctUserBooksRebaseRate()` — same `currencyExchangeRate` on PUT while currency is unchanged; scales by `newRate / oldRate` for records created at or before `booksRebasedAt`
- UI hook: `useBusinessCurrency()` / `useDocumentExchangeRate()` / `BooksCurrencyRebaseModal`
- Fallback constant: `APP_CURRENCY` (`NGN`)
