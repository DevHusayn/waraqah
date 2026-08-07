import {
    INV_PREFIX,
    RCP_PREFIX,
    QTN_PREFIX,
    extractDocumentSequence,
    isQuotationDocument,
    getQuotationDisplayNumber,
} from './documentHelpers.js';
import { getInvoiceAmountPaid } from './invoicePayments.js';

export { INV_PREFIX, RCP_PREFIX, QTN_PREFIX, extractDocumentSequence };

const MONEY_EPS = 0.009;

export function receiptFromInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber) return '';
    const seq = extractDocumentSequence(invoiceNumber);
    if (seq > 0) {
        return `${RCP_PREFIX}-${String(seq).padStart(4, '0')}`;
    }
    return '';
}

export const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card / POS' },
    { value: 'pos', label: 'POS' },
    { value: 'online_gateway', label: 'Online Gateway' },
];

export const MARK_PAID_METHODS = PAYMENT_METHODS.filter((m) =>
    ['bank_transfer', 'cash', 'card'].includes(m.value)
);

export function isReceiptOnly(doc) {
    return doc?.documentType === 'receipt';
}

/** Standalone receipt where amount received is less than the line-item total. */
export function isPartialReceipt(doc) {
    if (!isReceiptOnly(doc)) return false;
    const total = Number(doc?.total) || 0;
    if (total <= 0) return false;
    const paid = getInvoiceAmountPaid(doc);
    return paid > 0 && total - paid > MONEY_EPS;
}

/** UI/PDF badge status for standalone receipts (paid vs partial). */
export function getReceiptDisplayStatus(doc) {
    if (!doc) return 'paid';
    if (doc.status === 'draft') return 'draft';
    if (isPartialReceipt(doc)) return 'partial';
    return doc.status === 'paid' ? 'paid' : doc.status || 'paid';
}

export function isReceipt(invoice) {
    return isReceiptOnly(invoice) || invoice?.status === 'paid';
}

export function getPaymentMethodLabel(method) {
    if (!method) return 'Not specified';
    const found = PAYMENT_METHODS.find((m) => m.value === method);
    return found ? found.label : method;
}

export function getReceiptNumber(invoice) {
    if (!invoice) return '';
    return invoice.receiptNumber || receiptFromInvoiceNumber(invoice.invoiceNumber);
}

export function getDisplayNumber(doc) {
    if (!doc) return '';
    if (isQuotationDocument(doc)) return getQuotationDisplayNumber(doc);
    if (isReceiptOnly(doc)) return getReceiptNumber(doc);
    return doc.invoiceNumber || '';
}

export function getDocumentNumber(doc, mode = 'auto') {
    if (!doc) return '';
    const resolved = resolvePdfMode(doc, mode);
    if (resolved === 'quotation') {
        return getQuotationDisplayNumber(doc) || '';
    }
    if (resolved === 'receipt') {
        return getReceiptNumber(doc) || doc.invoiceNumber || '';
    }
    return doc.invoiceNumber || '';
}

export function getDocumentTypeLabel(doc, mode = 'auto') {
    const resolved = resolvePdfMode(doc, mode);
    if (resolved === 'quotation') return 'Quotation';
    if (resolved === 'receipt') return 'Receipt';
    return 'Invoice';
}

export function getPdfFileName(doc, mode = 'auto') {
    const num = getDocumentNumber(doc, mode) || 'document';
    return `${num}.pdf`;
}

export function resolvePdfMode(doc, mode = 'auto') {
    if (mode === 'invoice' || mode === 'receipt' || mode === 'quotation') return mode;
    if (isQuotationDocument(doc)) return 'quotation';
    if (isReceiptOnly(doc)) return 'receipt';
    return isReceipt(doc) ? 'receipt' : 'invoice';
}

export function getDownloadLabel(doc, mode = 'auto') {
    const resolved = resolvePdfMode(doc, mode);
    if (resolved === 'quotation') return 'Download quotation';
    if (resolved === 'receipt') return 'Download receipt';
    return 'Download invoice';
}
