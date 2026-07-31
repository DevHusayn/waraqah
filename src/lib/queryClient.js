import { QueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from './queryKeys';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: STALE_TIMES.lists,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

/** Seed related query caches from aggregated dashboard response. */
export function seedDashboardCache(data) {
    if (!data) return;

    queryClient.setQueryData(['dashboard'], data);

    if (data.businessInfo) {
        queryClient.setQueryData(['businessInfo'], data.businessInfo);
    }
    if (data.invoiceUsage) {
        queryClient.setQueryData(['invoiceUsage'], data.invoiceUsage);
    }
    if (data.stats?.draftCount != null) {
        queryClient.setQueryData(['invoiceMeta'], { draftCount: data.stats.draftCount });
    }
}

export function invalidateDashboardQueries() {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
