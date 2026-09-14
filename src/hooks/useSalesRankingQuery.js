import { useQuery } from '@tanstack/react-query';
import { isPeriodQueryReady } from '@waraqah/shared';
import { apiFetch } from '../utils/api';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

function buildRankingQuery(path, queryParams = {}) {
    const params = new URLSearchParams();
    const { period, startDate, endDate } = queryParams;
    if (period) params.set('period', String(period));
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

function useSalesRankingQuery({ queryKey, path, queryParams, enabled = true }) {
    return useQuery({
        queryKey,
        queryFn: () => apiFetch(buildRankingQuery(path, queryParams)),
        enabled: enabled && isPeriodQueryReady(queryParams),
        staleTime: STALE_TIMES.rankings,
        placeholderData: (previousData) => previousData,
    });
}

export function useInventoryTopProductsQuery(userId, queryParams, enabled = true) {
    const { period, startDate, endDate } = queryParams || {};
    return useSalesRankingQuery({
        queryKey: queryKeys.inventoryTopProducts(userId, period, startDate, endDate),
        path: '/inventory/top-products',
        queryParams,
        enabled: Boolean(userId) && enabled,
    });
}

export function useClientsTopBuyersQuery(userId, queryParams, enabled = true) {
    const { period, startDate, endDate } = queryParams || {};
    return useSalesRankingQuery({
        queryKey: queryKeys.clientsTopBuyers(userId, period, startDate, endDate),
        path: '/clients/top-buyers',
        queryParams,
        enabled: Boolean(userId) && enabled,
    });
}
