export const RECURRING_FREQUENCIES = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];

export const RECURRING_FREQUENCY_OPTIONS = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isRecurringFrequency(value) {
    return RECURRING_FREQUENCIES.includes(value);
}

export function getRecurringFrequencyLabel(frequency) {
    return RECURRING_FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label || frequency;
}

export function parseIsoDate(value) {
    const match = String(value || '').trim().match(ISO_DATE);
    if (!match) return null;
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const day = Number.parseInt(match[3], 10);
    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }
    const utc = new Date(Date.UTC(year, month - 1, day));
    if (
        utc.getUTCFullYear() !== year ||
        utc.getUTCMonth() !== month - 1 ||
        utc.getUTCDate() !== day
    ) {
        return null;
    }
    return { year, month, day };
}

export function formatIsoDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDaysToIsoDate(yyyyMmDd, deltaDays) {
    const parts = parseIsoDate(yyyyMmDd);
    if (!parts) return null;
    const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Number(deltaDays || 0)));
    return formatIsoDate(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function daysBetweenIsoDates(start, end) {
    const from = parseIsoDate(start);
    const to = parseIsoDate(end);
    if (!from || !to) return 0;
    const startUtc = Date.UTC(from.year, from.month - 1, from.day);
    const endUtc = Date.UTC(to.year, to.month - 1, to.day);
    return Math.round((endUtc - startUtc) / 86400000);
}

function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsToParts(year, month, day, months) {
    const total = year * 12 + (month - 1) + months;
    const nextYear = Math.floor(total / 12);
    const nextMonth = (total % 12) + 1;
    return {
        year: nextYear,
        month: nextMonth,
        day: Math.min(day, daysInMonth(nextYear, nextMonth)),
    };
}

/**
 * Advance a YYYY-MM-DD date by one recurrence period using calendar months,
 * clamping the day when the target month is shorter (Jan 31 + monthly → Feb 28/29).
 */
export function addFrequency(yyyyMmDd, frequency) {
    const parts = parseIsoDate(yyyyMmDd);
    if (!parts || !isRecurringFrequency(frequency)) return null;

    if (frequency === 'weekly') return addDaysToIsoDate(yyyyMmDd, 7);
    if (frequency === 'bi-weekly') return addDaysToIsoDate(yyyyMmDd, 14);

    const months = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12;
    const next = addMonthsToParts(parts.year, parts.month, parts.day, months);
    return formatIsoDate(next.year, next.month, next.day);
}

export function compareIsoDates(a, b) {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

export function shouldGenerateRecurrence({ nextDate, endDate, today }) {
    if (!parseIsoDate(nextDate) || !parseIsoDate(today)) return false;
    if (compareIsoDates(nextDate, today) > 0) return false;
    if (endDate && parseIsoDate(endDate) && compareIsoDates(nextDate, endDate) > 0) return false;
    return true;
}

export function computeRecurringDueDate(templateDate, templateDueDate, nextIssueDate) {
    if (!parseIsoDate(templateDate) || !parseIsoDate(templateDueDate) || !parseIsoDate(nextIssueDate)) {
        return null;
    }
    return addDaysToIsoDate(nextIssueDate, daysBetweenIsoDates(templateDate, templateDueDate));
}

export function formatRecurringSummary({ frequency, endDate, nextDate } = {}) {
    const freqLabel = getRecurringFrequencyLabel(frequency);
    if (!frequency) return '';
    const until = endDate ? ` until ${endDate}` : ' until you stop it';
    const next = nextDate ? ` Next: ${nextDate}.` : '';
    return `Repeats ${freqLabel.toLowerCase()}${until}.${next}`;
}

export function emptyRecurringFormFields() {
    return {
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
    };
}

export function recurringFieldsFromRecord(record) {
    return {
        isRecurring: Boolean(record?.isRecurring),
        recurringFrequency: isRecurringFrequency(record?.recurringFrequency)
            ? record.recurringFrequency
            : 'monthly',
        recurringEndDate: record?.recurringEndDate || '',
    };
}

export function toRecurringApiFields(formData) {
    const isRecurring = Boolean(formData?.isRecurring);
    if (!isRecurring) {
        return {
            isRecurring: false,
            recurringFrequency: undefined,
            recurringEndDate: null,
        };
    }
    return {
        isRecurring: true,
        recurringFrequency: isRecurringFrequency(formData.recurringFrequency)
            ? formData.recurringFrequency
            : 'monthly',
        recurringEndDate: formData.recurringEndDate || null,
    };
}
