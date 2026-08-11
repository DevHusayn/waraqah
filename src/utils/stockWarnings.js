import {
    collectStockShortfalls,
    formatInsufficientStockMessage,
    isInventoryTracked,
    isOversellingAllowed,
} from '@waraqah/shared';

export { isInventoryTracked };

export function findCatalogProduct(products, productId) {
    if (!productId || !Array.isArray(products)) return null;
    const target = String(productId);
    return products.find((entry) => String(entry.id) === target) || null;
}

export function isLowStock(product) {
    if (!isInventoryTracked(product)) return false;
    const threshold = product.lowStockThreshold;
    if (threshold == null || threshold === '') return false;
    const qty = Number(product.quantityOnHand ?? 0);
    if (qty <= 0) return false;
    return qty <= Number(threshold);
}

export function formatStockLabel(product) {
    if (!isInventoryTracked(product)) return 'Untracked';
    const qty = Number(product.quantityOnHand ?? 0);
    if (qty <= 0) return 'Out of stock';
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

export function getLineItemStockWarning(item, products, businessInfo) {
    if (!item?.productId || !Array.isArray(products)) return null;

    const product = findCatalogProduct(products, item.productId);
    if (!isInventoryTracked(product)) return null;

    const requested = Number(item.quantity) || 0;
    const available = Number(product.quantityOnHand ?? 0);
    if (requested <= available) return null;

    if (isOversellingAllowed(businessInfo)) {
        return `${product.name} exceeds available stock (${available} on hand). Stock can go negative.`;
    }

    return `${product.name} exceeds available stock (${available} on hand).`;
}

export function validateDocumentStock({
    items,
    products,
    businessInfo,
    prevCommitted = null,
} = {}) {
    const shortfalls = collectStockShortfalls({
        items,
        products,
        allowOverselling: isOversellingAllowed(businessInfo),
        prevCommitted,
    });

    return shortfalls.length ? formatInsufficientStockMessage(shortfalls) : null;
}

export { aggregateCatalogQuantities } from '@waraqah/shared';
