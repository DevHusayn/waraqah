import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPdfFileName, isPremiumUser, resolvePdfMode, ANALYTICS_EVENTS, PDF_ACTIONS, PDF_DOCUMENT_TYPES } from '@waraqah/shared';
import { buildInvoiceHtml } from './invoiceHtml';
import { buildQuotationHtml } from './quotationHtml';
import { buildStatementHtml } from './statementHtml';
import { stampLastPageFooter } from './stampLastPageFooter';
import { buildDocumentFooterConfig, buildStatementFooterConfig } from './footerConfig';
import { captureEvent } from '../monitoring/posthog';

function capturePdfDownloaded(documentType, action) {
    captureEvent(ANALYTICS_EVENTS.PDF_DOWNLOADED, {
        document_type: documentType,
        action,
    });
}

async function shareHtmlAsPdf(html, filename, { footer, includeFooterLink = false } = {}) {
    const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 1224,
        height: 1584,
    });

    return stampLastPageFooter(uri, footer, { includeFooterLink });
}

export async function shareInvoicePdf(invoice, client, businessInfo, mode = 'auto') {
    const filename = getPdfFileName(invoice, mode);
    const html = buildInvoiceHtml(invoice, client, businessInfo, mode);
    const resolvedMode = resolvePdfMode(invoice, mode);
    const footer = buildDocumentFooterConfig(
        businessInfo,
        resolvedMode === 'receipt' ? 'receipt' : 'invoice'
    );
    const premium = isPremiumUser(businessInfo);
    const pdfUri = await shareHtmlAsPdf(html, filename, {
        footer,
        includeFooterLink: !premium,
    });

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
        capturePdfDownloaded(
            resolvedMode === 'receipt' ? PDF_DOCUMENT_TYPES.RECEIPT : PDF_DOCUMENT_TYPES.INVOICE,
            PDF_ACTIONS.SHARE
        );
    }

    return pdfUri;
}

export async function shareQuotationPdf(quotation, client, businessInfo) {
    const filename = getPdfFileName(quotation, 'quotation');
    const html = buildQuotationHtml(quotation, client, businessInfo);
    const footer = buildDocumentFooterConfig(businessInfo, 'quotation');
    const premium = isPremiumUser(businessInfo);
    const pdfUri = await shareHtmlAsPdf(html, filename, {
        footer,
        includeFooterLink: !premium,
    });

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
        capturePdfDownloaded(PDF_DOCUMENT_TYPES.QUOTATION, PDF_ACTIONS.SHARE);
    }

    return pdfUri;
}

export async function shareStatementPdf(statement, businessInfo) {
    const slug = statement.periodLabel.replace(/\s+/g, '-').toLowerCase();
    const filename = `monthly-statement-${slug}.pdf`;
    const html = buildStatementHtml(statement, businessInfo);
    const footer = buildStatementFooterConfig(statement, businessInfo);
    const pdfUri = await shareHtmlAsPdf(html, filename, { footer });

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
        capturePdfDownloaded(PDF_DOCUMENT_TYPES.STATEMENT, PDF_ACTIONS.SHARE);
    }

    return pdfUri;
}
