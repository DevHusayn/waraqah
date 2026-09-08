export function computeCatalogMargin(unitPrice, unitCost) {
    const price = Number(unitPrice) || 0;
    const cost = Number(unitCost) || 0;

    if (price <= 0 || cost <= 0) {
        return { marginPercent: null };
    }

    const marginPercent = Math.round(((price - cost) / price) * 1000) / 10;

    return { marginPercent };
}

export function formatMarginPercent(marginPercent) {
    if (marginPercent == null || !Number.isFinite(marginPercent)) return '—';
    return `${marginPercent.toFixed(1)}%`;
}
