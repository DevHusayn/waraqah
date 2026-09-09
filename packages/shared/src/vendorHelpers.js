function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
}

/** Deduplicate payee names case-insensitively, keeping first spelling. */
export function uniqueVendorNames(names) {
    const seen = new Set();
    const result = [];

    for (const raw of names || []) {
        const name = String(raw || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(name);
    }

    return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function vendorMatchScore(name, query) {
    const q = normalizeSearchText(query);
    if (!q) return -1;

    const lower = normalizeSearchText(name);
    if (!lower) return -1;
    if (lower.startsWith(q)) return 0;
    if (lower.includes(q)) return 1;
    return -1;
}

/** Filter saved expense payee names for Paid to autocomplete. */
export function filterVendorsForSuggestion(vendors, query, { limit = 8 } = {}) {
    const q = normalizeSearchText(query);
    if (!q || !Array.isArray(vendors)) return [];

    return vendors
        .map((name) => {
            const trimmed = String(name || '').trim();
            return { name: trimmed, score: vendorMatchScore(trimmed, q) };
        })
        .filter(({ name, score }) => name && score >= 0)
        .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        })
        .slice(0, Math.max(1, limit))
        .map(({ name }) => name);
}
