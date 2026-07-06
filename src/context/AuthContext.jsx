import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';
import { clearLegacyAuthStorage, setCsrfToken, clearCsrfToken } from '../utils/csrf';
import { clearAccessToken } from '../utils/authToken';
import {
    setAuthSessionHint,
    clearAuthSessionHint,
    hasLikelyAuthSession,
    cacheUserProfile,
    getCachedUserProfile,
    clearUserProfileCache,
    clearLegacyAuthHints,
} from '../utils/authHint';

const AuthContext = createContext(null);
const AUTH_PROBE_TIMEOUT_MS = 8000;

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const likelySessionRef = useRef(hasLikelyAuthSession());
    const [user, setUser] = useState(() =>
        likelySessionRef.current ? getCachedUserProfile() : null
    );
    const [resolving, setResolving] = useState(true);

    const clearSession = useCallback(() => {
        clearCsrfToken();
        clearAccessToken();
        clearAuthSessionHint();
        clearUserProfileCache();
        setUser(null);
        likelySessionRef.current = false;
    }, []);

    const applySessionUser = useCallback((nextUser) => {
        setUser(nextUser || null);
        if (nextUser) {
            cacheUserProfile(nextUser);
            setAuthSessionHint();
            likelySessionRef.current = true;
        } else {
            clearUserProfileCache();
            clearAuthSessionHint();
            likelySessionRef.current = false;
        }
    }, []);

    const refreshSession = useCallback(async () => {
        try {
            const data = await apiFetch('/auth/me', { timeoutMs: AUTH_PROBE_TIMEOUT_MS });
            if (data.csrfToken) {
                setCsrfToken(data.csrfToken);
            } else if (!data.user) {
                clearCsrfToken();
            }
            applySessionUser(data.user || null);
            return data.user || null;
        } catch (err) {
            if (err.status === 401 || !likelySessionRef.current) {
                clearSession();
            }
            return null;
        }
    }, [applySessionUser, clearSession]);

    useEffect(() => {
        clearLegacyAuthStorage();
        clearLegacyAuthHints();
        refreshSession().finally(() => setResolving(false));
    }, [refreshSession]);

    useEffect(() => {
        const onLogin = () => {
            refreshSession();
        };
        const onLogout = () => {
            clearSession();
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [refreshSession, clearSession]);

    const setSession = useCallback(
        (nextUser) => {
            applySessionUser(nextUser);
        },
        [applySessionUser]
    );

    const logout = useCallback(async () => {
        try {
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch {
            /* cookie cleared server-side when possible */
        }
        clearSession();
        window.dispatchEvent(new Event('app-logout'));
    }, [clearSession]);

    const isAuthenticated = Boolean(user);

    const loading = resolving;

    const value = useMemo(
        () => ({
            user,
            loading,
            resolving,
            isAuthenticated,
            isAdmin: Boolean(user?.isAdmin),
            setSession,
            refreshSession,
            logout,
        }),
        [user, loading, resolving, isAuthenticated, setSession, refreshSession, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
