import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';
import { APP_DOMAIN, APP_WEBSITE_URL } from '../constants/brand';
import { getFreePdfFooterCta } from '@waraqah/shared';

/** jsPDF footer CTA line sits ~12mm above the physical page bottom. */
const FOOTER_OFFSET_MM = 12;

function footerLinkRect(pageWidth, pageHeight, label) {
    const labelWidth = Math.max(120, label.length * 4.8);
    const linkWidth = labelWidth + 24;
    const linkHeight = 18;
    const x = (pageWidth - linkWidth) / 2;
    const mmToPt = pageHeight / 297;
    const lowerY = FOOTER_OFFSET_MM * mmToPt - 4;
    return [x, lowerY, x + linkWidth, lowerY + linkHeight];
}

async function injectFooterLink(bytes, url, label) {
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];
    const { width, height } = page.getSize();

    const linkRef = pdfDoc.context.register(
        pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: footerLinkRect(width, height, label),
            Border: [0, 0, 0],
            A: {
                Type: 'Action',
                S: 'URI',
                URI: PDFString.of(url),
            },
        })
    );

    const annotsKey = PDFName.of('Annots');
    const existingAnnots = page.node.get(annotsKey);
    if (existingAnnots instanceof PDFArray) {
        existingAnnots.push(linkRef);
    } else {
        page.node.set(annotsKey, pdfDoc.context.obj([linkRef]));
    }

    return pdfDoc.save();
}

/**
 * Add a clickable footer link for free-plan PDFs.
 * @param {Blob} blob
 * @param {{ url?: string, label?: string }} [options]
 */
export async function addFooterLinkToPdfBlob(blob, options = {}) {
    const url = options.url ?? APP_WEBSITE_URL;
    const label = options.label ?? getFreePdfFooterCta(APP_DOMAIN);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const updated = await injectFooterLink(bytes, url, label);
    return new Blob([updated], { type: 'application/pdf' });
}
