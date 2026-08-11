import { calculateInvoiceTotals } from './invoiceTotals';

export function buildPurchaseOrderPayload(formData, status) {
    const totals = calculateInvoiceTotals(formData.items, {
        taxRate: 0,
        discountType: 'fixed',
        discountValue: 0,
    });

    const payload = {
        supplierId: formData.supplierId || null,
        date: formData.date,
        expectedDate: formData.expectedDate || null,
        items: formData.items,
        notes: formData.notes || '',
        status,
        currency: formData.currency || 'NGN',
        subtotal: totals.subtotal,
        total: totals.subtotal,
    };

    return payload;
}
