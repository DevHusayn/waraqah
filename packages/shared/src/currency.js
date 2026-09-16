export const APP_CURRENCY = 'NGN';

/** Active ISO 4217 codes shown in currency pickers. NGN is pinned first in select options. */
export const ISO_CURRENCY_CODES = [
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
    'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
    'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
    'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD',
    'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
    'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
    'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD',
    'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR',
    'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD',
    'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON',
    'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP',
    'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS',
    'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD',
    'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF',
    'YER', 'ZAR', 'ZMW', 'ZWG',
];

const infoCache = new Map();
const ISO_CURRENCY_CODE_SET = new Set(ISO_CURRENCY_CODES);
const NON_CASH_CURRENCY_CODES = new Set([
    'XAU', 'XAG', 'XPT', 'XPD', 'XDR', 'XSU', 'XUA',
    'XBA', 'XBB', 'XBC', 'XBD', 'XXX', 'XTS',
]);
let displayNames;

function getCurrencyDisplayNames() {
    if (!displayNames) {
        try {
            displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
        } catch {
            displayNames = null;
        }
    }
    return displayNames;
}

export function isValidCurrencyCode(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) return false;
    if (NON_CASH_CURRENCY_CODES.has(normalized)) return false;
    if (ISO_CURRENCY_CODE_SET.has(normalized)) return true;
    try {
        new Intl.NumberFormat('en', { style: 'currency', currency: normalized }).format(0);
        return true;
    } catch {
        return false;
    }
}

function readCurrencyName(code) {
    try {
        return getCurrencyDisplayNames()?.of(code) || code;
    } catch {
        return code;
    }
}

function readCurrencySymbol(code) {
    try {
        const parts = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'narrowSymbol',
        }).formatToParts(0);
        return parts.find((part) => part.type === 'currency')?.value || code;
    } catch {
        return code;
    }
}

export function getCurrencyInfo(code = APP_CURRENCY) {
    const normalized = isValidCurrencyCode(code) ? String(code).trim().toUpperCase() : APP_CURRENCY;
    const cached = infoCache.get(normalized);
    if (cached) return cached;

    const info = {
        code: normalized,
        symbol: readCurrencySymbol(normalized),
        name: readCurrencyName(normalized),
        locale: 'en',
    };
    infoCache.set(normalized, info);
    return info;
}

export const CURRENCY_INFO = getCurrencyInfo(APP_CURRENCY);

export const SUPPORTED_CURRENCIES = ISO_CURRENCY_CODES
    .filter((code) => isValidCurrencyCode(code))
    .map((code) => getCurrencyInfo(code));

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((currency) => currency.code);

export function normalizeCurrency(code) {
    return getCurrencyInfo(code).code;
}

export function getCurrencySelectOptions({ compact = false, pin } = {}) {
    const options = SUPPORTED_CURRENCIES.map((currency) => {
        const fullLabel = `${currency.symbol} ${currency.name} (${currency.code})`;
        return {
            value: currency.code,
            label: compact ? currency.code : fullLabel,
            listLabel: fullLabel,
            searchText: `${currency.symbol} ${currency.name} ${currency.code}`.toLowerCase(),
        };
    });
    const pinned = pin ? normalizeCurrency(pin) : APP_CURRENCY;
    options.sort((a, b) => {
        if (a.value === pinned) return -1;
        if (b.value === pinned) return 1;
        if (pinned !== APP_CURRENCY) {
            if (a.value === APP_CURRENCY) return -1;
            if (b.value === APP_CURRENCY) return 1;
        }
        return (a.listLabel || a.label).localeCompare(b.listLabel || b.label, 'en', { sensitivity: 'base' });
    });
    return options;
}

function parseCurrencyArgs(currencyOrShowSymbol, showSymbol, defaultUseSymbol) {
    let currency = APP_CURRENCY;
    let useSymbol = defaultUseSymbol;

    if (typeof currencyOrShowSymbol === 'boolean') {
        useSymbol = currencyOrShowSymbol;
    } else if (typeof currencyOrShowSymbol === 'string' && currencyOrShowSymbol) {
        currency = currencyOrShowSymbol;
        useSymbol = showSymbol;
    }

    return { currency: normalizeCurrency(currency), useSymbol };
}

function formatNumber(amount) {
    const numeric = Number(amount);
    return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * @param {number|string} amount
 * @param {string|boolean} [currencyOrShowSymbol=APP_CURRENCY] - ISO code, or legacy boolean for symbol vs code
 * @param {boolean} [showSymbol=true] - when currency is a string, whether to prefix with symbol (true) or code (false)
 */
export const formatCurrency = (amount, currencyOrShowSymbol = APP_CURRENCY, showSymbol = true) => {
    const { currency, useSymbol } = parseCurrencyArgs(currencyOrShowSymbol, showSymbol, true);
    const value = formatNumber(amount);

    if (useSymbol) {
        try {
            return new Intl.NumberFormat('en', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value);
        } catch {
            try {
                return new Intl.NumberFormat('en', {
                    style: 'currency',
                    currency,
                    currencyDisplay: 'narrowSymbol',
                    minimumFractionDigits: 0,
                }).format(value);
            } catch {
                /* fall through to code prefix */
            }
        }
    }

    const formatted = value.toLocaleString('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return `${useSymbol ? getCurrencyInfo(currency).symbol : currency}${formatted}`;
};

/**
 * @param {string|boolean} [currencyOrShowSymbol=true] - ISO code, or legacy boolean (true=symbol, false=code for APP_CURRENCY)
 * @param {boolean} [showSymbol=true]
 */
export const getCurrencySymbol = (currencyOrShowSymbol = true, showSymbol = true) => {
    const { currency, useSymbol } = parseCurrencyArgs(currencyOrShowSymbol, showSymbol, true);
    return useSymbol ? getCurrencyInfo(currency).symbol : currency;
};
