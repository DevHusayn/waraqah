export const PDF_PAGE_DIMENSIONS = {
    a4: { width: 210, height: 297, format: 'a4' },
    letter: { width: 215.9, height: 279.4, format: 'letter' },
};

function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

/** Prefer Letter on mobile (matches most phone print dialogs); A4 elsewhere. */
export function resolvePdfPaperFormat(options = {}) {
    const requested = options.paperFormat;
    if (requested && PDF_PAGE_DIMENSIONS[requested]) {
        return requested;
    }
    if (isMobileDevice()) {
        return 'letter';
    }
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language || '';
        if (/^en-US/i.test(lang)) {
            return 'letter';
        }
    }
    return 'a4';
}

export function getPdfPageDimensions(format = 'a4') {
    return PDF_PAGE_DIMENSIONS[format] || PDF_PAGE_DIMENSIONS.a4;
}
