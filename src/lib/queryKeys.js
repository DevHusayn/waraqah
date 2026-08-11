/** TanStack Query keys — scoped by userId to prevent cross-account cache bleed. */
export const queryKeys = {
    dashboard: (userId, summaryYear, summaryMonth) => [
        'dashboard',
        userId,
        summaryYear,
        summaryMonth,
    ],
    businessInfo: (userId) => ['businessInfo', userId],
    businessAssets: (userId) => ['businessAssets', userId],
    invoiceUsage: (userId) => ['invoiceUsage', userId],
    invoiceMeta: (userId) => ['invoiceMeta', userId],
    invoices: (userId, params) => ['invoices', userId, params],
    quotations: (userId, params) => ['quotations', userId, params],
    clients: (userId, params) => ['clients', userId, params],
    products: (userId, params) => ['products', userId, params],
    drafts: (userId, params) => ['drafts', userId, params],
    receipts: (userId, params) => ['receipts', userId, params],
    suppliers: (userId, params) => ['suppliers', userId, params],
    purchaseOrders: (userId, params) => ['purchaseOrders', userId, params],
    listSummary: (userId, resource, summaryYear, summaryMonth) => [
        'listSummary',
        userId,
        resource,
        summaryYear,
        summaryMonth,
    ],
    adminUsers: (userId, params) => ['adminUsers', userId, params],
    profit: (userId, summaryYear, summaryMonth) => ['profit', userId, summaryYear, summaryMonth],
};

export const STALE_TIMES = {
    dashboard: 30_000,
    lists: 2 * 60_000,
    listSummary: 5 * 60_000,
    businessInfo: 5 * 60_000,
    meta: 60_000,
};
