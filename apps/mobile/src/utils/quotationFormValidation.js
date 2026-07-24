import {
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    getInvoiceFieldFocusOrder,
} from '@waraqah/shared';

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
