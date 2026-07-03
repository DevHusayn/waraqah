/**
 * Generate invoice/receipt PDFs on the public invoice page using the same template as the app.
 */

export function resolvePublicPdfMode(showReceipt) {
    return showReceipt ? 'receipt' : 'invoice';
}

export async function generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const mode = resolvePublicPdfMode(showReceipt);
    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    return generateInvoicePdfBlob(invoice, client, businessInfo, { mode, output: 'blob' });
}

export async function downloadPublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const { downloadPdfBlob } = await import('./shareInvoicePdf');
    const { blob, filename } = await generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt);
    downloadPdfBlob(blob, filename);
}

export async function printPublicInvoicePdf(invoice, client, businessInfo, showReceipt) {
    const { blob } = await generatePublicInvoicePdf(invoice, client, businessInfo, showReceipt);
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    await new Promise((resolve, reject) => {
        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                window.setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                    resolve();
                }, 1000);
            } catch (err) {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
                reject(err);
            }
        };
        iframe.onerror = () => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load PDF for printing.'));
        };
    });
}
