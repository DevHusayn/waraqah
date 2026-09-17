export const DEFAULT_BUSINESS_TIMEZONE = 'Africa/Lagos';

/** ISO 3166-1 alpha-2 → primary IANA timezone (capital / most-used zone). */
export const COUNTRY_TIMEZONE = {
    AD: 'Europe/Andorra', AE: 'Asia/Dubai', AF: 'Asia/Kabul', AG: 'America/Antigua',
    AI: 'America/Anguilla', AL: 'Europe/Tirane', AM: 'Asia/Yerevan', AO: 'Africa/Luanda',
    AR: 'America/Argentina/Buenos_Aires', AS: 'Pacific/Pago_Pago', AT: 'Europe/Vienna',
    AU: 'Australia/Sydney', AW: 'America/Aruba', AX: 'Europe/Helsinki', AZ: 'Asia/Baku',
    BA: 'Europe/Sarajevo', BB: 'America/Barbados', BD: 'Asia/Dhaka', BE: 'Europe/Brussels',
    BF: 'Africa/Ouagadougou', BG: 'Europe/Sofia', BH: 'Asia/Bahrain', BI: 'Africa/Bujumbura',
    BJ: 'Africa/Porto-Novo', BL: 'America/St_Barthelemy', BM: 'Atlantic/Bermuda',
    BN: 'Asia/Brunei', BO: 'America/La_Paz', BQ: 'America/Kralendijk', BR: 'America/Sao_Paulo',
    BS: 'America/Nassau', BT: 'Asia/Thimphu', BV: 'Europe/Oslo', BW: 'Africa/Gaborone',
    BY: 'Europe/Minsk', BZ: 'America/Belize', CA: 'America/Toronto', CC: 'Indian/Cocos',
    CD: 'Africa/Kinshasa', CF: 'Africa/Bangui', CG: 'Africa/Brazzaville', CH: 'Europe/Zurich',
    CI: 'Africa/Abidjan', CK: 'Pacific/Rarotonga', CL: 'America/Santiago', CM: 'Africa/Douala',
    CN: 'Asia/Shanghai', CO: 'America/Bogota', CR: 'America/Costa_Rica', CU: 'America/Havana',
    CV: 'Atlantic/Cape_Verde', CW: 'America/Curacao', CX: 'Indian/Christmas', CY: 'Asia/Nicosia',
    CZ: 'Europe/Prague', DE: 'Europe/Berlin', DJ: 'Africa/Djibouti', DK: 'Europe/Copenhagen',
    DM: 'America/Dominica', DO: 'America/Santo_Domingo', DZ: 'Africa/Algiers',
    EC: 'America/Guayaquil', EE: 'Europe/Tallinn', EG: 'Africa/Cairo', EH: 'Africa/El_Aaiun',
    ER: 'Africa/Asmara', ES: 'Europe/Madrid', ET: 'Africa/Addis_Ababa', FI: 'Europe/Helsinki',
    FJ: 'Pacific/Fiji', FK: 'Atlantic/Stanley', FM: 'Pacific/Pohnpei', FO: 'Atlantic/Faroe',
    FR: 'Europe/Paris', GA: 'Africa/Libreville', GB: 'Europe/London', GD: 'America/Grenada',
    GE: 'Asia/Tbilisi', GF: 'America/Cayenne', GG: 'Europe/Guernsey', GH: 'Africa/Accra',
    GI: 'Europe/Gibraltar', GL: 'America/Nuuk', GM: 'Africa/Banjul', GN: 'Africa/Conakry',
    GP: 'America/Guadeloupe', GQ: 'Africa/Malabo', GR: 'Europe/Athens',
    GS: 'Atlantic/South_Georgia', GT: 'America/Guatemala', GU: 'Pacific/Guam',
    GW: 'Africa/Bissau', GY: 'America/Guyana', HK: 'Asia/Hong_Kong', HM: 'Indian/Kerguelen',
    HN: 'America/Tegucigalpa', HR: 'Europe/Zagreb', HT: 'America/Port-au-Prince',
    HU: 'Europe/Budapest', ID: 'Asia/Jakarta', IE: 'Europe/Dublin', IL: 'Asia/Jerusalem',
    IM: 'Europe/Isle_of_Man', IN: 'Asia/Kolkata', IO: 'Indian/Chagos', IQ: 'Asia/Baghdad',
    IR: 'Asia/Tehran', IS: 'Atlantic/Reykjavik', IT: 'Europe/Rome', JE: 'Europe/Jersey',
    JM: 'America/Jamaica', JO: 'Asia/Amman', JP: 'Asia/Tokyo', KE: 'Africa/Nairobi',
    KG: 'Asia/Bishkek', KH: 'Asia/Phnom_Penh', KI: 'Pacific/Tarawa', KM: 'Indian/Comoro',
    KN: 'America/St_Kitts', KP: 'Asia/Pyongyang', KR: 'Asia/Seoul', KW: 'Asia/Kuwait',
    KY: 'America/Cayman', KZ: 'Asia/Almaty', LA: 'Asia/Vientiane', LB: 'Asia/Beirut',
    LC: 'America/St_Lucia', LI: 'Europe/Vaduz', LK: 'Asia/Colombo', LR: 'Africa/Monrovia',
    LS: 'Africa/Maseru', LT: 'Europe/Vilnius', LU: 'Europe/Luxembourg', LV: 'Europe/Riga',
    LY: 'Africa/Tripoli', MA: 'Africa/Casablanca', MC: 'Europe/Monaco', MD: 'Europe/Chisinau',
    ME: 'Europe/Podgorica', MF: 'America/Marigot', MG: 'Indian/Antananarivo',
    MH: 'Pacific/Majuro', MK: 'Europe/Skopje', ML: 'Africa/Bamako', MM: 'Asia/Yangon',
    MN: 'Asia/Ulaanbaatar', MO: 'Asia/Macau', MP: 'Pacific/Saipan', MQ: 'America/Martinique',
    MR: 'Africa/Nouakchott', MS: 'America/Montserrat', MT: 'Europe/Malta',
    MU: 'Indian/Mauritius', MV: 'Indian/Maldives', MW: 'Africa/Blantyre',
    MX: 'America/Mexico_City', MY: 'Asia/Kuala_Lumpur', MZ: 'Africa/Maputo',
    NA: 'Africa/Windhoek', NC: 'Pacific/Noumea', NE: 'Africa/Niamey', NF: 'Pacific/Norfolk',
    NG: 'Africa/Lagos', NI: 'America/Managua', NL: 'Europe/Amsterdam', NO: 'Europe/Oslo',
    NP: 'Asia/Kathmandu', NR: 'Pacific/Nauru', NU: 'Pacific/Niue', NZ: 'Pacific/Auckland',
    OM: 'Asia/Muscat', PA: 'America/Panama', PE: 'America/Lima', PF: 'Pacific/Tahiti',
    PG: 'Pacific/Port_Moresby', PH: 'Asia/Manila', PK: 'Asia/Karachi', PL: 'Europe/Warsaw',
    PM: 'America/Miquelon', PN: 'Pacific/Pitcairn', PR: 'America/Puerto_Rico', PS: 'Asia/Gaza',
    PT: 'Europe/Lisbon', PW: 'Pacific/Palau', PY: 'America/Asuncion', QA: 'Asia/Qatar',
    RE: 'Indian/Reunion', RO: 'Europe/Bucharest', RS: 'Europe/Belgrade', RU: 'Europe/Moscow',
    RW: 'Africa/Kigali', SA: 'Asia/Riyadh', SB: 'Pacific/Guadalcanal', SC: 'Indian/Mahe',
    SD: 'Africa/Khartoum', SE: 'Europe/Stockholm', SG: 'Asia/Singapore',
    SH: 'Atlantic/St_Helena', SI: 'Europe/Ljubljana', SJ: 'Arctic/Longyearbyen',
    SK: 'Europe/Bratislava', SL: 'Africa/Freetown', SM: 'Europe/San_Marino', SN: 'Africa/Dakar',
    SO: 'Africa/Mogadishu', SR: 'America/Paramaribo', SS: 'Africa/Juba', ST: 'Africa/Sao_Tome',
    SV: 'America/El_Salvador', SX: 'America/Lower_Princes', SY: 'Asia/Damascus',
    SZ: 'Africa/Mbabane', TC: 'America/Grand_Turk', TD: 'Africa/Ndjamena',
    TF: 'Indian/Kerguelen', TG: 'Africa/Lome', TH: 'Asia/Bangkok', TJ: 'Asia/Dushanbe',
    TK: 'Pacific/Fakaofo', TL: 'Asia/Dili', TM: 'Asia/Ashgabat', TN: 'Africa/Tunis',
    TO: 'Pacific/Tongatapu', TR: 'Europe/Istanbul', TT: 'America/Port_of_Spain',
    TV: 'Pacific/Funafuti', TW: 'Asia/Taipei', TZ: 'Africa/Dar_es_Salaam', UA: 'Europe/Kyiv',
    UG: 'Africa/Kampala', UM: 'Pacific/Wake', US: 'America/New_York', UY: 'America/Montevideo',
    UZ: 'Asia/Tashkent', VA: 'Europe/Rome', VC: 'America/St_Vincent', VE: 'America/Caracas',
    VG: 'America/Tortola', VI: 'America/St_Thomas', VN: 'Asia/Ho_Chi_Minh', VU: 'Pacific/Efate',
    WF: 'Pacific/Wallis', WS: 'Pacific/Apia', XK: 'Europe/Belgrade', YE: 'Asia/Aden',
    YT: 'Indian/Mayotte', ZA: 'Africa/Johannesburg', ZM: 'Africa/Lusaka', ZW: 'Africa/Harare',
};

