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

export async function resolvePersistProductItems(items, handlers, { createIfMissing = true } = {}) {
    if (!handlers?.resolveProductItems) return items || [];
    return handlers.resolveProductItems(items, { createIfMissing });
}

export function isEmptyLineItem(item) {
    return !String(item.description || '').trim();
}

/** Persist the typed bill-to name on the document even if the client is later deleted. */
export function clientSnapshotFromForm(formData) {
    return {
        clientName: String(formData.clientName || '').trim() || null,
        clientCompany: String(formData.clientBusiness || formData.clientCompany || '').trim() || null,
    };
}

export function applyClientSnapshotToPayload(payload, formData) {
    Object.assign(payload, clientSnapshotFromForm(formData || payload));
    delete payload.clientEmail;
    delete payload.clientBusiness;
    delete payload.clientPhone;
    delete payload.clientAddress;
    return payload;
}
