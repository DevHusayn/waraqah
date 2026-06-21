import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { clearAuth, getIsAdmin, getToken, setIsAdmin, setToken } from '../api/storage';
import { getNetworkErrorMessage } from '../api/config';

const AuthContext = createContext(null);

const AUTH_URL = '/auth';

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(null);
    const [isAdmin, setIsAdminState] = useState(false);
    const [booting, setBooting] = useState(true);
    const [sessionVersion, setSessionVersion] = useState(0);

    const refreshSession = useCallback(async () => {
        const stored = await getToken();
        const admin = await getIsAdmin();
        setTokenState(stored || null);
        setIsAdminState(admin);
        return Boolean(stored);
    }, []);

    useEffect(() => {
        refreshSession().finally(() => setBooting(false));
    }, [refreshSession]);

    const bumpSession = useCallback(() => {
        setSessionVersion((v) => v + 1);
    }, []);

    const login = useCallback(
        async (email, password) => {
            let res;
            try {
                res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}${AUTH_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
                });
            } catch {
                throw new Error(getNetworkErrorMessage());
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');
            await setToken(data.token);
            await setIsAdmin(Boolean(data.user?.isAdmin));
            await refreshSession();
            bumpSession();
            return data;
        },
        [refreshSession, bumpSession]
    );

    const register = useCallback(
        async (email, password, businessInfo) => {
            let res;
            try {
                res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}${AUTH_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password,
                        businessInfo: {
                            ...businessInfo,
                            email: businessInfo.email?.trim().toLowerCase(),
                            defaultCurrency: 'NGN',
                        },
                    }),
                });
            } catch {
                throw new Error(getNetworkErrorMessage());
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            await setToken(data.token);
            await setIsAdmin(Boolean(data.user?.isAdmin));
            await refreshSession();
            bumpSession();
            return data;
        },
        [refreshSession, bumpSession]
    );

    const logout = useCallback(async () => {
        await clearAuth();
        setTokenState(null);
        setIsAdminState(false);
        bumpSession();
    }, [bumpSession]);

    const forgotPassword = useCallback(async (email) => {
        return apiFetch(`${AUTH_URL}/forgot-password`, {
            method: 'POST',
            body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
    }, []);

    const resetPassword = useCallback(async (tokenValue, password) => {
        return apiFetch(`${AUTH_URL}/reset-password/${tokenValue}`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    }, []);

    const value = useMemo(
        () => ({
            token,
            isAuthenticated: Boolean(token),
            isAdmin,
            booting,
            sessionVersion,
            login,
            register,
            logout,
            forgotPassword,
            resetPassword,
            refreshSession,
        }),
        [token, isAdmin, booting, sessionVersion, login, register, logout, forgotPassword, resetPassword, refreshSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
