import { DashboardAnalyticsSkeleton } from './dashboard/DashboardAnalytics';
import { ReportStatGridSkeleton } from './ReportStatGrid';

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse rounded bg-zinc-200/80 ${className}`.trim()} aria-hidden />;
}

function LoadingStatus({ children, label = 'Loading' }) {
    return (
        <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
            {children}
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function PageHeaderSkeleton({ withAction = true, withEyebrow = false }) {
    return (
        <div className="mb-6 pb-5 border-b border-zinc-200/50 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="space-y-2 min-w-0">
                {withEyebrow ? <Skeleton className="h-3 w-24" /> : null}
                <Skeleton className="h-7 w-36 sm:w-44" />
                <Skeleton className="h-4 w-52 sm:w-64 max-w-full" />
            </div>
            {withAction ? <Skeleton className="h-9 w-full sm:w-32 rounded-lg shrink-0" /> : null}
        </div>
    );
}

export function ToolbarSkeleton({ withSort = false }) {
    return (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-full sm:max-w-xs rounded-lg" />
            {withSort ? <Skeleton className="h-9 w-full sm:w-44 rounded-lg" /> : null}
        </div>
    );
}

export function FilterTabsSkeleton() {
    return (
        <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 6, columns = 5, className = '' }) {
    return (
        <LoadingStatus label="Loading table">
            <div className={`data-table-wrap ${className}`.trim()}>
                <table className="data-table">
                    <thead>
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i}>
                                    <Skeleton className="h-3 w-16" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, row) => (
                            <tr key={row}>
                                {Array.from({ length: columns }).map((_, col) => (
                                    <td key={col}>
                                        <Skeleton
                                            className={`h-4 ${
                                                col === 0
                                                    ? 'w-28'
                                                    : col === columns - 1
                                                      ? 'w-16 ml-auto'
                                                      : 'w-20'
                                            }`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </LoadingStatus>
    );
}

export function ListSummaryStatsSkeleton({ className = 'mb-6' }) {
    return (
        <div className={`grid grid-cols-2 gap-3 max-w-lg ${className}`.trim()} aria-hidden>
            {[0, 1].map((index) => (
                <div key={index} className="stat-card stat-card-compact">
                    <Skeleton className={`h-3 ${index === 0 ? 'w-[5.5rem]' : 'w-[7.5rem]'}`} />
                    <Skeleton className="h-5 w-10" />
                    {index === 1 ? <Skeleton className="h-3 w-24" /> : null}
                </div>
            ))}
        </div>
    );
}

export function ProductListSkeleton({ count = 6, className = '' }) {
    return (
        <LoadingStatus label="Loading products">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`.trim()} aria-hidden>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="card !p-4 sm:!p-5 space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-full max-w-sm" />
                        </div>
                        <div className="flex gap-5">
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-16" />
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-zinc-100">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-16 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </LoadingStatus>
    );
}

export function ListPageSkeleton({
    rows = 6,
    columns = 4,
    withToolbar = true,
    withAction = true,
    withHeader = true,
    withSummaryStats = false,
    withFilterTabs = false,
    withSort = false,
}) {
    return (
        <LoadingStatus label="Loading page">
            {withHeader ? <PageHeaderSkeleton withAction={withAction} /> : null}
            {withSummaryStats ? <ListSummaryStatsSkeleton /> : null}
            {withToolbar ? <ToolbarSkeleton withSort={withSort} /> : null}
            {withFilterTabs ? <FilterTabsSkeleton /> : null}
            <TableSkeleton rows={rows} columns={columns} />
        </LoadingStatus>
    );
}

export function StatsCardsSkeleton({ count = 3, className = 'grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6', fullWidthLast = false }) {
    return (
        <div className={className}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`stat-card${fullWidthLast && i === count - 1 ? ' col-span-2 lg:col-span-1' : ''}`}
                >
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                </div>
            ))}
        </div>
    );
}

