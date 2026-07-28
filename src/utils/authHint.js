import { getCsrfToken } from './csrf';
import { getAccessToken } from './authToken';

const HINT_KEY = 'waraqah_auth_hint';
const USER_CACHE_KEY = 'waraqah_user_cache';

function readAuthHint() {
    try {
        if (sessionStorage.getItem(HINT_KEY) === '1') return true;
        if (localStorage.getItem(HINT_KEY) === '1') return true;
    } catch {
        /* private browsing / storage blocked */
    }
    return false;
}

export function setAuthSessionHint() {
    try {
        sessionStorage.setItem(HINT_KEY, '1');
        localStorage.setItem(HINT_KEY, '1');
    } catch {
        /* private browsing / storage blocked */
    }
}

export function clearAuthSessionHint() {
    try {
        sessionStorage.removeItem(HINT_KEY);
        localStorage.removeItem(HINT_KEY);
    } catch {
        /* ignore */
    }
}

function serializeUserProfile(user) {
    return JSON.stringify({
        id: user.id || user._id || null,
        email: user.email || '',
        emailVerified: user.emailVerified !== false,
        isAdmin: Boolean(user.isAdmin),
    });
}

function parseCachedUserProfile(raw) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed?.email ? parsed : null;
    } catch {
        return null;
    }
}

export function cacheUserProfile(user) {
    if (!user) {
        clearUserProfileCache();
        return;
    }
    const payload = serializeUserProfile(user);
    try {
        sessionStorage.setItem(USER_CACHE_KEY, payload);
        localStorage.setItem(USER_CACHE_KEY, payload);
    } catch {
        /* storage blocked */
    }
}

export function getCachedUserProfile() {
    try {
        return (
            parseCachedUserProfile(sessionStorage.getItem(USER_CACHE_KEY)) ||
            parseCachedUserProfile(localStorage.getItem(USER_CACHE_KEY))
        );
    } catch {
        return null;
    }
}

export function clearUserProfileCache() {
    try {
        sessionStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
    } catch {
        /* ignore */
    }
}

/** Best-effort signal that the browser likely holds an active session. */
export function hasLikelyAuthSession() {
    if (getAccessToken()) return true;
    if (getCsrfToken()) return true;
    if (getCachedUserProfile()) return true;
    return readAuthHint();
}

/** Start user data fetches once auth is confirmed or the browser likely holds a session. */
export function shouldPrefetchUserData(isAuthenticated) {
    return isAuthenticated || hasLikelyAuthSession();
}

/** Remove stale cross-tab auth artifacts from older builds (localStorage only). */
export function clearLegacyAuthHints() {
    try {
        localStorage.removeItem(HINT_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
    } catch {
        /* ignore */
    }
}
