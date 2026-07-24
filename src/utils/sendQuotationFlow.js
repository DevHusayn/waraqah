import { calculateInvoiceTotals } from './invoiceTotals';
import { setCachedPdf } from './pdfCache';
import { DEFAULT_QUOTATION_TERMS } from './documentHelpers';

export function buildQuotationPayload(formData, status) {
    const totals = calculateInvoiceTotals(formData.items, {
        taxRate: formData.taxRate,
        discountType: formData.discountType || 'percent',
        discountValue: formData.discountValue || 0,
    });

    const payload = {
        ...formData,
        status,
        currency: formData.currency || 'NGN',
        discountType: formData.discountType || 'percent',
        discountValue: Number(formData.discountValue) || 0,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        terms:
            formData.terms !== undefined && formData.terms !== null
                ? formData.terms
                : DEFAULT_QUOTATION_TERMS,
        validUntil: formData.hasValidUntil === false ? null : formData.validUntil || null,
    };

    delete payload.quotationNumber;
    delete payload.hasValidUntil;
    delete payload.clientName;
    delete payload.clientEmail;
    delete payload.dueDate;
    delete payload.hasDueDate;
    delete payload.invoiceNumber;
    delete payload.receiptNumber;
    delete payload.paymentMethod;
    delete payload.datePaid;
    delete payload.balance;

    if (!payload.clientId) {
        payload.clientId = null;
    }

    return payload;
}

export async function prepareQuotationPdf(quotation, client, businessInfo, quotationId) {
    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    const generated = await generateInvoicePdfBlob(quotation, client, businessInfo, {
        mode: 'quotation',
    });
    if (quotationId) {
        setCachedPdf(quotationId, 'quotation', generated);
    }
    return generated;
}
