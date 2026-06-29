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

export function PageHeaderSkeleton({ withAction = true }) {
    return (
        <div className="mb-6 pb-5 border-b border-zinc-200/50 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="space-y-2 min-w-0">
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

export function ListPageSkeleton({ rows = 6, columns = 4, withToolbar = true, withAction = true }) {
    return (
        <LoadingStatus label="Loading page">
            <PageHeaderSkeleton withAction={withAction} />
            {withToolbar ? <ToolbarSkeleton /> : null}
            <TableSkeleton rows={rows} columns={columns} />
        </LoadingStatus>
    );
}

export function StatsCardsSkeleton({ count = 3, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6' }) {
    return (
        <div className={className}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card">
                    <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                    <div className="stat-card-body space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-7 w-12" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AdminPageSkeleton() {
    return (
        <LoadingStatus label="Loading admin dashboard">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="card !p-4 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                ))}
            </div>
            <div className="card overflow-hidden !p-0">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <TableSkeleton rows={5} columns={6} className="!border-0 !shadow-none !rounded-none" />
            </div>
        </LoadingStatus>
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
            <StatsCardsSkeleton
                count={4}
                className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 mb-6"
            />
            <div className="card mb-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-32 rounded-lg" />
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

/** Default full-page skeleton for generic list views. */
export function PageLoader({ className = '' }) {
    return (
        <div className={className}>
            <ListPageSkeleton />
        </div>
    );
}

export default Skeleton;
