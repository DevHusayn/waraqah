import { FREE_MONTHLY_INVOICE_LIMIT } from './invoiceLimits.js';
import { AI_DRAFTS_ENABLED } from './aiDraft.js';

export const FREE_PLAN_FEATURES = [
    `${FREE_MONTHLY_INVOICE_LIMIT} invoices, quotes, and receipts / month`,
    'Clients, products, and inventory',
    'Professional PDFs and email',
    'Expense tracking',
    'Recurring invoices and expenses',
    'Dashboard and CSV export',
];

export const PREMIUM_PLAN_FEATURES = [
    'Unlimited sales documents',
    'Profit page with trends and breakdowns',
    'Logo, stamp, and signature on PDFs',
    'Monthly statements, emailed automatically',
    ...(AI_DRAFTS_ENABLED ? ['Draft invoices and quotations from a sentence'] : []),
];
