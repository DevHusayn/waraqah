function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
}

export function getSupplierCompany(supplier) {
    if (!supplier) return '';
    return supplier.company || '';
}

function supplierSearchHaystack(supplier) {
    return [
        supplier?.name,
        getSupplierCompany(supplier),
        supplier?.email,
        supplier?.phone,
    ]
        .map(normalizeSearchText)
        .filter(Boolean)
        .join(' ');
}

function supplierMatchScore(supplier, query) {
    const q = normalizeSearchText(query);
    if (!q) return -1;

    const name = normalizeSearchText(supplier?.name);
    const haystack = supplierSearchHaystack(supplier);

    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    if (haystack.includes(q)) return 2;
    return -1;
}

/** Filter saved suppliers for name-field autocomplete suggestions. */
export function filterSuppliersForSuggestion(suppliers, query, { limit = 8 } = {}) {
    const q = normalizeSearchText(query);
    if (!q || !Array.isArray(suppliers)) return [];

    return suppliers
        .map((supplier) => ({ supplier, score: supplierMatchScore(supplier, q) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            return normalizeSearchText(a.supplier?.name).localeCompare(
                normalizeSearchText(b.supplier?.name)
            );
        })
        .slice(0, Math.max(1, limit))
        .map(({ supplier }) => supplier);
}
