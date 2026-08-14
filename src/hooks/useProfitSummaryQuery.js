import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

function buildProfitQuery(period, summaryYear, summaryMonth) {
    const params = new URLSearchParams();
    if (period) params.set('period', String(period));
    if (summaryYear) params.set('summaryYear', String(summaryYear));
    if (summaryMonth) params.set('summaryMonth', String(summaryMonth));
    const query = params.toString();
    return query ? `/profit/summary?${query}` : '/profit/summary';
}

function isPeriodReady(period, summaryYear, summaryMonth) {
    if (period === 'all' || period === 'today') return true;
    return Boolean(summaryYear) && Boolean(summaryMonth);
}

export function useProfitSummaryQuery(period, summaryYear, summaryMonth, { enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.profit(userId, period, summaryYear, summaryMonth),
        queryFn: () => apiFetch(buildProfitQuery(period, summaryYear, summaryMonth)),
        enabled:
            enabled &&
            isAuthenticated &&
            Boolean(userId) &&
            isPeriodReady(period, summaryYear, summaryMonth),
        staleTime: STALE_TIMES.dashboard,
        placeholderData: (previousData, previousQuery) => {
            const [, prevUserId, prevPeriod, prevYear, prevMonth] = previousQuery?.queryKey ?? [];
            if (prevUserId !== userId) return undefined;
            if (prevPeriod !== period || prevYear !== summaryYear || prevMonth !== summaryMonth) {
                return undefined;
            }
            return keepPreviousData(previousData);
        },
    });
}
