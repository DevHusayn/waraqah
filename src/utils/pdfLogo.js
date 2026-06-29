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

const PAID_STAMP_GREEN = 'rgb(34, 197, 94)';
const PAID_STAMP_TEXT = 'rgb(22, 163, 74)';
const PAID_STAMP_CACHE = new Map();

function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function createPaidStampPng(rotation = -18) {
    const cacheKey = String(rotation);
    if (PAID_STAMP_CACHE.has(cacheKey)) {
        return PAID_STAMP_CACHE.get(cacheKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 168;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const boxW = 330;
    const boxH = 112;

    ctx.strokeStyle = PAID_STAMP_GREEN;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.55;
    roundRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 14);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45;
    roundRectPath(ctx, -boxW / 2 + 12, -boxH / 2 + 10, boxW - 24, boxH - 20, 10);
    ctx.stroke();

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = PAID_STAMP_TEXT;
    ctx.font = 'bold 58px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAID', 0, 2);

    const png = canvas.toDataURL('image/png');
    PAID_STAMP_CACHE.set(cacheKey, png);
    return png;
}

function rotatePoint(cx, cy, px, py, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return {
        x: cx + c * px - s * py,
        y: cy + s * px + c * py,
    };
}

function drawRotatedRectOutline(doc, cx, cy, width, height, rad, rgb) {
    const hw = width / 2;
    const hh = height / 2;
    const corners = [
        rotatePoint(cx, cy, -hw, -hh, rad),
        rotatePoint(cx, cy, hw, -hh, rad),
        rotatePoint(cx, cy, hw, hh, rad),
        rotatePoint(cx, cy, -hw, hh, rad),
    ];

    doc.setDrawColor(...rgb);
    doc.lines(
        [
            [corners[1].x - corners[0].x, corners[1].y - corners[0].y],
            [corners[2].x - corners[1].x, corners[2].y - corners[1].y],
            [corners[3].x - corners[2].x, corners[3].y - corners[2].y],
            [corners[0].x - corners[3].x, corners[0].y - corners[3].y],
        ],
        corners[0].x,
        corners[0].y,
        [1, 1],
        'S',
        true
    );
}

function drawPaidStampFallback(doc, { x, y, rotation, opacity }) {
    const stampW = 54;
    const stampH = 20;
    const rad = (rotation * Math.PI) / 180;
    const green = [34, 197, 94];
    const textGreen = [22, 163, 74];

    doc.saveGraphicsState();
    if (typeof doc.setGState === 'function' && doc.GState && opacity < 1) {
        doc.setGState(new doc.GState({ opacity }));
    }

    doc.setLineWidth(0.85);
    drawRotatedRectOutline(doc, x, y, stampW, stampH, rad, green);
    doc.setLineWidth(0.4);
    drawRotatedRectOutline(doc, x, y, stampW - 4, stampH - 3.5, rad, green);

    doc.setFont(undefined, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...textGreen);
    doc.text('PAID', x, y + 1, { align: 'center', angle: rotation });

    doc.restoreGraphicsState();
}

/** Rubber-stamp PAID watermark — centered over line items on receipt PDFs */
export async function drawPaidStamp(doc, options = {}) {
    const {
        x = PAGE_W / 2,
        y = 165,
        rotation = -18,
        opacity = 0.42,
    } = options;

    const stampW = 54;
    const stampH = 20;

    if (typeof document !== 'undefined') {
        const png = createPaidStampPng(rotation);
        if (png) {
            addPngWithOpacity(
                doc,
                png,
                x - stampW / 2,
                y - stampH / 2,
                stampW,
                stampH,
                opacity
            );
            return;
        }
    }

    drawPaidStampFallback(doc, { x, y, rotation, opacity });
}

/** @deprecated jsPDF always receives flattened PNG after resolvePdfPng */
export function getImageFormat() {
    return 'PNG';
}

export { PAGE_W, PAGE_H };
