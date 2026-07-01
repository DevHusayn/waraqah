import { PDFDocument, PDFName, PDFString, PDFArray } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';

/** jsPDF footer domain line sits ~12mm above the physical page bottom. */
const FOOTER_OFFSET_MM = 12;

function footerLinkRect(pageWidth, pageHeight, label) {
    const labelWidth = Math.max(96, label.length * 5.5);
    const linkWidth = labelWidth + 24;
    const linkHeight = 18;
    const x = (pageWidth - linkWidth) / 2;
    const mmToPt = pageHeight / 297;
    const lowerY = FOOTER_OFFSET_MM * mmToPt - 4;
    return [x, lowerY, x + linkWidth, lowerY + linkHeight];
}

/**
 * Inject a footer URI link into a PDF file produced by expo-print.
 * HTML <a> tags are not preserved as PDF link annotations on iOS/Android.
 */
export async function addFooterLinkToPdfFile(uri, url, label) {
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

    const outBase64 = await pdfDoc.saveAsBase64();
    const outUri = `${FileSystem.cacheDirectory}linked-${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(outUri, outBase64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return outUri;
}
