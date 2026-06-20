import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCurrencySymbol } from './currency';
import { getClientBusiness } from './clientHelpers';
import { isPremiumUser } from './premium';
import {
    drawHeaderLogo,
    drawAuthorizedSignature,
    drawCompanyStamp,
    PAGE_H,
    PAGE_W,
} from './pdfLogo';
import { drawPdfGeometricBackground } from './pdfBackground';
import {
    getCompanyLogoUrl,
    getCompanyStampUrl,
    getAuthorizedSignatureUrl,
} from './brandAssets';
import {
    getDocumentNumber,
    getPaymentMethodLabel,
    getPdfFileName,
    resolvePdfMode,
} from './receiptHelpers';

export const generatePDF = async (invoice, client, businessInfo, options = {}) => {
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

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
            : [14, 165, 233];
    };

    const lightenColor = (rgb, percent) =>
        rgb.map((c) => Math.min(255, Math.round(c + (255 - c) * percent)));

    const primaryColor = hexToRgb(businessInfo.brandColor || '#0ea5e9');
    const lightPrimary = lightenColor(primaryColor, 0.85);
    const textColor = [31, 41, 55];
    const grayColor = [107, 114, 128];
    const lightGray = [229, 231, 235];
    const whiteColor = [255, 255, 255];
    const currencySymbol = getCurrencySymbol(false);

    drawPdfGeometricBackground(doc);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const docNumber = getDocumentNumber(invoice, mode) || (isReceiptDoc ? 'RCP' : 'INV');

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 3, 'F');

    const HEADER_LEFT = 22;
    const NAME_Y = 20;
    const ACCENT_X = 15;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);

    let logoDims = null;
    let detailsStartY = 28;

    if (logoUrl) {
        try {
            logoDims = await drawHeaderLogo(doc, logoUrl, pngCache, {
                x: HEADER_LEFT,
                nameBaselineY: NAME_Y,
                maxW: 28,
                maxH: 14,
            });
        } catch {
            logoDims = null;
        }
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');

    if (logoDims?.width) {
        doc.text(
            String(businessInfo.name || 'Your Business'),
            HEADER_LEFT + logoDims.width + 4,
            NAME_Y
        );
        detailsStartY = logoDims.y + logoDims.height + 4;
    } else {
        doc.text(String(businessInfo.name || 'Your Business'), HEADER_LEFT, NAME_Y);
        detailsStartY = 28;
    }

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...grayColor);
    const businessAddress = doc.splitTextToSize(String(businessInfo.address || ''), 92);
    doc.text(businessAddress, HEADER_LEFT, detailsStartY);

    const contactY = detailsStartY + businessAddress.length * 4;
    doc.text(String(businessInfo.email || ''), HEADER_LEFT, contactY);
    doc.text(String(businessInfo.phone || ''), HEADER_LEFT, contactY + 4);
    let headerBottomY = contactY + 4;
    if (businessInfo.website) {
        doc.text(String(businessInfo.website), HEADER_LEFT, contactY + 8);
        headerBottomY = contactY + 8;
    }

    doc.line(ACCENT_X, 12, ACCENT_X, Math.min(headerBottomY + 5, 56));

    doc.setTextColor(...primaryColor);
    doc.setFontSize(isReceiptDoc ? 34 : 38);
    doc.setFont(undefined, 'bold');
    doc.text(isReceiptDoc ? 'RECEIPT' : 'INVOICE', 195, 22, { align: 'right' });

    doc.setFillColor(...lightPrimary);
    doc.roundedRect(155, 28, 40, 12, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`#${String(docNumber)}`, 175, 35.5, { align: 'center' });

    const infoStartY = Math.max(62, headerBottomY + 14);

    doc.setFillColor(...lightGray);
    doc.roundedRect(15, infoStartY, 85, 38, 3, 3, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('BILLED TO', 20, infoStartY + 6);

    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(String(client.name || 'Client'), 20, infoStartY + 13);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...grayColor);
    doc.text(String(getClientBusiness(client) || ''), 20, infoStartY + 19);
    doc.text(String(client.email || ''), 20, infoStartY + 24);
    if (client.phone) {
        doc.text(String(client.phone), 20, infoStartY + 29);
    }

    const detailsHeight = isReceiptDoc ? 46 : 38;
    doc.setFillColor(...lightGray);
    doc.roundedRect(110, infoStartY, 85, detailsHeight, 3, 3, 'F');

    const statusColors = {
        paid: [34, 197, 94],
        pending: [234, 179, 8],
        overdue: [239, 68, 68],
        cancelled: [156, 163, 175],
    };

    const badgeStatus = isReceiptDoc ? 'paid' : invoice.status;
    doc.setFillColor(...(statusColors[badgeStatus] || statusColors.pending));
    doc.roundedRect(165, infoStartY + 3, 26, 8, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...whiteColor);
    doc.text(
        isReceiptDoc ? 'PAID' : (invoice.status || 'pending').toUpperCase(),
        178,
        infoStartY + 8,
        { align: 'center' }
    );

    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('ISSUE DATE', 115, infoStartY + 18);

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const issueDate = invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A';
    doc.text(issueDate, 190, infoStartY + 18, { align: 'right' });

    if (isReceiptDoc) {
        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('PAYMENT DATE', 115, infoStartY + 28);
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const paymentDate = invoice.datePaid
            ? format(new Date(invoice.datePaid), 'MMM dd, yyyy')
            : issueDate;
        doc.text(paymentDate, 190, infoStartY + 28, { align: 'right' });

        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('PAYMENT METHOD', 115, infoStartY + 38);
        doc.setTextColor(...textColor);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(getPaymentMethodLabel(invoice.paymentMethod), 190, infoStartY + 38, { align: 'right' });
    } else {
        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('DUE DATE', 115, infoStartY + 28);
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A';
        doc.text(dueDate, 190, infoStartY + 28, { align: 'right' });
    }

    const footerLineY = PAGE_H - 22;
    const signatureReserve = signatureUrl ? 18 : 0;
    const stampReserve = isReceiptDoc && stampUrl ? 28 : 0;
    const assetZoneHeight = Math.max(signatureReserve, stampReserve);
    const FOOTER_ZONE = 22 + assetZoneHeight + 6;
    const CONTENT_BOTTOM = PAGE_H - FOOTER_ZONE;
    const LINE_HEIGHT = 4;

    const drawPageTopBar = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 3, 'F');
    };

    const startNewPage = () => {
        doc.addPage();
        drawPdfGeometricBackground(doc);
        drawPageTopBar();
        return 20;
    };

    const ensureSpace = (currentY, neededHeight) => {
        if (currentY + neededHeight > CONTENT_BOTTOM) {
            return startNewPage();
        }
        return currentY;
    };

    const tableStartY = 112;

    if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
        throw new Error('Invoice must have at least one item');
    }

    const tableHead = [['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']];
    const tableData = invoice.items.map((item) => [
        item.description || '',
        (item.quantity || 0).toString(),
        `${currencySymbol} ${formatMoney(item.rate)}`,
        `${currencySymbol} ${formatMoney(Number(item.quantity || 0) * Number(item.rate || 0))}`,
    ]);

    doc.autoTable({
        startY: tableStartY,
        head: tableHead,
        body: tableData,
        theme: 'plain',
        showHead: 'everyPage',
        headStyles: {
            fillColor: primaryColor,
            textColor: whiteColor,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
        },
        styles: {
            fontSize: 9,
            cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
            lineColor: lightGray,
            lineWidth: 0.5,
        },
        columnStyles: {
            0: { cellWidth: 85, halign: 'left', textColor: textColor },
            1: { cellWidth: 25, halign: 'center', textColor: grayColor },
            2: { cellWidth: 42, halign: 'center', textColor: grayColor },
            3: { cellWidth: 42, halign: 'center', fontStyle: 'bold', textColor: textColor },
        },
        alternateRowStyles: { fillColor: [252, 252, 253] },
        margin: { left: 15, right: 15, bottom: FOOTER_ZONE + 4 },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                drawPageTopBar();
            }
        },
    });

    let currentY = ensureSpace(doc.lastAutoTable.finalY + 15, 52);
    const totalsX = 130;

    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal', totalsX, currentY);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol} ${formatMoney(invoice.subtotal)}`, 195, currentY, { align: 'right' });

    doc.setTextColor(...grayColor);
    doc.text(`Tax (${invoice.taxRate || 10}%)`, totalsX, currentY + 8);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol} ${formatMoney(invoice.tax)}`, 195, currentY + 8, { align: 'right' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(totalsX, currentY + 13, 195, currentY + 13);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text('Total', totalsX, currentY + 22);
    doc.setFontSize(11);
    doc.text(`${currencySymbol} ${formatMoney(invoice.total)}`, 195, currentY + 22, { align: 'right' });

    currentY += 22;
    let total = Number(invoice.total);
    if (isNaN(total) || total < 0) total = 0;

    currentY += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY, 195, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(isReceiptDoc ? 'TOTAL PAID' : 'TOTAL DUE', totalsX, currentY);
    doc.setFontSize(11);
    doc.text(`${currencySymbol} ${formatMoney(total)}`, 195, currentY, { align: 'right' });

    if (invoice.notes) {
        const splitNotes = doc.splitTextToSize(String(invoice.notes), 175);
        const notesBlockHeight = 20 + splitNotes.length * LINE_HEIGHT;
        currentY = ensureSpace(currentY + 16, notesBlockHeight);

        const notesY = currentY + 4;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(15, notesY, 25, notesY);
        doc.setTextColor(...primaryColor);
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('NOTES', 15, notesY + 6);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);

        let noteLineY = notesY + 12;
        for (const line of splitNotes) {
            if (noteLineY + LINE_HEIGHT > CONTENT_BOTTOM) {
                currentY = startNewPage();
                noteLineY = currentY;
            }
            doc.text(line, 15, noteLineY);
            noteLineY += LINE_HEIGHT;
        }
        currentY = noteLineY;
    }

    const signatureY = footerLineY - signatureReserve - 4;
    const stampY = footerLineY - stampReserve - 2;

    try {
        if (signatureUrl) {
            await drawAuthorizedSignature(doc, signatureUrl, signatureY, pngCache, {
                x: 22,
                maxW: 50,
                maxH: 13,
            });
        }
        if (isReceiptDoc && stampUrl) {
            await drawCompanyStamp(doc, stampUrl, stampY, pngCache, {
                x: PAGE_W - 48,
                maxW: 32,
                maxH: 32,
                rotation: -10,
                opacity: 0.92,
            });
        }
    } catch {
        /* continue without stamp/signature if assets fail */
    }

    doc.setPage(doc.getNumberOfPages());
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(1);
    doc.line(15, footerLineY, 195, footerLineY);

    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(
        isReceiptDoc ? 'Payment received. Thank you!' : 'Thank you for your business!',
        105,
        footerLineY + 7,
        { align: 'center' }
    );

    doc.setFontSize(7);
    doc.text(
        `${String(businessInfo.name || 'Business')} • ${String(businessInfo.email || '')} • ${String(businessInfo.phone || '')}`,
        105,
        footerLineY + 12,
        { align: 'center' }
    );

    doc.setFillColor(...primaryColor);
    doc.rect(0, PAGE_H - 3, 210, 3, 'F');

    doc.save(getPdfFileName(invoice, mode));
};
