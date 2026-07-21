import { ERROR_TYPES } from './errorStates';

const NETWORK_MESSAGE_RE =
    /failed to fetch|networkerror|network request failed|load failed|internet connection|couldn't connect|could not connect|check your connection|check your internet|offline|err_internet_disconnected|err_network_changed/i;

/**
 * Classify a failure into a user-facing error type.
 * Prefers explicit error metadata, then connectivity, then HTTP status.
 */
export function classifyError(error, { isOnline = typeof navigator === 'undefined' ? true : navigator.onLine } = {}) {
    if (!isOnline) {
        return ERROR_TYPES.OFFLINE;
    }

    if (isNetworkError(error)) {
        return ERROR_TYPES.OFFLINE;
    }

    const status = Number(error?.status);
    if (Number.isFinite(status) && status >= 500 && status < 600) {
        return ERROR_TYPES.SERVER;
    }

    if (error?.code === 'SERVER_ERROR' || error?.type === ERROR_TYPES.SERVER) {
        return ERROR_TYPES.SERVER;
    }

    return ERROR_TYPES.UNEXPECTED;
}

export function isNetworkError(error) {
    if (!error) return false;
    if (error.code === 'NETWORK_ERROR' || error.isNetworkError === true) return true;
    if (error.type === ERROR_TYPES.OFFLINE) return true;
    if (error.name === 'TypeError' && NETWORK_MESSAGE_RE.test(error.message || '')) return true;
    return NETWORK_MESSAGE_RE.test(error.message || '');
}

/** Attach metadata so callers (and ErrorFallback) can classify reliably. */
export function tagNetworkError(error) {
    if (!error || typeof error !== 'object') return error;
    error.code = error.code || 'NETWORK_ERROR';
    error.isNetworkError = true;
    return error;
}

export function tagServerError(error, status = 503) {
    if (!error || typeof error !== 'object') return error;
    error.status = error.status ?? status;
    error.code = error.code || 'SERVER_ERROR';
    return error;
}
