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

/**
 * Authorized signature image — returns drawn bounds for labels / layout.
 * Pass `rightX` to right-align within the available width.
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export async function drawAuthorizedSignature(doc, signatureDataUrl, y, cache, options = {}) {
    const png = await resolvePdfPng(signatureDataUrl, cache);
    if (!png) return null;

    const { x = 22, rightX, maxW = 48, maxH = 16 } = options;
    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, maxW, maxH);
    const drawX = rightX != null ? rightX - w : x;
    addPngWithOpacity(doc, png, drawX, y, w, h, 1);
    return { x: drawX, y, w, h };
}

/**
 * Company stamp — clean, unrotated placement for premium receipts.
 * Pass `rightX` to right-align within the available width.
 * @returns {{ x: number, y: number, w: number, h: number } | null}
 */
export async function drawCompanyStamp(doc, stampDataUrl, y, cache, options = {}) {
    const png = await resolvePdfPng(stampDataUrl, cache);
    if (!png) return null;

    const { x = PAGE_W - 50, rightX, maxW = 28, maxH = 28, opacity = 0.95 } = options;
    const { width, height } = await loadImageMeta(png);
    const { w, h } = fitImage(width / height, maxW, maxH);
    const drawX = rightX != null ? rightX - w : x;
    addPngWithOpacity(doc, png, drawX, y, w, h, opacity);
    return { x: drawX, y, w, h };
}

/** @deprecated jsPDF always receives flattened PNG after resolvePdfPng */
export function getImageFormat() {
    return 'PNG';
}

export { PAGE_W, PAGE_H, fitImage, loadImageMeta, resolvePdfPng };
