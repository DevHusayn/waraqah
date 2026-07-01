/** JWT for cross-origin API calls when httpOnly session cookies are blocked (e.g. mywaraqah.com → api host). */
const STORAGE_KEY = 'waraqah_access_token';

let memoryToken = '';

export function setAccessToken(token) {
    memoryToken = token ? String(token) : '';
    try {
        if (memoryToken) {
            sessionStorage.setItem(STORAGE_KEY, memoryToken);
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        /* private browsing / storage blocked */
    }
}

export function getAccessToken() {
    if (memoryToken) return memoryToken;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) memoryToken = stored;
        return stored || '';
    } catch {
        return '';
    }
}

export function clearAccessToken() {
    memoryToken = '';
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}