const TIMEZONE_LABELS = {
    'Africa/Lagos': 'West Africa (Lagos)',
    'Africa/Accra': 'Ghana (Accra)',
    'Africa/Nairobi': 'East Africa (Nairobi)',
    'Africa/Johannesburg': 'South Africa',
    'Africa/Cairo': 'Egypt (Cairo)',
    'Europe/London': 'United Kingdom',
    'Europe/Paris': 'Central Europe',
    'America/New_York': 'US Eastern',
    'America/Chicago': 'US Central',
    'America/Denver': 'US Mountain',
    'America/Los_Angeles': 'US Pacific',
    'Asia/Dubai': 'UAE (Dubai)',
    UTC: 'UTC',
};

const EXTRA_BUSINESS_TIMEZONES = [
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'UTC',
];

const TIMEZONE_REGION_ORDER = [
    'Africa',
    'America',
    'Asia',
    'Atlantic',
    'Australia',
    'Europe',
    'Indian',
    'Pacific',
    'Arctic',
    'UTC',
];

const TIMEZONE_REGION_HEADERS = {
    Africa: 'Africa',
    America: 'Americas',
    Asia: 'Asia',
    Atlantic: 'Atlantic',
    Australia: 'Australia',
    Europe: 'Europe',
    Indian: 'Indian Ocean',
    Pacific: 'Pacific',
    Arctic: 'Arctic',
    UTC: 'Other',
};

