/** Strip grouping commas and keep a single optional decimal part. */
export function sanitizeAmountInput(raw) {
    const cleaned = String(raw ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
    if (!cleaned) return '';

    const dotIndex = cleaned.indexOf('.');
    if (dotIndex === -1) {
        return cleaned;
    }

    const whole = cleaned.slice(0, dotIndex);
    const decimals = cleaned
        .slice(dotIndex + 1)
        .replace(/\./g, '')
        .slice(0, 2);
    const endsWithDot = cleaned.endsWith('.');

    if (endsWithDot && !decimals) {
        return `${whole || '0'}.`;
    }
    if (decimals) {
        return `${whole || '0'}.${decimals}`;
    }
    return whole;
}

/** Format a numeric amount for editable display with thousands separators. */
export function formatAmountInput(raw) {
    const sanitized = sanitizeAmountInput(raw);
    if (!sanitized) return '';

    if (sanitized.endsWith('.')) {
        const whole = sanitized.slice(0, -1) || '0';
        const formattedWhole = whole ? Number(whole).toLocaleString('en-US') : '0';
        return `${formattedWhole}.`;
    }

    const [whole, decimals] = sanitized.split('.');
    const formattedWhole = whole ? Number(whole).toLocaleString('en-US') : '0';

    if (decimals !== undefined) {
        return `${formattedWhole}.${decimals}`;
    }
    return formattedWhole;
}

/** Parse a formatted amount string back to a number. */
export function parseAmountInput(raw) {
    const sanitized = sanitizeAmountInput(raw);
    if (!sanitized || sanitized === '.') return 0;
    const parsed = Number(sanitized.endsWith('.') ? sanitized.slice(0, -1) : sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
}
