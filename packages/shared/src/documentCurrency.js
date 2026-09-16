import { APP_CURRENCY, normalizeCurrency } from './currency.js';

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
