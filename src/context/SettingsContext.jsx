import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
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
    const { isAuthenticated, loading: authLoading } = useAuth();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const fetchBusinessInfo = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                setBusinessInfo(EMPTY_BUSINESS);
            }
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const info = await apiFetch('/business-info');
            setBusinessInfo(info);
        } catch {
            if (!authLoading && !isAuthenticated) {
                setBusinessInfo(EMPTY_BUSINESS);
            }
        } finally {
            setLoading(false);
        }
    }, [shouldFetch, authLoading, isAuthenticated]);

    useEffect(() => {
        fetchBusinessInfo();
        const onLogin = () => fetchBusinessInfo();
        const onLogout = () => {
            setBusinessInfo(EMPTY_BUSINESS);
            setLoading(false);
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchBusinessInfo]);

    const updateBusinessInfo = async (info) => {
        const payload = buildBusinessInfoPayload(info, businessInfo);
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        setBusinessInfo(updated);
        return updated;
    };

    const saveBusinessAsset = async (field, dataUrl) => {
        const payload = buildBusinessInfoPayload({ [field]: dataUrl }, businessInfo);
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
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
