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
    if (String(data.documentFooter || '').trim()) return true;
    if (Number(data.discountValue) > 0) return true;
    if (extraCheck?.(data)) return true;
    return (data.items || []).some((item) => String(item.description || '').trim());
}

/** Stricter check for background auto-save — typing a client name alone should not persist. */
export function hasAutoSaveDraftContent(data, { extraCheck } = {}) {
    if (data.clientId) return true;
    if (String(data.notes || '').trim()) return true;
    if (String(data.documentFooter || '').trim()) return true;
    if (Number(data.discountValue) > 0) return true;
    if (extraCheck?.(data)) return true;
    return (data.items || []).some((item) => String(item.description || '').trim());
}

export async function resolvePersistClientId(formData, handlers, { createIfMissing = true } = {}) {
    if (formData.clientId) return formData.clientId;
    const name = String(formData.clientName || '').trim();
    if (!name) return null;
    return handlers.resolveClientId(formData, { createIfMissing });
}

export function isEmptyLineItem(item) {
    return !String(item.description || '').trim();
}
