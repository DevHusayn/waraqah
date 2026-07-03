import { getCsrfToken } from './csrf';
import { getAccessToken } from './authToken';

const HINT_KEY = 'waraqah_auth_hint';
const USER_CACHE_KEY = 'waraqah_user_cache';

function readAuthHint() {
    try {
        if (localStorage.getItem(HINT_KEY) === '1') return true;
        // One-time migration from tab-scoped hint (older builds).
        if (sessionStorage.getItem(HINT_KEY) === '1') {
            localStorage.setItem(HINT_KEY, '1');
            sessionStorage.removeItem(HINT_KEY);
            return true;
        }
    } catch {
        /* private browsing / storage blocked */
    }
    return false;
}

export function setAuthSessionHint() {
    try {
        localStorage.setItem(HINT_KEY, '1');
    } catch {
        /* private browsing / storage blocked */
    }
}

export function clearAuthSessionHint() {
    try {
        localStorage.removeItem(HINT_KEY);
        sessionStorage.removeItem(HINT_KEY);
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
        localStorage.setItem(
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
        const raw = localStorage.getItem(USER_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.email ? parsed : null;
    } catch {
        return null;
    }
}

export function clearUserProfileCache() {
    try {
        localStorage.removeItem(USER_CACHE_KEY);
    } catch {
        /* ignore */
    }
}

/** Best-effort signal that the user was recently signed in in this browser. */
export function hasLikelyAuthSession() {
    if (getAccessToken()) return true;
    if (getCsrfToken()) return true;
    if (getCachedUserProfile()) return true;
    return readAuthHint();
}

/** Start user data fetches as soon as a session is likely — don't wait for /auth/me. */
export function shouldPrefetchUserData(isAuthenticated) {
    return isAuthenticated || hasLikelyAuthSession();
}
