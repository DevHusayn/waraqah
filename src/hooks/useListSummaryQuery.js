import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

/**
 * Lightweight summary counts for list page stat cards — separate from the paginated list query.
 */
export function useListSummaryQuery(resource, summaryYear, summaryMonth) {
    const { user } = useAuth();
    const userId = user?.id;
    const lastSummaryRef = useRef(null);

    const { data, isPending, isFetching, refetch } = useQuery({
        queryKey: queryKeys.listSummary(userId, resource, summaryYear, summaryMonth),
        queryFn: async () => {
            const query = buildListQuery({
                page: 1,
                limit: 1,
                summaryYear,
                summaryMonth,
                summaryOnly: true,
            });
            const payload = await apiFetch(`/${resource}?${query}`);
            return payload?.summary ?? null;
        },
        enabled: Boolean(userId) && Boolean(summaryYear) && Boolean(summaryMonth),
        staleTime: STALE_TIMES.listSummary,
        placeholderData: keepPreviousData,
    });

    if (data) {
        lastSummaryRef.current = data;
    }

    const summaryMatchesPeriod =
        data?.period?.year === summaryYear && data?.period?.month === summaryMonth;

    const summaryLoading = isPending || (isFetching && !summaryMatchesPeriod);

    return {
        summary: summaryMatchesPeriod ? data : lastSummaryRef.current,
        summaryLoading,
        refreshSummary: refetch,
    };
}
