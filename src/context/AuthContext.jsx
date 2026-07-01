import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, authFetch } from '../utils/api';
import { clearLegacyAuthStorage, setCsrfToken, clearCsrfToken } from '../utils/csrf';
import { clearAccessToken } from '../utils/authToken';
import { setAuthSessionHint, clearAuthSessionHint } from '../utils/authHint';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        try {
            const data = await apiFetch('/auth/me');
            if (data.csrfToken) {
                setCsrfToken(data.csrfToken);
            } else if (!data.user) {
                clearCsrfToken();
            }
            setUser(data.user || null);
            if (data.user) {
                setAuthSessionHint();
            } else {
                clearAuthSessionHint();
            }
            return data.user || null;
        } catch {
            clearCsrfToken();
            clearAccessToken();
            clearAuthSessionHint();
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        clearLegacyAuthStorage();
        refreshSession().finally(() => setLoading(false));
    }, [refreshSession]);

    useEffect(() => {
        const onLogin = () => {
            refreshSession();
        };
        const onLogout = () => {
            clearCsrfToken();
            clearAccessToken();
            clearAuthSessionHint();
            setUser(null);
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [refreshSession]);

    const setSession = useCallback((nextUser) => {
        setUser(nextUser || null);
        if (nextUser) {
            setAuthSessionHint();
        } else {
            clearAuthSessionHint();
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch {
            /* cookie cleared server-side when possible */
        }
        setUser(null);
        clearCsrfToken();
        clearAccessToken();
        clearAuthSessionHint();
        window.dispatchEvent(new Event('app-logout'));
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            isAdmin: Boolean(user?.isAdmin),
            setSession,
            refreshSession,
            logout,
        }),
        [user, loading, setSession, refreshSession, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
