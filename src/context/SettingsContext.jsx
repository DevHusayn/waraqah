import { createContext, useContext, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData, getCachedBusinessSummary, cacheBusinessSummary } from '../utils/authHint';
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
    timezone: 'Africa/Lagos',
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
    lowStockEmailAlerts: false,
    autoEmailMonthlyStatements: true,
};

function businessPlaceholder(userId) {
    const cached = userId ? getCachedBusinessSummary(userId) : null;
    return cached ? { ...EMPTY_BUSINESS, ...cached } : EMPTY_BUSINESS;
}

function businessInfoPlaceholder(prev, previousQuery, userId) {
    if (previousQuery?.queryKey?.[1] !== userId) {
        return businessPlaceholder(userId);
    }
    return prev ?? businessPlaceholder(userId);
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
    const [assetsReady, setAssetsReady] = useState(false);
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const userId = user?.id;
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const {
        data: businessInfo = EMPTY_BUSINESS,
        isLoading,
        isFetched,
        isSuccess,
        isError,
        isPlaceholderData,
        refetch: refetchBusinessInfo,
    } = useQuery({
        queryKey: queryKeys.businessInfo(userId),
        queryFn: async () => {
            const info = await apiFetch('/business-info?summary=1');
            const prev = queryClient.getQueryData(queryKeys.businessInfo(userId));
            let merged = mergeBusinessInfoSummary(prev ?? EMPTY_BUSINESS, info);

            if (isPremiumUser(merged) && !getCompanyLogoAvatarUrl(merged)) {
                try {
                    const assets = await apiFetch('/business-info/assets');
                    merged = mergeBusinessInfoSummary(merged, { ...merged, ...assets });
                    assetsLoadedRef.current = true;
                } catch {
                    /* branding assets are optional for initial render */
                }
            } else if (isPremiumUser(merged)) {
                assetsLoadedRef.current = true;
            }

            return merged;
        },
        enabled: shouldFetch && Boolean(userId),
        staleTime: STALE_TIMES.businessInfo,
        placeholderData: (prev, previousQuery) =>
            businessInfoPlaceholder(prev, previousQuery, userId),
    });

    useEffect(() => {
        if (!userId || !isSuccess || isPlaceholderData || !businessInfo?.name?.trim()) return;
        cacheBusinessSummary(businessInfo, userId);
    }, [businessInfo, userId, isSuccess, isPlaceholderData]);

    const setBusinessInfo = useCallback(
        (updater, targetUserId) => {
            const id = targetUserId ?? userId;
            if (!id) return;
            queryClient.setQueryData(queryKeys.businessInfo(id), (prev) => {
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
        if (!shouldFetch || !userId) return;

        const current = queryClient.getQueryData(queryKeys.businessInfo(userId)) ?? EMPTY_BUSINESS;
        const hasAvatar = getCompanyLogoAvatarUrl(current).length > 0;
        if (assetsLoadedRef.current && (!isPremiumUser(current) || hasAvatar)) {
            setAssetsReady(true);
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
    }, [shouldFetch, userId, setBusinessInfo, queryClient]);

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
        assetsLoadedRef.current = false;
        setAssetsReady(false);
    }, [userId]);

    useEffect(() => {
        if (!shouldFetch || !userId || isLoading || !isFetched) return;

        if (!isPremiumUser(businessInfo)) {
            setAssetsReady(true);
            return;
        }

        if (getCompanyLogoAvatarUrl(businessInfo)) {
            setAssetsReady(true);
            return;
        }

        if (!assetsLoadedRef.current) {
            fetchBusinessAssets();
            return;
        }

        setAssetsReady(true);
    }, [shouldFetch, userId, isLoading, isFetched, businessInfo, fetchBusinessAssets]);

    const persistBusinessInfo = useCallback(async (payload) => {
        const updated = await apiFetch('/business-info', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        assetsLoadedRef.current = true;
        setAssetsReady(true);
        setBusinessInfo(updated);
        invalidateDashboardQueries(userId);
        return updated;
    }, [setBusinessInfo, userId]);

    const updateBusinessInfo = useCallback(async (info) => {
        const payload = buildBusinessInfoPayload(info, businessInfo);
        return persistBusinessInfo(payload);
    }, [businessInfo, persistBusinessInfo]);

    const saveBusinessAsset = useCallback(async (field, dataUrl) => {
        const payload = buildBusinessInfoPayload({ [field]: dataUrl }, businessInfo);
        return persistBusinessInfo(payload);
    }, [businessInfo, persistBusinessInfo]);

    const saveCompanyLogo = useCallback(async ({ companyLogoUrl, companyLogoAvatarUrl }) => {
        const payload = buildBusinessInfoPayload(
            {
                companyLogoUrl,
                companyLogoAvatarUrl,
                businessLogo: companyLogoUrl,
            },
            businessInfo
        );
        return persistBusinessInfo(payload);
    }, [businessInfo, persistBusinessInfo]);

    const saveBusinessLogo = useCallback(
        async (logoDataUrl) => saveBusinessAsset('companyLogoUrl', logoDataUrl),
        [saveBusinessAsset]
    );

    const loading = authLoading
        || (shouldFetch && !userId)
        || isLoading
        || (shouldFetch && Boolean(userId) && !isFetched);

    const businessInfoReady =
        Boolean(userId) && isSuccess && isFetched && !isPlaceholderData && !isError;

    const value = useMemo(() => ({
        businessInfo,
        businessInfoReady,
        updateBusinessInfo,
        setBusinessInfo,
        loading,
        assetsReady,
        refreshBusinessInfo: fetchBusinessInfo,
        fetchBusinessAssets,
        saveBusinessLogo,
        saveCompanyLogo,
        saveBusinessAsset,
    }), [
        businessInfo,
        businessInfoReady,
        updateBusinessInfo,
        setBusinessInfo,
        loading,
        assetsReady,
        fetchBusinessInfo,
        fetchBusinessAssets,
        saveBusinessLogo,
        saveCompanyLogo,
        saveBusinessAsset,
    ]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
