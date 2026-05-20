import { validateRequired } from './formFieldValidation';

export const INVOICE_FIELD_ORDER = ['clientId', 'date', 'dueDate', 'taxRate'];

export function buildInvoiceFieldErrors(formData) {
    const errors = {};

    if (!formData.clientId) {
        errors.clientId = 'Please select a client.';
    }
    if (!formData.date) {
        errors.date = 'Please select an issue date.';
    }
    if (!formData.dueDate) {
        errors.dueDate = 'Please select a due date.';
    }
    const taxRate = formData.taxRate;
    if (taxRate === '' || taxRate === null || taxRate === undefined) {
        errors.taxRate = 'Please enter a tax rate.';
    } else if (Number(taxRate) < 0 || Number(taxRate) > 100) {
        errors.taxRate = 'Tax rate must be between 0 and 100.';
    }

    (formData.items || []).forEach((item, index) => {
        const descKey = `item-${index}-description`;
        const qtyKey = `item-${index}-quantity`;
        const rateKey = `item-${index}-rate`;

        const descErr = validateRequired(item.description, 'Please enter a description.');
        if (descErr) errors[descKey] = descErr;

        const qty = Number(item.quantity);
        if (!item.quantity && item.quantity !== 0) {
            errors[qtyKey] = 'Please enter a quantity.';
        } else if (Number.isNaN(qty) || qty < 1) {
            errors[qtyKey] = 'Quantity must be at least 1.';
        }

        const rate = Number(item.rate);
        if (item.rate === '' || item.rate === null || item.rate === undefined) {
            errors[rateKey] = 'Please enter a rate.';
        } else if (Number.isNaN(rate) || rate < 0) {
            errors[rateKey] = 'Rate cannot be negative.';
        }
    });

    return errors;
}

export function getFirstInvoiceFieldId(fieldKey) {
    if (fieldKey === 'clientId') return 'invoice-client';
    if (fieldKey === 'date') return 'invoice-date';
    if (fieldKey === 'dueDate') return 'invoice-due-date';
    if (fieldKey === 'taxRate') return 'invoice-tax-rate';
    const itemMatch = fieldKey.match(/^item-(\d+)-(description|quantity|rate)$/);
    if (itemMatch) {
        return `invoice-item-${itemMatch[1]}-${itemMatch[2]}`;
    }
    return null;
}

export function getInvoiceFieldFocusOrder(itemCount = 0) {
    const order = [...INVOICE_FIELD_ORDER];
    for (let i = 0; i < itemCount; i += 1) {
        order.push(`item-${i}-description`, `item-${i}-quantity`, `item-${i}-rate`);
    }
    return order;
}
