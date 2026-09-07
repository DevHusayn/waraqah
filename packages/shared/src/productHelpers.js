function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
}

function catalogProductId(product) {
    return product?.id ?? product?._id ?? null;
}

function productSearchHaystack(product) {
    return [product?.name, product?.description]
        .map(normalizeSearchText)
        .filter(Boolean)
        .join(' ');
}

function productMatchScore(product, query) {
    const q = normalizeSearchText(query);
    if (!q) return -1;

    const name = normalizeSearchText(product?.name);
    const haystack = productSearchHaystack(product);

    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    if (haystack.includes(q)) return 2;
    return -1;
}

/** Filter saved products for line-item description autocomplete. */
export function filterProductsForSuggestion(products, query, { limit = 8 } = {}) {
    const q = normalizeSearchText(query);
    if (!q || !Array.isArray(products)) return [];

    return products
        .map((product) => ({ product, score: productMatchScore(product, q) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            return normalizeSearchText(a.product?.name).localeCompare(
                normalizeSearchText(b.product?.name)
            );
        })
        .slice(0, Math.max(1, limit))
        .map(({ product }) => product);
}

/** Match a line item to a catalog product by id, exact name, or "Name — details". */
export function findCatalogProductForLineItem(item, products) {
    if (!item || !Array.isArray(products) || products.length === 0) return null;

    if (item.productId) {
        const target = String(item.productId);
        const byId = products.find((product) => String(catalogProductId(product)) === target);
        if (byId) return byId;
    }

    const description = String(item.description || '').trim();
    if (!description) return null;

    const byName = products.find(
        (product) => normalizeSearchText(product?.name) === normalizeSearchText(description)
    );
    if (byName) return byName;

    const separator = ' — ';
    const separatorIndex = description.indexOf(separator);
    if (separatorIndex > 0) {
        const maybeName = description.slice(0, separatorIndex).trim();
        return (
            products.find(
                (product) => normalizeSearchText(product?.name) === normalizeSearchText(maybeName)
            ) || null
        );
    }

    return null;
}

export function buildCatalogProductFromLineItem(item, { priceField = 'unitPrice' } = {}) {
    const name = String(item?.description || '').trim();
    const rate = Number(item?.rate) || 0;
    return {
        name,
        description: '',
        unitPrice: priceField === 'unitCost' ? 0 : rate,
        unitCost: priceField === 'unitCost' ? rate : 0,
        trackInventory: false,
        quantityOnHand: 0,
        lowStockThreshold: null,
    };
}

/**
 * Link line items to catalog products, creating missing ones when allowed.
 * Returns a new items array with productId set where resolved.
 */
export async function ensureLineItemProducts(
    items,
    products,
    { addProduct, createIfMissing = true, priceField = 'unitPrice' } = {}
) {
    if (!Array.isArray(items) || items.length === 0) return items || [];

    const catalog = Array.isArray(products) ? [...products] : [];
    const nextItems = [];

    for (const item of items) {
        const description = String(item?.description || '').trim();
        if (!description) {
            nextItems.push(item);
            continue;
        }

        const existing = findCatalogProductForLineItem(item, catalog);
        if (existing) {
            const existingId = catalogProductId(existing);
            nextItems.push(
                item.productId && String(item.productId) === String(existingId)
                    ? item
                    : { ...item, productId: existingId }
            );
            continue;
        }

        if (!createIfMissing || typeof addProduct !== 'function') {
            nextItems.push(item);
            continue;
        }

        const created = await addProduct(buildCatalogProductFromLineItem(item, { priceField }));
        if (created) {
            catalog.push(created);
            nextItems.push({ ...item, productId: catalogProductId(created) });
        } else {
            nextItems.push(item);
        }
    }

    return nextItems;
}
