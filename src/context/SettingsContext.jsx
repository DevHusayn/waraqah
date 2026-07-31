import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { BRAND_ASSET_FIELDS } from '../utils/brandAssets';
import { isPremiumUser } from '../utils/premium';
import { DEFAULT_BRAND_COLOR } from '@waraqah/shared';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { invalidateDashboardQueries } from '../lib/queryClient';

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
    const queryClient = useQueryClient();
    const assetsLoadedRef = useRef(false);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const {
        data: businessInfo = EMPTY_BUSINESS,
        isLoading,
        isFetching,
        refetch: refetchBusinessInfo,
    } = useQuery({
        queryKey: queryKeys.businessInfo,
        queryFn: async () => {
            const info = await apiFetch('/business-info?summary=1');
            return info;
        },
        enabled: shouldFetch,
        staleTime: STALE_TIMES.businessInfo,
        placeholderData: (prev) => prev ?? EMPTY_BUSINESS,
    });

    const setBusinessInfo = useCallback(
        (updater) => {
            queryClient.setQueryData(queryKeys.businessInfo, (prev) => {
                const current = prev ?? EMPTY_BUSINESS;
                return typeof updater === 'function' ? updater(current) : updater;
            });
        },
        [queryClient]
    );

    const fetchBusinessInfo = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                queryClient.setQueryData(queryKeys.businessInfo, EMPTY_BUSINESS);
                assetsLoadedRef.current = false;
            }
            return;
        }
        const result = await refetchBusinessInfo();
        return result.data;
    }, [shouldFetch, authLoading, isAuthenticated, refetchBusinessInfo, queryClient]);

    const fetchBusinessAssets = useCallback(async () => {
        if (!shouldFetch || assetsLoadedRef.current) return;
        try {
            const assets = await apiFetch('/business-info/assets');
            assetsLoadedRef.current = true;
            setBusinessInfo((prev) => mergeSummaryBusinessInfo(prev, { ...prev, ...assets }));
        } catch {
            /* branding assets are optional for initial render */
        }
    }, [shouldFetch, setBusinessInfo]);

    useEffect(() => {
        const onLogin = () => {
            assetsLoadedRef.current = false;
            fetchBusinessInfo().then(() => fetchBusinessAssets());
        };
        const onLogout = () => {
            queryClient.setQueryData(queryKeys.businessInfo, EMPTY_BUSINESS);
            queryClient.removeQueries({ queryKey: queryKeys.businessInfo });
            assetsLoadedRef.current = false;
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchBusinessInfo, fetchBusinessAssets, queryClient]);

    const persistBusinessInfo = async (payload) => {
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setBusinessInfo(updated);
        invalidateDashboardQueries();
        return updated;
    };

    const updateBusinessInfo = async (info) => {
        const payload = buildBusinessInfoPayload(info, businessInfo);
        return persistBusinessInfo(payload);
    };

    const saveBusinessAsset = async (field, dataUrl) => {
        const payload = buildBusinessInfoPayload({ [field]: dataUrl }, businessInfo);
        return persistBusinessInfo(payload);
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
        return persistBusinessInfo(payload);
    };

    const saveBusinessLogo = async (logoDataUrl) => saveBusinessAsset('companyLogoUrl', logoDataUrl);

    const value = {
        businessInfo,
        updateBusinessInfo,
        setBusinessInfo,
        loading: isLoading || (isFetching && businessInfo === EMPTY_BUSINESS),
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
