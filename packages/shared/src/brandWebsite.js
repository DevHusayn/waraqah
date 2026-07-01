/** Public marketing site URL (no trailing slash). */
export const APP_WEBSITE_URL = 'https://mywaraqah.com';

/** Hostname label for display, e.g. mywaraqah.com */
export function getAppDomain(url = APP_WEBSITE_URL) {
    return String(url || '')
        .trim()
        .replace(/\/$/, '')
        .replace(/^https?:\/\//i, '');
}
