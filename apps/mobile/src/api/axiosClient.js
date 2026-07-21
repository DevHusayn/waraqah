import axios from 'axios';
import { API_BASE, getNetworkErrorMessage } from './config';
import { clearAuth, getToken } from './storage';

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

export const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response) {
            const err = new Error(getNetworkErrorMessage());
            err.isNetworkError = true;
            throw err;
        }

        const { status, data } = error.response;
        if (status === 401) {
            await clearAuth();
            onUnauthorized?.();
        }

        const err = new Error(data?.message || 'Something went wrong. Please try again.');
        if (data?.code) err.code = data.code;
        if (data?.usage) err.usage = data.usage;
        err.status = status;
        throw err;
    }
);

/** Drop-in replacement for the previous fetch helper */
export async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toLowerCase();
    const body = options.body ? JSON.parse(options.body) : undefined;
    const res = await api.request({
        url: path,
        method,
        data: body,
        headers: options.headers,
    });
    return res.data;
}
