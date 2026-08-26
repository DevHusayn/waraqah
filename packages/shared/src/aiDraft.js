/** Product flag — keep AI drafts off until we turn this back on. */
export const AI_DRAFTS_ENABLED = false;

export function isAiDraftsEnabled() {
    return AI_DRAFTS_ENABLED === true;
}

export const AI_DOCUMENT_TYPES = {
    INVOICE: 'invoice',
    QUOTATION: 'quotation',
};

export const AI_MAX_PROMPT_LENGTH = 2000;

export function isAiDocumentType(value) {
    return value === AI_DOCUMENT_TYPES.INVOICE || value === AI_DOCUMENT_TYPES.QUOTATION;
}

/**
 * Merge a server AI draft into create-invoice / create-quotation form state.
 * Does not save or send — callers still use the existing save buttons.
 */
export function applyAiDraftToForm(prev, draft, { stringifyNumbers = false } = {}) {
    if (!prev || typeof prev !== 'object') return prev;
    if (!draft || typeof draft !== 'object') return prev;

    const next = { ...prev };

    if (Array.isArray(draft.items) && draft.items.length > 0) {
        next.items = draft.items.map((item) => {
            const quantity = item?.quantity ?? 1;
            const rate = item?.rate ?? 0;
            const mapped = {
                description: String(item?.description || '').trim(),
                quantity: stringifyNumbers ? String(quantity) : Number(quantity) || 0,
                rate: stringifyNumbers ? String(rate) : Number(rate) || 0,
                unit: String(item?.unit || 'Qty').trim() || 'Qty',
            };
            if (item?.productId) mapped.productId = String(item.productId);
            return mapped;
        });
    }

    const client = draft.client || {};
    const clientName = String(client.clientName || '').trim();
    if (clientName) {
        next.clientName = clientName;
        next.clientId = client.clientId ? String(client.clientId) : '';
        if (client.clientEmail != null) next.clientEmail = String(client.clientEmail);
        if (client.clientBusiness != null) next.clientBusiness = String(client.clientBusiness);
        if (client.clientPhone != null) next.clientPhone = String(client.clientPhone);
        if (client.clientAddress != null) next.clientAddress = String(client.clientAddress);
    }

    if (typeof draft.notes === 'string' && draft.notes.trim()) {
        next.notes = draft.notes.trim();
    }

    return next;
}