export function TableBodySkeleton({ rows = 6, columns = 7 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, row) => (
                <tr key={row} className="animate-pulse">
                    {Array.from({ length: columns }).map((_, col) => (
                        <td key={col} className="px-4 sm:px-6 py-4">
                            <Skeleton
                                className={`h-4 ${
                                    col === 0 ? 'w-32' : col === columns - 1 ? 'w-20 ml-auto' : 'w-16'
                                }`}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export function AdminTableSkeleton() {
    return (
        <div className="max-w-7xl mx-auto">
            <PageHeaderSkeleton withAction={false} />
            <StatsCardsSkeleton count={3} />
            <div className="card !p-0 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
                </div>
                <TableSkeleton rows={8} columns={7} className="!border-0 !shadow-none !rounded-none" />
            </div>
        </div>
    );
}

/** @deprecated Use AdminTableSkeleton for route fallback; prefer inline headers + TableBodySkeleton in-page. */
export function AdminPageSkeleton() {
    return (
        <LoadingStatus label="Loading admin dashboard">
            <AdminTableSkeleton />
        </LoadingStatus>
    );
}

export function DetailPageSkeleton() {
    return (
        <LoadingStatus label="Loading invoice details">
            <div className="max-w-6xl mx-auto pb-8">
                <Skeleton className="h-4 w-32 mb-6" />
                <div className="mb-8 space-y-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-36" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="card space-y-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-24" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="card space-y-3">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="card space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex justify-between gap-4">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                            <Skeleton className="h-6 w-full mt-2" />
                        </div>
                    </div>
                </div>
            </div>
        </LoadingStatus>
    );
}

export function StatementPageSkeleton() {
    return (
        <LoadingStatus label="Loading monthly statement">
            <PageHeaderSkeleton />
            <div className="card mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-10 w-full max-w-xs rounded-lg" />
                    <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-12 w-full sm:w-56 rounded-xl" />
            </div>
            <StatementContentSkeleton />
        </LoadingStatus>
    );
}

export function StatementContentSkeleton({ variant = 'profit' }) {
    const isStatement = variant === 'statement';

    return (
        <>
            <ReportStatGridSkeleton
                count={isStatement ? 5 : 6}
                columns={isStatement ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}
                footer={isStatement}
            />
            <div className="card overflow-hidden !p-0">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <TableSkeleton rows={5} columns={6} className="!border-0 !shadow-none !rounded-none" />
            </div>
        </>
    );
}

export function UpgradePageSkeleton() {
    return (
        <LoadingStatus label="Loading upgrade page">
            <div className="max-w-lg mx-auto">
                <Skeleton className="h-4 w-36 mb-8" />
                <div className="text-center mb-6 space-y-3">
                    <Skeleton className="h-10 w-10 rounded-lg mx-auto" />
                    <Skeleton className="h-7 w-48 mx-auto" />
                    <Skeleton className="h-4 w-full max-w-sm mx-auto" />
                </div>
                <div className="premium-card">
                    <div className="px-5 py-4 border-b border-amber-200/70 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-8 w-40" />
                    </div>
                    <div className="px-5 py-5 space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                                <Skeleton className="h-4 flex-1 max-w-xs" />
                            </div>
                        ))}
                    </div>
                    <div className="px-5 pb-5">
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </LoadingStatus>
    );
}

export function DashboardSkeleton() {
    return (
        <LoadingStatus label="Loading dashboard">
            <PageHeaderSkeleton withAction={false} />
            <DashboardAnalyticsSkeleton />
            <div className="card mb-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <Skeleton className="h-4 w-28 mb-3" />
                    <TableSkeleton rows={5} columns={4} />
                </div>
                <div>
                    <Skeleton className="h-4 w-16 mb-3" />
                    <div className="card flex flex-col items-center gap-3 py-8">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                </div>
            </div>
        </LoadingStatus>
    );
}

/** Full-page app chrome skeleton — no context hooks; safe before providers settle. */
export function AppShellSkeleton() {
    return (
        <LoadingStatus label="Loading">
            <div className="min-h-screen bg-surface-muted">
                <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center border-b border-zinc-200/50 bg-white px-4">
                    <div className="flex h-full w-[15.5rem] shrink-0 items-center gap-2 min-w-0">
                        <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex flex-1 justify-end">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                <aside className="hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:flex md:w-[15.5rem] md:flex-col border-r border-zinc-200/50 bg-zinc-50/40">
                    <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-4">
                        <div className="flex flex-col gap-1 px-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="md:pl-[15.5rem] md:pt-14 flex flex-col flex-1 min-h-screen min-w-0">
                    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200/50 bg-white/80 px-4 py-2.5 md:hidden">
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                    </header>
                    <main className="flex-1 min-w-0">
                        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
                            <AppContentSkeleton />
                        </div>
                    </main>
                </div>
            </div>
        </LoadingStatus>
    );
}

/** Neutral content skeleton for auth/session checks inside the app shell. */
export function AppContentSkeleton() {
    return (
        <LoadingStatus label="Loading">
            <PageHeaderSkeleton withAction={false} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-full max-w-[12rem]" />
                    </div>
                ))}
            </div>
        </LoadingStatus>
    );
}

/** Centered loader for public routes (auth, legal) outside the app shell. */
export function PublicPageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
            <LoadingStatus label="Loading page">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-8 w-40 mx-auto" />
                    <Skeleton className="h-4 w-56 mx-auto" />
                    <div className="card space-y-3 mt-8">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                </div>
            </LoadingStatus>
        </div>
    );
}

/** Full-page skeleton for list views already wrapped in Layout. */
export function PageLoader({ className = '' }) {
    return (
        <div className={className}>
            <ListPageSkeleton />
        </div>
    );
}

export default Skeleton;
