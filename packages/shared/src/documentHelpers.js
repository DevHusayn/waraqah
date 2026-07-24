export const INV_PREFIX = 'INV';
export const RCP_PREFIX = 'RCP';
export const QTN_PREFIX = 'QTN';

export const QUOTATION_STATUSES = [
    'draft',
    'sent',
    'accepted',
    'rejected',
    'expired',
    'converted',
];

export const DEFAULT_QUOTATION_TERMS = [
    'This quotation is valid until the date stated above.',
    '',
    'Prices quoted are subject to acceptance before the expiry date.',
    '',
    'This quotation is not a demand for payment. Payment becomes due only after this quotation has been accepted and converted into an invoice.',
    '',
    'Any changes to the scope of work or requested items may result in a revised quotation.',
].join('\n');

/** Extract numeric suffix from INV-/RCP-/QTN- style strings. */
export function extractDocumentSequence(raw) {
    const match = String(raw || '').match(/^(?:INV|RCP|QTN)-(\d+)$/i);
    return match ? parseInt(match[1], 10) : 0;
}

export function formatDocumentNumber(prefix, sequence, pad = 4) {
    return `${prefix}-${String(sequence).padStart(pad, '0')}`;
}

export function isQuotationDocument(doc) {
    if (!doc) return false;
    if (doc.documentType === 'quotation') return true;
    if (doc.quotationNumber) return true;
    return false;
}

export function getQuotationDisplayNumber(quotation) {
    if (!quotation) return '';
    return quotation.quotationNumber || '';
}
