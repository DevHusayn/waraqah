export const DEFAULT_BUSINESS_TIMEZONE = 'Africa/Lagos';

export const BUSINESS_TIMEZONE_OPTIONS = [
    { value: 'Africa/Lagos', label: 'West Africa (Lagos)' },
    { value: 'Africa/Accra', label: 'Ghana (Accra)' },
    { value: 'Africa/Nairobi', label: 'East Africa (Nairobi)' },
    { value: 'Africa/Johannesburg', label: 'South Africa' },
    { value: 'Africa/Cairo', label: 'Egypt (Cairo)' },
    { value: 'Europe/London', label: 'United Kingdom' },
    { value: 'Europe/Paris', label: 'Central Europe' },
    { value: 'America/New_York', label: 'US Eastern' },
    { value: 'America/Chicago', label: 'US Central' },
    { value: 'America/Los_Angeles', label: 'US Pacific' },
    { value: 'Asia/Dubai', label: 'UAE (Dubai)' },
    { value: 'UTC', label: 'UTC' },
];

export function normalizeBusinessTimezone(value) {
    const tz = String(value || '').trim();
    if (!tz) return DEFAULT_BUSINESS_TIMEZONE;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return tz;
    } catch {
        return DEFAULT_BUSINESS_TIMEZONE;
    }
}

export function getDatePartsInTimezone(timeZone, date = new Date()) {
    const tz = normalizeBusinessTimezone(timeZone);
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .formatToParts(date)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value])
    );
    return {
        year: Number.parseInt(parts.year, 10),
        month: Number.parseInt(parts.month, 10),
        day: Number.parseInt(parts.day, 10),
    };
}

export function getYearMonthInTimezone(timeZone, date = new Date()) {
    const { year, month } = getDatePartsInTimezone(timeZone, date);
    return { year, month };
}

export function toDateInputValue(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function shiftDateByDays(year, month, day, deltaDays) {
    const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
    return {
        year: utc.getUTCFullYear(),
        month: utc.getUTCMonth() + 1,
        day: utc.getUTCDate(),
    };
}

export function formatPeriodPresetLabel(mode, year, month, locale = 'en-US') {
    if (mode === 'all') return 'All time';
    if (mode === 'today') return 'Today';
    return formatSummaryPeriodLabel(year, month, locale);
}

export function getPeriodComparisonLabel(mode, isCurrentPeriod = false) {
    if (mode === 'all') return null;
    if (mode === 'today') return 'vs yesterday';
    return isCurrentPeriod ? 'vs last month' : 'vs previous month';
}

export function toMonthInputValue(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}

export function parseMonthInputValue(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const year = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return null;
    }
    return { year, month };
}

export function formatSummaryPeriodLabel(year, month, locale = 'en-US') {
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        date
    );
}

export function isCurrentSummaryPeriod(year, month, timeZone, date = new Date()) {
    const current = getYearMonthInTimezone(timeZone, date);
    return current.year === year && current.month === month;
}

export function shiftSummaryPeriod(year, month, deltaMonths) {
    const index = year * 12 + (month - 1) + deltaMonths;
    return {
        year: Math.floor(index / 12),
        month: (index % 12) + 1,
    };
}
