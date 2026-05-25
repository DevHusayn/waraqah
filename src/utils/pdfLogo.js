import { ensurePngDataUrl } from './imageToPng';

const PAGE_W = 210;
const PAGE_H = 297;
const LOGO_MAX_WIDTH_MM = 155;
const LOGO_MAX_HEIGHT_MM = 155;
const WATERMARK_OPACITY = 0.12;

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

async function resolvePng(dataUrl, cache) {
    try {
        return await ensurePngDataUrl(dataUrl, cache);
    } catch {
        return '';
    }
}

/** Centered watermark behind document content */
export async function drawPremiumLogoWatermark(doc, logoDataUrl, cache) {
    const png = await resolvePng(logoDataUrl, cache);
    if (!png) return;

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, LOGO_MAX_WIDTH_MM, LOGO_MAX_HEIGHT_MM);
    const x = (PAGE_W - w) / 2;
    const y = (PAGE_H - h) / 2;
    addPngWithOpacity(doc, png, x, y, w, h, WATERMARK_OPACITY);
}

/** Top-left header logo */
export async function drawHeaderLogo(doc, logoDataUrl, cache) {
    const png = await resolvePng(logoDataUrl, cache);
    if (!png) return { width: 0, height: 0 };

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, 38, 18);
    addPngWithOpacity(doc, png, 15, 10, w, h, 1);
    return { width: w, height: h };
}

/** Authorized signature above footer */
export async function drawAuthorizedSignature(doc, signatureDataUrl, y = 258, cache) {
    const png = await resolvePng(signatureDataUrl, cache);
    if (!png) return;

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, 50, 16);
    const x = (PAGE_W - w) / 2;
    addPngWithOpacity(doc, png, x, y, w, h, 1);
}

/** Company stamp on paid receipts — slight rotation + ink opacity */
export async function drawCompanyStamp(doc, stampDataUrl, y = 248, cache) {
    const png = await resolvePng(stampDataUrl, cache);
    if (!png) return;

    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, 42, 42);
    const x = PAGE_W - w - 22;
    addPngWithOpacity(doc, png, x, y, w, h, 0.85, -5);
}

/** @deprecated jsPDF always receives PNG after ensurePngDataUrl */
export function getImageFormat() {
    return 'PNG';
}
