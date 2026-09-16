export function expensePayeePath(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return '/expenses';
    return `/expenses/payee/${encodeURIComponent(trimmed)}`;
}

export function formatPayeeCategorySummary(categories = [], getLabel) {
    const labels = categories
        .map((row) => (typeof getLabel === 'function' ? getLabel(row.category) : row.category))
        .filter(Boolean);
    if (labels.length === 0) return '—';
    if (labels.length <= 3) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
}

export function formatPayeePaymentCount(count) {
    const total = Number(count) || 0;
    return `${total} payment${total === 1 ? '' : 's'}`;
}
