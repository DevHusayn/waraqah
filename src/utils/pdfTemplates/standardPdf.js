import {
    FREE_PDF_FOOTER_CTA_PREFIX,
    getInvoiceAmountPaid,
    getInvoiceBalanceDue,
    hasRecordedPayments,
    resolveQuantityColumnLabel,
    resolveFooterLineY,
    getFooterZoneHeight,
    contentFitsAboveFooter,
} from '@waraqah/shared';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_WEBSITE_URL } from '../../constants/brand';
import { getCurrencySymbol } from '../currency';
import { getClientBusiness } from '../clientHelpers';
import { isPremiumUser } from '../premium';
import {
    drawAuthorizedSignature,
    drawCompanyStamp,
    drawHeaderLogo,
} from '../pdfLogo';
import { drawPdfGeometricBackground } from '../pdfBackground';
import {
    getCompanyLogoUrl,
    getCompanyStampUrl,
    getAuthorizedSignatureUrl,
} from '../brandAssets';
import {
    getDocumentNumber,
    getPaymentMethodLabel,
    getPdfFileName,
    resolvePdfMode,
} from '../receiptHelpers';
import { drawCenteredPdfFooterCta } from '../pdfLink';
import { addFooterLinkToPdfBlob } from '../pdfFooterLink';
import { addPdfPreviewThumbnail } from '../pdfPageThumbnail';
import { resolvePdfPaperFormat } from '../pdfPageFormat';

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [14, 165, 233];
}

function lightenColor(rgb, percent) {
    return rgb.map((c) => Math.min(255, Math.round(c + (255 - c) * percent)));
}

function hasPaymentDetails(businessInfo) {
    return Boolean(
        businessInfo?.paymentAccountName?.trim() ||
        businessInfo?.paymentBankName?.trim() ||
        businessInfo?.paymentAccountNumber?.trim() ||
        businessInfo?.paymentInstructions?.trim()
    );
}

/** jsPDF Helvetica only supports normal/bold — bold at small sizes reads slightly heavier. */
function setPdfBodyFont(doc) {
    doc.setFont(undefined, 'bold');
}

function drawStatusBadge(doc, status, x, y) {
    const statusColors = {
        paid: [22, 163, 74],
        pending: [202, 138, 4],
        partial: [2, 132, 199],
        overdue: [220, 38, 38],
        cancelled: [113, 113, 122],
        draft: [113, 113, 122],
        sent: [2, 132, 199],
        accepted: [22, 163, 74],
        rejected: [220, 38, 38],
        expired: [234, 88, 12],
        converted: [124, 58, 237],
    };
    const key = (status || 'pending').toLowerCase();
    const label = key.toUpperCase();
    const color = statusColors[key] || statusColors.pending;
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'bold');
    const badgeW = Math.max(24, doc.getTextWidth(label) + 8);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x - badgeW + 2, y - 4, badgeW, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(label, x - badgeW / 2 + 2, y + 0.5, { align: 'center' });
}

const BILL_TO_BOX_X = 15;
const BILL_TO_BOX_W = 88;
const BILL_TO_TEXT_X = 19;
const BILL_TO_TEXT_PAD = BILL_TO_TEXT_X - BILL_TO_BOX_X;
const BILL_TO_MAX_WIDTH = BILL_TO_BOX_W - BILL_TO_TEXT_PAD * 2 - 2;
const BILL_TO_LINE_HEIGHT = 3.8;
const PAYMENT_BOX_X = 15;
const PAYMENT_BOX_W = 88;
const PAYMENT_TEXT_X = 19;
const PAYMENT_TEXT_MAX_WIDTH = PAYMENT_BOX_W - (PAYMENT_TEXT_X - PAYMENT_BOX_X) * 2 - 2;

function splitWrappedParagraphs(doc, text, maxWidth) {
    return String(text || '')
        .split(/\r?\n/)
        .flatMap((paragraph) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return [];
            return doc.splitTextToSize(trimmed, maxWidth);
        });
}

