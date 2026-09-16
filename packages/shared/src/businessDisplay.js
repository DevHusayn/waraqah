export const DEFAULT_BUSINESS_DISPLAY_NAME = 'Your business';
export const DASHBOARD_SUBTITLE = 'Your business at a glance';
export const DEFAULT_PAYMENT_INSTRUCTIONS =
    'Kindly use the invoice number as your payment reference. Send proof of payment to my DM.';

export function getDisplayBusinessName(businessInfo) {
    const name = businessInfo?.name?.trim();
    return name || DEFAULT_BUSINESS_DISPLAY_NAME;
}

export function hasInvoicePaymentAccount(businessInfo) {
    return Boolean(
        businessInfo?.paymentAccountName?.trim() ||
        businessInfo?.paymentBankName?.trim() ||
        businessInfo?.paymentAccountNumber?.trim()
    );
}

export function withDefaultPaymentInstructions(data = {}) {
    if (String(data.paymentInstructions || '').trim()) return data;
    return { ...data, paymentInstructions: DEFAULT_PAYMENT_INSTRUCTIONS };
}
