export function hasClientDetails(data) {
    return Boolean(
        String(data.clientBusiness || '').trim() ||
            String(data.clientPhone || '').trim() ||
            String(data.clientAddress || '').trim() ||
            String(data.clientAdditionalInfo || '').trim()
    );
}

export function hasDraftContent(data, { extraCheck } = {}) {
    if (String(data.clientName || '').trim()) return true;
    if (data.clientId) return true;
    if (String(data.notes || '').trim()) return true;
    if (Number(data.discountValue) > 0) return true;
    if (extraCheck?.(data)) return true;
    return (data.items || []).some((item) => String(item.description || '').trim());
}

export function isEmptyLineItem(item) {
    return !String(item.description || '').trim();
}
