import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { isPeriodQueryReady } from '@waraqah/shared';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

function buildProfitQuery(queryParams = {}) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value != null && value !== '') params.set(key, String(value));
    });
    const query = params.toString();
    return query ? `/profit/summary?${query}` : '/profit/summary';
}

export function useProfitSummaryQuery(queryParams, { enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;
    const { period, startDate, endDate } = queryParams || {};

    return useQuery({
        queryKey: queryKeys.profit(userId, period, startDate, endDate),
        queryFn: () => apiFetch(buildProfitQuery(queryParams)),
        enabled:
            enabled &&
            isAuthenticated &&
            Boolean(userId) &&
            isPeriodQueryReady(queryParams),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const [, prevUserId, prevPeriod, prevStart, prevEnd] = previousQuery?.queryKey ?? [];
            if (prevUserId !== userId) return undefined;
            if (prevPeriod !== period || prevStart !== (startDate ?? null) || prevEnd !== (endDate ?? null)) {
                return undefined;
            }
            return keepPreviousData(previousData);
        },
    });
}
