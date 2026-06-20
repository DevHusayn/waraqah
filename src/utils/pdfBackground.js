import { PAGE_W, PAGE_H } from './pdfLogo';

/** Plain white page background for clean print/PDF output. */
export function drawPdfGeometricBackground(doc) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}
