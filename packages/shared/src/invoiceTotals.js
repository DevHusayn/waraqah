export function calculateInvoiceSubtotal(items) {
    return (items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
        0
    );
}

export function calculateInvoiceDiscount(subtotal, discountType, discountValue) {
    const value = Number(discountValue);
    if (!value || value <= 0 || Number.isNaN(value)) return 0;
    if (discountType === 'percent') {
        const pct = Math.min(100, value);
        return subtotal * (pct / 100);
    }
    return Math.min(subtotal, value);
}

export function calculateInvoiceTax(subtotal, discountAmount, taxRate) {
    const rate = Number(taxRate);
    if (Number.isNaN(rate) || rate <= 0) return 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    return taxable * (rate / 100);
}

export function calculateInvoiceTotals(
    items,
    { taxRate, discountType = 'fixed', discountValue = 0 } = {}
) {
    const subtotal = calculateInvoiceSubtotal(items);
    const discount = calculateInvoiceDiscount(subtotal, discountType, discountValue);
    const tax = calculateInvoiceTax(subtotal, discount, taxRate);
    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, discount, tax, total };
}
