import { getCsrfToken } from './csrf';
import { getAccessToken } from './authToken';
import { needsBusinessSetup } from '@waraqah/shared';

const HINT_KEY = 'waraqah_auth_hint';
const USER_CACHE_KEY = 'waraqah_user_cache';
const BUSINESS_CACHE_KEY = 'waraqah_business_cache';

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

function serializeBusinessSummary(info, userId) {
    const avatar = String(
        info.companyLogoAvatarUrl || info.companyLogoUrl || info.businessLogo || ''
    ).trim();
    const cacheAvatar =
        avatar.startsWith('http://') || avatar.startsWith('https://')
            ? avatar
            : avatar.length > 0 && avatar.length <= 150_000
              ? avatar
              : '';

    return JSON.stringify({
        userId: String(userId || ''),
        name: String(info.name || '').trim(),
        address: String(info.address || '').trim(),
        email: String(info.email || '').trim(),
        phone: String(info.phone || '').trim(),
        plan: info.plan || 'free',
        defaultCurrency: info.defaultCurrency || 'NGN',
        brandColor: String(info.brandColor || '').trim(),
        companyLogoAvatarUrl: cacheAvatar,
    });
}

function parseCachedBusinessSummary(raw, expectedUserId) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.name) return null;
        if (expectedUserId) {
            const expected = String(expectedUserId);
            if (!parsed.userId || String(parsed.userId) !== expected) return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/** Cache business name and summary fields for instant dashboard header on refresh. */
export function cacheBusinessSummary(info, userId) {
    if (!userId || !info?.name?.trim()) {
        return;
    }
    if (needsBusinessSetup(info)) {
        return;
    }
    const payload = serializeBusinessSummary(info, userId);
    try {
        sessionStorage.setItem(BUSINESS_CACHE_KEY, payload);
        localStorage.setItem(BUSINESS_CACHE_KEY, payload);
    } catch {
        /* storage blocked */
    }
}

export function getCachedBusinessSummary(userId) {
    if (!userId) return null;
    try {
        return (
            parseCachedBusinessSummary(sessionStorage.getItem(BUSINESS_CACHE_KEY), userId) ||
            parseCachedBusinessSummary(localStorage.getItem(BUSINESS_CACHE_KEY), userId)
        );
    } catch {
        return null;
    }
}

export function clearBusinessSummaryCache() {
    try {
        sessionStorage.removeItem(BUSINESS_CACHE_KEY);
        localStorage.removeItem(BUSINESS_CACHE_KEY);
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
        localStorage.removeItem(BUSINESS_CACHE_KEY);
    } catch {
        /* ignore */
    }
}
