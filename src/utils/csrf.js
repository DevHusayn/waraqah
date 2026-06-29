/** Read the CSRF double-submit cookie set by the API on login/register. */
export function getCsrfToken() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)waraqah_csrf=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

/** Clear legacy JWT storage from before httpOnly cookie auth. */
export function clearLegacyAuthStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
}
