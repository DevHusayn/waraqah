import {
    dateMatchesClientPeriod,
    getDatePartsInTimezone,
    shiftDateByDays,
    shiftSummaryPeriod,
} from '@waraqah/shared';

function countInclusiveDays(start, end) {
    let count = 0;
    let cursor = { ...start };
    const compare = (a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
    };
    while (compare(cursor, end) <= 0) {
        count += 1;
        if (compare(cursor, end) === 0) break;
        cursor = shiftDateByDays(cursor.year, cursor.month, cursor.day, 1);
    }
    return count;
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
        if (!dateMatchesClientPeriod(issueDate, period, timeZone)) continue;

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
    if (!period) return null;
    if (period.kind === 'day') {
        return { kind: 'day', ...shiftDateByDays(period.year, period.month, period.day, -1) };
    }
    if (period.kind === 'month') {
        return { kind: 'month', ...shiftSummaryPeriod(period.year, period.month, -1) };
    }
    if (period.kind === 'year') {
        return { kind: 'year', year: period.year - 1 };
    }
    if (period.kind === 'week') {
        const start = {
            year: period.startYear,
            month: period.startMonth,
            day: period.startDay,
        };
        const prevStart = shiftDateByDays(start.year, start.month, start.day, -7);
        const prevEnd = shiftDateByDays(prevStart.year, prevStart.month, prevStart.day, 6);
        return {
            kind: 'week',
            startYear: prevStart.year,
            startMonth: prevStart.month,
            startDay: prevStart.day,
            endYear: prevEnd.year,
            endMonth: prevEnd.month,
            endDay: prevEnd.day,
        };
    }
    if (period.kind === 'range') {
        const start = {
            year: period.startYear,
            month: period.startMonth,
            day: period.startDay,
        };
        const end = { year: period.endYear, month: period.endMonth, day: period.endDay };
        const days = countInclusiveDays(start, end);
        const prevEnd = shiftDateByDays(start.year, start.month, start.day, -1);
        const prevStart = shiftDateByDays(prevEnd.year, prevEnd.month, prevEnd.day, -(days - 1));
        return {
            kind: 'range',
            startYear: prevStart.year,
            startMonth: prevStart.month,
            startDay: prevStart.day,
            endYear: prevEnd.year,
            endMonth: prevEnd.month,
            endDay: prevEnd.day,
        };
    }
    return null;
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
