/** Default thank-you footer shown at the bottom of premium PDFs. */
export function getDefaultDocumentFooter(businessName, mode = 'invoice') {
    const name = String(businessName || '').trim() || 'us';
    if (mode === 'quotation') {
        return `Thank you for considering ${name}. We look forward to doing business with you.`;
    }
    return `Thank you for doing business with ${name}.`;
}

/** Resolved footer text for a document (custom or default). */
export function resolveDocumentFooter(doc, businessInfo, mode = 'invoice') {
    const custom = String(doc?.documentFooter ?? '').trim();
    if (custom) return custom;
    const businessName = businessInfo?.name ?? doc?.businessName;
    return getDefaultDocumentFooter(businessName, mode);
}
