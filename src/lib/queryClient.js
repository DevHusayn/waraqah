import { QueryClient } from '@tanstack/react-query';
import { STALE_TIMES, queryKeys } from './queryKeys';
import { mergeBusinessInfoSummary } from '../utils/brandAssets';
import { resetPrefetchState } from '../utils/prefetchRoutes';
import { cacheBusinessSummary } from '../utils/authHint';

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
export function seedDashboardCache(userId, data) {
    if (!data || !userId) return;

    queryClient.setQueryData(queryKeys.dashboard(userId), data);

    if (data.businessInfo) {
        cacheBusinessSummary(data.businessInfo, userId);
        queryClient.setQueryData(queryKeys.businessInfo(userId), (prev) =>
            mergeBusinessInfoSummary(prev, data.businessInfo)
        );
    }
    if (data.invoiceUsage) {
        queryClient.setQueryData(queryKeys.invoiceUsage(userId), data.invoiceUsage);
    }
    if (data.stats?.draftCount != null) {
        queryClient.setQueryData(queryKeys.invoiceMeta(userId), {
            draftCount: data.stats.draftCount,
        });
    }
}

export function invalidateDashboardQueries(userId) {
    if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) });
    } else {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
}

/** Invalidate paginated invoice/draft list caches after mutations. */
export function invalidateInvoiceListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['invoices', userId] });
    queryClient.invalidateQueries({ queryKey: ['drafts', userId] });
}

/** Invalidate paginated quotation/draft list caches after mutations. */
export function invalidateQuotationListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['quotations', userId] });
    queryClient.invalidateQueries({ queryKey: ['drafts', userId] });
}

/** Wipe all cached server state — call on logout / account switch. */
export function clearUserQueryCache() {
    queryClient.clear();
    resetPrefetchState();
}
