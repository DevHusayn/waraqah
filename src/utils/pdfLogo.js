import { ensurePngDataUrl, flattenImageForPdf } from './imageToPng';

const PAGE_W = 210;
const PAGE_H = 297;
const LOGO_MAX_WIDTH_MM = 120;
const LOGO_MAX_HEIGHT_MM = 120;
const WATERMARK_OPACITY = 0.08;

function loadImageMeta(pngDataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = pngDataUrl;
    });
}

function fitImage(aspect, maxW, maxH) {
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
        h = maxH;
        w = h * aspect;
    }
    return { w, h };
}

function addPngWithOpacity(doc, pngDataUrl, x, y, w, h, opacity, rotation = 0) {
    if (typeof doc.setGState === 'function' && doc.GState && opacity < 1) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity }));
        doc.addImage(pngDataUrl, 'PNG', x, y, w, h, undefined, 'FAST', rotation);
        doc.restoreGraphicsState();
        return;
    }
    doc.addImage(pngDataUrl, 'PNG', x, y, w, h, undefined, 'FAST', rotation);
}

async function resolvePdfPng(dataUrl, cache) {
    const trimmed = (dataUrl || '').trim();
    if (!trimmed) return '';

    const cacheKey = `pdf-flat:${trimmed}`;
    if (cache?.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const flat = await flattenImageForPdf(trimmed, '#ffffff');
        cache?.set(cacheKey, flat);
        return flat;
    } catch {
        try {
            const png = await ensurePngDataUrl(trimmed, cache);
            return png;
        } catch {
            return '';
        }
    }
}

/** Centered watermark behind document content */
export async function drawPremiumLogoWatermark(doc, logoDataUrl, cache) {
    const png = await resolvePdfPng(logoDataUrl, cache);
    if (!png) return;

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, LOGO_MAX_WIDTH_MM, LOGO_MAX_HEIGHT_MM);
    const x = (PAGE_W - w) / 2;
    const y = (PAGE_H - h) / 2;
    addPngWithOpacity(doc, png, x, y, w, h, WATERMARK_OPACITY);
}

/** Top-left header logo — sized to sit beside the business name */
export async function drawHeaderLogo(doc, logoDataUrl, cache, options = {}) {
    const { x = 22, nameBaselineY = 20, maxW = 28, maxH = 14 } = options;
    const png = await resolvePdfPng(logoDataUrl, cache);
    if (!png) return { width: 0, height: 0, x, y: nameBaselineY };

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, maxW, maxH);
    const y = nameBaselineY - h + 1.5;
    addPngWithOpacity(doc, png, x, y, w, h, 1);
    return { width: w, height: h, x, y };
}

/** Authorized signature in the footer block */
export async function drawAuthorizedSignature(doc, signatureDataUrl, y, cache, options = {}) {
    const png = await resolvePdfPng(signatureDataUrl, cache);
    if (!png) return;

    const { x = 22, maxW = 52, maxH = 14 } = options;
    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, maxW, maxH);
    addPngWithOpacity(doc, png, x, y, w, h, 1);
}

/** Company stamp on paid receipts — bottom-right, above footer rule */
export async function drawCompanyStamp(doc, stampDataUrl, y, cache, options = {}) {
    const png = await resolvePdfPng(stampDataUrl, cache);
    if (!png) return;

    const { x = PAGE_W - 50, maxW = 34, maxH = 34, rotation = -10, opacity = 0.9 } = options;
    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, maxW, maxH);
    addPngWithOpacity(doc, png, x, y, w, h, opacity, rotation);
}

const PAID_STAMP_GREEN = [34, 197, 94];
const PAID_STAMP_TEXT = [22, 163, 74];

/** Apply rotation around (cx, cy) so local (0, 0) maps to the stamp center. */
function applyRotationTransform(doc, cx, cy, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    doc.internal.write(
        `${c.toFixed(5)} ${s.toFixed(5)} ${(-s).toFixed(5)} ${c.toFixed(5)} ${cx.toFixed(2)} ${cy.toFixed(2)} cm`
    );
}

/** Rubber-stamp PAID watermark — centered over line items on receipt PDFs */
export function drawPaidStamp(doc, options = {}) {
    const {
        x = PAGE_W / 2,
        y = 165,
        rotation = -18,
        opacity = 0.38,
    } = options;

    const stampW = 54;
    const stampH = 20;
    const rad = (rotation * Math.PI) / 180;

    doc.saveGraphicsState();
    if (typeof doc.setGState === 'function' && doc.GState && opacity < 1) {
        doc.setGState(new doc.GState({ opacity }));
    }

    applyRotationTransform(doc, x, y, rad);

    doc.setDrawColor(...PAID_STAMP_GREEN);
    doc.setLineWidth(0.85);
    doc.roundedRect(-stampW / 2, -stampH / 2, stampW, stampH, 2.5, 2.5, 'S');
    doc.setLineWidth(0.4);
    doc.roundedRect(-stampW / 2 + 2, -stampH / 2 + 1.75, stampW - 4, stampH - 3.5, 1.5, 1.5, 'S');

    doc.setFont(undefined, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PAID_STAMP_TEXT);
    doc.text('PAID', 0, 2.5, { align: 'center' });

    doc.restoreGraphicsState();
}

/** @deprecated jsPDF always receives flattened PNG after resolvePdfPng */
export function getImageFormat() {
    return 'PNG';
}

export { PAGE_W, PAGE_H };
