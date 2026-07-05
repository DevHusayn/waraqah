import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { buildBusinessInfoPayload } from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { getToken } from '../api/storage';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const EMPTY_BUSINESS = {
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    defaultCurrency: 'NGN',
    taxRate: 10,
    brandColor: '#16A34A',
    plan: 'free',
    businessLogo: '',
    companyLogoUrl: '',
    companyLogoAvatarUrl: '',
    companyStampUrl: '',
    authorizedSignatureUrl: '',
};

export function SettingsProvider({ children }) {
    const { sessionVersion, isAuthenticated } = useAuth();
    const [businessInfo, setBusinessInfo] = useState(EMPTY_BUSINESS);
    const [loading, setLoading] = useState(true);
    const assetsLoadedRef = useRef(false);

    const fetchBusinessInfo = useCallback(async () => {
        const token = await getToken();
        if (!token) {
            setBusinessInfo(EMPTY_BUSINESS);
            assetsLoadedRef.current = false;
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const info = await apiFetch('/business-info?summary=1');
            setBusinessInfo(info);
        } catch {
            setBusinessInfo(EMPTY_BUSINESS);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBusinessAssets = useCallback(async () => {
        const token = await getToken();
        if (!token || assetsLoadedRef.current) return;
        try {
            const assets = await apiFetch('/business-info/assets');
            assetsLoadedRef.current = true;
            setBusinessInfo((prev) => ({ ...prev, ...assets }));
        } catch {
            /* optional branding assets */
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            assetsLoadedRef.current = false;
            fetchBusinessInfo();
        } else {
            setBusinessInfo(EMPTY_BUSINESS);
            assetsLoadedRef.current = false;
            setLoading(false);
        }
    }, [sessionVersion, isAuthenticated, fetchBusinessInfo]);

    const updateBusinessInfo = async (info) => {
        const payload = buildBusinessInfoPayload(info, businessInfo);
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setBusinessInfo(updated);
        return updated;
    };

    const saveBusinessAsset = async (field, dataUrl) => {
        const payload = buildBusinessInfoPayload({ [field]: dataUrl }, businessInfo);
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setBusinessInfo(updated);
        return updated;
    };

    return (
        <SettingsContext.Provider
            value={{
                businessInfo,
                setBusinessInfo,
                loading,
                updateBusinessInfo,
                refreshBusinessInfo: fetchBusinessInfo,
                fetchBusinessAssets,
                saveBusinessAsset,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}
