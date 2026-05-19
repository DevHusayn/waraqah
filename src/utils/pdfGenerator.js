import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { getCurrencySymbol } from './currency';
import { getClientBusiness } from './clientHelpers';
import { isPremiumUser } from './premium';
import { drawPremiumLogoWatermark } from './pdfLogo';

export const generatePDF = async (invoice, client, businessInfo) => {
    try {
        if (!invoice || !client || !businessInfo) {
            throw new Error('Missing required data for PDF generation');
        }

        const doc = new jsPDF();

        if (isPremiumUser(businessInfo) && businessInfo.businessLogo) {
            try {
                await drawPremiumLogoWatermark(doc, businessInfo.businessLogo);
            } catch {
                /* continue without watermark if logo fails */
            }
        }

        // Get currency symbol (use 'NGN' for PDF, not ₦)
        const currencySymbol = getCurrencySymbol(false);
        const formatMoney = (value) =>
            Number(value || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        // Helper function to convert hex color to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16)
            ] : [14, 165, 233];
        };

        // Helper to lighten color
        const lightenColor = (rgb, percent) => {
            return rgb.map(c => Math.min(255, Math.round(c + (255 - c) * percent)));
        };

        // Colors
        const primaryColor = hexToRgb(businessInfo.brandColor || '#0ea5e9');
        const lightPrimary = lightenColor(primaryColor, 0.85);
        const textColor = [31, 41, 55];
        const grayColor = [107, 114, 128];
        const lightGray = [229, 231, 235];
        const whiteColor = [255, 255, 255];

        // ===== MODERN GEOMETRIC HEADER =====
        // Top accent stripe only (original design)
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 3, 'F');

        // Company info card - left side with subtle border
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(15, 12, 15, 50);

        doc.setTextColor(...textColor);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text(String(businessInfo.name || 'Your Business'), 22, 20);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grayColor);
        const businessAddress = doc.splitTextToSize(String(businessInfo.address || ''), 80);
        doc.text(businessAddress, 22, 28);

        const contactY = 28 + (businessAddress.length * 4);
        doc.text(String(businessInfo.email || ''), 22, contactY);
        doc.text(String(businessInfo.phone || ''), 22, contactY + 4);
        if (businessInfo.website) {
            doc.text(String(businessInfo.website), 22, contactY + 8);
        }

        // INVOICE title with modern styling - right side
        doc.setTextColor(...primaryColor);
        doc.setFontSize(38);
        doc.setFont(undefined, 'bold');
        doc.text('INVOICE', 195, 22, { align: 'right' });

        // Invoice number with accent box
        doc.setFillColor(...lightPrimary);
        doc.roundedRect(155, 28, 40, 12, 2, 2, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`#${String(invoice.invoiceNumber || 'INV')}`, 175, 35.5, { align: 'center' });

        // ===== BILLING & INVOICE INFO SECTION =====
        const infoStartY = 62;

        // Client info card with background
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

        // Invoice details card with background
        doc.setFillColor(...lightGray);
        doc.roundedRect(110, infoStartY, 85, 38, 3, 3, 'F');

        // Status badge at top of details card
        const statusColors = {
            paid: [34, 197, 94],
            pending: [234, 179, 8],
            overdue: [239, 68, 68],
            cancelled: [156, 163, 175],
        };

        doc.setFillColor(...(statusColors[invoice.status] || statusColors.pending));
        doc.roundedRect(165, infoStartY + 3, 26, 8, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...whiteColor);
        doc.text(invoice.status.toUpperCase(), 178, infoStartY + 8, { align: 'center' });

        // Date details
        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('ISSUE DATE', 115, infoStartY + 18);
        doc.text('DUE DATE', 115, infoStartY + 28);

        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const issueDate = invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A';
        const dueDate = invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A';
        doc.text(issueDate, 190, infoStartY + 18, { align: 'right' });
        doc.text(dueDate, 190, infoStartY + 28, { align: 'right' });

        // ===== ITEMS TABLE WITH MODERN DESIGN =====
        const tableStartY = 112;

        // Validate items array
        if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
            throw new Error('Invoice must have at least one item');
        }

        // Regular table only
        const tableHead = [['DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']];
        const tableData = invoice.items.map(item => [
            item.description || '',
            (item.quantity || 0).toString(),
            `${currencySymbol} ${formatMoney(item.rate)}`,
            `${currencySymbol} ${formatMoney(Number(item.quantity || 0) * Number(item.rate || 0))}`
        ]);
        const columnStyles = {
            0: { cellWidth: 85, halign: 'left', textColor: textColor },
            1: { cellWidth: 25, halign: 'center', textColor: grayColor },
            2: { cellWidth: 42, halign: 'center', textColor: grayColor },
            3: { cellWidth: 42, halign: 'center', fontStyle: 'bold', textColor: textColor },
        };

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
            columnStyles: columnStyles,
            alternateRowStyles: {
                fillColor: [252, 252, 253],
            },
            margin: { left: 15, right: 15 },
        });

        // ===== MODERN TOTALS SECTION =====
        const finalY = doc.lastAutoTable.finalY + 15;
        const totalsX = 130;


        // Subtotal
        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        doc.setFont(undefined, 'normal');
        doc.text('Subtotal', totalsX, finalY);
        doc.setTextColor(...textColor);
        doc.setFont(undefined, 'normal');
        const subtotalText = `${currencySymbol} ${formatMoney(invoice.subtotal)}`;
        doc.text(subtotalText, 195, finalY, { align: 'right' });

        // Tax
        doc.setTextColor(...grayColor);
        doc.text(`Tax (${invoice.taxRate || 10}%)`, totalsX, finalY + 8);
        doc.setTextColor(...textColor);
        const taxText = `${currencySymbol} ${formatMoney(invoice.tax)}`;
        doc.text(taxText, 195, finalY + 8, { align: 'right' });

        // Divider line with accent color
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(totalsX, finalY + 13, 195, finalY + 13);

        // Total - clean layout without background
        doc.setFontSize(10); // Decreased font size for total label
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...textColor);
        doc.text('Total', totalsX, finalY + 22);

        doc.setFontSize(11); // Decreased font size for total amount
        doc.setTextColor(...textColor);
        const totalAmountText = `${currencySymbol} ${formatMoney(invoice.total)}`;
        doc.text(totalAmountText, 195, finalY + 22, { align: 'right' });

        let currentY = finalY + 22;

        // Only show TOTAL DUE (no partial/amount paid/balance logic)
        let total = Number(invoice.total);
        if (isNaN(total) || total < 0) total = 0;

        currentY += 5;
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.line(totalsX, currentY, 195, currentY);

        currentY += 8;
        doc.setFontSize(10); // Decreased font size for TOTAL DUE label
        doc.setFont(undefined, 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('TOTAL DUE', totalsX, currentY);

        doc.setFontSize(11); // Decreased font size for TOTAL DUE amount
        doc.setTextColor(...primaryColor);
        const totalText = `${currencySymbol} ${formatMoney(total)}`;
        doc.text(totalText, 195, currentY, { align: 'right' });

        // ===== NOTES SECTION =====
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
        }

        // ===== MODERN FOOTER =====
        // Decorative line
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(1);
        doc.line(15, 278, 195, 278);

        doc.setTextColor(...grayColor);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('Thank you for your business!', 105, 285, { align: 'center' });

        doc.setFontSize(7);
        const footerText = `${String(businessInfo.name || 'Business')} • ${String(businessInfo.email || '')} • ${String(businessInfo.phone || '')}`;
        doc.text(footerText, 105, 290, { align: 'center' });

        // Bottom accent stripe
        doc.setFillColor(...primaryColor);
        doc.rect(0, 294, 210, 3, 'F');

        const fileName = `${String(invoice.invoiceNumber || 'invoice')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        throw error;
    }
}
