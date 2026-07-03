import { validateOptionalEmail, validateRequired } from './formFieldValidation.js';

export const INVOICE_FIELD_ORDER = ['clientName', 'clientEmail', 'date', 'dueDate', 'taxRate', 'discountValue'];

function invoiceFieldOrder(formData) {
    const order = ['clientName', 'clientEmail', 'date'];
    if (!formData || formData.hasDueDate !== false) {
        order.push('dueDate');
    }
    order.push('taxRate', 'discountValue');
    return order;
}

export function buildInvoiceFieldErrors(formData) {
    const errors = {};

    const hasClientId = Boolean(formData.clientId);
    const clientName = String(formData.clientName || '').trim();
    if (!hasClientId && !clientName) {
        const message = 'Please enter the client name.';
        errors.clientName = message;
        errors.clientId = message;
    } else if (clientName) {
        const nameErr = validateRequired(clientName, 'Please enter the client name.');
        if (nameErr) errors.clientName = nameErr;
    }

    const emailErr = validateOptionalEmail(
        formData.clientEmail,
        'Please enter a valid email address.'
    );
    if (emailErr) errors.clientEmail = emailErr;
    if (!formData.date) {
        errors.date = 'Please select an issue date.';
    }
    if (formData.hasDueDate !== false && !formData.dueDate) {
        errors.dueDate = 'Please select a due date.';
    }
    const taxRate = formData.taxRate;
    if (taxRate === '' || taxRate === null || taxRate === undefined) {
        errors.taxRate = 'Please enter a tax rate.';
    } else if (Number(taxRate) < 0 || Number(taxRate) > 100) {
        errors.taxRate = 'Tax rate must be between 0 and 100.';
    }

    const discountValue = formData.discountValue;
    if (discountValue !== '' && discountValue !== null && discountValue !== undefined) {
        const discountNum = Number(discountValue);
        if (Number.isNaN(discountNum) || discountNum < 0) {
            errors.discountValue = 'Discount cannot be negative.';
        } else if (formData.discountType === 'percent' && discountNum > 100) {
            errors.discountValue = 'Discount cannot exceed 100%.';
        }
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

export function buildDraftFieldErrors(formData) {
    const errors = {};

    const emailErr = validateOptionalEmail(
        formData.clientEmail,
        'Please enter a valid email address.'
    );
    if (emailErr) errors.clientEmail = emailErr;

    const taxRate = formData.taxRate;
    if (taxRate !== '' && taxRate !== null && taxRate !== undefined) {
        if (Number(taxRate) < 0 || Number(taxRate) > 100) {
            errors.taxRate = 'Tax rate must be between 0 and 100.';
        }
    }

    const discountValue = formData.discountValue;
    if (discountValue !== '' && discountValue !== null && discountValue !== undefined) {
        const discountNum = Number(discountValue);
        if (Number.isNaN(discountNum) || discountNum < 0) {
            errors.discountValue = 'Discount cannot be negative.';
        } else if (formData.discountType === 'percent' && discountNum > 100) {
            errors.discountValue = 'Discount cannot exceed 100%.';
        }
    }

    (formData.items || []).forEach((item, index) => {
        const qtyKey = `item-${index}-quantity`;
        const rateKey = `item-${index}-rate`;
        const qty = Number(item.quantity);
        if (item.quantity !== '' && item.quantity !== null && item.quantity !== undefined) {
            if (Number.isNaN(qty) || qty < 1) {
                errors[qtyKey] = 'Quantity must be at least 1.';
            }
        }
        const rate = Number(item.rate);
        if (item.rate !== '' && item.rate !== null && item.rate !== undefined) {
            if (Number.isNaN(rate) || rate < 0) {
                errors[rateKey] = 'Rate cannot be negative.';
            }
        }
    });

    return errors;
}

export function getInvoiceFieldFocusOrder(itemCount = 0, formData = null) {
    const order = invoiceFieldOrder(formData);
    for (let i = 0; i < itemCount; i += 1) {
        order.push(`item-${i}-description`, `item-${i}-quantity`, `item-${i}-rate`);
    }
    return order;
}

export function getFirstInvoiceFieldId(fieldKey) {
    if (fieldKey === 'clientName' || fieldKey === 'clientId') return 'invoice-client-name';
    if (fieldKey === 'clientEmail') return 'invoice-client-email';
    if (fieldKey === 'date') return 'invoice-date';
    if (fieldKey === 'dueDate') return 'invoice-due-date';
    if (fieldKey === 'taxRate') return 'invoice-tax-rate';
    if (fieldKey === 'discountValue') return 'invoice-discount-value';
    const itemMatch = fieldKey.match(/^item-(\d+)-(description|quantity|rate)$/);
    if (itemMatch) {
        return `invoice-item-${itemMatch[1]}-${itemMatch[2]}`;
    }
    return null;
}
