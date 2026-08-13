export const FREE_MONTHLY_INVOICE_LIMIT = 5;

/** User-facing label for quotation, invoice, and receipt as a group. */
export const SALES_DOCUMENT_TYPES_LABEL = 'invoices, quotations, and receipts';

export function formatFreeSalesDocumentsLimit(limit = FREE_MONTHLY_INVOICE_LIMIT) {
    return `${limit} sales documents per month (${SALES_DOCUMENT_TYPES_LABEL})`;
}

export function canCreateInvoice(usage) {
    if (!usage) return true;
    if (usage.unlimited) return true;
    return Boolean(usage.canCreate);
}

export function formatInvoiceUsageLabel(usage) {
    if (!usage || usage.unlimited) return null;
    return `${usage.used} of ${usage.limit} free sales documents used this month`;
}
