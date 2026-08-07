import { calculateInvoiceTotals } from './invoiceTotals';
import { DEFAULT_QUOTATION_TERMS } from './documentHelpers';

export function buildClientPreviewFromForm(formData) {
    return {
        name: formData.clientName || '',
        email: formData.clientEmail || '',
        business: formData.clientBusiness || '',
        phone: formData.clientPhone || '',
        address: formData.clientAddress || '',
    };
}

export function buildDocumentPreviewFromForm(formData, { type = 'invoice' } = {}) {
    const isQuotation = type === 'quotation';
    const isReceipt = type === 'receipt';
    const discountType = formData.discountType || (isQuotation ? 'percent' : 'fixed');
    const totals = calculateInvoiceTotals(formData.items, {
        taxRate: formData.taxRate,
        discountType,
        discountValue: formData.discountValue || 0,
    });

    const client = buildClientPreviewFromForm(formData);

    const invoice = {
        date: formData.date,
        items: formData.items,
        notes: formData.notes || '',
        status: 'draft',
        currency: formData.currency || 'NGN',
        taxRate: formData.taxRate ?? 0,
        discountType,
        discountValue: Number(formData.discountValue) || 0,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        clientAdditionalInfo: formData.clientAdditionalInfo || '',
    };

    if (isQuotation) {
        invoice.quotationNumber = formData.quotationNumber || 'Draft';
        invoice.validUntil = formData.hasValidUntil === false ? null : formData.validUntil || null;
        invoice.terms =
            formData.terms !== undefined && formData.terms !== null
                ? formData.terms
                : DEFAULT_QUOTATION_TERMS;
    } else if (isReceipt) {
        invoice.documentType = 'receipt';
        invoice.receiptNumber = formData.receiptNumber || 'Draft';
        invoice.status = formData.status || 'paid';
        invoice.paymentMethod = formData.paymentMethod || '';
        invoice.datePaid = formData.datePaid || formData.date;
        if (formData.amountPaid != null) {
            invoice.amountPaid = Number(formData.amountPaid) || 0;
        }
    } else {
        invoice.invoiceNumber = formData.invoiceNumber || 'Draft';
        invoice.dueDate = formData.hasDueDate ? formData.dueDate || null : null;
    }

    return { invoice, client };
}
