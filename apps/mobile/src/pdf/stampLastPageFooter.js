import { PDFDocument, PDFName, PDFString, PDFArray, StandardFonts, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import {
    FREE_PDF_FOOTER_CTA_PREFIX,
    getFooterBlockHeight,
    PDF_PRINT_BOTTOM_MARGIN,
} from '@waraqah/shared';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_WEBSITE_URL } from '../constants/brand';

const PAGE_W_MM = 210;
const PT_TO_MM = 25.4 / 72;

function pointsToMm(pageHeightPt) {
    return pageHeightPt * PT_TO_MM;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!result) return rgb(0.09, 0.64, 0.29);
    return rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    );
}

function mmX(mm, pageWidth) {
    return (mm / PAGE_W_MM) * pageWidth;
}

function mmYFromTop(mmFromTop, pageHeightPt) {
    const pageHeight = pageHeightPt * PT_TO_MM;
    return pageHeightPt - (mmFromTop / pageHeight) * pageHeightPt;
}

function footerDomainLinkRect(pageWidth, pageHeightPt, prefix, domain, footerLineY) {
    const prefixWidthPt = prefix.length * 4.8;
    const domainWidthPt = Math.max(72, domain.length * 5.2);
    const domainX = (pageWidth - prefixWidthPt - domainWidthPt) / 2 + prefixWidthPt;
    const pageHeightMm = pageHeightPt * PT_TO_MM;
    const mmToPt = pageHeightPt / pageHeightMm;
    const lowerY = (footerLineY + 10) * mmToPt - 4;
    return [domainX, lowerY, domainX + domainWidthPt, lowerY + 18];
}

function wrapText(text, maxChars) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
        const next = `${line} ${words[i]}`;
        if (next.length <= maxChars) {
            line = next;
        } else {
            lines.push(line);
            line = words[i];
        }
    }
    lines.push(line);
    return lines;
}

function drawCenteredLine(page, font, text, yFromTopMm, size, color, pageWidth, pageHeightPt) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
        x: (pageWidth - textWidth) / 2,
        y: mmYFromTop(yFromTopMm, pageHeightPt),
        size,
        font,
        color,
    });
}

async function drawFooterOnLastPage(pdfDoc, footer) {
    const pages = pdfDoc.getPages();
    const page = pages[pages.length - 1];
    const { width, height } = page.getSize();
    const pageHeightMm = pointsToMm(height);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const footerBlockH =
        footer.type === 'statement' ? 22 : getFooterBlockHeight(footer.premium, footer.mode);
    const footerLineY = pageHeightMm - footerBlockH - PDF_PRINT_BOTTOM_MARGIN;
    const gray = rgb(0.42, 0.45, 0.5);
    const brand = hexToRgb(footer.brandColor);

    page.drawLine({
        start: { x: mmX(15, width), y: mmYFromTop(footerLineY - 4, height) },
        end: { x: mmX(195, width), y: mmYFromTop(footerLineY - 4, height) },
        thickness: 0.5,
        color: rgb(0.9, 0.91, 0.92),
    });

    if (footer.type === 'statement') {
        drawCenteredLine(
            page,
            font,
            `Amounts grouped by invoice status for ${footer.periodLabel}. Issue dates determine the billing period.`,
            footerLineY + 2,
            7,
            gray,
            width,
            height
        );
        const contact = [footer.businessName, footer.businessEmail].filter(Boolean).join(' · ');
        if (contact) {
            drawCenteredLine(page, font, contact, footerLineY + 7, 7, gray, width, height);
        }
        return null;
    }

    if (footer.premium) {
        const businessName = footer.businessName || 'us';
        const thankYou =
            footer.mode === 'quotation'
                ? `Thank you for considering ${businessName}. We look forward to doing business with you.`
                : `Thank you for doing business with ${businessName}.`;
        const lines = wrapText(thankYou, 72);
        let y = footerLineY + 2;
        for (const line of lines) {
            drawCenteredLine(page, font, line, y, 8, gray, width, height);
            y += 3.8;
        }
        return null;
    }

    drawCenteredLine(page, fontBold, `Powered by ${APP_NAME}`, footerLineY + 1, 8, brand, width, height);
    drawCenteredLine(page, font, APP_TAGLINE, footerLineY + 5.5, 7, gray, width, height);

    const prefix = FREE_PDF_FOOTER_CTA_PREFIX;
    const domain = APP_DOMAIN;
    const prefixWidth = font.widthOfTextAtSize(prefix, 7);
    const domainWidth = fontBold.widthOfTextAtSize(domain, 7);
    const startX = (width - prefixWidth - domainWidth) / 2;
    const ctaY = footerLineY + 10;

    page.drawText(prefix, {
        x: startX,
        y: mmYFromTop(ctaY, height),
        size: 7,
        font,
        color: gray,
    });
    page.drawText(domain, {
        x: startX + prefixWidth,
        y: mmYFromTop(ctaY, height),
        size: 7,
        font: fontBold,
        color: brand,
    });

    return footerDomainLinkRect(width, height, prefix, domain, footerLineY);
}

function addLinkAnnotation(pdfDoc, page, rect, url) {
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
}

/**
 * Draw the document footer on the last page and optionally inject a clickable CTA link.
 * HTML footers from expo-print follow document flow; this pins the footer to the page bottom.
 */
export async function stampLastPageFooter(uri, footer, { includeFooterLink = false } = {}) {
    const response = await fetch(uri);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfDoc = await PDFDocument.load(bytes);
    const linkRect = await drawFooterOnLastPage(pdfDoc, footer);

    if (includeFooterLink && linkRect) {
        const pages = pdfDoc.getPages();
        addLinkAnnotation(pdfDoc, pages[pages.length - 1], linkRect, APP_WEBSITE_URL);
    }

    const outBase64 = await pdfDoc.saveAsBase64();
    const outUri = `${FileSystem.cacheDirectory}stamped-${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(outUri, outBase64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return outUri;
}