function cityFromIana(value) {
    return String(value || '')
        .split('/')
        .pop()
        .replace(/_/g, ' ');
}

function timezoneRegionKey(value) {
    if (value === 'UTC') return 'UTC';
    return String(value || '').split('/')[0] || 'UTC';
}

function buildTimezoneLabel(value) {
    if (TIMEZONE_LABELS[value]) return TIMEZONE_LABELS[value];
    if (value === 'UTC') return 'UTC';
    const region = timezoneRegionKey(value).replace(/_/g, ' ');
    return `${region} (${cityFromIana(value)})`;
}

function buildBusinessTimezoneOptions() {
    const values = new Set([...Object.values(COUNTRY_TIMEZONE), ...EXTRA_BUSINESS_TIMEZONES]);
    return [...values].map((value) => ({
        value,
        label: buildTimezoneLabel(value),
    }));
}

export const BUSINESS_TIMEZONE_OPTIONS = buildBusinessTimezoneOptions();

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

export function getTimezoneForCountry(code) {
    const country = String(code || '').trim().toUpperCase();
    const mapped = COUNTRY_TIMEZONE[country];
    return mapped ? normalizeBusinessTimezone(mapped) : DEFAULT_BUSINESS_TIMEZONE;
}

export function getTimezoneLabel(value) {
    const tz = String(value || '').trim();
    if (!tz) return TIMEZONE_LABELS[DEFAULT_BUSINESS_TIMEZONE];
    return BUSINESS_TIMEZONE_OPTIONS.find((option) => option.value === tz)?.label || tz;
}

