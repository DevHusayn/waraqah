export function isLowStock(product) {
    if (!product?.trackInventory) return false;
    const threshold = product.lowStockThreshold;
    if (threshold == null || threshold === '') return false;
    return Number(product.quantityOnHand ?? 0) <= Number(threshold);
}

export function formatStockLabel(product) {
    if (!product?.trackInventory) return null;
    const qty = Number(product.quantityOnHand ?? 0);
    return `${qty} in stock`;
}

export function buildStockWarningMessage(stockWarnings) {
    if (!Array.isArray(stockWarnings) || stockWarnings.length === 0) return null;

    if (stockWarnings.length === 1) {
        const warning = stockWarnings[0];
        return `${warning.name} is short by ${warning.shortfall}. Stock can go negative.`;
    }

    return `${stockWarnings.length} products are below available stock. Inventory can go negative.`;
}

export function notifyStockWarnings(showToast, record) {
    const message = buildStockWarningMessage(record?.stockWarnings);
    if (message) {
        showToast(message, 'info');
    }
}

export function getLineItemStockWarning(item, products) {
    if (!item?.productId || !Array.isArray(products)) return null;

    const product = products.find((entry) => entry.id === item.productId);
    if (!product?.trackInventory) return null;

    const requested = Number(item.quantity) || 0;
    const available = Number(product.quantityOnHand ?? 0);
    if (requested <= available) return null;

    return `${product.name} exceeds available stock (${available} on hand).`;
}
