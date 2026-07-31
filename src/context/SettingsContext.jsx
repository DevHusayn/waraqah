import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { mergeBusinessInfoSummary, getCompanyLogoAvatarUrl } from '../utils/brandAssets';
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
    const [assetsReady, setAssetsReady] = useState(false);
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const userId = user?.id;
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const {
        data: businessInfo = EMPTY_BUSINESS,
        isLoading,
        isFetching,
        refetch: refetchBusinessInfo,
    } = useQuery({
        queryKey: queryKeys.businessInfo(userId),
        queryFn: async () => {
            const info = await apiFetch('/business-info?summary=1');
            const prev = queryClient.getQueryData(queryKeys.businessInfo(userId));
            return mergeBusinessInfoSummary(prev ?? EMPTY_BUSINESS, info);
        },
        enabled: shouldFetch && Boolean(userId),
        staleTime: STALE_TIMES.businessInfo,
    });

    const setBusinessInfo = useCallback(
        (updater) => {
            if (!userId) return;
            queryClient.setQueryData(queryKeys.businessInfo(userId), (prev) => {
                const current = prev ?? EMPTY_BUSINESS;
                return typeof updater === 'function' ? updater(current) : updater;
            });
        },
        [queryClient, userId]
    );

    const fetchBusinessInfo = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated && userId) {
                queryClient.setQueryData(queryKeys.businessInfo(userId), EMPTY_BUSINESS);
                assetsLoadedRef.current = false;
            }
            return;
        }
        const result = await refetchBusinessInfo();
        return result.data;
    }, [shouldFetch, authLoading, isAuthenticated, userId, refetchBusinessInfo, queryClient]);

    const fetchBusinessAssets = useCallback(async () => {
        if (!shouldFetch || assetsLoadedRef.current) {
            if (shouldFetch) setAssetsReady(true);
            return;
        }

        try {
            const assets = await apiFetch('/business-info/assets');
            assetsLoadedRef.current = true;
            setBusinessInfo((prev) => mergeBusinessInfoSummary(prev, { ...prev, ...assets }));
        } catch {
            /* branding assets are optional for initial render */
        } finally {
            setAssetsReady(true);
        }
    }, [shouldFetch, setBusinessInfo]);

    useEffect(() => {
        const onLogin = () => {
            assetsLoadedRef.current = false;
            setAssetsReady(false);
            fetchBusinessInfo().then(() => fetchBusinessAssets());
        };
        const onLogout = () => {
            assetsLoadedRef.current = false;
            setAssetsReady(false);
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchBusinessInfo, fetchBusinessAssets, queryClient]);

    useEffect(() => {
        if (!shouldFetch || isLoading) return;

        if (!isPremiumUser(businessInfo)) {
            setAssetsReady(true);
            return;
        }

        if (getCompanyLogoAvatarUrl(businessInfo)) {
            setAssetsReady(true);
            return;
        }

        fetchBusinessAssets();
    }, [shouldFetch, isLoading, businessInfo, fetchBusinessAssets]);

    const persistBusinessInfo = async (payload) => {
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setAssetsReady(true);
        setBusinessInfo(updated);
        invalidateDashboardQueries(userId);
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
        assetsReady,
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
