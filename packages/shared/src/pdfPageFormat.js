export const PDF_PAGE_DIMENSIONS = {
    a4: { width: 210, height: 297, format: 'a4' },
    letter: { width: 215.9, height: 279.4, format: 'letter' },
};

/** Prefer Letter for en-US browsers; A4 elsewhere (common for NG/EU). Override via options.paperFormat. */
export function resolvePdfPaperFormat(options = {}) {
    const requested = options.paperFormat;
    if (requested && PDF_PAGE_DIMENSIONS[requested]) {
        return requested;
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
