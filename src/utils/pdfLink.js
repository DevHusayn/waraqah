/**
 * Draw centered footer label text with underline (no jsPDF link annotation).
 */
export function drawCenteredPdfLink(doc, label, y, _url, color = [22, 163, 74]) {
    doc.setFont(undefined, 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const { w } = doc.getTextDimensions(label);
    const x = (pageWidth - w) / 2;

    doc.setTextColor(...color);
    doc.text(label, x, y);

    doc.setDrawColor(...color);
    doc.setLineWidth(0.2);
    doc.line(x, y + 0.6, x + w, y + 0.6);
}
