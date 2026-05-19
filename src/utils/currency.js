/** App uses Nigerian Naira only */
export const APP_CURRENCY = 'NGN';

export const CURRENCY_INFO = {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
};

/** @param {number} amount */
export const formatCurrency = (amount, showNairaSign = true) => {
    const symbol = showNairaSign ? CURRENCY_INFO.symbol : CURRENCY_INFO.code;
    const formatted = Number(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
};

/** PDF and exports — code label instead of ₦ */
export const getCurrencySymbol = (showNairaSign = true) =>
    showNairaSign ? CURRENCY_INFO.symbol : CURRENCY_INFO.code;
