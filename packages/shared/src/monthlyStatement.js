import {
    startOfMonth,
    endOfMonth,
    parseISO,
    format,
    isValid,
    isWithinInterval,
} from 'date-fns';
import { getClientBusiness } from './clientHelpers.js';
import { isPartialReceipt, isReceiptOnly } from './receiptHelpers.js';
import { getInvoiceAmountPaid, getInvoiceBalanceDue } from './invoicePayments.js';

const STATUSES = ['paid', 'partial', 'pending', 'overdue', 'cancelled'];

function emptyBucketTotals() {
    return {
        paid: 0,
        partial: 0,
        pending: 0,
        overdue: 0,
        cancelled: 0,
    };
}

function emptyTotals() {
    return {
        ...emptyBucketTotals(),
        total: 0,
        documentCount: 0,
    };
}

function parseInvoiceDate(dateStr) {
    if (!dateStr) return null;
    const raw = String(dateStr).slice(0, 10);
    const d = parseISO(raw);
    return isValid(d) ? d : null;
}

function normalizeInvoiceStatus(status) {
    if (status === 'canceled') return 'cancelled';
    if (status === 'partial') return 'partial';
    if (STATUSES.includes(status)) return status;
    return 'pending';
}

/** Split document totals across statement buckets by payment progress. */
export function allocateStatementAmounts(doc) {
    const buckets = emptyBucketTotals();
    const total = Number(doc?.total) || 0;
    if (total <= 0) return buckets;

    if (doc.status === 'cancelled' || doc.status === 'canceled') {
        buckets.cancelled = total;
        return buckets;
    }

    if (doc.status === 'draft') {
        return buckets;
    }

    if (isReceiptOnly(doc)) {
        if (isPartialReceipt(doc)) {
            buckets.paid = getInvoiceAmountPaid(doc);
            buckets.partial = getInvoiceBalanceDue(doc);
        } else {
            buckets.paid = total;
        }
        return buckets;
    }

    const status = normalizeInvoiceStatus(doc.status);
    if (status === 'partial') {
        buckets.paid = getInvoiceAmountPaid(doc);
        buckets.partial = getInvoiceBalanceDue(doc);
        return buckets;
    }

    buckets[status] = total;
    return buckets;
}

export function buildMonthlyStatement({
    invoices = [],
    receipts = [],
    clients = [],
    year,
    month,
}) {
    const periodStart = startOfMonth(new Date(year, month - 1, 1));
    const periodEnd = endOfMonth(periodStart);
    const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));
    const documents = [...invoices, ...receipts];

    const inPeriod = documents.filter((doc) => {
        const d = parseInvoiceDate(doc.date);
        return d && isWithinInterval(d, { start: periodStart, end: periodEnd });
    });

    const byClientId = {};

    for (const doc of inPeriod) {
        if (doc.status === 'draft') continue;

        const clientId = doc.clientId;
        const client = clientById[clientId];
        if (!byClientId[clientId]) {
            const business = getClientBusiness(client);
            byClientId[clientId] = {
                clientId,
                clientName: client?.name || 'Unknown client',
                clientSubtitle: business || client?.email || '',
                ...emptyBucketTotals(),
                total: 0,
                documentCount: 0,
            };
        }

        const row = byClientId[clientId];
        const allocation = allocateStatementAmounts(doc);
        const docTotal = Number(doc.total) || 0;

        for (const status of STATUSES) {
            row[status] += allocation[status];
        }
        row.total += docTotal;
        row.documentCount += 1;
    }

    const rows = Object.values(byClientId).sort((a, b) =>
        a.clientName.localeCompare(b.clientName)
    );

    const totals = emptyTotals();
    totals.documentCount = inPeriod.filter((doc) => doc.status !== 'draft').length;
    for (const row of rows) {
        for (const status of STATUSES) totals[status] += row[status];
        totals.total += row.total;
    }

    return {
        periodLabel: format(periodStart, 'MMMM yyyy'),
        periodStart,
        periodEnd,
        generatedAt: new Date(),
        rows,
        totals,
        hasData: rows.length > 0,
    };
}

export function getDefaultStatementMonth() {
    return format(new Date(), 'yyyy-MM');
}

export function parseStatementMonth(value) {
    const [y, m] = String(value || '').split('-').map(Number);
    if (!y || !m || m < 1 || m > 12) {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    return { year: y, month: m };
}
