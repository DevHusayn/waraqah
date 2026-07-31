const cache = new Map();

const CACHE_VERSION = 'v2';

function cacheKey(invoiceId, mode) {
    return `${invoiceId}:${mode}:${CACHE_VERSION}`;
}

export function getCachedPdf(invoiceId, mode) {
    if (!invoiceId) return null;
    return cache.get(cacheKey(invoiceId, mode)) ?? null;
}

export function setCachedPdf(invoiceId, mode, entry) {
    if (!invoiceId || !entry?.blob) return;
    cache.set(cacheKey(invoiceId, mode), entry);
}

export function clearCachedPdf(invoiceId, mode) {
    if (!invoiceId) return;
    if (mode) {
        cache.delete(cacheKey(invoiceId, mode));
        return;
    }
    cache.delete(cacheKey(invoiceId, 'invoice'));
    cache.delete(cacheKey(invoiceId, 'receipt'));
}
