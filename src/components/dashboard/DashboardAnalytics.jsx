import { Suspense, lazy } from 'react';
import DashboardPeriodStats from './DashboardPeriodStats';
import PaymentBreakdownChart from './PaymentBreakdownChart';

const RevenueTrendChart = lazy(() => import('./RevenueTrendChart'));

function ChartAreaSkeleton() {
    return (
        <div className="card lg:col-span-2 min-h-[280px] animate-pulse">
            <div className="mb-4 space-y-2">
                <div className="h-4 w-32 skeleton-bar" />
                <div className="h-3 w-56 max-w-full skeleton-bar" />
            </div>
            <div className="h-[220px] skeleton-bar" />
        </div>
    );
}

function PaymentBreakdownSkeleton() {
    return (
        <div className="card min-h-[280px] animate-pulse">
            <div className="mb-4 space-y-2">
                <div className="h-4 w-36 skeleton-bar" />
                <div className="h-3 w-48 max-w-full skeleton-bar" />
            </div>
            <div className="flex flex-col justify-center gap-4 py-1">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex justify-between gap-3">
                            <div className="h-4 w-24 skeleton-bar" />
                            <div className="h-4 w-6 skeleton-bar" />
                        </div>
                        <div className="h-2 rounded-full skeleton-bar" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardAnalyticsSkeleton({ premium = false }) {
    return (
        <>
            <DashboardPeriodStats loading premium={premium} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <ChartAreaSkeleton />
                <PaymentBreakdownSkeleton />
            </div>
        </>
    );
}

function AnalyticsSkeleton({ premium = false }) {
    return <DashboardAnalyticsSkeleton premium={premium} />;
}

export default function DashboardAnalytics({
    analytics,
    periodSummary,
    loading = false,
    fetching = false,
    periodUpdating = false,
    premium = false,
    showComparison = true,
    comparisonLabel,
}) {
    if (loading) {
        return <AnalyticsSkeleton premium={premium} />;
    }

    return (
        <div className={`mb-6 transition-opacity ${fetching && !periodUpdating ? 'opacity-80' : ''}`}>
            <DashboardPeriodStats
                summary={periodSummary}
                loading={periodUpdating}
                premium={premium}
                showComparison={showComparison}
                comparisonLabel={comparisonLabel}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Suspense fallback={<ChartAreaSkeleton />}>
                    <RevenueTrendChart trend={analytics?.revenueTrend} />
                </Suspense>
                {periodUpdating ? (
                    <PaymentBreakdownSkeleton />
                ) : (
                    <PaymentBreakdownChart
                        breakdown={periodSummary?.paymentBreakdown}
                        periodLabel={periodSummary?.period?.label}
                    />
                )}
            </div>
        </div>
    );
}
