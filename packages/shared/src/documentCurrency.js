import { normalizeCurrency } from './currency.js';

export function roundMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

export function isValidExchangeRate(rate) {
    const n = Number(rate);
    return Number.isFinite(n) && n > 0;
}

export function needsExchangeRate(documentCurrency, businessCurrency) {
    return normalizeCurrency(documentCurrency) !== normalizeCurrency(businessCurrency);
}

/** Prompt for a books rate only when currency changes and the account already has amounts. */
export function needsBooksCurrencyRebase(fromCurrency, toCurrency, hasBooksAmounts) {
    return needsExchangeRate(fromCurrency, toCurrency) && Boolean(hasBooksAmounts);
}

export function booksRebaseCorrectionFactor(oldRate, newRate) {
    if (!isValidExchangeRate(oldRate) || !isValidExchangeRate(newRate)) return null;
    if (roundExchangeRate(oldRate) === roundExchangeRate(newRate)) return 1;
    const factor = Number(newRate) / Number(oldRate);
    return Number.isFinite(factor) && factor > 0 ? factor : null;
}

export function getLastBooksRebase(businessInfo = {}) {
    const fromRaw = String(businessInfo.booksRebaseFrom || '').trim();
    const toRaw = String(businessInfo.booksRebaseTo || '').trim();
    if (!fromRaw || !toRaw) return null;
    const from = normalizeCurrency(fromRaw);
    const to = normalizeCurrency(toRaw);
    const rate = Number(businessInfo.booksRebaseRate);
    const at = businessInfo.booksRebasedAt;
    if (!from || !to || from === to || !isValidExchangeRate(rate) || !at) return null;
    return { from, to, rate, at };
}

export function canCorrectBooksRebase(businessInfo = {}) {
    const last = getLastBooksRebase(businessInfo);
    if (!last) return false;
    return last.to === normalizeCurrency(businessInfo.defaultCurrency);
}

export function isBooksRebaseRateError(message) {
    return /enter how many \S+ equal 1 \S+/i.test(String(message || ''));
}

export function computeBaseAmounts({
    total = 0,
    subtotal = 0,
    tax = 0,
    discount = 0,
    amountPaid = 0,
    exchangeRate = 1,
} = {}) {
    const rate = Number(exchangeRate);
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 0;
    return {
        baseSubtotal: roundMoney((Number(subtotal) || 0) * safeRate),
        baseTax: roundMoney((Number(tax) || 0) * safeRate),
        baseDiscount: roundMoney((Number(discount) || 0) * safeRate),
        baseTotal: roundMoney((Number(total) || 0) * safeRate),
        baseAmountPaid: roundMoney((Number(amountPaid) || 0) * safeRate),
    };
}

export function resolveDocumentExchangeRate(documentCurrency, businessCurrency, exchangeRate) {
    if (!needsExchangeRate(documentCurrency, businessCurrency)) return 1;
    return isValidExchangeRate(exchangeRate) ? Number(exchangeRate) : null;
}

export function roundExchangeRate(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 1e8) / 1e8;
}

