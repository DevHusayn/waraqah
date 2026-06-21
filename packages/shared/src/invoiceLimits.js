export const FREE_MONTHLY_INVOICE_LIMIT = 5;

export function canCreateInvoice(usage) {
    if (!usage) return true;
    if (usage.unlimited) return true;
    return Boolean(usage.canCreate);
}

export function formatInvoiceUsageLabel(usage) {
    if (!usage || usage.unlimited) return null;
    return `${usage.used} of ${usage.limit} free invoices used this month`;
}
