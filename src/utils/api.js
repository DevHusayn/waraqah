// Utility for API requests with cookie-based auth + CSRF
import { API_BASE, getNetworkErrorMessage } from './apiConfig';
import { getCsrfToken, clearLegacyAuthStorage } from './csrf';

clearLegacyAuthStorage();

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** @deprecated Session is cookie-based; use AuthContext.isAuthenticated instead. */
export function getToken() {
    return null;
}

export async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (UNSAFE_METHODS.has(method)) {
        const csrf = getCsrfToken();
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

/** Auth endpoints that set cookies — use credentials but skip CSRF on first login/register. */
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
        err.status = res.status;
        throw err;
    }

    return data;
}
