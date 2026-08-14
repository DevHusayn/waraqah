import { getDatePartsInTimezone, shiftDateByDays, shiftSummaryPeriod } from '@waraqah/shared';

function rowMatchesPeriod(issueDate, period, timeZone) {
    if (!period || period.kind === 'all') return true;
    const parts = getDatePartsInTimezone(timeZone, issueDate);
    if (period.kind === 'day') {
        return parts.year === period.year && parts.month === period.month && parts.day === period.day;
    }
    return parts.year === period.year && parts.month === period.month;
}

export function sumSoldInPeriod(transactions, period, timeZone) {
    let quantity = 0;
    let revenue = 0;
    let grossProfit = 0;

    if (!Array.isArray(transactions)) return { quantity, revenue, grossProfit };

    for (const row of transactions) {
        if (!row.countsAsSale) continue;
        if (!row.date) continue;

        const issueDate = new Date(row.date);
        if (Number.isNaN(issueDate.getTime())) continue;
        if (!rowMatchesPeriod(issueDate, period, timeZone)) continue;

        quantity += Number(row.saleQuantity) || 0;
        revenue += Number(row.saleLineTotal) || 0;
        grossProfit += Number(row.saleLineProfit) || 0;
    }

    return { quantity, revenue, grossProfit };
}

const MAX_COMPARISON_PERCENT = 999;

export function computeCountPercentChange(current, previous) {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;

    if (currentValue === 0 && previousValue === 0) {
        return { kind: 'flat', direction: 'flat' };
    }

    if (previousValue === 0) {
        return { kind: 'new', direction: currentValue > 0 ? 'up' : 'flat' };
    }

    const raw = ((currentValue - previousValue) / previousValue) * 100;
    const rounded = Math.round(raw);

    if (rounded === 0) {
        return { kind: 'flat', direction: 'flat' };
    }

    const direction = rounded > 0 ? 'up' : 'down';
    const absValue = Math.abs(rounded);

    if (absValue > MAX_COMPARISON_PERCENT) {
        return { kind: 'capped', value: MAX_COMPARISON_PERCENT, direction };
    }

    return {
        kind: 'percent',
        value: absValue,
        direction,
    };
}

function previousSoldPeriod(period) {
    if (!period || period.kind === 'all') return null;
    if (period.kind === 'day') {
        return { kind: 'day', ...shiftDateByDays(period.year, period.month, period.day, -1) };
    }
    return { kind: 'month', ...shiftSummaryPeriod(period.year, period.month, -1) };
}

export function getSoldPeriodSummary(transactions, period, timeZone) {
    const current = sumSoldInPeriod(transactions, period, timeZone);
    const previousPeriod = previousSoldPeriod(period);
    if (!previousPeriod) {
        return { ...current, comparison: null };
    }

    const previous = sumSoldInPeriod(transactions, previousPeriod, timeZone);

    return {
        ...current,
        comparison: computeCountPercentChange(current.quantity, previous.quantity),
    };
}
