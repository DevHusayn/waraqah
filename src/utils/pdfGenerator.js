import { generatePdfWithTemplate } from './pdfTemplates/index';

export const generatePDF = generatePdfWithTemplate;

export async function generateInvoicePdfBlob(invoice, client, businessInfo, options = {}) {
    return generatePdfWithTemplate(invoice, client, businessInfo, { ...options, output: 'blob' });
}
