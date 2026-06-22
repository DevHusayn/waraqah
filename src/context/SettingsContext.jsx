import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken } from '../utils/api';
import { buildBusinessInfoPayload } from '../utils/businessPayload';

const SettingsContext = createContext();

const EMPTY_BUSINESS = {
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    defaultCurrency: 'NGN',
    taxRate: 10,
    brandColor: '#0ea5e9',
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
    const [loading, setLoading] = useState(true);

    const fetchBusinessInfo = useCallback(async () => {
        if (!getToken()) {
            setBusinessInfo(EMPTY_BUSINESS);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const info = await apiFetch('/business-info');
            setBusinessInfo(info);
        } catch {
            setBusinessInfo(EMPTY_BUSINESS);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const saveBusinessAsset = async (field, dataUrl, formSnapshot = {}) => {
        const payload = buildBusinessInfoPayload(
            { ...businessInfo, ...formSnapshot, [field]: dataUrl },
            businessInfo
        );
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        setBusinessInfo(updated);
        return updated;
    };

    const saveCompanyLogo = async (
        { companyLogoUrl, companyLogoAvatarUrl },
        formSnapshot = {}
    ) => {
        const payload = buildBusinessInfoPayload(
            {
                ...businessInfo,
                ...formSnapshot,
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

    const saveBusinessLogo = async (logoDataUrl, formSnapshot = {}) => {
        return saveBusinessAsset('companyLogoUrl', logoDataUrl, formSnapshot);
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
