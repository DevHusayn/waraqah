/** Minimum space between page bottom edge and lowest footer text (print-safe). */
export const PDF_PRINT_BOTTOM_MARGIN = 8;

/** Lowest footer text is drawn at footerLineY + this offset (CTA line in drawPageFooter). */
export const PDF_FOOTER_CTA_BOTTOM_OFFSET = 10;

/** Gap between main content and signature block above the footer. */
export const PDF_SIGNATURE_CONTENT_GAP = 10;

/** Total vertical space reserved for the footer block (line through CTA). */
export function getFooterBlockHeight(premium, mode = 'invoice') {
    if (premium) {
        return mode === 'quotation' ? 28 : 18;
    }
    return PDF_FOOTER_CTA_BOTTOM_OFFSET + 4;
}

export function getSignatureZoneTop(footerLineY, signatureBlockH = 0) {
    return signatureBlockH > 0 ? footerLineY - signatureBlockH - 4 : footerLineY;
}

/** Always pin footer line so the CTA sits just above the print-safe bottom margin. */
export function resolveFooterLineY({ pageHeight }) {
    return pageHeight - PDF_PRINT_BOTTOM_MARGIN - PDF_FOOTER_CTA_BOTTOM_OFFSET;
}

/** Combined footer + signature zone used for table/content bottom margins. */
export function getFooterZoneHeight(signatureBlockH = 0) {
    const reservedFromBottom =
        PDF_PRINT_BOTTOM_MARGIN + PDF_FOOTER_CTA_BOTTOM_OFFSET + 4;
    const assetZone = signatureBlockH > 0 ? signatureBlockH + 6 : 0;
    return reservedFromBottom + assetZone;
}

export function contentFitsAboveFooter(
    contentStartY,
    neededHeight,
    signatureBlockH,
    pageHeight
) {
    const footerLineY = resolveFooterLineY({ pageHeight });
    const signatureTop = getSignatureZoneTop(footerLineY, signatureBlockH);
    return contentStartY + neededHeight + 6 <= signatureTop;
}
