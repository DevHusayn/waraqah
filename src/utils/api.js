// Utility for API requests with JWT
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getToken() {
    return localStorage.getItem('token');
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
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
        throw new Error('Unable to connect to the server. Check your connection and try again.');
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
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
