// Utility for API requests with cookie-based auth + CSRF
import { API_BASE, getNetworkErrorMessage } from './apiConfig';
import { getCsrfToken, clearLegacyAuthStorage, setCsrfToken, clearCsrfToken } from './csrf';

clearLegacyAuthStorage();

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** @deprecated Session is cookie-based; use AuthContext.isAuthenticated instead. */
export function getToken() {
    return null;
}

export { getCsrfToken, setCsrfToken, clearCsrfToken, clearLegacyAuthStorage } from './csrf';

/** Fetch CSRF token from session when the cookie is not readable (cross-origin). */
async function bootstrapCsrfToken() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
            return data.csrfToken;
        }
    } catch {
        /* session may be expired */
    }
    return '';
}

export async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (UNSAFE_METHODS.has(method)) {
        let csrf = getCsrfToken();
        if (!csrf) {
            csrf = await bootstrapCsrfToken();
        }
        if (csrf) {
            headers['X-CSRF-Token'] = csrf;
        }
    }

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: 'include',
            headers,
        });
    } catch {
        throw new Error(getNetworkErrorMessage());
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 && !path.startsWith('/auth/me')) {
            clearLegacyAuthStorage();
            window.dispatchEvent(new Event('app-logout'));
        }
        const err = new Error(data.message || 'Something went wrong. Please try again.');
        if (data.code) err.code = data.code;
        if (data.usage) err.usage = data.usage;
        err.status = res.status;
        throw err;
    }

    return res.json();
}

export async function authFetch(path, options = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    } catch {
        throw new Error(getNetworkErrorMessage());
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || 'Something went wrong. Please try again.');
        if (data.code) err.code = data.code;
        err.status = res.status;
        throw err;
    }

    return data;
}
