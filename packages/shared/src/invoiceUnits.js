export const DEFAULT_INVOICE_UNIT = 'Qty';

export const INVOICE_UNIT_PRESETS = [
    'Qty',
    'Hours',
    'Days',
    'Weeks',
    'Months',
    'Projects',
    'Sessions',
    'Kilograms',
    'Litres',
    'Boxes',
];

/** Sentinel value for the "Custom…" select option — never persisted. */
export const CUSTOM_UNIT_OPTION = '__custom__';

export function normalizeInvoiceUnit(unit) {
    const trimmed = String(unit || '').trim();
    return trimmed || DEFAULT_INVOICE_UNIT;
}

/**
 * PDF / table quantity column header from line items.
 * Uses the shared unit when every item agrees; otherwise falls back to Qty.
 */
export function resolveQuantityColumnLabel(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
        return DEFAULT_INVOICE_UNIT;
    }
    const units = items.map((item) => normalizeInvoiceUnit(item?.unit));
    const first = units[0];
    return units.every((u) => u === first) ? first : DEFAULT_INVOICE_UNIT;
}

export function buildUnitSelectOptions(currentUnit) {
    const normalized = normalizeInvoiceUnit(currentUnit);
    const options = INVOICE_UNIT_PRESETS.map((unit) => ({
        value: unit,
        label: unit,
    }));

    if (!INVOICE_UNIT_PRESETS.includes(normalized)) {
        options.push({ value: normalized, label: normalized });
    }

    options.push({ value: CUSTOM_UNIT_OPTION, label: 'Custom…' });
    return options;
}
