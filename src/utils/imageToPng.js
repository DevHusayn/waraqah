const RASTER_DATA_URL = /^data:image\/(png|jpe?g|webp);/i;
const SVG_DATA_URL = /^data:image\/svg\+xml/i;

/** True for PNG, JPEG, or WebP data URLs usable in the browser. */
export function isSupportedImageDataUrl(dataUrl) {
    return typeof dataUrl === 'string' && RASTER_DATA_URL.test(dataUrl.trim());
}

export function isSvgDataUrl(dataUrl) {
    return typeof dataUrl === 'string' && SVG_DATA_URL.test(dataUrl.trim());
}

export function isPngDataUrl(dataUrl) {
    return typeof dataUrl === 'string' && dataUrl.trim().startsWith('data:image/png');
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = dataUrl;
    });
}

/**
 * Draw an image onto a canvas, optionally capping the longest edge.
 * @returns {HTMLCanvasElement}
 */
async function drawToCanvas(dataUrl, maxEdge = 0) {
    const img = await loadImage(dataUrl);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) {
        throw new Error('Could not process image');
    }

    if (maxEdge > 0 && Math.max(width, height) > maxEdge) {
        const scale = maxEdge / Math.max(width, height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

/** Draw any supported browser image data URL onto a canvas and export as PNG. */
export async function convertDataUrlToPng(dataUrl, maxEdge = 0) {
    const canvas = await drawToCanvas(dataUrl, maxEdge);
    return canvas.toDataURL('image/png');
}

/**
 * jsPDF renders transparent PNG pixels as black. Flatten onto a solid backdrop before PDF embed.
 * @param {string} dataUrl
 * @param {string} background — hex or css color (default white page)
 */
export async function flattenImageForPdf(dataUrl, background = '#ffffff') {
    const png = await ensurePngDataUrl(dataUrl);
    if (!png) return '';

    const img = await loadImage(png);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
}

/** Export as JPEG (white backdrop for transparent PNG / SVG sources). */
export async function convertDataUrlToJpeg(dataUrl, quality = 0.92, maxEdge = 0) {
    const canvas = await drawToCanvas(dataUrl, maxEdge);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image');

    // Re-draw on white backdrop for transparency-safe JPEG
    const white = document.createElement('canvas');
    white.width = canvas.width;
    white.height = canvas.height;
    const wctx = white.getContext('2d');
    if (!wctx) throw new Error('Could not process image');
    wctx.fillStyle = '#ffffff';
    wctx.fillRect(0, 0, white.width, white.height);
    wctx.drawImage(canvas, 0, 0);
    return white.toDataURL('image/jpeg', quality);
}

/**
 * Return a PNG data URL — passthrough if already PNG (and under maxEdge), convert otherwise.
 * Optional cache avoids re-converting the same source during one PDF render.
 */
export async function ensurePngDataUrl(dataUrl, cache, maxEdge = 0) {
    const trimmed = (dataUrl || '').trim();
    if (!trimmed) return '';

    const canPassthrough =
        maxEdge <= 0 && isPngDataUrl(trimmed) && !isSvgDataUrl(trimmed);
    if (canPassthrough) return trimmed;

    if (!isSupportedImageDataUrl(trimmed) && !isSvgDataUrl(trimmed)) return '';

    const cacheKey = maxEdge > 0 ? `${trimmed}::${maxEdge}` : trimmed;
    if (cache?.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const png = await convertDataUrlToPng(trimmed, maxEdge);
    cache?.set(cacheKey, png);
    return png;
}
