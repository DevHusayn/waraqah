export const queryKeys = {
    dashboard: ['dashboard'],
    businessInfo: ['businessInfo'],
    businessAssets: ['businessAssets'],
    invoiceUsage: ['invoiceUsage'],
    invoiceMeta: ['invoiceMeta'],
    invoices: (params) => ['invoices', params],
    quotations: (params) => ['quotations', params],
    clients: (params) => ['clients', params],
    products: (params) => ['products', params],
    drafts: (params) => ['drafts', params],
};

export const STALE_TIMES = {
    dashboard: 30_000,
    lists: 2 * 60_000,
    businessInfo: 5 * 60_000,
    meta: 60_000,
};
