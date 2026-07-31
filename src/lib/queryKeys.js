/** TanStack Query keys — scoped by userId to prevent cross-account cache bleed. */
export const queryKeys = {
    dashboard: (userId) => ['dashboard', userId],
    businessInfo: (userId) => ['businessInfo', userId],
    businessAssets: (userId) => ['businessAssets', userId],
    invoiceUsage: (userId) => ['invoiceUsage', userId],
    invoiceMeta: (userId) => ['invoiceMeta', userId],
    invoices: (userId, params) => ['invoices', userId, params],
    quotations: (userId, params) => ['quotations', userId, params],
    clients: (userId, params) => ['clients', userId, params],
    products: (userId, params) => ['products', userId, params],
    drafts: (userId, params) => ['drafts', userId, params],
};

export const STALE_TIMES = {
    dashboard: 30_000,
    lists: 2 * 60_000,
    businessInfo: 5 * 60_000,
    meta: 60_000,
};
