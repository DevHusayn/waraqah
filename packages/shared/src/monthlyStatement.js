import {
    startOfMonth,
    endOfMonth,
    parseISO,
    format,
    isValid,
    isWithinInterval,
} from 'date-fns';
import { getClientBusiness } from './clientHelpers.js';

const STATUSES = ['paid', 'pending', 'overdue', 'cancelled'];

function normalizeStatus(status) {
    if (status === 'canceled') return 'cancelled';
    return STATUSES.includes(status) ? status : 'pending';
}

function parseInvoiceDate(dateStr) {
    if (!dateStr) return null;
    const raw = String(dateStr).slice(0, 10);
    const d = parseISO(raw);
    return isValid(d) ? d : null;
}

function emptyTotals() {
    return {
        paid: 0,
        pending: 0,
        overdue: 0,
        cancelled: 0,
        total: 0,
        invoiceCount: 0,
    };
}

export function buildMonthlyStatement({ invoices = [], clients = [], year, month }) {
    const periodStart = startOfMonth(new Date(year, month - 1, 1));
    const periodEnd = endOfMonth(periodStart);
    const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));

    const inPeriod = invoices.filter((inv) => {
        const d = parseInvoiceDate(inv.date);
        return d && isWithinInterval(d, { start: periodStart, end: periodEnd });
    });

    const byClientId = {};

    for (const inv of inPeriod) {
        const clientId = inv.clientId;
        const client = clientById[clientId];
        if (!byClientId[clientId]) {
            const business = getClientBusiness(client);
            byClientId[clientId] = {
                clientId,
                clientName: client?.name || 'Unknown client',
                clientSubtitle: business || client?.email || '',
                paid: 0,
                pending: 0,
                overdue: 0,
                cancelled: 0,
                total: 0,
                invoiceCount: 0,
            };
        }

        const row = byClientId[clientId];
        const status = normalizeStatus(inv.status);
        const amount = Number(inv.total) || 0;
        row[status] += amount;
        row.total += amount;
        row.invoiceCount += 1;
    }

    const rows = Object.values(byClientId).sort((a, b) =>
        a.clientName.localeCompare(b.clientName)
    );

    const totals = emptyTotals();
    totals.invoiceCount = inPeriod.length;
    for (const row of rows) {
        for (const s of STATUSES) totals[s] += row[s];
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
