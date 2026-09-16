/** Default thank-you footer shown at the bottom of premium PDFs. */
export function getDefaultDocumentFooter(businessName, mode = 'invoice') {
    const name = String(businessName || '').trim() || 'us';
    if (mode === 'quotation') {
        return `Thank you for considering ${name}. We look forward to doing business with you.`;
    }
    return `Thank you for doing business with ${name}.`;
}

export function getSavedDocumentFooter(businessInfo) {
    return String(businessInfo?.defaultDocumentFooter ?? '').trim();
}

/** Footer used when creating a new document: saved settings, else generated thank-you. */
export function resolvePrefillDocumentFooter(businessInfo, mode = 'invoice') {
    return getSavedDocumentFooter(businessInfo)
        || getDefaultDocumentFooter(businessInfo?.name, mode);
}

export function withDefaultDocumentFooter(data = {}, mode = 'invoice') {
    if (String(data.defaultDocumentFooter || '').trim()) return data;
    return {
        ...data,
        defaultDocumentFooter: getDefaultDocumentFooter(data.name, mode),
    };
}

/** Resolved footer text for a document (custom, saved default, or generated). */
export function resolveDocumentFooter(doc, businessInfo, mode = 'invoice') {
    const custom = String(doc?.documentFooter ?? '').trim();
    if (custom) return custom;
    const saved = getSavedDocumentFooter(businessInfo);
    if (saved) return saved;
    const businessName = businessInfo?.name ?? doc?.businessName;
    return getDefaultDocumentFooter(businessName, mode);
}
