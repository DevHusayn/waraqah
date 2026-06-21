export const APP_CURRENCY = 'NGN';

export const CURRENCY_INFO = {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
};

export const formatCurrency = (amount, showNairaSign = true) => {
    const symbol = showNairaSign ? CURRENCY_INFO.symbol : CURRENCY_INFO.code;
    const formatted = Number(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
};

export const getCurrencySymbol = (showNairaSign = true) =>
    showNairaSign ? CURRENCY_INFO.symbol : CURRENCY_INFO.code;
