import { getYearMonthInTimezone, shiftSummaryPeriod } from '@waraqah/shared';

function isSoldTransaction(documentType) {
    return documentType === 'invoice' || documentType === 'receipt';
}

export function sumSoldInPeriod(transactions, year, month, timeZone) {
    let quantity = 0;
    let revenue = 0;

    if (!Array.isArray(transactions)) return { quantity, revenue };

    for (const row of transactions) {
        if (!isSoldTransaction(row.documentType) || !row.date) continue;

        const issueDate = new Date(row.date);
        if (Number.isNaN(issueDate.getTime())) continue;

        const { year: rowYear, month: rowMonth } = getYearMonthInTimezone(timeZone, issueDate);
        if (rowYear !== year || rowMonth !== month) continue;

        quantity += Number(row.quantity) || 0;
        revenue += Number(row.lineTotal) || 0;
    }

    return { quantity, revenue };
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

export function getSoldPeriodSummary(transactions, year, month, timeZone) {
    const current = sumSoldInPeriod(transactions, year, month, timeZone);
    const previousPeriod = shiftSummaryPeriod(year, month, -1);
    const previous = sumSoldInPeriod(
        transactions,
        previousPeriod.year,
        previousPeriod.month,
        timeZone
    );

    return {
        ...current,
        comparison: computeCountPercentChange(current.quantity, previous.quantity),
    };
}
