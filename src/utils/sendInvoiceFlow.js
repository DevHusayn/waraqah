import { calculateInvoiceTotals } from './invoiceTotals';
import { setCachedPdf } from './pdfCache';

export function buildInvoicePayload(formData, status) {
    const totals = calculateInvoiceTotals(formData.items, {
        taxRate: formData.taxRate,
        discountType: formData.discountType || 'fixed',
        discountValue: formData.discountValue || 0,
    });

    const payload = {
        ...formData,
        status,
        currency: formData.currency,
        discountType: formData.discountType || 'fixed',
        discountValue: Number(formData.discountValue) || 0,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        balance: totals.total,
    };

    delete payload.invoiceNumber;
    delete payload.receiptNumber;
    delete payload.paymentMethod;
    delete payload.datePaid;

    if (!payload.clientId) {
        payload.clientId = null;
    }

    if (!formData.hasDueDate) {
        payload.dueDate = null;
    } else if (!payload.dueDate) {
        payload.dueDate = null;
    }

    delete payload.hasDueDate;
    delete payload.clientName;
    delete payload.clientEmail;

    delete payload.isRecurring;
    delete payload.recurringFrequency;
    delete payload.recurringEndDate;

    return payload;
}

export async function prepareInvoicePdf(invoice, client, businessInfo, invoiceId, mode = 'invoice') {
    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    const generated = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
    if (invoiceId) {
        setCachedPdf(invoiceId, mode, generated);
    }
    return generated;
}

export async function finalizeAndShareInvoice(invoice, client, businessInfo, invoiceId) {
    const generated = await prepareInvoicePdf(invoice, client, businessInfo, invoiceId, 'invoice');
    const { shareInvoicePdf } = await import('./shareInvoicePdf');
    return shareInvoicePdf(invoice, client, businessInfo, {
        mode: 'invoice',
        cached: generated,
    });
}
