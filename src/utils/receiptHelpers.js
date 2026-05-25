const INV_PREFIX = 'INV';
const RCP_PREFIX = 'RCP';

export function extractDocumentSequence(raw) {
    const match = String(raw || '').match(/^(?:INV|RCP)-(\d+)$/i);
    return match ? parseInt(match[1], 10) : 0;
}

/** RCP-0001 from INV-0001 — same sequence number as the invoice. */
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

export function isReceipt(invoice) {
    return invoice?.status === 'paid';
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

export function getDisplayNumber(invoice) {
    if (!invoice) return '';
    return invoice.invoiceNumber || '';
}

export function getDocumentNumber(invoice, mode = 'auto') {
    if (!invoice) return '';
    const useReceipt = mode === 'receipt' || (mode === 'auto' && isReceipt(invoice));
    if (useReceipt) {
        return getReceiptNumber(invoice) || invoice.invoiceNumber || '';
    }
    return invoice.invoiceNumber || '';
}

export function getDocumentTypeLabel(invoice) {
    return isReceipt(invoice) ? 'Receipt' : 'Invoice';
}

export function getPdfFileName(invoice, mode = 'auto') {
    const num = getDocumentNumber(invoice, mode) || 'document';
    return `${num}.pdf`;
}

export function getDownloadLabel(invoice) {
    return isReceipt(invoice) ? 'Receipt' : 'Invoice';
}

export function resolvePdfMode(invoice, mode = 'auto') {
    if (mode === 'invoice' || mode === 'receipt') return mode;
    return isReceipt(invoice) ? 'receipt' : 'invoice';
}

export { INV_PREFIX, RCP_PREFIX };
