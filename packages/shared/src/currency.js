export const APP_CURRENCY = 'NGN';

export const SUPPORTED_CURRENCIES = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-IE' },
];

export const CURRENCY_INFO = SUPPORTED_CURRENCIES[0];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

export function getCurrencyInfo(code = APP_CURRENCY) {
    const normalized = String(code || APP_CURRENCY).toUpperCase();
    return SUPPORTED_CURRENCIES.find((c) => c.code === normalized) || CURRENCY_INFO;
}

export function normalizeCurrency(code) {
    return getCurrencyInfo(code).code;
}

export function getCurrencySelectOptions() {
    return SUPPORTED_CURRENCIES.map((c) => ({
        value: c.code,
        label: c.code,
    }));
}

/**
 * @param {number|string} amount
 * @param {string|boolean} [currencyOrShowSymbol=APP_CURRENCY] - ISO code, or legacy boolean for symbol vs code
 * @param {boolean} [showSymbol=true] - when currency is a string, whether to prefix with symbol (true) or code (false)
 */
export const formatCurrency = (amount, currencyOrShowSymbol = APP_CURRENCY, showSymbol = true) => {
    let currency = APP_CURRENCY;
    let useSymbol = showSymbol;

    if (typeof currencyOrShowSymbol === 'boolean') {
        useSymbol = currencyOrShowSymbol;
    } else if (typeof currencyOrShowSymbol === 'string' && currencyOrShowSymbol) {
        currency = currencyOrShowSymbol;
    }

    const info = getCurrencyInfo(currency);
    const prefix = useSymbol ? info.symbol : info.code;
    const formatted = Number(amount).toLocaleString(info.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${prefix}${formatted}`;
};

/**
 * @param {string|boolean} [currencyOrShowSymbol=true] - ISO code, or legacy boolean (true=symbol, false=code for APP_CURRENCY)
 * @param {boolean} [showSymbol=true]
 */
export const getCurrencySymbol = (currencyOrShowSymbol = true, showSymbol = true) => {
    let currency = APP_CURRENCY;
    let useSymbol = showSymbol;

    if (typeof currencyOrShowSymbol === 'boolean') {
        useSymbol = currencyOrShowSymbol;
    } else if (typeof currencyOrShowSymbol === 'string' && currencyOrShowSymbol) {
        currency = currencyOrShowSymbol;
    }

    const info = getCurrencyInfo(currency);
    return useSymbol ? info.symbol : info.code;
};
