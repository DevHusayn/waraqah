export const LOW_STOCK_EMAIL_COOLDOWN_HOURS = 24;

export function isLowStockEmailAlertsEnabled(businessInfo) {
    return Boolean(businessInfo?.lowStockEmailAlerts);
}

export function isLowStockProduct(product) {
    if (!product?.trackInventory) return false;
    const threshold = product.lowStockThreshold;
    if (threshold == null || threshold === '') return false;
    return Number(product.quantityOnHand ?? 0) <= Number(threshold);
}
