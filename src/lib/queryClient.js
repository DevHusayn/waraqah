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
export function seedDashboardCache(userId, period, startDate, endDate, data) {
    if (!data || !userId) return;

    queryClient.setQueryData(queryKeys.dashboard(userId, period, startDate, endDate), data);

    if (data.businessInfo) {
        queryClient.setQueryData(queryKeys.businessInfo(userId), (prev) => {
            const merged = mergeBusinessInfoSummary(prev, data.businessInfo);
            if (!needsBusinessSetup(merged)) {
                cacheBusinessSummary(merged, userId);
            }
            return merged;
        });
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

/** Invalidate expense list, summary, profit, payroll, and dashboard after expense mutations. */
export function invalidateExpenseQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    queryClient.invalidateQueries({ queryKey: ['expensePayees', userId] });
    queryClient.invalidateQueries({ queryKey: ['expensePayee', userId] });
    queryClient.invalidateQueries({ queryKey: ['expenseVendors', userId] });
    queryClient.invalidateQueries({ queryKey: ['expenseSummary', userId] });
    queryClient.invalidateQueries({ queryKey: ['staffPayroll', userId] });
    queryClient.invalidateQueries({ queryKey: ['profit', userId] });
    invalidateDashboardQueries(userId);
}

/** Invalidate staff roster and payroll after staff or pay mutations. */
export function invalidateStaffQueries(userId) {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['staff', userId] });
    invalidateExpenseQueries(userId);
}

/** After a books currency conversion, refresh every money-labelled cache. */
export function invalidateAccountingQueries(userId) {
    if (!userId) return;
    invalidateInvoiceListQueries(userId);
    invalidateQuotationListQueries(userId);
    invalidateReceiptListQueries(userId);
    invalidateProductListQueries(userId);
    invalidateExpenseQueries(userId);
    invalidateStaffQueries(userId);
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders', userId] });
    queryClient.invalidateQueries({ queryKey: ['inventoryStock', userId] });
    queryClient.invalidateQueries({ queryKey: ['inventorySummary', userId] });
    queryClient.invalidateQueries({ queryKey: ['inventoryTopProducts', userId] });
    queryClient.invalidateQueries({ queryKey: ['clientsTopBuyers', userId] });
    invalidateListSummaryQueries(userId);
}

/** Wipe all cached server state — call on logout / account switch. */
export function clearUserQueryCache() {
    queryClient.clear();
    resetPrefetchState();
}
