/** In-memory CSRF token for cross-origin API calls (cookie is not readable across domains). */
let memoryCsrfToken = '';

export function setCsrfToken(token) {
    memoryCsrfToken = token ? String(token) : '';
}

export function clearCsrfToken() {
    memoryCsrfToken = '';
}

/** Read CSRF token — memory first, then same-origin cookie fallback for local dev. */
export function getCsrfToken() {
    if (memoryCsrfToken) return memoryCsrfToken;

    if (typeof document === 'undefined') return '';

    const match = document.cookie.match(/(?:^|;\s*)waraqah_csrf=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/** Clear legacy JWT storage from before httpOnly cookie auth. */
export function clearLegacyAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
}
