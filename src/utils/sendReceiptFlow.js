import { calculateInvoiceTotals } from './invoiceTotals';
import { setCachedPdf } from './pdfCache';

export function buildReceiptPayload(formData, status) {
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
    };

    delete payload.receiptNumber;
    delete payload.invoiceNumber;
    delete payload.hasDueDate;
    delete payload.dueDate;
    delete payload.clientName;
    delete payload.clientEmail;
    delete payload.clientBusiness;
    delete payload.clientPhone;
    delete payload.clientAddress;
    delete payload.balance;

    if (status === 'draft') {
        delete payload.paymentMethod;
        delete payload.datePaid;
        delete payload.paymentAmount;
        delete payload.paidInFull;
    } else {
        const paidInFull = formData.paidInFull !== false;
        payload.paidInFull = paidInFull;
        payload.paymentAmount = paidInFull
            ? totals.total
            : Number(formData.paymentAmount) || 0;
    }

    if (!payload.clientId) {
        payload.clientId = null;
    }

    return payload;
}

export async function prepareReceiptPdf(receipt, client, businessInfo, receiptId) {
    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    const generated = await generateInvoicePdfBlob(receipt, client, businessInfo, {
        mode: 'receipt',
    });
    if (receiptId) {
        setCachedPdf(receiptId, 'receipt', generated);
    }
    return generated;
}
