import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { BRAND_ASSET_FIELDS } from '../utils/brandAssets';
import { isPremiumUser } from '../utils/premium';
import { DEFAULT_BRAND_COLOR } from '@waraqah/shared';

const SettingsContext = createContext();

const EMPTY_BUSINESS = {
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    defaultCurrency: 'NGN',
    taxRate: 10,
    brandColor: DEFAULT_BRAND_COLOR,
    plan: 'free',
    businessLogo: '',
    companyLogoUrl: '',
    companyLogoAvatarUrl: '',
    companyStampUrl: '',
    authorizedSignatureUrl: '',
    paymentAccountName: '',
    paymentBankName: '',
    paymentAccountNumber: '',
    paymentInstructions: '',
    invoiceTemplateId: 'classic',
    autoEmailInvoices: false,
    autoPaymentReminders: true,
};

/** Summary responses intentionally send empty asset placeholders — keep loaded branding in memory. */
const SUMMARY_ASSET_FIELDS = ['businessLogo', ...BRAND_ASSET_FIELDS];

function mergeSummaryBusinessInfo(prev, info) {
    if (!isPremiumUser(info)) {
        return info;
    }
    const next = { ...info };
    for (const field of SUMMARY_ASSET_FIELDS) {
        const incoming = (info[field] || '').trim();
        const existing = (prev[field] || '').trim();
        if (!incoming && existing) {
            next[field] = prev[field];
        }
    }
    return next;
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [businessInfo, setBusinessInfo] = useState(EMPTY_BUSINESS);
    const [loading, setLoading] = useState(false);
    const assetsLoadedRef = useRef(false);
    const hasHydratedRef = useRef(false);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);
    const authLoadingRef = useRef(authLoading);
    const isAuthenticatedRef = useRef(isAuthenticated);
    authLoadingRef.current = authLoading;
    isAuthenticatedRef.current = isAuthenticated;

    const fetchBusinessInfo = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoadingRef.current && !isAuthenticatedRef.current) {
                setBusinessInfo(EMPTY_BUSINESS);
                assetsLoadedRef.current = false;
                hasHydratedRef.current = false;
            }
            setLoading(false);
            return;
        }
        // Avoid avatar/skeleton flicker on auth settle or billing refresh.
        if (!hasHydratedRef.current) {
            setLoading(true);
        }
        try {
            const info = await apiFetch('/business-info?summary=1');
            setBusinessInfo((prev) => mergeSummaryBusinessInfo(prev, info));
            hasHydratedRef.current = true;
        } catch {
            if (!authLoadingRef.current && !isAuthenticatedRef.current) {
                setBusinessInfo(EMPTY_BUSINESS);
                hasHydratedRef.current = false;
            }
        } finally {
            setLoading(false);
        }
    }, [shouldFetch]);

    const fetchBusinessAssets = useCallback(async () => {
        if (!shouldFetch || assetsLoadedRef.current) return;
        try {
            const assets = await apiFetch('/business-info/assets');
            assetsLoadedRef.current = true;
            setBusinessInfo((prev) => ({ ...prev, ...assets }));
        } catch {
            /* branding assets are optional for initial render */
        }
    }, [shouldFetch]);

    useEffect(() => {
        fetchBusinessInfo();
        const onLogin = () => {
            assetsLoadedRef.current = false;
            fetchBusinessInfo().then(() => {
                fetchBusinessAssets();
            });
        };
        const onLogout = () => {
            setBusinessInfo(EMPTY_BUSINESS);
            setLoading(false);
            assetsLoadedRef.current = false;
            hasHydratedRef.current = false;
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchBusinessInfo, fetchBusinessAssets]);

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

    const saveCompanyLogo = async ({ companyLogoUrl, companyLogoAvatarUrl }) => {
        const payload = buildBusinessInfoPayload(
            {
                companyLogoUrl,
                companyLogoAvatarUrl,
                businessLogo: companyLogoUrl,
            },
            businessInfo
        );
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setBusinessInfo(updated);
        return updated;
    };

    const saveBusinessLogo = async (logoDataUrl) => {
        return saveBusinessAsset('companyLogoUrl', logoDataUrl);
    };

    const value = {
        businessInfo,
        updateBusinessInfo,
        setBusinessInfo,
        loading,
        refreshBusinessInfo: fetchBusinessInfo,
        fetchBusinessAssets,
        saveBusinessLogo,
        saveCompanyLogo,
        saveBusinessAsset,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
