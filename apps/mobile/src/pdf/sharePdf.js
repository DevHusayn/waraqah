import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPdfFileName } from '@waraqah/shared';
import { buildInvoiceHtml } from './invoiceHtml';
import { buildStatementHtml } from './statementHtml';

async function shareHtmlAsPdf(html, filename) {
    const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
    }

    return uri;
}

export async function shareInvoicePdf(invoice, client, businessInfo, mode = 'auto') {
    const filename = getPdfFileName(invoice, mode);
    const html = buildInvoiceHtml(invoice, client, businessInfo, mode);
    return shareHtmlAsPdf(html, filename);
}

export async function shareStatementPdf(statement, businessInfo) {
    const slug = statement.periodLabel.replace(/\s+/g, '-').toLowerCase();
    const filename = `monthly-statement-${slug}.pdf`;
    const html = buildStatementHtml(statement, businessInfo);
    return shareHtmlAsPdf(html, filename);
}
