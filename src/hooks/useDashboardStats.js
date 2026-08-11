import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { seedDashboardCache } from '../lib/queryClient';

function buildDashboardQuery(summaryYear, summaryMonth) {
    const params = new URLSearchParams();
    if (summaryYear) params.set('summaryYear', String(summaryYear));
    if (summaryMonth) params.set('summaryMonth', String(summaryMonth));
    const query = params.toString();
    return query ? `/dashboard?${query}` : '/dashboard';
}

/**
 * Aggregated dashboard query — stats, period summary, analytics, recent docs, alerts.
 */
export function useDashboardQuery(summaryYear, summaryMonth) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.dashboard(userId, summaryYear, summaryMonth),
        queryFn: async () => {
            const data = await apiFetch(buildDashboardQuery(summaryYear, summaryMonth));
            seedDashboardCache(userId, summaryYear, summaryMonth, data);
            return data;
        },
        enabled: isAuthenticated && Boolean(userId) && Boolean(summaryYear) && Boolean(summaryMonth),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const [, prevUserId, prevYear, prevMonth] = previousQuery?.queryKey ?? [];
            if (prevUserId !== userId) return undefined;
            if (prevYear !== summaryYear || prevMonth !== summaryMonth) return undefined;
            return keepPreviousData(previousData);
        },
    });
}

/** @deprecated Use useDashboardQuery — kept for backward compatibility. */
export function useDashboardStats(summaryYear, summaryMonth) {
    const { data, isLoading, isFetching, refetch } = useDashboardQuery(summaryYear, summaryMonth);

    return {
        data,
        loading: isLoading,
        fetching: isFetching,
        refresh: refetch,
    };
}
