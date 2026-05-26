const SUPPORTED_DATA_URL = /^data:image\/(png|jpe?g|webp);/i;

/** True for PNG, JPEG, or WebP data URLs usable in the browser. */
export function isSupportedImageDataUrl(dataUrl) {
    return typeof dataUrl === 'string' && SUPPORTED_DATA_URL.test(dataUrl.trim());
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

/** Draw any supported browser image data URL onto a canvas and export as PNG. */
export async function convertDataUrlToPng(dataUrl) {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
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

/** Export as JPEG (white backdrop for transparent PNG sources). */
export async function convertDataUrlToJpeg(dataUrl, quality = 0.92) {
    const img = await loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process image');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Return a PNG data URL — passthrough if already PNG, convert JPEG/WebP otherwise.
 * Optional cache avoids re-converting the same source during one PDF render.
 */
export async function ensurePngDataUrl(dataUrl, cache) {
    const trimmed = (dataUrl || '').trim();
    if (!trimmed) return '';
    if (isPngDataUrl(trimmed)) return trimmed;
    if (!isSupportedImageDataUrl(trimmed)) return '';

    if (cache?.has(trimmed)) {
        return cache.get(trimmed);
    }

    const png = await convertDataUrlToPng(trimmed);
    cache?.set(trimmed, png);
    return png;
}
