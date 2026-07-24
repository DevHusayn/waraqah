function roundMoney(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

export function getInvoiceAmountPaid(invoice) {
    if (!invoice) return 0;
    const recorded = roundMoney(invoice.amountPaid);
    if (recorded > 0) return recorded;
    if (invoice.status === 'paid') {
        return roundMoney(invoice.total);
    }
    if (Array.isArray(invoice.payments) && invoice.payments.length > 0) {
        return roundMoney(
            invoice.payments.reduce((sum, p) => sum + (Number(p?.amount) || 0), 0)
        );
    }
    return 0;
}

export function getInvoiceBalanceDue(invoice) {
    const total = roundMoney(invoice?.total);
    return Math.max(0, roundMoney(total - getInvoiceAmountPaid(invoice)));
}

export function hasRecordedPayments(invoice) {
    return getInvoiceAmountPaid(invoice) > 0;
}

export function canRecordInvoicePayment(invoice) {
    return Boolean(invoice && ['pending', 'partial', 'overdue'].includes(invoice.status));
}

export function getInvoicePayments(invoice) {
    if (!invoice) return [];
    if (Array.isArray(invoice.payments) && invoice.payments.length > 0) {
        return invoice.payments;
    }
    // Legacy paid invoice without a ledger entry
    if (invoice.status === 'paid' && Number(invoice.total) > 0) {
        return [
            {
                amount: getInvoiceAmountPaid(invoice),
                method: invoice.paymentMethod,
                date: invoice.datePaid,
            },
        ];
    }
    return [];
}
