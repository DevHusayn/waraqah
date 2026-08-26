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

const WEEK_STARTS_ON = 0;

export function parseDateInputValue(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
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
        day > 31 ||
        year < 1970 ||
        year > 2100
    ) {
        return null;
    }
    return { year, month, day };
}

function compareDateParts(a, b) {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
}

function getWeekdayInTimezone(timeZone, date = new Date()) {
    const tz = normalizeBusinessTimezone(timeZone);
    const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
    }).format(date);
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[weekday] ?? 0;
}

export function getWeekBoundsInTimezone(timeZone, now = new Date()) {
    const today = getDatePartsInTimezone(timeZone, now);
    const weekday = getWeekdayInTimezone(timeZone, now);
    const daysFromStart = (weekday - WEEK_STARTS_ON + 7) % 7;
    const start = shiftDateByDays(today.year, today.month, today.day, -daysFromStart);
    const end = shiftDateByDays(start.year, start.month, start.day, 6);
    return { start, end };
}

function formatDatePartsLabel({ year, month, day }, locale = 'en-US', options = {}) {
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(date);
}

export function formatDateRangeLabel(start, end, locale = 'en-US') {
    const sameYear = start.year === end.year;
    const startLabel = formatDatePartsLabel(start, locale, {
        month: 'short',
        day: 'numeric',
        year: sameYear ? undefined : 'numeric',
    });
    const endLabel = formatDatePartsLabel(end, locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return `${startLabel} – ${endLabel}`;
}

export function isCurrentWeekPeriod(timeZone, date = new Date()) {
    const current = getWeekBoundsInTimezone(timeZone, date);
    const today = getDatePartsInTimezone(timeZone, date);
    return compareDateParts(today, current.start) >= 0 && compareDateParts(today, current.end) <= 0;
}

export function isCurrentYearPeriod(timeZone, date = new Date()) {
    return getDatePartsInTimezone(timeZone, date).year === getDatePartsInTimezone(timeZone, date).year;
}

export function formatPeriodPresetLabel(mode, year, month, locale = 'en-US', options = {}) {
    const { timeZone, startDate, endDate } = options;
    if (mode === 'today') return 'Today';
    if (mode === 'week') return 'This week';
    if (mode === 'month') return 'This month';
    if (mode === 'year') return 'This year';
    if (mode === 'custom') {
        const start = parseDateInputValue(startDate);
        const end = parseDateInputValue(endDate);
        if (start && end) return formatDateRangeLabel(start, end, locale);
        return 'Custom';
    }
    if (mode === 'all') return 'All time';
    return formatSummaryPeriodLabel(year, month, locale);
}

export function getPeriodComparisonLabel(mode, isCurrentPeriod = false) {
    if (mode === 'today') return 'vs yesterday';
    if (mode === 'week') return isCurrentPeriod ? 'vs last week' : 'vs previous week';
    if (mode === 'month') return isCurrentPeriod ? 'vs last month' : 'vs previous month';
    if (mode === 'year') return isCurrentPeriod ? 'vs last year' : 'vs previous year';
    if (mode === 'custom') return 'vs previous period';
    if (mode === 'all') return null;
    return isCurrentPeriod ? 'vs last month' : 'vs previous month';
}

export function buildPeriodQueryParams({ mode, startDate, endDate } = {}) {
    const params = {};
    if (mode) params.period = mode;
    if (mode === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
    }
    return params;
}

export function isPeriodQueryReady({ mode, period, startDate, endDate } = {}) {
    const resolved = mode || period;
    if (!resolved) return false;
    if (resolved === 'custom') return Boolean(startDate) && Boolean(endDate);
    return true;
}

export function resolveClientPeriodFromFilter(mode, timeZone, { startDate, endDate, now = new Date() } = {}) {
    if (mode === 'today') {
        return { kind: 'day', ...getDatePartsInTimezone(timeZone, now) };
    }
    if (mode === 'week') {
        const { start, end } = getWeekBoundsInTimezone(timeZone, now);
        return {
            kind: 'week',
            startYear: start.year,
            startMonth: start.month,
            startDay: start.day,
            endYear: end.year,
            endMonth: end.month,
            endDay: end.day,
        };
    }
    if (mode === 'month') {
        return { kind: 'month', ...getYearMonthInTimezone(timeZone, now) };
    }
    if (mode === 'year') {
        const { year } = getDatePartsInTimezone(timeZone, now);
        return { kind: 'year', year };
    }
    if (mode === 'custom') {
        const start = parseDateInputValue(startDate);
        const end = parseDateInputValue(endDate);
        if (!start || !end || compareDateParts(start, end) > 0) return null;
        return {
            kind: 'range',
            startYear: start.year,
            startMonth: start.month,
            startDay: start.day,
            endYear: end.year,
            endMonth: end.month,
            endDay: end.day,
        };
    }
    if (mode === 'all') {
        return { kind: 'all' };
    }
    return null;
}

export function dateMatchesClientPeriod(dateValue, period, timeZone) {
    if (!period || period.kind === 'all') return true;
    if (!dateValue) return false;
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    const parts = getDatePartsInTimezone(timeZone, date);
    if (period.kind === 'day') {
        return parts.year === period.year && parts.month === period.month && parts.day === period.day;
    }
    if (period.kind === 'month') {
        return parts.year === period.year && parts.month === period.month;
    }
    if (period.kind === 'year') {
        return parts.year === period.year;
    }
    if (period.kind === 'week' || period.kind === 'range') {
        const start = {
            year: period.startYear,
            month: period.startMonth,
            day: period.startDay,
        };
        const end = { year: period.endYear, month: period.endMonth, day: period.endDay };
        return compareDateParts(parts, start) >= 0 && compareDateParts(parts, end) <= 0;
    }
    return false;
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
