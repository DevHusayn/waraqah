const PERIOD_MODES = new Set([
    'all',
    'today',
    'week',
    'last-week',
    'month',
    'last-month',
    'year',
    'custom',
]);

export function parsePositiveInt(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readListUrlValues(searchParams, defaults) {
    const values = {};
    for (const [key, fallback] of Object.entries(defaults)) {
        const raw = searchParams.get(key);
        if (key === 'page') {
            values.page = parsePositiveInt(raw, fallback ?? 1);
            continue;
        }
        if (key === 'period') {
            values.period = PERIOD_MODES.has(raw) ? raw : fallback;
            continue;
        }
        values[key] = raw == null || raw === '' ? fallback : raw;
    }
    return values;
}

function isDefaultListValue(key, value, fallback) {
    if (value == null || value === '') return true;
    if (value === fallback) return true;
    if (key === 'page' && Number(value) === 1) return true;
    return false;
}

/** Merge list-state keys into existing search params, omitting defaults. Unrelated keys are kept. */
export function applyListUrlPatch(searchParams, patch, defaults) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
        if (!(key in defaults)) continue;
        const fallback = defaults[key];
        if (isDefaultListValue(key, value, fallback)) {
            next.delete(key);
        } else {
            next.set(key, String(value));
        }
    }
    return next;
}
