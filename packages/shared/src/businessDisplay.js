export const DEFAULT_BUSINESS_DISPLAY_NAME = 'Your business';
export const DASHBOARD_SUBTITLE = 'Your business at a glance';
export const DEFAULT_PAYMENT_INSTRUCTIONS =
    'Kindly Send proof of payment to my DM.';

const PAYMENT_ACCOUNT_FIELDS = [
    'paymentAccountName',
    'paymentBankName',
    'paymentAccountNumber',
    'paymentSortCode',
    'paymentIban',
    'paymentSwift',
];

const PAYMENT_LINE_FIELDS = [
    ['paymentBankName', 'Bank Name'],
    ['paymentAccountName', 'Account Name'],
    ['paymentAccountNumber', 'Account Number'],
    ['paymentSortCode', 'Sort Code / Routing Number'],
    ['paymentIban', 'IBAN'],
    ['paymentSwift', 'SWIFT / BIC'],
];

export function getDisplayBusinessName(businessInfo) {
    const name = businessInfo?.name?.trim();
    return name || DEFAULT_BUSINESS_DISPLAY_NAME;
}

export function hasInvoicePaymentAccount(businessInfo) {
    return PAYMENT_ACCOUNT_FIELDS.some((key) => businessInfo?.[key]?.trim());
}

export function getInvoicePaymentLines(businessInfo) {
    const lines = [];
    for (const [key, label] of PAYMENT_LINE_FIELDS) {
        const value = businessInfo?.[key]?.trim();
        if (value) lines.push(`${label}: ${value}`);
    }
    const instructions = businessInfo?.paymentInstructions?.trim();
    if (instructions) lines.push(instructions);
    return lines;
}

export function withDefaultPaymentInstructions(data = {}) {
    if (String(data.paymentInstructions || '').trim()) return data;
    return { ...data, paymentInstructions: DEFAULT_PAYMENT_INSTRUCTIONS };
}
