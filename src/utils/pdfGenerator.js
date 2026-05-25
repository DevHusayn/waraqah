import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCurrencySymbol } from './currency';
import { getClientBusiness } from './clientHelpers';
import { isPremiumUser } from './premium';
import {
    drawPremiumLogoWatermark,
    drawHeaderLogo,
    drawAuthorizedSignature,
    drawCompanyStamp,
} from './pdfLogo';
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

    if (logoUrl) {
        try {
            await drawPremiumLogoWatermark(doc, logoUrl, pngCache);
        } catch {
            /* continue without watermark if logo fails */
        }
    }

    const currencySymbol = getCurrencySymbol(false);
    const formatMoney = (value) =>
        Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

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
    const docNumber = getDocumentNumber(invoice, mode) || (isReceiptDoc ? 'RCP' : 'INV');

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 3, 'F');

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(15, 12, 15, 50);

    let headerTextX = 22;
    if (logoUrl) {
        try {
            const logoDims = await drawHeaderLogo(doc, logoUrl, pngCache);
            if (logoDims.width) {
                headerTextX = 15 + logoDims.width + 6;
            }
        } catch {
            /* header text falls back to default position */
        }
    }

    doc.setTextColor(...textColor);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(String(businessInfo.name || 'Your Business'), headerTextX, 20);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...grayColor);
    const businessAddress = doc.splitTextToSize(String(businessInfo.address || ''), 80);
    doc.text(businessAddress, headerTextX, 28);

    const contactY = 28 + businessAddress.length * 4;
    doc.text(String(businessInfo.email || ''), headerTextX, contactY);
    doc.text(String(businessInfo.phone || ''), headerTextX, contactY + 4);
    if (businessInfo.website) {
        doc.text(String(businessInfo.website), headerTextX, contactY + 8);
    }

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

    const infoStartY = 62;

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
        margin: { left: 15, right: 15 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    const totalsX = 130;

    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal', totalsX, finalY);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol} ${formatMoney(invoice.subtotal)}`, 195, finalY, { align: 'right' });

    doc.setTextColor(...grayColor);
    doc.text(`Tax (${invoice.taxRate || 10}%)`, totalsX, finalY + 8);
    doc.setTextColor(...textColor);
    doc.text(`${currencySymbol} ${formatMoney(invoice.tax)}`, 195, finalY + 8, { align: 'right' });

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(totalsX, finalY + 13, 195, finalY + 13);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...textColor);
    doc.text('Total', totalsX, finalY + 22);
    doc.setFontSize(11);
    doc.text(`${currencySymbol} ${formatMoney(invoice.total)}`, 195, finalY + 22, { align: 'right' });

    let currentY = finalY + 22;
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

    let contentEndY = currentY;
    if (invoice.notes) {
        const notesY = currentY + 20;
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
        const splitNotes = doc.splitTextToSize(invoice.notes, 175);
        doc.text(splitNotes, 15, notesY + 12);
        contentEndY = notesY + 12 + splitNotes.length * 4;
    }

    const footerLineY = Math.min(Math.max(contentEndY + 16, 268), 278);

    try {
        if (signatureUrl) {
            await drawAuthorizedSignature(doc, signatureUrl, footerLineY - 18, pngCache);
        }
        if (isReceiptDoc && stampUrl) {
            await drawCompanyStamp(doc, stampUrl, footerLineY - 22, pngCache);
        }
    } catch {
        /* continue without stamp/signature if assets fail */
    }

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
    doc.rect(0, footerLineY + 16, 210, 3, 'F');

    doc.save(getPdfFileName(invoice, mode));
};