function countWrappedLines(doc, text, maxWidth) {
    if (!text) return 0;
    return splitWrappedParagraphs(doc, text, maxWidth).length;
}

function measureBillToBoxHeight(doc, client, business, additionalInfo) {
    let height = 13;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    height += countWrappedLines(doc, client?.name || 'Client', BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;

    doc.setFontSize(8);
    setPdfBodyFont(doc);
    if (business) {
        height += countWrappedLines(doc, business, BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;
    }
    if (client?.email) {
        height += countWrappedLines(doc, client.email, BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;
    }
    if (client?.phone) {
        height += countWrappedLines(doc, client.phone, BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;
    }
    if (client?.address) {
        height += countWrappedLines(doc, client.address, BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;
    }
    if (additionalInfo) {
        height += 2;
        height += countWrappedLines(doc, additionalInfo, BILL_TO_MAX_WIDTH) * BILL_TO_LINE_HEIGHT;
    }

    return Math.max(36, height + 5);
}

function drawWrappedBillToField(doc, text, x, y, maxWidth = BILL_TO_MAX_WIDTH) {
    const lines = splitWrappedParagraphs(doc, text, maxWidth);
    if (!lines.length) return y;
    doc.text(lines, x, y);
    return y + lines.length * BILL_TO_LINE_HEIGHT;
}

function ensureBottomSectionSpace(
    currentY,
    neededHeight,
    signatureBlockH,
    pageHeight,
    startNewPage
) {
    if (contentFitsAboveFooter(currentY, neededHeight, signatureBlockH, pageHeight)) {
        return currentY;
    }
    return startNewPage();
}

function drawInvoiceTitleBlock(doc, docNumber, mode, primaryColor, lightPrimary, textColor) {
    const title =
        mode === 'receipt' ? 'RECEIPT' : mode === 'quotation' ? 'QUOTATION' : 'INVOICE';
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text(title, 195, 20, { align: 'right' });

    const numberText = `#${String(docNumber)}`;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const badgeW = Math.max(36, doc.getTextWidth(numberText) + 10);
    const badgeX = 195 - badgeW;
    const badgeY = 24;
    doc.setFillColor(...lightPrimary);
    doc.roundedRect(badgeX, badgeY, badgeW, 12, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.text(numberText, badgeX + badgeW / 2, badgeY + 8, { align: 'center' });
}

function drawBillToAndDetails(
    doc,
    client,
    invoice,
    mode,
    y,
    primaryColor,
    textColor,
    grayColor,
    lightPrimary
) {
    const isReceiptDoc = mode === 'receipt';
    const isQuotationDoc = mode === 'quotation';
    const hasValidUntil = Boolean(invoice.validUntil);
    const hasDueDate = Boolean(invoice.dueDate);
    const hasSecondaryDate = isQuotationDoc ? hasValidUntil : hasDueDate;
    const detailsHeight = isReceiptDoc ? 46 : hasSecondaryDate ? 38 : 28;

    const business = getClientBusiness(client);
    const additionalInfo = String(invoice.clientAdditionalInfo || '').trim();
    const leftBoxH = measureBillToBoxHeight(doc, client, business, additionalInfo);
    const rightBoxH = Math.max(36, detailsHeight);

    doc.setFillColor(...lightPrimary);
    doc.roundedRect(15, y, 88, leftBoxH, 2, 2, 'F');
    doc.roundedRect(107, y, 88, rightBoxH, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(isQuotationDoc ? 'QUOTED TO' : 'BILL TO', BILL_TO_TEXT_X, y + 6);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    let billY = drawWrappedBillToField(doc, client?.name || 'Client', BILL_TO_TEXT_X, y + 13);

    doc.setFontSize(8);
    setPdfBodyFont(doc);
    doc.setTextColor(...grayColor);
    if (business) {
        billY = drawWrappedBillToField(doc, business, BILL_TO_TEXT_X, billY);
    }
    if (client?.email) {
        billY = drawWrappedBillToField(doc, client.email, BILL_TO_TEXT_X, billY);
    }
    if (client?.phone) {
        billY = drawWrappedBillToField(doc, client.phone, BILL_TO_TEXT_X, billY);
    }
    if (client?.address) {
        billY = drawWrappedBillToField(doc, client.address, BILL_TO_TEXT_X, billY);
    }
    if (additionalInfo) {
        billY += 2;
        drawWrappedBillToField(doc, additionalInfo, BILL_TO_TEXT_X, billY);
    }

    const badgeStatus = isReceiptDoc ? 'paid' : invoice.status;
    drawStatusBadge(doc, badgeStatus, 188, y + 8);

    const issueDate = invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A';
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...grayColor);
    doc.text('ISSUE DATE', 111, y + 18);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text(issueDate, 190, y + 18, { align: 'right' });

    if (isReceiptDoc) {
        const paymentDate = invoice.datePaid
            ? format(new Date(invoice.datePaid), 'MMM dd, yyyy')
            : issueDate;
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...grayColor);
        doc.text('PAYMENT DATE', 111, y + 28);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(paymentDate, 190, y + 28, { align: 'right' });

        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...grayColor);
        doc.text('PAYMENT METHOD', 111, y + 38);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(getPaymentMethodLabel(invoice.paymentMethod), 190, y + 38, { align: 'right' });
    } else if (isQuotationDoc && hasValidUntil) {
        const validUntil = format(new Date(invoice.validUntil), 'MMM dd, yyyy');
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...grayColor);
        doc.text('VALID UNTIL', 111, y + 28);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(validUntil, 190, y + 28, { align: 'right' });
    } else if (!isQuotationDoc && hasDueDate) {
        const dueDate = format(new Date(invoice.dueDate), 'MMM dd, yyyy');
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...grayColor);
        doc.text('DUE DATE', 111, y + 28);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(dueDate, 190, y + 28, { align: 'right' });
    }

    return y + Math.max(leftBoxH, rightBoxH) + 8;
}

async function drawCompanyHeader(doc, businessInfo, premium, logoUrl, pngCache, primaryColor, textColor, grayColor) {
    const leftX = 15;
    let nameX = leftX;
    let nameY = 22;

    if (premium && logoUrl) {
        try {
            const logoDims = await drawHeaderLogo(doc, logoUrl, pngCache, {
                x: leftX,
                nameBaselineY: nameY,
                maxW: 22,
                maxH: 12,
            });
            if (logoDims?.width) {
                nameX = leftX + logoDims.width + 3;
            }
        } catch {
            /* no logo */
        }
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(String(businessInfo.name || 'Your Business'), nameX, nameY);

    doc.setFontSize(8);
    setPdfBodyFont(doc);
    doc.setTextColor(...grayColor);
    let detailY = nameY + 6;
    const addressLines = doc.splitTextToSize(String(businessInfo.address || ''), 88);
    doc.text(addressLines, leftX, detailY);
    detailY += addressLines.length * 3.8;
    if (businessInfo.email) {
        doc.text(String(businessInfo.email), leftX, detailY);
        detailY += 4;
    }
    if (businessInfo.phone) {
        doc.text(String(businessInfo.phone), leftX, detailY);
        detailY += 4;
    }

    return detailY;
}

function drawBottomBoxes(
    doc,
    businessInfo,
    invoice,
    startY,
    primaryColor,
    grayColor,
    textColor,
    lightGray,
    startNewPage,
    signatureBlockH,
    pageHeight,
    mode
) {
    const isReceiptDoc = mode === 'receipt';
    const isQuotationDoc = mode === 'quotation';
    const hasPayment = !isReceiptDoc && !isQuotationDoc && hasPaymentDetails(businessInfo);
    const notesText = invoice.notes?.trim() || '';
    const hasNotes = Boolean(notesText);
    const termsText = isQuotationDoc ? invoice.terms?.trim() || '' : '';
    const hasTerms = Boolean(termsText);

    let y = startY;

    if (hasPayment || hasNotes) {
        const paymentLines = [];
        if (hasPayment) {
            if (businessInfo.paymentBankName?.trim()) {
                paymentLines.push(`Bank Name: ${businessInfo.paymentBankName.trim()}`);
            }
            if (businessInfo.paymentAccountName?.trim()) {
                paymentLines.push(`Account Name: ${businessInfo.paymentAccountName.trim()}`);
            }
            if (businessInfo.paymentAccountNumber?.trim()) {
                paymentLines.push(`Account Number: ${businessInfo.paymentAccountNumber.trim()}`);
            }
            if (businessInfo.paymentInstructions?.trim()) {
                paymentLines.push(businessInfo.paymentInstructions.trim());
            }
        }

        doc.setFontSize(7.5);
        setPdfBodyFont(doc);
        const notesMaxWidth = hasPayment ? PAYMENT_TEXT_MAX_WIDTH : 168;
        const notesLines = hasNotes ? splitWrappedParagraphs(doc, notesText, notesMaxWidth) : [];
        const wrappedPaymentLines = hasPayment
            ? paymentLines.flatMap((line) => splitWrappedParagraphs(doc, line, PAYMENT_TEXT_MAX_WIDTH))
            : [];

        const boxH = Math.max(
            24,
            hasPayment ? 14 + wrappedPaymentLines.length * 3.5 : 0,
            hasNotes ? 14 + notesLines.length * 3.5 : 0
        );
        y = ensureBottomSectionSpace(startY, boxH, signatureBlockH, pageHeight, startNewPage);

        if (hasPayment) {
            doc.setDrawColor(...lightGray);
            doc.setLineWidth(0.4);
            doc.roundedRect(15, y, 88, boxH, 2, 2, 'S');

            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('PAYMENT INFORMATION', 19, y + 7);

            doc.setTextColor(...grayColor);
            let py = y + 12;
            for (const line of wrappedPaymentLines) {
                doc.text(line, PAYMENT_TEXT_X, py);
                py += 3.5;
            }
        }

        if (hasNotes) {
            const notesX = hasPayment ? 107 : 15;
            const notesW = hasPayment ? 88 : 180;
            doc.setDrawColor(...lightGray);
            doc.roundedRect(notesX, y, notesW, boxH, 2, 2, 'S');

            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('NOTES', notesX + 4, y + 7);

            doc.setFontSize(7.5);
            setPdfBodyFont(doc);
            doc.setTextColor(...grayColor);
            let ny = y + 13;
            for (const line of notesLines) {
                doc.text(line, notesX + 4, ny);
                ny += 3.8;
            }
        }

        y += boxH + 4;
    }

    if (hasTerms) {
        const termsLines = doc.splitTextToSize(termsText, 168);
        const termsBoxH = Math.max(24, 14 + termsLines.length * 3.5);
        y = ensureBottomSectionSpace(y, termsBoxH, signatureBlockH, pageHeight, startNewPage);

        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.4);
        doc.roundedRect(15, y, 180, termsBoxH, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('TERMS & CONDITIONS', 19, y + 7);

        doc.setFontSize(7.5);
        setPdfBodyFont(doc);
        doc.setTextColor(...grayColor);
        let ty = y + 13;
        for (const line of termsLines) {
            doc.text(line, 19, ty);
            ty += 3.8;
        }

        y += termsBoxH + 4;
    }

    return y;
}

function drawPageFooter(doc, businessInfo, premium, footerY, primaryColor, grayColor, mode = 'invoice') {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 4, 195, footerY - 4);

    doc.setFontSize(8);
    setPdfBodyFont(doc);

    if (premium) {
        doc.setTextColor(...grayColor);
        const businessName = String(businessInfo.name || 'us');
        const thankYou =
            mode === 'quotation'
                ? `Thank you for considering ${businessName}. We look forward to doing business with you.`
                : `Thank you for doing business with ${businessName}.`;
        const thankYouLines = doc.splitTextToSize(thankYou, 170);
        doc.text(thankYouLines, 105, footerY + 2, { align: 'center' });
        return null;
    }

    doc.setTextColor(...primaryColor);
    doc.setFont(undefined, 'bold');
    doc.text(`Powered by ${APP_NAME}`, 105, footerY + 1, { align: 'center' });
    setPdfBodyFont(doc);
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text(APP_TAGLINE, 105, footerY + 5.5, { align: 'center' });

    return drawCenteredPdfFooterCta(
        doc,
        FREE_PDF_FOOTER_CTA_PREFIX,
        APP_DOMAIN,
        footerY + 10,
        primaryColor,
        grayColor
    );
}

/**
 * Premium signature (+ optional stamp) block — right-aligned under totals, above footer.
 * Renders only uploaded assets (no placeholders). Stamp appears only on receipts.
 */
async function drawSignatureStampBlock(
    doc,
    {
        signatureUrl,
        stampUrl,
        ownerName,
        footerLineY,
        isReceiptDoc,
        pngCache,
        textColor,
        grayColor,
    }
) {
    const hasSignature = Boolean(signatureUrl);
    const hasStamp = isReceiptDoc && Boolean(stampUrl);
    if (!hasSignature && !hasStamp) return;

    const contentRight = 195;
    const pairGap = 14;
    const sigMaxW = 48;
    const sigMaxH = 16;
    const stampMaxW = 28;
    const stampMaxH = 28;
    const nameGap = 4.5;
    const ruleGap = 2.5;
    const ruleBelowGap = 1.5;

    const signatureTextH = hasSignature ? nameGap + 10 : 0;
    const blockH = Math.max(
        hasSignature ? sigMaxH + ruleBelowGap + ruleGap + 4 + signatureTextH : 0,
        hasStamp ? stampMaxH : 0
    );
    const blockTop = footerLineY - blockH - 4;
    const imageY = blockTop;

    let stampDrawn = null;
    if (hasStamp) {
        stampDrawn = await drawCompanyStamp(doc, stampUrl, imageY, pngCache, {
            rightX: contentRight,
            maxW: stampMaxW,
            maxH: stampMaxH,
            opacity: 0.95,
        });
    }

    if (hasSignature) {
        const signatureRight =
            stampDrawn != null ? stampDrawn.x - pairGap : contentRight;
        const drawn = await drawAuthorizedSignature(doc, signatureUrl, imageY, pngCache, {
            rightX: signatureRight,
            maxW: sigMaxW,
            maxH: sigMaxH,
        });

        if (drawn) {
            const ruleY = drawn.y + drawn.h + ruleBelowGap;
            doc.setDrawColor(...grayColor);
            doc.setLineWidth(0.35);
            doc.line(drawn.x, ruleY, drawn.x + drawn.w, ruleY);

            const name = String(ownerName || '').trim();
            let textY = ruleY + ruleGap + 2;
            if (name) {
                doc.setFontSize(8);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...textColor);
                doc.text(name, drawn.x + drawn.w / 2, textY, { align: 'center' });
                textY += nameGap;
            }

            doc.setFontSize(6.5);
            setPdfBodyFont(doc);
            doc.setTextColor(...grayColor);
            doc.text('Authorized Signature', drawn.x + drawn.w / 2, textY, { align: 'center' });
        }
    }
}

export async function generateStandardPdf(invoice, client, businessInfo, options = {}) {
    const mode = resolvePdfMode(invoice, options.mode);
    const isReceiptDoc = mode === 'receipt';
    const isQuotationDoc = mode === 'quotation';

    if (!invoice || !client || !businessInfo) {
        throw new Error('Missing required data for PDF generation');
    }

    const paperFormat = resolvePdfPaperFormat(options);
    const doc = new jsPDF({ unit: 'mm', format: paperFormat });
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const premium = isPremiumUser(businessInfo);
    const logoUrl = premium ? getCompanyLogoUrl(businessInfo) : '';
    const stampUrl = premium ? getCompanyStampUrl(businessInfo) : '';
    const signatureUrl = premium ? getAuthorizedSignatureUrl(businessInfo) : '';
    const pngCache = new Map();

    const primaryColor = hexToRgb(businessInfo.brandColor || '#16A34A');
    const lightPrimary = lightenColor(primaryColor, 0.7);
    const textColor = [31, 41, 55];
    const grayColor = [107, 114, 128];
    const lightGray = [229, 231, 235];
    const currencySymbol = getCurrencySymbol(invoice.currency || 'NGN', false);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const docNumber =
        getDocumentNumber(invoice, mode) ||
        (isReceiptDoc ? 'RCP' : isQuotationDoc ? 'QTN' : 'INV');
    const hasSignatureAsset = Boolean(signatureUrl);
    const hasStampAsset = isReceiptDoc && Boolean(stampUrl);
    const signatureBlockH = hasSignatureAsset ? 39 : hasStampAsset ? 32 : 0;
    const FOOTER_ZONE = getFooterZoneHeight(signatureBlockH);
    const CONTENT_BOTTOM = pageHeight - FOOTER_ZONE;

    const pdfContentLeft = 15;
    const pdfContentWidth = 180;
    const pdfContentRight = pdfContentLeft + pdfContentWidth;

    const startNewPage = () => {
        doc.addPage();
        drawPdfGeometricBackground(doc);
        return 18;
    };

    const ensureSpace = (currentY, neededHeight) => {
        if (currentY + neededHeight > CONTENT_BOTTOM) {
            return startNewPage();
        }
        return currentY;
    };

    drawPdfGeometricBackground(doc);

    const headerBottom = await drawCompanyHeader(
        doc,
        businessInfo,
        premium,
        logoUrl,
        pngCache,
        primaryColor,
        textColor,
        grayColor
    );

    drawInvoiceTitleBlock(doc, docNumber, mode, primaryColor, lightPrimary, textColor);

    const partyY = headerBottom + 8;
    const tableStartY = drawBillToAndDetails(
        doc,
        client,
        invoice,
        mode,
        partyY,
        primaryColor,
        textColor,
        grayColor,
        lightPrimary
    );

    if (!invoice.items?.length) {
        throw new Error(
            isQuotationDoc
                ? 'Quotation must have at least one item'
                : 'Invoice must have at least one item'
        );
    }

    const tableData = invoice.items.map((item, index) => [
        String(index + 1),
        item.description || '',
        (item.quantity || 0).toString(),
        `${currencySymbol}${formatMoney(item.rate)}`,
        `${currencySymbol}${formatMoney(Number(item.quantity || 0) * Number(item.rate || 0))}`,
    ]);

    const tableColumnWidths = {
        0: 14,
        1: 64,
        2: 24,
        3: 39,
        4: 39,
    };
    const quantityColumnLabel = resolveQuantityColumnLabel(invoice.items).toUpperCase();

    autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'DESCRIPTION', quantityColumnLabel, 'RATE', 'TOTAL']],
        body: tableData,
        theme: 'plain',
        showHead: 'everyPage',
        tableWidth: pdfContentWidth,
        headStyles: {
            fillColor: lightPrimary,
            textColor: primaryColor,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        },
        styles: {
            fontSize: 8,
            fontStyle: 'bold',
            cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
            lineColor: lightGray,
            lineWidth: 0.3,
            textColor,
        },
        columnStyles: {
            0: { cellWidth: tableColumnWidths[0], halign: 'center', textColor: grayColor },
            1: { cellWidth: tableColumnWidths[1], halign: 'left' },
            2: { cellWidth: tableColumnWidths[2], halign: 'center', textColor: grayColor },
            3: { cellWidth: tableColumnWidths[3], halign: 'right', textColor: grayColor },
            4: { cellWidth: tableColumnWidths[4], halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (hookData) => {
            if (hookData.section === 'head') {
                hookData.cell.styles.halign = 'center';
            }
        },
        alternateRowStyles: { fillColor: [252, 252, 253] },
        margin: { left: pdfContentLeft, right: pageWidth - pdfContentRight, bottom: FOOTER_ZONE + 4 },
    });

    const mayShowPartialPayment =
        !isReceiptDoc &&
        !isQuotationDoc &&
        hasRecordedPayments(invoice) &&
        invoice.status !== 'paid';
    let currentY = ensureSpace(doc.lastAutoTable.finalY + 10, mayShowPartialPayment ? 72 : 48);
    const totalsX = 130;

    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    setPdfBodyFont(doc);
    doc.text('Subtotal', totalsX, currentY);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol}${formatMoney(invoice.subtotal)}`, 195, currentY, { align: 'right' });

    let totalsOffset = 7;
    if (Number(invoice.discount) > 0) {
        const discountLabel =
            invoice.discountType === 'percent' && invoice.discountValue
                ? `Discount (${invoice.discountValue}%)`
                : 'Discount';
        doc.setTextColor(...grayColor);
        doc.text(discountLabel, totalsX, currentY + totalsOffset);
        doc.setTextColor(220, 38, 38);
        doc.text(`-${currencySymbol}${formatMoney(invoice.discount)}`, 195, currentY + totalsOffset, {
            align: 'right',
        });
        totalsOffset += 7;
    }

    doc.setTextColor(...grayColor);
    doc.text(`Tax (${invoice.taxRate ?? 0}%)`, totalsX, currentY + totalsOffset);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol}${formatMoney(invoice.tax)}`, 195, currentY + totalsOffset, {
        align: 'right',
    });

    currentY += totalsOffset + 7;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY, 195, currentY);

    const amountPaidValue = getInvoiceAmountPaid(invoice);
    const balanceDueValue = getInvoiceBalanceDue(invoice);

    if (mayShowPartialPayment) {
        currentY += 8;
        doc.setFontSize(8);
        setPdfBodyFont(doc);
        doc.setTextColor(...grayColor);
        doc.text('Total', totalsX, currentY);
        doc.setTextColor(...textColor);
        doc.text(`${currencySymbol}${formatMoney(invoice.total)}`, 195, currentY, { align: 'right' });

        currentY += 7;
        doc.setTextColor(...grayColor);
        doc.text('Amount paid', totalsX, currentY);
        doc.setTextColor(...textColor);
        doc.text(`${currencySymbol}${formatMoney(amountPaidValue)}`, 195, currentY, {
            align: 'right',
        });

        currentY += 7;
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.4);
        doc.line(totalsX, currentY, 195, currentY);

        currentY += 8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text('BALANCE DUE', totalsX, currentY);
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(`${currencySymbol}${formatMoney(balanceDueValue)}`, 195, currentY, {
            align: 'right',
        });
    } else {
        currentY += 8;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        const totalLabel = isReceiptDoc
            ? 'TOTAL PAID'
            : isQuotationDoc
              ? 'ESTIMATED TOTAL'
              : 'TOTAL DUE';
        doc.text(totalLabel, totalsX, currentY);
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(`${currencySymbol}${formatMoney(invoice.total)}`, 195, currentY, { align: 'right' });
    }

    currentY = drawBottomBoxes(
        doc,
        businessInfo,
        invoice,
        currentY + 8,
        primaryColor,
        grayColor,
        textColor,
        lightGray,
        startNewPage,
        signatureBlockH,
        pageHeight,
        mode
    );

    const totalPages = doc.getNumberOfPages();
    doc.setPage(totalPages);
    const footerLineY = resolveFooterLineY({ pageHeight });

    try {
        await drawSignatureStampBlock(doc, {
            signatureUrl,
            stampUrl,
            ownerName: businessInfo.name,
            footerLineY,
            isReceiptDoc,
            pngCache,
            textColor,
            grayColor,
        });
    } catch {
        /* optional assets */
    }
    const footerLinkBounds = drawPageFooter(
        doc,
        businessInfo,
        premium,
        footerLineY,
        primaryColor,
        grayColor,
        mode
    );

    const filename = getPdfFileName(invoice, mode);
    let blob = doc.output('blob');
    if (!premium && footerLinkBounds) {
        blob = await addFooterLinkToPdfBlob(blob, {
            url: APP_WEBSITE_URL,
            linkBounds: footerLinkBounds,
        });
    }
    blob = await addPdfPreviewThumbnail(blob, invoice, client, businessInfo, mode);
    if (options.output === 'blob') {
        return { blob, filename };
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
