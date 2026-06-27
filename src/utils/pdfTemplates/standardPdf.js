import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { APP_NAME } from '../../constants/brand';
import { getCurrencySymbol } from '../currency';
import { getClientBusiness } from '../clientHelpers';
import { isPremiumUser } from '../premium';
import {
    drawAuthorizedSignature,
    drawCompanyStamp,
    drawHeaderLogo,
    drawPaidStamp,
    PAGE_H,
    PAGE_W,
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

function drawStatusBadge(doc, status, x, y, primaryColor) {
    const statusColors = {
        paid: [34, 197, 94],
        pending: [234, 179, 8],
        overdue: [239, 68, 68],
        cancelled: [156, 163, 175],
    };
    const label = (status || 'pending').toUpperCase();
    const color = statusColors[status] || statusColors.pending;
    doc.setFillColor(...color);
    doc.roundedRect(x - 22, y - 4, 24, 7, 1.5, 1.5, 'F');
    doc.setFontSize(6.5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(label, x - 10, y + 0.5, { align: 'center' });
}

function drawInvoiceTitleBlock(doc, docNumber, isReceiptDoc, primaryColor, lightPrimary, textColor) {
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text(isReceiptDoc ? 'RECEIPT' : 'INVOICE', 195, 20, { align: 'right' });

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
    isReceiptDoc,
    y,
    primaryColor,
    textColor,
    grayColor,
    lightPrimary
) {
    const detailsHeight = isReceiptDoc ? 46 : 38;
    const boxH = Math.max(36, detailsHeight);

    doc.setFillColor(...lightPrimary);
    doc.roundedRect(15, y, 88, boxH, 2, 2, 'F');
    doc.roundedRect(107, y, 88, boxH, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('BILL TO', 19, y + 6);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text(String(client.name || 'Client'), 19, y + 13);

    doc.setFontSize(8);
    setPdfBodyFont(doc);
    doc.setTextColor(...grayColor);
    let billY = y + 18;
    const business = getClientBusiness(client);
    if (business) {
        doc.text(String(business), 19, billY);
        billY += 3.8;
    }
    if (client.email) {
        doc.text(String(client.email), 19, billY);
        billY += 3.8;
    }
    if (client.phone) {
        doc.text(String(client.phone), 19, billY);
        billY += 3.8;
    }
    if (client.address) {
        const addressLines = doc.splitTextToSize(String(client.address), 80);
        doc.text(addressLines, 19, billY);
    }

    const badgeStatus = isReceiptDoc ? 'paid' : invoice.status;
    drawStatusBadge(doc, badgeStatus, 188, y + 8, primaryColor);

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
    } else {
        const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A';
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...grayColor);
        doc.text('DUE DATE', 111, y + 28);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text(dueDate, 190, y + 28, { align: 'right' });
    }

    return y + boxH + 8;
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
    ensureSpace,
    isReceiptDoc
) {
    const hasPayment = !isReceiptDoc && hasPaymentDetails(businessInfo);
    const notesText = invoice.notes?.trim() || '';
    const hasNotes = Boolean(notesText);

    if (!hasPayment && !hasNotes) {
        return startY;
    }

    const notesLines = hasNotes ? doc.splitTextToSize(notesText, hasPayment ? 78 : 168) : [];
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

    const boxH = Math.max(
        28,
        hasPayment ? 16 + paymentLines.length * 4 : 0,
        hasNotes ? 16 + notesLines.length * 3.8 : 0
    );
    let y = ensureSpace(startY, boxH + 8);

    if (hasPayment) {
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.4);
        doc.roundedRect(15, y, 88, boxH, 2, 2, 'S');

        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('PAYMENT INFORMATION', 19, y + 7);

        doc.setFontSize(7.5);
        setPdfBodyFont(doc);
        doc.setTextColor(...grayColor);
        let py = y + 13;
        for (const line of paymentLines) {
            doc.text(line, 19, py);
            py += 4;
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

    return y + boxH + 6;
}

function drawPageFooter(doc, businessInfo, premium, footerY, primaryColor, grayColor) {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 4, 195, footerY - 4);

    doc.setFontSize(8);
    setPdfBodyFont(doc);

    if (premium) {
        doc.setTextColor(...grayColor);
        doc.text(
            `Thank you for doing business with ${String(businessInfo.name || 'us')}.`,
            105,
            footerY + 2,
            { align: 'center' }
        );
    } else {
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text(`Powered by ${APP_NAME}`, 105, footerY + 1, { align: 'center' });
        setPdfBodyFont(doc);
        doc.setFontSize(7);
        doc.setTextColor(...grayColor);
        doc.text('Professional invoicing for businesses', 105, footerY + 5.5, { align: 'center' });
    }
}

export async function generateStandardPdf(invoice, client, businessInfo, options = {}) {
    const mode = resolvePdfMode(invoice, options.mode);
    const isReceiptDoc = mode === 'receipt';

    if (!invoice || !client || !businessInfo) {
        throw new Error('Missing required data for PDF generation');
    }

    const doc = new jsPDF();
    const premium = isPremiumUser(businessInfo);
    const logoUrl = premium ? getCompanyLogoUrl(businessInfo) : '';
    const stampUrl = premium ? getCompanyStampUrl(businessInfo) : '';
    const signatureUrl = premium ? getAuthorizedSignatureUrl(businessInfo) : '';
    const pngCache = new Map();

    const primaryColor = hexToRgb(businessInfo.brandColor || '#0ea5e9');
    const lightPrimary = lightenColor(primaryColor, 0.88);
    const textColor = [31, 41, 55];
    const grayColor = [107, 114, 128];
    const lightGray = [229, 231, 235];
    const whiteColor = [255, 255, 255];
    const currencySymbol = getCurrencySymbol(false);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const docNumber = getDocumentNumber(invoice, mode) || (isReceiptDoc ? 'RCP' : 'INV');
    const footerReserve = 18;
    const signatureReserve = signatureUrl ? 16 : 0;
    const stampReserve = isReceiptDoc && stampUrl ? 26 : 0;
    const assetZone = Math.max(signatureReserve, stampReserve);
    const FOOTER_ZONE = footerReserve + assetZone + 8;
    const CONTENT_BOTTOM = PAGE_H - FOOTER_ZONE;
    const LINE_HEIGHT = 3.8;

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

    drawInvoiceTitleBlock(doc, docNumber, isReceiptDoc, primaryColor, lightPrimary, textColor);

    const partyY = headerBottom + 8;
    const tableStartY = drawBillToAndDetails(
        doc,
        client,
        invoice,
        isReceiptDoc,
        partyY,
        primaryColor,
        textColor,
        grayColor,
        lightPrimary
    );

    if (!invoice.items?.length) {
        throw new Error('Invoice must have at least one item');
    }

    const tableData = invoice.items.map((item, index) => [
        String(index + 1),
        item.description || '',
        (item.quantity || 0).toString(),
        `${currencySymbol}${formatMoney(item.rate)}`,
        `${currencySymbol}${formatMoney(Number(item.quantity || 0) * Number(item.rate || 0))}`,
    ]);

    const tableColumnWidths = {
        0: 10,
        1: 76,
        2: 16,
        3: 38,
        4: 38,
    };
    const pdfContentLeft = 15;
    const pdfContentWidth = 180;
    const pdfContentRight = pdfContentLeft + pdfContentWidth;

    doc.autoTable({
        startY: tableStartY,
        head: [['#', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
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
        margin: { left: pdfContentLeft, right: PAGE_W - pdfContentRight, bottom: FOOTER_ZONE + 4 },
    });

    let currentY = ensureSpace(doc.lastAutoTable.finalY + 10, 48);
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

    currentY += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text(isReceiptDoc ? 'TOTAL PAID' : 'TOTAL DUE', totalsX, currentY);
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(`${currencySymbol}${formatMoney(invoice.total)}`, 195, currentY, { align: 'right' });

    currentY = drawBottomBoxes(
        doc,
        businessInfo,
        invoice,
        currentY + 12,
        primaryColor,
        grayColor,
        textColor,
        lightGray,
        ensureSpace,
        isReceiptDoc
    );

    const footerLineY = PAGE_H - footerReserve;
    const signatureY = footerLineY - signatureReserve - 2;
    const stampY = footerLineY - stampReserve;

    if (isReceiptDoc) {
        const pageCount = doc.getNumberOfPages();
        for (let page = 1; page <= pageCount; page += 1) {
            doc.setPage(page);
            drawPaidStamp(doc);
        }
        doc.setPage(pageCount);
    }

    try {
        if (signatureUrl) {
            await drawAuthorizedSignature(doc, signatureUrl, signatureY, pngCache, {
                x: 18,
                maxW: 48,
                maxH: 12,
            });
        }
        if (isReceiptDoc && stampUrl) {
            await drawCompanyStamp(doc, stampUrl, stampY, pngCache, {
                x: PAGE_W - 46,
                maxW: 30,
                maxH: 30,
                rotation: -8,
                opacity: 0.92,
            });
        }
    } catch {
        /* optional assets */
    }

    doc.setPage(doc.getNumberOfPages());
    drawPageFooter(doc, businessInfo, premium, footerLineY, primaryColor, grayColor);

    const filename = getPdfFileName(invoice, mode);
    if (options.output === 'blob') {
        return { blob: doc.output('blob'), filename };
    }
    doc.save(filename);
}
