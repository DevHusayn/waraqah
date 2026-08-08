/**
 * Generate invoice/receipt PDFs on the public invoice page using the same template as the app.
 */

import { downloadPdfBlob, printPdfBlob } from './shareInvoicePdf';
import { PDF_DOCUMENT_TYPES } from '@waraqah/shared';

export { printPdfBlob };

export function resolvePublicPdfMode(showReceipt) {
    return showReceipt ? 'receipt' : 'invoice';
}

export async function generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const mode = resolvePublicPdfMode(showReceipt);
    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    return generateInvoicePdfBlob(invoice, client, businessInfo, { mode, output: 'blob' });
}

export async function loadPublicInvoicePdfBundle(invoice, client, businessInfo, showReceipt) {
    const { blob, filename } = await generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt);
    return {
        blob,
        filename,
        url: URL.createObjectURL(blob),
    };
}

export function revokePublicInvoicePdfBundle(bundle) {
    if (bundle?.url) {
        URL.revokeObjectURL(bundle.url);
    }
}

export async function downloadPublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const { blob, filename } = await generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt);
    downloadPdfBlob(blob, filename, {
        documentType: showReceipt ? PDF_DOCUMENT_TYPES.RECEIPT : PDF_DOCUMENT_TYPES.INVOICE,
    });
}

export async function downloadPublicInvoicePdfBundle(bundle, { showReceipt = false } = {}) {
    if (!bundle?.blob || !bundle?.filename) {
        throw new Error('PDF is not ready yet.');
    }
    downloadPdfBlob(bundle.blob, bundle.filename, {
        documentType: showReceipt ? PDF_DOCUMENT_TYPES.RECEIPT : PDF_DOCUMENT_TYPES.INVOICE,
    });
}

export async function printPublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const { blob } = await generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt);
    await printPdfBlob(blob);
}

export async function printPublicInvoicePdfBundle(bundle) {
    if (!bundle?.blob) {
        throw new Error('PDF is not ready yet.');
    }
    await printPdfBlob(bundle.blob);
}