export function getTimezoneOffsetLabel(timeZone, date = new Date()) {
    const tz = normalizeBusinessTimezone(timeZone);
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset',
        }).formatToParts(date);
        return parts.find((part) => part.type === 'timeZoneName')?.value || '';
    } catch {
        return '';
    }
}

function toTimezoneSelectItem(option) {
    const offset = getTimezoneOffsetLabel(option.value);
    return {
        ...option,
        listLabel: offset ? `${option.label} · ${offset}` : option.label,
        searchText: `${option.label} ${option.value} ${cityFromIana(option.value)} ${offset}`.toLowerCase(),
    };
}

export function getTimezoneSelectOptions({ grouped = true } = {}) {
    const items = BUSINESS_TIMEZONE_OPTIONS.map(toTimezoneSelectItem);
    items.sort((a, b) => {
        if (a.value === DEFAULT_BUSINESS_TIMEZONE) return -1;
        if (b.value === DEFAULT_BUSINESS_TIMEZONE) return 1;
        return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
    });

    if (!grouped) return items;

    const groups = new Map();
    for (const item of items) {
        const key = timezoneRegionKey(item.value);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }

    const regionKeys = [
        ...TIMEZONE_REGION_ORDER.filter((key) => groups.has(key)),
        ...[...groups.keys()].filter((key) => !TIMEZONE_REGION_ORDER.includes(key)).sort(),
    ];

    const options = [];
    for (const key of regionKeys) {
        options.push({ header: true, label: TIMEZONE_REGION_HEADERS[key] || key });
        options.push(...groups.get(key));
    }
    return options;
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

export function getLastWeekBoundsInTimezone(timeZone, now = new Date()) {
    const { start } = getWeekBoundsInTimezone(timeZone, now);
    const prevStart = shiftDateByDays(start.year, start.month, start.day, -7);
    const prevEnd = shiftDateByDays(prevStart.year, prevStart.month, prevStart.day, 6);
    return { start: prevStart, end: prevEnd };
}

function weekPeriodFromBounds({ start, end }) {
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
    if (mode === 'last-week') return 'Last week';
    if (mode === 'month') return 'This month';
    if (mode === 'last-month') return 'Last month';
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
    if (mode === 'last-week') return 'vs previous week';
    if (mode === 'month') return isCurrentPeriod ? 'vs last month' : 'vs previous month';
    if (mode === 'last-month') return 'vs previous month';
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
        return weekPeriodFromBounds(getWeekBoundsInTimezone(timeZone, now));
    }
    if (mode === 'last-week') {
        return weekPeriodFromBounds(getLastWeekBoundsInTimezone(timeZone, now));
    }
    if (mode === 'month') {
        return { kind: 'month', ...getYearMonthInTimezone(timeZone, now) };
    }
    if (mode === 'last-month') {
        return { kind: 'month', ...getLastYearMonthInTimezone(timeZone, now) };
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

export function getLastYearMonthInTimezone(timeZone, now = new Date()) {
    const current = getYearMonthInTimezone(timeZone, now);
    return shiftSummaryPeriod(current.year, current.month, -1);
}
