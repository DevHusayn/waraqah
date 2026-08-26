function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
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
