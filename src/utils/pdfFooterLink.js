import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';
import { APP_DOMAIN, APP_WEBSITE_URL } from '../constants/brand';
import { FREE_PDF_FOOTER_CTA_PREFIX } from '@waraqah/shared';
import { domainBoundsToLinkRect } from './pdfLink';

function footerDomainLinkRect(pageWidth, pageHeight, prefix, domain) {
    const prefixWidthPt = prefix.length * 4.8;
    const domainWidthPt = Math.max(72, domain.length * 5.2);
    const domainX = (pageWidth - prefixWidthPt - domainWidthPt) / 2 + prefixWidthPt;
    const mmToPt = pageHeight / 297;
    const lowerY = 12 * mmToPt - 4;
    return [domainX, lowerY, domainX + domainWidthPt, lowerY + 18];
}

async function injectFooterLink(bytes, url, options = {}) {
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];
    const { width, height } = page.getSize();

    const domain = options.domain ?? APP_DOMAIN;
    const rect = options.linkBounds
        ? domainBoundsToLinkRect(options.linkBounds, width, height)
        : footerDomainLinkRect(width, height, FREE_PDF_FOOTER_CTA_PREFIX, domain);

    const linkRef = pdfDoc.context.register(
        pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: rect,
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
 * Add a clickable footer domain link for free-plan PDFs.
 * @param {Blob} blob
 * @param {{ url?: string, domain?: string, linkBounds?: { domainX: number, domainWidth: number, y: number } }} [options]
 */
export async function addFooterLinkToPdfBlob(blob, options = {}) {
    const url = options.url ?? APP_WEBSITE_URL;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const updated = await injectFooterLink(bytes, url, options);
    return new Blob([updated], { type: 'application/pdf' });
}
