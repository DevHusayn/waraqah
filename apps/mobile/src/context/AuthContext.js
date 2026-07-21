import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { clearAuth, getIsAdmin, getToken, setIsAdmin, setToken } from '../api/storage';
import { getNetworkErrorMessage } from '../api/config';

const AuthContext = createContext(null);

const AUTH_URL = '/auth';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

async function postAuth(path, body) {
    let res;
    try {
        res = await fetch(`${API_BASE}${AUTH_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error(getNetworkErrorMessage());
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || 'Request failed');
        if (data.code) err.code = data.code;
        err.status = res.status;
        throw err;
    }
    return data;
}

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdminState] = useState(false);
    const [booting, setBooting] = useState(true);
    const [sessionVersion, setSessionVersion] = useState(0);

    const bumpSession = useCallback(() => {
        setSessionVersion((v) => v + 1);
    }, []);

    const applySession = useCallback(async (nextToken, nextUser) => {
        if (nextToken) {
            await setToken(nextToken);
            await setIsAdmin(Boolean(nextUser?.isAdmin));
            setTokenState(nextToken);
            setIsAdminState(Boolean(nextUser?.isAdmin));
            setUser(nextUser || null);
        } else {
            await clearAuth();
            setTokenState(null);
            setIsAdminState(false);
            setUser(null);
        }
        bumpSession();
    }, [bumpSession]);

    const refreshSession = useCallback(async () => {
        const stored = await getToken();
        const admin = await getIsAdmin();
        if (!stored) {
            setTokenState(null);
            setUser(null);
            setIsAdminState(false);
            return false;
        }

        setTokenState(stored);
        setIsAdminState(admin);

        try {
            const data = await apiFetch('/auth/me');
            if (!data?.user) {
                await clearAuth();
                setTokenState(null);
                setUser(null);
                setIsAdminState(false);
                return false;
            }
            setUser(data.user);
            setIsAdminState(Boolean(data.user.isAdmin));
            await setIsAdmin(Boolean(data.user.isAdmin));
            return true;
        } catch {
            // Keep local token if offline; clear only on explicit 401 via interceptor
            return Boolean(stored);
        }
    }, []);

    useEffect(() => {
        refreshSession().finally(() => setBooting(false));
    }, [refreshSession]);

    const login = useCallback(
        async (email, password) => {
            const data = await postAuth('/login', {
                email: email.trim().toLowerCase(),
                password,
            });
            await applySession(data.token, data.user);
            return data;
        },
        [applySession]
    );

    const register = useCallback(async (email, password, businessInfo) => {
        const data = await postAuth('/register', {
            email: email.trim().toLowerCase(),
            password,
            name: businessInfo?.name,
            businessInfo: {
                ...businessInfo,
                email: businessInfo.email?.trim().toLowerCase(),
                defaultCurrency: 'NGN',
            },
        });
        // Backend requires email verification before login — do not store a token
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch {
            // Local logout still proceeds
        }
        await applySession(null, null);
    }, [applySession]);

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

    const verifyEmail = useCallback(async (tokenValue) => {
        return apiFetch(`${AUTH_URL}/verify-email/${tokenValue}`, { method: 'POST' });
    }, []);

    const resendVerificationEmail = useCallback(async (email) => {
        return apiFetch(`${AUTH_URL}/resend-verification-email`, {
            method: 'POST',
            body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
    }, []);

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            isAdmin,
            booting,
            sessionVersion,
            login,
            register,
            logout,
            forgotPassword,
            resetPassword,
            verifyEmail,
            resendVerificationEmail,
            refreshSession,
        }),
        [
            token,
            user,
            isAdmin,
            booting,
            sessionVersion,
            login,
            register,
            logout,
            forgotPassword,
            resetPassword,
            verifyEmail,
            resendVerificationEmail,
            refreshSession,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
