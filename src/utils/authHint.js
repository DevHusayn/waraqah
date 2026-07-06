import { getCsrfToken } from './csrf';
import { getAccessToken } from './authToken';

const HINT_KEY = 'waraqah_auth_hint';
const USER_CACHE_KEY = 'waraqah_user_cache';

function readAuthHint() {
    try {
        if (sessionStorage.getItem(HINT_KEY) === '1') return true;
    } catch {
        /* private browsing / storage blocked */
    }
    return false;
}

export function setAuthSessionHint() {
    try {
        sessionStorage.setItem(HINT_KEY, '1');
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

export function cacheUserProfile(user) {
    if (!user) {
        clearUserProfileCache();
        return;
    }
    try {
        sessionStorage.setItem(
            USER_CACHE_KEY,
            JSON.stringify({
                id: user.id || user._id || null,
                email: user.email || '',
                emailVerified: user.emailVerified !== false,
                isAdmin: Boolean(user.isAdmin),
            })
        );
    } catch {
        /* storage blocked */
    }
}

export function getCachedUserProfile() {
    try {
        const raw = sessionStorage.getItem(USER_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.email ? parsed : null;
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

/** Best-effort signal that this tab has an active session (tab-scoped only). */
export function hasLikelyAuthSession() {
    if (getAccessToken()) return true;
    if (getCsrfToken()) return true;
    if (getCachedUserProfile()) return true;
    return readAuthHint();
}

/** Start user data fetches once auth is confirmed or this tab holds a session token. */
export function shouldPrefetchUserData(isAuthenticated) {
    return isAuthenticated || Boolean(getAccessToken());
}

/** Remove stale cross-tab auth artifacts from older builds. */
export function clearLegacyAuthHints() {
    clearAuthSessionHint();
    clearUserProfileCache();
}
