import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

function buildExpenseSummaryQuery(summaryYear, summaryMonth) {
    const params = new URLSearchParams();
    if (summaryYear) params.set('summaryYear', String(summaryYear));
    if (summaryMonth) params.set('summaryMonth', String(summaryMonth));
    const query = params.toString();
    return query ? `/expenses/summary?${query}` : '/expenses/summary';
}

export function useExpenseSummaryQuery(summaryYear, summaryMonth, { enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.expenseSummary(userId, summaryYear, summaryMonth),
        queryFn: () => apiFetch(buildExpenseSummaryQuery(summaryYear, summaryMonth)),
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
