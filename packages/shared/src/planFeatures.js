import { FREE_MONTHLY_INVOICE_LIMIT, formatFreeSalesDocumentsLimit } from './invoiceLimits.js';

export const FREE_PLAN_FEATURES = [
    formatFreeSalesDocumentsLimit(FREE_MONTHLY_INVOICE_LIMIT),
    'Create and send professional invoices',
    'Convert accepted quotations to invoices',
    'Client management',
    'Product catalog with unit cost and catalog margin',
    'Inventory tracking with stock history and low-stock alerts',
    'Bank details on invoices',
    'Professional PDF invoices & quotations',
    'Email invoices, reminders, and receipts',
    'Mark paid with PDF receipts',
    'Track operating expenses by category',
    'Dashboard and status tracking',
    'CSV export for invoices, quotations, receipts, and clients',
];

export const PREMIUM_PLAN_FEATURES = [
    'Unlimited sales documents every month',
    'Gross profit on your dashboard',
    'Net profit after operating expenses',
    'Profit analytics with trends and product breakdown',
    'Logo on PDF invoices & quotations',
    'Company stamp on paid receipts',
    'Authorized signature on PDFs',
    'Logo on your account profile',
    'Monthly billing statements (PDF and print)',
    'Monthly statement PDF emailed on the 1st of each month',
];
