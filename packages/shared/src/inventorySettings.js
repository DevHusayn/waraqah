export function isOversellingAllowed(businessInfo) {
    return Boolean(businessInfo?.allowOverselling);
}

export function isInventoryTracked(product) {
    return Boolean(product?.trackInventory);
}

export function formatInsufficientStockMessage(shortfalls) {
    if (!Array.isArray(shortfalls) || shortfalls.length === 0) return '';

    if (shortfalls.length === 1) {
        const entry = shortfalls[0];
        return `${entry.name} exceeds available stock (${entry.available} on hand).`;
    }

    const names = shortfalls.map((entry) => entry.name).join(', ');
    return `Insufficient stock for: ${names}. Adjust quantities or add stock.`;
}

/**
 * Aggregate catalog line quantities by productId.
 * @param {Array<{ productId?: string, quantity?: number }>} items
 * @returns {Map<string, number>}
 */
export function aggregateCatalogQuantities(items) {
    const map = new Map();
    if (!Array.isArray(items)) return map;

    for (const item of items) {
        if (!item?.productId) continue;
        const id = String(item.productId);
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) continue;
        map.set(id, (map.get(id) || 0) + qty);
    }

    return map;
}

/**
 * Read-only shortfall check for document saves and client-side validation.
 * @param {object} options
 * @param {Array} options.items - Line items on the document being saved
 * @param {Array<{ id: string, name?: string, trackInventory?: boolean, quantityOnHand?: number }>} options.products
 * @param {boolean} [options.allowOverselling=false]
 * @param {Map<string, number>|Record<string, number>} [options.prevCommitted] - Quantities already committed on the previous doc version
 */
export function collectStockShortfalls({
    items,
    products,
    allowOverselling = false,
    prevCommitted = null,
} = {}) {
    if (allowOverselling || !Array.isArray(products)) return [];

    const prevMap = prevCommitted instanceof Map
        ? prevCommitted
        : new Map(Object.entries(prevCommitted || {}));
    const nextCommitted = aggregateCatalogQuantities(items);
    const shortfalls = [];

    for (const [productId, nextQty] of nextCommitted) {
        const product = products.find((entry) => String(entry.id) === productId);
        if (!isInventoryTracked(product)) continue;

        const prevQty = prevMap.get(productId) || 0;
        const additionalDeduction = nextQty - prevQty;
        if (additionalDeduction <= 0) continue;

        const available = Number(product.quantityOnHand ?? 0);
        const shortfall = additionalDeduction - available;
        if (shortfall > 0) {
            shortfalls.push({
                productId,
                name: product.name || 'Product',
                requested: nextQty,
                available,
                shortfall,
            });
        }
    }

    return shortfalls;
}
