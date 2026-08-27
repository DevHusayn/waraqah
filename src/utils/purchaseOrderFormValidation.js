import { buildLineItemFieldErrors } from '@waraqah/shared';
import { validateRequired } from '../utils/formFieldValidation';

export function buildPurchaseOrderFieldErrors(formData, { requireSupplier = true } = {}) {
    const errors = {};

    if (requireSupplier) {
        const hasSupplier =
            Boolean(formData.supplierId) || Boolean(String(formData.supplierName || '').trim());
        if (!hasSupplier) {
            errors.supplierId = 'Enter a supplier name.';
        }
    }

    errors.date = validateRequired(formData.date, 'Please set an order date.');

    const items = formData.items || [];
    if (items.length === 0) {
        errors.items = 'Add at least one line item.';
    }

    items.forEach((item, index) => {
        const itemErrors = buildLineItemFieldErrors(item, index);
        Object.entries(itemErrors).forEach(([key, message]) => {
            if (message) errors[key] = message;
        });
    });

    return errors;
}

export function getFirstPurchaseOrderFieldId(fieldKey) {
    if (fieldKey === 'supplierId') return 'po-supplier';
    if (fieldKey === 'date') return 'po-date';
    if (fieldKey?.startsWith('item-')) {
        const parts = fieldKey.split('-');
        const index = parts[1];
        const part = parts[2];
        if (part === 'description') return `po-item-${index}-description`;
        if (part === 'quantity') return `po-item-${index}-quantity`;
        if (part === 'rate') return `po-item-${index}-rate`;
    }
    return null;
}

export function getPurchaseOrderFieldFocusOrder(itemCount) {
    return ['supplierId', 'date', ...Array.from({ length: itemCount }, (_, i) => `item-${i}-description`)];
}
