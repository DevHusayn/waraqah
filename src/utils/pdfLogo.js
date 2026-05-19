const PAGE_W = 210;
const PAGE_H = 297;
const LOGO_MAX_WIDTH_MM = 88;
const LOGO_MAX_HEIGHT_MM = 88;
const LOGO_OPACITY = 0.12;

function getImageFormat(dataUrl) {
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        return 'JPEG';
    }
    if (dataUrl.startsWith('data:image/webp')) {
        return 'WEBP';
    }
    return 'PNG';
}

function loadImageMeta(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Could not load logo image'));
        img.src = dataUrl;
    });
}

/** Centered watermark behind invoice content */
export async function drawPremiumLogoWatermark(doc, logoDataUrl) {
    if (!logoDataUrl || !logoDataUrl.startsWith('data:image')) {
        return;
    }

    const { width, height } = await loadImageMeta(logoDataUrl);
    const aspect = width / height;

    let w = LOGO_MAX_WIDTH_MM;
    let h = w / aspect;
    if (h > LOGO_MAX_HEIGHT_MM) {
        h = LOGO_MAX_HEIGHT_MM;
        w = h * aspect;
    }

    const x = (PAGE_W - w) / 2;
    const y = (PAGE_H - h) / 2;
    const format = getImageFormat(logoDataUrl);

    if (typeof doc.setGState === 'function' && doc.GState) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: LOGO_OPACITY }));
        doc.addImage(logoDataUrl, format, x, y, w, h, undefined, 'FAST');
        doc.restoreGraphicsState();
        return;
    }

    doc.addImage(logoDataUrl, format, x, y, w, h, undefined, 'FAST');
}
