import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { FREE_PDF_FOOTER_CTA_PREFIX } from '@waraqah/shared';

function footerDomainLinkRect(pageWidth, pageHeight, prefix, domain) {
    const prefixWidthPt = prefix.length * 4.8;
    const domainWidthPt = Math.max(72, domain.length * 5.2);
    const domainX = (pageWidth - prefixWidthPt - domainWidthPt) / 2 + prefixWidthPt;
    const mmToPt = pageHeight / 297;
    const lowerY = 12 * mmToPt - 4;
    return [domainX, lowerY, domainX + domainWidthPt, lowerY + 18];
}

/**
 * Inject a clickable domain link into a PDF file produced by expo-print.
 * HTML <a> tags are not preserved as PDF link annotations on iOS/Android.
 */
export async function addFooterLinkToPdfFile(uri, url, domain) {
    const response = await fetch(uri);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];
    const { width, height } = page.getSize();

    const linkRef = pdfDoc.context.register(
        pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: footerDomainLinkRect(width, height, FREE_PDF_FOOTER_CTA_PREFIX, domain),
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

    const outBase64 = await pdfDoc.saveAsBase64();
    const outUri = `${FileSystem.cacheDirectory}linked-${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(outUri, outBase64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return outUri;
}
