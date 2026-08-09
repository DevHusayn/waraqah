import {
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    getInvoiceFieldFocusOrder,
} from './invoiceFormValidation';
import { calculateInvoiceTotals } from './invoiceTotals';
import { parseAmountInput } from './numberInput';

const MONEY_EPS = 0.009;

function parsePaymentAmount(value) {
    const parsed = parseAmountInput(value);
    if (value === '' || value == null) return NaN;
    return Number.isFinite(parsed) ? parsed : NaN;
}

function getReceiptTotal(formData) {
    return calculateInvoiceTotals(formData.items, {
        taxRate: formData.taxRate,
        discountType: formData.discountType || 'percent',
        discountValue: formData.discountValue || 0,
    }).total;
}

function toInvoiceShape(formData) {
    return {
        ...formData,
        hasDueDate: false,
        dueDate: null,
    };
}

export function buildReceiptFieldErrors(formData) {
    const errors = buildInvoiceFieldErrors(toInvoiceShape(formData));
    delete errors.dueDate;

    if (!formData.paymentMethod) {
        errors.paymentMethod = 'Please select how payment was received.';
    }
    if (!formData.datePaid) {
        errors.datePaid = 'Please select the payment date.';
    }

    const total = getReceiptTotal(formData);
    const paidInFull = formData.paidInFull !== false;
    const amount = paidInFull ? total : parsePaymentAmount(formData.paymentAmount);

    if (!paidInFull) {
        if (!Number.isFinite(amount) || amount <= 0) {
            errors.paymentAmount = 'Enter the amount received (greater than zero).';
        } else if (amount > total + MONEY_EPS) {
            errors.paymentAmount = 'Amount received cannot exceed the total.';
        }
    }

    return errors;
}

export function buildReceiptDraftFieldErrors(formData) {
    return buildDraftFieldErrors(toInvoiceShape(formData));
}

export function getReceiptFieldFocusOrder(itemCount = 0, formData = null) {
    const order = getInvoiceFieldFocusOrder(itemCount, toInvoiceShape(formData));
    return order.filter((key) => key !== 'dueDate');
}

export function getFirstReceiptFieldId(fieldKey) {
    if (fieldKey === 'clientName' || fieldKey === 'clientId') return 'receipt-client-name';
    if (fieldKey === 'clientEmail') return 'receipt-client-email';
    if (fieldKey === 'date') return 'receipt-date';
    if (fieldKey === 'datePaid') return 'receipt-date-paid';
    if (fieldKey === 'paymentMethod') return 'receipt-payment-method';
    if (fieldKey === 'paymentAmount') return 'receipt-payment-amount';
    if (fieldKey === 'taxRate') return 'receipt-tax-rate';
    if (fieldKey === 'discountValue') return 'receipt-discount-value';
    const itemMatch = fieldKey.match(/^item-(\d+)-(description|quantity|rate)$/);
    if (itemMatch) {
        return `receipt-item-${itemMatch[1]}-${itemMatch[2]}`;
    }
    return null;
}