/** Keep up to 8 decimal places so books rebases like 1 NGN = 0.00067 USD can be entered. */
export function sanitizeExchangeRateInput(raw) {
    const cleaned = String(raw ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
    if (!cleaned) return '';

    const dotIndex = cleaned.indexOf('.');
    if (dotIndex === -1) return cleaned;

    const whole = cleaned.slice(0, dotIndex);
    const decimals = cleaned
        .slice(dotIndex + 1)
        .replace(/\./g, '')
        .slice(0, 8);
    const endsWithDot = cleaned.endsWith('.');

    if (endsWithDot && !decimals) {
        return `${whole || '0'}.`;
    }
    if (decimals) {
        return `${whole || '0'}.${decimals}`;
    }
    return whole || '0';
}

export function parseExchangeRateInput(raw) {
    const sanitized = sanitizeExchangeRateInput(raw);
    if (!sanitized || sanitized === '.') return 0;
    const parsed = Number(sanitized.endsWith('.') ? sanitized.slice(0, -1) : sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatExchangeRateValue(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return '';
    const digits = n >= 1 ? 4 : 8;
    return n.toLocaleString('en-US', {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
        useGrouping: n >= 1000,
    });
}

function recordedAmountPaid(doc) {
    const recorded = roundMoney(doc?.amountPaid);
    if (recorded > 0) return recorded;
    if (doc?.status === 'paid') return roundMoney(doc?.total);
    return 0;
}

function scaleItemUnitCosts(items, rate) {
    if (!Array.isArray(items)) return { items, changed: false };
    let changed = false;
    const next = items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const cost = Number(item.unitCost);
        if (!Number.isFinite(cost) || cost === 0) return item;
        changed = true;
        return { ...item, unitCost: roundMoney(cost * rate) };
    });
    return { items: next, changed };
}

function pickBooksPatch(patch, kind) {
    if (kind === 'purchaseOrder') {
        const { exchangeRate, baseCurrency, baseSubtotal, baseTotal } = patch;
        return { exchangeRate, baseCurrency, baseSubtotal, baseTotal };
    }
    if (kind === 'quotation') {
        const { exchangeRate, baseCurrency, baseSubtotal, baseTax, baseDiscount, baseTotal } = patch;
        return { exchangeRate, baseCurrency, baseSubtotal, baseTax, baseDiscount, baseTotal };
    }
    return patch;
}

/**
 * Rebase a document's books fields from one business currency into another.
 * Client-facing `currency` and face amounts are left unchanged.
 * Returns a $set patch, or null when the document is already on the new books.
 */
export function rebaseDocumentBooks(doc, { fromCurrency, toCurrency, rate, kind = 'invoice' } = {}) {
    if (!doc) return null;
    const from = normalizeCurrency(fromCurrency);
    const to = normalizeCurrency(toCurrency);
    const rebaseRate = Number(rate);
    if (from === to || !isValidExchangeRate(rebaseRate)) return null;

    const docCurrency = normalizeCurrency(doc.currency || from);
    const baseCurrency = doc.baseCurrency ? normalizeCurrency(doc.baseCurrency) : docCurrency;
    if (baseCurrency === to) return null;

    const amountPaid = recordedAmountPaid(doc);

    if (docCurrency === to) {
        const { items, changed } = scaleItemUnitCosts(doc.items, rebaseRate);
        const patch = {
            exchangeRate: 1,
            baseCurrency: to,
            ...computeBaseAmounts({
                subtotal: doc.subtotal,
                tax: doc.tax,
                discount: doc.discount,
                total: doc.total,
                amountPaid,
                exchangeRate: 1,
            }),
        };
        if (kind === 'invoice' && changed) patch.items = items;
        return pickBooksPatch(patch, kind);
    }

    if (docCurrency !== from && !isValidExchangeRate(doc.exchangeRate)) {
        return null;
    }

    const previousRate = docCurrency === from || !isValidExchangeRate(doc.exchangeRate)
        ? 1
        : Number(doc.exchangeRate);
    const newRate = roundExchangeRate(previousRate * rebaseRate);
    if (!isValidExchangeRate(newRate)) return null;

    const hasStoredBase = doc.baseTotal != null || doc.baseSubtotal != null;
    const baseFields = hasStoredBase && (baseCurrency === from || !doc.baseCurrency)
        ? {
              baseSubtotal: roundMoney((Number(doc.baseSubtotal) || 0) * rebaseRate),
              baseTax: roundMoney((Number(doc.baseTax) || 0) * rebaseRate),
              baseDiscount: roundMoney((Number(doc.baseDiscount) || 0) * rebaseRate),
              baseTotal: roundMoney((Number(doc.baseTotal) || Number(doc.total) || 0) * rebaseRate),
              baseAmountPaid: roundMoney(
                  (doc.baseAmountPaid != null ? Number(doc.baseAmountPaid) : amountPaid) * rebaseRate
              ),
          }
        : computeBaseAmounts({
              subtotal: doc.subtotal,
              tax: doc.tax,
              discount: doc.discount,
              total: doc.total,
              amountPaid,
              exchangeRate: newRate,
          });

    const { items, changed } = scaleItemUnitCosts(doc.items, rebaseRate);
    const patch = {
        exchangeRate: newRate,
        baseCurrency: to,
        ...baseFields,
    };
    if (kind === 'invoice' && changed) patch.items = items;
    return pickBooksPatch(patch, kind);
}

/**
 * Restate books after a mistaken conversion rate. Face amounts stay put.
 * Returns a $set patch, or null when this document should not move.
 */
export function correctDocumentBooksRate(
    doc,
    { fromCurrency, toCurrency, oldRate, newRate, kind = 'invoice' } = {}
) {
    if (!doc) return null;
    const from = normalizeCurrency(fromCurrency);
    const to = normalizeCurrency(toCurrency);
    const factor = booksRebaseCorrectionFactor(oldRate, newRate);
    if (from === to || factor == null || factor === 1) return null;

    const docCurrency = normalizeCurrency(doc.currency || from);
    const baseCurrency = doc.baseCurrency ? normalizeCurrency(doc.baseCurrency) : docCurrency;
    if (baseCurrency !== to) return null;

    if (docCurrency === to) {
        const { items, changed } = scaleItemUnitCosts(doc.items, factor);
        if (!changed || kind !== 'invoice') return null;
        return { items };
    }

    const nextExchangeRate =
        docCurrency === from || !isValidExchangeRate(doc.exchangeRate)
            ? roundExchangeRate(newRate)
            : roundExchangeRate(Number(doc.exchangeRate) * factor);
    if (!isValidExchangeRate(nextExchangeRate)) return null;

    const amountPaid = recordedAmountPaid(doc);
    const { items, changed } = scaleItemUnitCosts(doc.items, factor);
    const patch = {
        exchangeRate: nextExchangeRate,
        baseCurrency: to,
        ...computeBaseAmounts({
            subtotal: doc.subtotal,
            tax: doc.tax,
            discount: doc.discount,
            total: doc.total,
            amountPaid,
            exchangeRate: nextExchangeRate,
        }),
    };
    if (kind === 'invoice' && changed) patch.items = items;
    return pickBooksPatch(patch, kind);
}
