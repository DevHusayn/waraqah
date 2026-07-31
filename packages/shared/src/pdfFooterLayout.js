/** Minimum space between page bottom edge and lowest footer text (print-safe). */
export const PDF_PRINT_BOTTOM_MARGIN = 8;

/** Gap between main content and signature block / footer on short pages. */
export const PDF_SIGNATURE_CONTENT_GAP = 10;
export const PDF_CONTENT_FOOTER_GAP = 8;

/** Total vertical space reserved for the footer block (line through CTA). */
export function getFooterBlockHeight(premium, mode = 'invoice') {
    if (premium) {
        return mode === 'quotation' ? 28 : 18;
    }
    return 20;
}

export function getSignatureZoneTop(footerLineY, signatureBlockH = 0) {
    return signatureBlockH > 0 ? footerLineY - signatureBlockH - 4 : footerLineY;
}

/** Combined footer + signature zone used for table/content bottom margins. */
export function getFooterZoneHeight(footerBlockH, signatureBlockH = 0) {
    const assetZone = signatureBlockH > 0 ? signatureBlockH + 6 : 0;
    return footerBlockH + PDF_PRINT_BOTTOM_MARGIN + assetZone;
}

/**
 * Pin footer to page bottom when content is short; place below content when the page is full.
 */
export function resolveFooterLineY({
    contentEndY,
    signatureBlockH = 0,
    footerBlockH,
    pageHeight,
}) {
    const pinnedLineY = pageHeight - footerBlockH - PDF_PRINT_BOTTOM_MARGIN;
    const minLineY =
        contentEndY +
        (signatureBlockH > 0
            ? signatureBlockH + PDF_SIGNATURE_CONTENT_GAP
            : PDF_CONTENT_FOOTER_GAP);

    if (minLineY <= pinnedLineY) {
        return pinnedLineY;
    }
    return minLineY;
}

export function contentFitsAboveFooter(
    contentStartY,
    neededHeight,
    signatureBlockH,
    footerBlockH,
    pageHeight
) {
    const footerLineY = pageHeight - footerBlockH - PDF_PRINT_BOTTOM_MARGIN;
    const signatureTop = getSignatureZoneTop(footerLineY, signatureBlockH);
    return contentStartY + neededHeight + 6 <= signatureTop;
}
