import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { seedDashboardCache } from '../lib/queryClient';

async function fetchDashboard() {
    const data = await apiFetch('/dashboard');
    seedDashboardCache(data);
    return data;
}

/**
 * Aggregated dashboard query — stats, recent docs, alerts, subscription, business info.
 */
export function useDashboardQuery() {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.dashboard,
        queryFn: fetchDashboard,
        enabled: isAuthenticated,
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (prev) => prev,
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
