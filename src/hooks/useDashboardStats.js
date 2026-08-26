import { useQuery } from '@tanstack/react-query';
import { isPeriodQueryReady } from '@waraqah/shared';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { seedDashboardCache } from '../lib/queryClient';

function buildDashboardQuery(queryParams = {}) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value != null && value !== '') params.set(key, String(value));
    });
    const query = params.toString();
    return query ? `/dashboard?${query}` : '/dashboard';
}

/**
 * Aggregated dashboard query — stats, period summary, analytics, recent docs, alerts.
 */
export function useDashboardQuery(queryParams) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;
    const { period, startDate, endDate } = queryParams || {};

    return useQuery({
        queryKey: queryKeys.dashboard(userId, period, startDate, endDate),
        queryFn: async () => {
            const data = await apiFetch(buildDashboardQuery(queryParams));
            seedDashboardCache(userId, period, startDate, endDate, data);
            return data;
        },
        enabled: isAuthenticated && Boolean(userId) && isPeriodQueryReady(queryParams),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const prevUserId = previousQuery?.queryKey?.[1];
            if (prevUserId !== userId) return undefined;
            return previousData;
        },
    });
}

/** @deprecated Use useDashboardQuery — kept for backward compatibility. */
export function useDashboardStats(queryParams) {
    const { data, isLoading, isFetching, refetch } = useDashboardQuery(queryParams);

    return {
        data,
        loading: isLoading,
        fetching: isFetching,
        refresh: refetch,
    };
}
