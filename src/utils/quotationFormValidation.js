import {
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    getInvoiceFieldFocusOrder,
} from './invoiceFormValidation';

function toInvoiceShape(formData) {
    return {
        ...formData,
        hasDueDate: formData?.hasValidUntil !== false,
        dueDate: formData?.validUntil,
    };
}

export function buildQuotationFieldErrors(formData) {
    const errors = buildInvoiceFieldErrors(toInvoiceShape(formData));
    if (errors.dueDate) {
        errors.validUntil = 'Please select a valid until date.';
        delete errors.dueDate;
    }
    return errors;
}

export function buildQuotationDraftFieldErrors(formData) {
    return buildDraftFieldErrors(toInvoiceShape(formData));
}

export function getQuotationFieldFocusOrder(itemCount = 0, formData = null) {
    const order = getInvoiceFieldFocusOrder(itemCount, toInvoiceShape(formData));
    return order.map((key) => (key === 'dueDate' ? 'validUntil' : key));
}

export function getFirstQuotationFieldId(fieldKey) {
    if (fieldKey === 'clientName' || fieldKey === 'clientId') return 'quotation-client-name';
    if (fieldKey === 'clientEmail') return 'quotation-client-email';
    if (fieldKey === 'date') return 'quotation-date';
    if (fieldKey === 'validUntil' || fieldKey === 'dueDate') return 'quotation-valid-until';
    if (fieldKey === 'taxRate') return 'quotation-tax-rate';
    if (fieldKey === 'discountValue') return 'quotation-discount-value';
    const itemMatch = fieldKey.match(/^item-(\d+)-(description|quantity|rate)$/);
    if (itemMatch) {
        return `quotation-item-${itemMatch[1]}-${itemMatch[2]}`;
    }
    return null;
}
