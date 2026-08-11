export const LOW_STOCK_EMAIL_COOLDOWN_HOURS = 24;

export function isLowStockEmailAlertsEnabled(businessInfo) {
    return Boolean(businessInfo?.lowStockEmailAlerts);
}

export function isLowStockProduct(product) {
    if (!product?.trackInventory) return false;
    const threshold = product.lowStockThreshold;
    if (threshold == null || threshold === '') return false;
    const qty = Number(product.quantityOnHand ?? 0);
    if (qty <= 0) return false;
    return qty <= Number(threshold);
}
