import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { format } from 'date-fns';
import { getCurrencySymbol } from './currency';
import { drawPdfGeometricBackground } from './pdfBackground';
import { PAGE_H } from './pdfLogo';
import { printPdfBlob } from './shareInvoicePdf';
import { ANALYTICS_EVENTS, PDF_ACTIONS, PDF_DOCUMENT_TYPES } from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';
import { ensurePdfFonts, PDF_FONT_FAMILY, setPdfFont } from './pdfFonts';

const FOOTER_RESERVE = 22;

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [2, 132, 199];
}

function formatMoney(value, currencySymbol) {
    return `${currencySymbol} ${Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

function statusLabel(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Apply halign to header/body/footer so labels line up with column data */
function applyColumnAlignment(data, alignments) {
    if (data.section !== 'head' && data.section !== 'body' && data.section !== 'foot') {
        return;
    }
    const halign = alignments[data.column.index] || 'left';
    data.cell.styles.halign = halign;
}

/**
 * @param {ReturnType<import('./monthlyStatement').buildMonthlyStatement>} statement
 * @param {object} businessInfo
 * @param {{ print?: boolean }} options
 */
export async function generateMonthlyStatementPdf(statement, businessInfo, options = {}) {
    const { print = false } = options;
    const doc = new jsPDF();
    await ensurePdfFonts(doc);
    setPdfFont(doc, 'normal');
    const primaryColor = hexToRgb(businessInfo?.brandColor || '#16A34A');
    const textColor = [31, 41, 55];
    const grayColor = [107, 114, 128];
    const currencySymbol = getCurrencySymbol(false);

    drawPdfGeometricBackground(doc);

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 3, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(20);
    setPdfFont(doc, 'bold');
    doc.text(String(businessInfo?.name || 'Your Business'), 15, 18);

    doc.setFontSize(9);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...grayColor);
    doc.text('Monthly billing statement', 15, 26);
    doc.text(`Period: ${statement.periodLabel}`, 15, 32);
    doc.text(`Generated: ${format(statement.generatedAt, 'MMM d, yyyy')}`, 15, 38);

    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    setPdfFont(doc, 'bold');
    doc.text('Statement summary', 15, 52);

    const summaryBody = [
        ['Paid', formatMoney(statement.totals.paid, currencySymbol)],
        ['Partial', formatMoney(statement.totals.partial, currencySymbol)],
        ['Pending', formatMoney(statement.totals.pending, currencySymbol)],
        ['Overdue', formatMoney(statement.totals.overdue, currencySymbol)],
        ['Cancelled', formatMoney(statement.totals.cancelled, currencySymbol)],
        ['Total billed', formatMoney(statement.totals.total, currencySymbol)],
        ['Documents in period', String(statement.totals.documentCount)],
    ];

    autoTable(doc, {
        startY: 56,
        head: [['Category', 'Amount']],
        body: summaryBody,
        theme: 'plain',
        tableWidth: 180,
        styles: { font: PDF_FONT_FAMILY, fontSize: 9, cellPadding: 3 },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            font: PDF_FONT_FAMILY,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 55, halign: 'left' },
            1: { cellWidth: 125, halign: 'right' },
        },
        didParseCell: (data) => applyColumnAlignment(data, ['left', 'right']),
        margin: { left: 15, right: 15, bottom: FOOTER_RESERVE + 4 },
    });

    let tableY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    setPdfFont(doc, 'bold');
    doc.text('By client', 15, tableY);

    if (!statement.hasData) {
        doc.setFontSize(9);
        setPdfFont(doc, 'normal');
        doc.setTextColor(...grayColor);
        doc.text('No documents were issued during this period.', 15, tableY + 8);
    } else {
        const tableHead = [
            'Client',
            'Paid',
            'Partial',
            'Pending',
            'Overdue',
            'Cancelled',
            'Total',
        ];

        const tableBody = statement.rows.map((row) => [
            row.clientSubtitle
                ? `${row.clientName}\n${row.clientSubtitle}`
                : row.clientName,
            formatMoney(row.paid, currencySymbol),
            formatMoney(row.partial, currencySymbol),
            formatMoney(row.pending, currencySymbol),
            formatMoney(row.overdue, currencySymbol),
            formatMoney(row.cancelled, currencySymbol),
            formatMoney(row.total, currencySymbol),
        ]);

        const footRow = [
            'Total',
            formatMoney(statement.totals.paid, currencySymbol),
            formatMoney(statement.totals.partial, currencySymbol),
            formatMoney(statement.totals.pending, currencySymbol),
            formatMoney(statement.totals.overdue, currencySymbol),
            formatMoney(statement.totals.cancelled, currencySymbol),
            formatMoney(statement.totals.total, currencySymbol),
        ];

        const clientAlign = ['left', 'center', 'center', 'center', 'center', 'center', 'center'];

        autoTable(doc, {
            startY: tableY + 4,
            head: [tableHead],
            body: tableBody,
            foot: [footRow],
            showFoot: 'lastPage',
            theme: 'striped',
            tableWidth: 180,
            styles: { font: PDF_FONT_FAMILY, fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                font: PDF_FONT_FAMILY,
                fontStyle: 'bold',
            },
            footStyles: {
                fillColor: [241, 245, 249],
                textColor: textColor,
                font: PDF_FONT_FAMILY,
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 36, halign: 'left' },
                1: { cellWidth: 24, halign: 'center' },
                2: { cellWidth: 24, halign: 'center' },
                3: { cellWidth: 24, halign: 'center' },
                4: { cellWidth: 24, halign: 'center' },
                5: { cellWidth: 24, halign: 'center' },
                6: { cellWidth: 24, halign: 'center' },
            },
            didParseCell: (data) => applyColumnAlignment(data, clientAlign),
            margin: { left: 15, right: 15, bottom: FOOTER_RESERVE + 4 },
        });

        tableY = doc.lastAutoTable.finalY;
    }

    doc.setPage(doc.getNumberOfPages());
    const footerLineY = PAGE_H - FOOTER_RESERVE;

    doc.setDrawColor(229, 231, 235);
    doc.line(15, footerLineY - 4, 195, footerLineY - 4);
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text(
        `Amounts grouped by document status for ${statement.periodLabel}. Issue dates determine the billing period.`,
        105,
        footerLineY + 2,
        { align: 'center', maxWidth: 170 }
    );
    doc.text(
        `${businessInfo?.name || ''} · ${businessInfo?.email || ''}`,
        105,
        footerLineY + 7,
        { align: 'center' }
    );

    doc.setFillColor(...primaryColor);
    doc.rect(0, 294, 210, 3, 'F');

    const slug = statement.periodLabel.replace(/\s+/g, '-').toLowerCase();
    const fileName = `monthly-statement-${slug}.pdf`;
    const blob = doc.output('blob');

    if (print) {
        await printPdfBlob(blob);
    } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
        captureEvent(ANALYTICS_EVENTS.PDF_DOWNLOADED, {
            document_type: PDF_DOCUMENT_TYPES.STATEMENT,
            action: PDF_ACTIONS.DOWNLOAD,
        });
    }
}

export { statusLabel };
