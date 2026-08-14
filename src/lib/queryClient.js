import { QueryClient } from '@tanstack/react-query';
import { needsBusinessSetup } from '@waraqah/shared';
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
export function seedDashboardCache(userId, period, summaryYear, summaryMonth, data) {
    if (!data || !userId) return;

    queryClient.setQueryData(queryKeys.dashboard(userId, period, summaryYear, summaryMonth), data);

    if (data.businessInfo) {
        if (!needsBusinessSetup(data.businessInfo)) {
            cacheBusinessSummary(data.businessInfo, userId);
        }
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
        queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    } else {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
}

/** Invalidate list page stat-card summary caches after mutations. */
export function invalidateListSummaryQueries(userId, resource) {
    if (!userId) return;
    queryClient.invalidateQueries({
        queryKey: resource ? ['listSummary', userId, resource] : ['listSummary', userId],
    });
}

/** Invalidate paginated invoice/draft list caches after mutations. */
export function invalidateInvoiceListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['invoices', userId] });
    queryClient.invalidateQueries({ queryKey: ['drafts', userId] });
    invalidateListSummaryQueries(userId, 'invoices');
}

/** Invalidate paginated quotation/draft list caches after mutations. */
export function invalidateQuotationListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['quotations', userId] });
    queryClient.invalidateQueries({ queryKey: ['drafts', userId] });
    invalidateListSummaryQueries(userId, 'quotations');
}

/** Invalidate paginated receipt/draft list caches after mutations. */
export function invalidateReceiptListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['receipts', userId] });
    queryClient.invalidateQueries({ queryKey: ['drafts', userId] });
    invalidateListSummaryQueries(userId, 'receipts');
}

/** Invalidate paginated product list caches after mutations. */
export function invalidateProductListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['products', userId] });
    invalidateListSummaryQueries(userId, 'products');
}

/** Invalidate paginated client list caches after mutations. */
export function invalidateClientListQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['clients', userId] });
    invalidateListSummaryQueries(userId, 'clients');
}

/** Invalidate expense list, summary, profit, and dashboard after expense mutations. */
export function invalidateExpenseQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    queryClient.invalidateQueries({ queryKey: ['expenseSummary', userId] });
    queryClient.invalidateQueries({ queryKey: ['profit', userId] });
    invalidateDashboardQueries(userId);
}

/** Wipe all cached server state — call on logout / account switch. */
export function clearUserQueryCache() {
    queryClient.clear();
    resetPrefetchState();
}
