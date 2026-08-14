import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { seedDashboardCache } from '../lib/queryClient';

function buildDashboardQuery(period, summaryYear, summaryMonth) {
    const params = new URLSearchParams();
    if (period) params.set('period', String(period));
    if (summaryYear) params.set('summaryYear', String(summaryYear));
    if (summaryMonth) params.set('summaryMonth', String(summaryMonth));
    const query = params.toString();
    return query ? `/dashboard?${query}` : '/dashboard';
}

function isPeriodReady(period, summaryYear, summaryMonth) {
    if (period === 'all' || period === 'today') return true;
    return Boolean(summaryYear) && Boolean(summaryMonth);
}

/**
 * Aggregated dashboard query — stats, period summary, analytics, recent docs, alerts.
 */
export function useDashboardQuery(period, summaryYear, summaryMonth) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.dashboard(userId, period, summaryYear, summaryMonth),
        queryFn: async () => {
            const data = await apiFetch(buildDashboardQuery(period, summaryYear, summaryMonth));
            seedDashboardCache(userId, period, summaryYear, summaryMonth, data);
            return data;
        },
        enabled: isAuthenticated && Boolean(userId) && isPeriodReady(period, summaryYear, summaryMonth),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const prevUserId = previousQuery?.queryKey?.[1];
            if (prevUserId !== userId) return undefined;
            return previousData;
        },
    });
}

/** @deprecated Use useDashboardQuery — kept for backward compatibility. */
export function useDashboardStats(period, summaryYear, summaryMonth) {
    const { data, isLoading, isFetching, refetch } = useDashboardQuery(
        period,
        summaryYear,
        summaryMonth
    );

    return {
        data,
        loading: isLoading,
        fetching: isFetching,
        refresh: refetch,
    };
}
