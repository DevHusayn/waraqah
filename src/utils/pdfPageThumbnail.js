import { PDFDocument, PDFName, PDFRawStream, PDFDict } from 'pdf-lib';

const THUMB_WIDTH = 595;
const THUMB_HEIGHT = 842;

/**
 * Draw a simplified first-page preview for PDF /Thumb metadata.
 * Messaging apps (e.g. WhatsApp) often use this instead of a low-res raster pass.
 */
function renderInvoicePreviewCanvas(invoice, client, businessInfo, mode = 'invoice') {
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_WIDTH;
    canvas.height = THUMB_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create PDF preview');

    const brandColor = businessInfo?.brandColor || '#16A34A';
    const title =
        mode === 'receipt' ? 'RECEIPT' : mode === 'quotation' ? 'QUOTATION' : 'INVOICE';
    const docNumber =
        invoice.receiptNumber ||
        invoice.invoiceNumber ||
        invoice.quotationNumber ||
        '—';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, THUMB_WIDTH, THUMB_HEIGHT);

    ctx.fillStyle = brandColor;
    ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
    ctx.fillText(String(businessInfo?.name || 'Your Business'), 40, 56);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 52px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(title, THUMB_WIDTH - 40, 72);

    ctx.fillStyle = brandColor;
    ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
    ctx.fillText(`#${docNumber}`, THUMB_WIDTH - 40, 108);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    ctx.fillText('BILL TO', 40, 150);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
    ctx.fillText(String(client?.name || 'Client'), 40, 178);

    if (client?.email) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Helvetica, Arial, sans-serif';
        ctx.fillText(String(client.email), 40, 204);
    }

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 230);
    ctx.lineTo(THUMB_WIDTH - 40, 230);
    ctx.stroke();

    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.fillText('DESCRIPTION', 40, 252);
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL', THUMB_WIDTH - 40, 252);
    ctx.textAlign = 'left';

    let y = 278;
    const items = (invoice.items || []).slice(0, 8);
    for (const item of items) {
        ctx.fillStyle = '#111827';
        ctx.font = '16px Helvetica, Arial, sans-serif';
        const desc = String(item.description || 'Item').slice(0, 42);
        ctx.fillText(desc, 40, y);
        ctx.textAlign = 'right';
        ctx.fillText(
            Number(item.quantity || 0) * Number(item.rate || 0) > 0
                ? Number(item.quantity * item.rate).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  })
                : '0.00',
            THUMB_WIDTH - 40,
            y
        );
        ctx.textAlign = 'left';
        y += 28;
    }

    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(THUMB_WIDTH - 220, THUMB_HEIGHT - 120);
    ctx.lineTo(THUMB_WIDTH - 40, THUMB_HEIGHT - 120);
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL DUE', THUMB_WIDTH - 220, THUMB_HEIGHT - 92);
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 28px Helvetica, Arial, sans-serif';
    ctx.fillText(
        Number(invoice.total || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        THUMB_WIDTH - 40,
        THUMB_HEIGHT - 92
    );
    ctx.textAlign = 'left';

    return canvas;
}

function canvasToJpeg(canvas, quality = 0.92) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Could not encode PDF preview'));
                    return;
                }
                blob.arrayBuffer().then(resolve).catch(reject);
            },
            'image/jpeg',
            quality
        );
    });
}

async function embedFirstPageThumbnail(pdfBytes, jpegBytes, width, height) {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const context = pdfDoc.context;

    const imageDict = PDFDict.withContext(context, {
        Type: 'XObject',
        Subtype: 'Image',
        Width: width,
        Height: height,
        ColorSpace: 'DeviceRGB',
        BitsPerComponent: 8,
        Filter: 'DCTDecode',
        Length: jpegBytes.length,
    });

    const imageStream = PDFRawStream.of(jpegBytes, imageDict);
    const imageRef = context.register(imageStream);
    page.node.set(PDFName.of('Thumb'), imageRef);

    return pdfDoc.save({ useObjectStreams: false });
}

/**
 * Embed a high-resolution page thumbnail so share previews stay sharp.
 */
export async function addPdfPreviewThumbnail(blob, invoice, client, businessInfo, mode = 'invoice') {
    if (typeof document === 'undefined') return blob;

    try {
        const canvas = renderInvoicePreviewCanvas(invoice, client, businessInfo, mode);
        const jpegBytes = await canvasToJpeg(canvas);
        const pdfBytes = new Uint8Array(await blob.arrayBuffer());
        const updated = await embedFirstPageThumbnail(pdfBytes, new Uint8Array(jpegBytes), THUMB_WIDTH, THUMB_HEIGHT);
        return new Blob([updated], { type: 'application/pdf' });
    } catch {
        return blob;
    }
}
