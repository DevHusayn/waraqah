/** Prefetch frequently visited route chunks after the dashboard loads. */

const PREFETCH_ROUTES = [
    () => import('../pages/Invoices'),
    () => import('../pages/Clients'),
    () => import('../pages/Quotations'),
    () => import('../pages/MonthlyStatement'),
];

let prefetched = false;

export function prefetchFrequentRoutes() {
    if (prefetched || typeof window === 'undefined') return;
    prefetched = true;

    const run = () => {
        PREFETCH_ROUTES.forEach((load) => {
            load().catch(() => {});
        });
    };

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run, { timeout: 3000 });
    } else {
        window.setTimeout(run, 500);
    }
}

export function resetPrefetchState() {
    prefetched = false;
}
