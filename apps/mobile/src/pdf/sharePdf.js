import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPdfFileName, getFreePdfFooterCta, isPremiumUser } from '@waraqah/shared';
import { APP_DOMAIN, APP_WEBSITE_URL } from '../constants/brand';
import { buildInvoiceHtml } from './invoiceHtml';
import { buildStatementHtml } from './statementHtml';
import { addFooterLinkToPdfFile } from './addFooterLink';

async function shareHtmlAsPdf(html, filename, { includeFooterLink = false } = {}) {
    const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
    });

    const pdfUri = includeFooterLink
        ? await addFooterLinkToPdfFile(uri, APP_WEBSITE_URL, getFreePdfFooterCta(APP_DOMAIN))
        : uri;

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
    }

    return pdfUri;
}

export async function shareInvoicePdf(invoice, client, businessInfo, mode = 'auto') {
    const filename = getPdfFileName(invoice, mode);
    const html = buildInvoiceHtml(invoice, client, businessInfo, mode);
    const premium = isPremiumUser(businessInfo);
    return shareHtmlAsPdf(html, filename, { includeFooterLink: !premium });
}

export async function shareStatementPdf(statement, businessInfo) {
    const slug = statement.periodLabel.replace(/\s+/g, '-').toLowerCase();
    const filename = `monthly-statement-${slug}.pdf`;
    const html = buildStatementHtml(statement, businessInfo);
    return shareHtmlAsPdf(html, filename);
}
