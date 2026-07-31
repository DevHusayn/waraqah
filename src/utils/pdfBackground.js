/** Plain white page background for clean print/PDF output. */
export function drawPdfGeometricBackground(doc) {
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, 'F');
}
