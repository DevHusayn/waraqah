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
        throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return res.json();
}
