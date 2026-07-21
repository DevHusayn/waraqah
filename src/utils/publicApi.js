import { API_BASE, getNetworkErrorMessage } from './apiConfig';
import { tagNetworkError, tagServerError } from '../errors/classifyError';

/** Unauthenticated API calls (public invoice view, etc.). */
export async function publicFetch(path, options = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    } catch {
        throw tagNetworkError(new Error(getNetworkErrorMessage()));
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || 'Something went wrong. Please try again.');
        err.status = res.status;
        if (res.status >= 500) tagServerError(err, res.status);
        throw err;
    }

    return data;
}

export function getPublicInvoicePath(publicToken) {
    return `/i/${publicToken}`;
}

export function getPublicInvoiceUrl(publicToken) {
    if (!publicToken) return '';
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}${getPublicInvoicePath(publicToken)}`;
    }
    return getPublicInvoicePath(publicToken);
}
