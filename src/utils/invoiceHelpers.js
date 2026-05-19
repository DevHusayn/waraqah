import { getClientBusiness } from './clientHelpers';

/** Start of local calendar day for date comparisons. */
export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function isInvoiceOverdue(invoice) {
    if (!invoice?.dueDate || invoice.status !== 'pending') return false;
    return startOfDay(invoice.dueDate) < startOfDay(new Date());
}

export function invoicesNeedingOverdueSync(invoices) {
    return (invoices || []).filter(isInvoiceOverdue);
}

const SORTERS = {
    newest: (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
    oldest: (a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date),
    dueDate: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    amountHigh: (a, b) => (b.total || 0) - (a.total || 0),
    amountLow: (a, b) => (a.total || 0) - (b.total || 0),
};

export function sortInvoices(invoices, sortBy = 'newest') {
    const list = [...(invoices || [])];
    const sorter = SORTERS[sortBy] || SORTERS.newest;
    return list.sort(sorter);
}

export function filterInvoicesBySearch(invoices, query, clients = []) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return invoices;
    return (invoices || []).filter((inv) => {
        const client = clients.find((c) => c.id === inv.clientId);
        const haystack = [
            inv.invoiceNumber,
            client?.name,
            getClientBusiness(client),
            client?.email,
            String(inv.total ?? ''),
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return haystack.includes(q);
    });
}
