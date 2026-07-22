/** Public marketing site URL (no trailing slash). */
export const APP_WEBSITE_URL = 'https://mywaraqah.com';

/** Official social profiles (open in browser / Linking.openURL). */
export const APP_SOCIAL_LINKS = [
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/my.waraqah' },
    { id: 'x', label: 'X', url: 'https://x.com/mywaraqah' },
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/share/1DNt634787/' },
];

/** Hostname label for display, e.g. mywaraqah.com */
export function getAppDomain(url = APP_WEBSITE_URL) {
    return String(url || '')
        .trim()
        .replace(/\/$/, '')
        .replace(/^https?:\/\//i, '');
}

/** Footer CTA prefix shown on free-plan invoice PDFs only. */
export const FREE_PDF_FOOTER_CTA_PREFIX = 'Try yours at ';

/** Footer CTA shown on free-plan invoice PDFs only. */
export function getFreePdfFooterCta(domain = getAppDomain()) {
    return `${FREE_PDF_FOOTER_CTA_PREFIX}${domain}`;
}
