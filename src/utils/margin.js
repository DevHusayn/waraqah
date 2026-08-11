export function computeCatalogMargin(unitPrice, unitCost) {
    const price = Number(unitPrice) || 0;
    const cost = Number(unitCost) || 0;

    if (price <= 0 || cost <= 0) {
        return { marginPercent: null, markupPercent: null };
    }

    const marginPercent = Math.round(((price - cost) / price) * 1000) / 10;
    const markupPercent = Math.round(((price - cost) / cost) * 1000) / 10;

    return { marginPercent, markupPercent };
}

export function formatMarginPercent(marginPercent) {
    if (marginPercent == null || !Number.isFinite(marginPercent)) return '—';
    return `${marginPercent.toFixed(1)}%`;
}
