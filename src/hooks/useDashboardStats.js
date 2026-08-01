import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { seedDashboardCache } from '../lib/queryClient';

/**
 * Aggregated dashboard query — stats, recent docs, alerts, subscription, business info.
 */
export function useDashboardQuery() {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.dashboard(userId),
        queryFn: async () => {
            const data = await apiFetch('/dashboard');
            seedDashboardCache(userId, data);
            return data;
        },
        enabled: isAuthenticated && Boolean(userId),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (prev, previousQuery) =>
            previousQuery?.queryKey?.[1] === userId ? prev : undefined,
    });
}

/** @deprecated Use useDashboardQuery — kept for backward compatibility. */
export function useDashboardStats() {
    const { data, isLoading, isFetching, refetch } = useDashboardQuery();

    return {
        data,
        loading: isLoading,
        fetching: isFetching,
        refresh: refetch,
    };
}
