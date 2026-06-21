import { API_BASE, getNetworkErrorMessage } from './config';
import { clearAuth, getToken } from './storage';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

export async function apiFetch(path, options = {}) {
    const token = await getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
        });
    } catch {
        throw new Error(getNetworkErrorMessage());
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
            await clearAuth();
            onUnauthorized?.();
        }
        const err = new Error(data.message || 'Something went wrong. Please try again.');
        if (data.code) err.code = data.code;
        if (data.usage) err.usage = data.usage;
        err.status = res.status;
        throw err;
    }

    return res.json();
}
