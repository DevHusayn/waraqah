import { getCsrfToken } from './csrf';

const HINT_KEY = 'waraqah_auth_hint';

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
    } catch {
        /* ignore */
    }
}

/** Best-effort signal that the user was recently signed in on this tab. */
export function hasLikelyAuthSession() {
    if (getCsrfToken()) return true;
    try {
        return sessionStorage.getItem(HINT_KEY) === '1';
    } catch {
        return false;
    }
}

/** Start user data fetches in parallel with /auth/me when a session is likely present. */
export function shouldPrefetchUserData(isAuthenticated, authLoading) {
    return isAuthenticated || (authLoading && hasLikelyAuthSession());
}
