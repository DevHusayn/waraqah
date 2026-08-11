import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

function buildProfitQuery(summaryYear, summaryMonth) {
    const params = new URLSearchParams();
    if (summaryYear) params.set('summaryYear', String(summaryYear));
    if (summaryMonth) params.set('summaryMonth', String(summaryMonth));
    const query = params.toString();
    return query ? `/profit/summary?${query}` : '/profit/summary';
}

export function useProfitSummaryQuery(summaryYear, summaryMonth, { enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.profit(userId, summaryYear, summaryMonth),
        queryFn: () => apiFetch(buildProfitQuery(summaryYear, summaryMonth)),
        enabled:
            enabled &&
            isAuthenticated &&
            Boolean(userId) &&
            Boolean(summaryYear) &&
            Boolean(summaryMonth),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const [, prevUserId, prevYear, prevMonth] = previousQuery?.queryKey ?? [];
            if (prevUserId !== userId) return undefined;
            if (prevYear !== summaryYear || prevMonth !== summaryMonth) return undefined;
            return keepPreviousData(previousData);
        },
    });
}
