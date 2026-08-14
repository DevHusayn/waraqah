/**
 * Draw "Try yours at mywaraqah.com" centered — only the domain is styled and underlined.
 * Returns domain bounds in jsPDF mm units for pdf-lib link injection.
 */
export function drawCenteredPdfFooterCta(doc, prefix, domain, y, brandColor, grayColor) {
    doc.setFont(undefined, 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const prefixWidth = doc.getTextWidth(prefix);
    const domainWidth = doc.getTextWidth(domain);
    const startX = (pageWidth - prefixWidth - domainWidth) / 2;
    const domainX = startX + prefixWidth;

    doc.setTextColor(...grayColor);
    doc.text(prefix, startX, y);

    doc.setTextColor(...brandColor);
    doc.text(domain, domainX, y);

    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.2);
    doc.line(domainX, y + 0.6, domainX + domainWidth, y + 0.6);

    return { domainX, domainWidth, y };
}

/** Convert jsPDF mm domain bounds to a pdf-lib link rect in PDF points. */
export function domainBoundsToLinkRect({ domainX, domainWidth, y }, pageWidth, pageHeight) {
    const xScale = pageWidth / 210;
    const yScale = pageHeight / 297;
    const x1 = domainX * xScale;
    const x2 = (domainX + domainWidth) * xScale;
    const lowerY = (297 - y - 1) * yScale;
    const upperY = lowerY + 14;
    return [x1, lowerY, x2, upperY];
}
