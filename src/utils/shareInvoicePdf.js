import {
    getDocumentNumber,
    resolvePdfMode,
} from './receiptHelpers';

export function buildInvoiceShareMessage(invoice, client, businessInfo, mode = 'auto') {
    const resolvedMode = resolvePdfMode(invoice, mode);
    const docKind =
        resolvedMode === 'receipt'
            ? 'receipt'
            : resolvedMode === 'quotation'
              ? 'quotation'
              : 'invoice';
    const docNumber = getDocumentNumber(invoice, resolvedMode);
    const businessName = businessInfo?.name?.trim() || 'Our business';
    const clientName = client?.name?.trim() || 'there';

    return `Hi ${clientName}\n\nAttached is your ${docKind} ${docNumber}.\n\nThank you.\n${businessName}`;
}

export function canSharePdfFiles() {
    if (typeof navigator === 'undefined' || !navigator.share) return false;
    try {
        const probe = new File([''], 'probe.pdf', { type: 'application/pdf' });
        return navigator.canShare?.({ files: [probe] }) ?? false;
    } catch {
        return false;
    }
}

export function downloadPdfBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

/** Open PDF in a new tab and trigger the browser print dialog. */
export function printPdfBlob(blob) {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
        URL.revokeObjectURL(url);
        return Promise.reject(new Error('Allow pop-ups to print this document.'));
    }

    let printed = false;
    const cleanup = () => {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    };

    const runPrint = () => {
        if (printed) return;
        printed = true;
        try {
            printWindow.focus();
            printWindow.print();
        } catch {
            // PDF opened in a new tab — user can print from the browser viewer.
        } finally {
            cleanup();
        }
    };

    printWindow.addEventListener('load', runPrint, { once: true });
    window.setTimeout(runPrint, 1000);

    return Promise.resolve();
}

export async function shareCachedPdfBlob({ blob, filename, message, docNumber }) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    const shareData = { text: message, title: docNumber, files: [file] };

    if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return { method: 'share' };
    }

    downloadPdfBlob(blob, filename);
    return { method: 'download' };
}

export async function shareInvoicePdf(invoice, client, businessInfo, options = {}) {
    const mode = options.mode ?? 'auto';
    const message = buildInvoiceShareMessage(invoice, client, businessInfo, mode);
    const docNumber = getDocumentNumber(invoice, mode);

    if (options.cached?.blob) {
        return shareCachedPdfBlob({
            blob: options.cached.blob,
            filename: options.cached.filename,
            message,
            docNumber,
        });
    }

    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    const { blob, filename } = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
    return shareCachedPdfBlob({ blob, filename, message, docNumber });
}

export function getShareFallbackHint() {
    return canSharePdfFiles()
        ? null
        : 'Your browser opened a download instead. Attach the PDF in WhatsApp or your email app.';
}
