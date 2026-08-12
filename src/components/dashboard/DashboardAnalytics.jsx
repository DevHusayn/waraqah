import { Suspense, lazy } from 'react';
import { format } from 'date-fns';
import MonthPickerField from '../MonthPickerField';
import DashboardPeriodStats from './DashboardPeriodStats';
import PaymentBreakdownChart from './PaymentBreakdownChart';

const RevenueTrendChart = lazy(() => import('./RevenueTrendChart'));

function ChartAreaSkeleton() {
    return (
        <div className="card lg:col-span-2 min-h-[280px] animate-pulse">
            <div className="mb-4 space-y-2">
                <div className="h-4 w-32 rounded bg-zinc-200/80" />
                <div className="h-3 w-56 max-w-full rounded bg-zinc-200/80" />
            </div>
            <div className="h-[220px] rounded-lg bg-zinc-200/80" />
        </div>
    );
}

function PaymentBreakdownSkeleton() {
    return (
        <div className="card min-h-[280px] animate-pulse">
            <div className="mb-4 space-y-2">
                <div className="h-4 w-36 rounded bg-zinc-200/80" />
                <div className="h-3 w-48 max-w-full rounded bg-zinc-200/80" />
            </div>
            <div className="flex flex-col justify-center gap-4 py-1">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex justify-between gap-3">
                            <div className="h-4 w-24 rounded bg-zinc-200/80" />
                            <div className="h-4 w-6 rounded bg-zinc-200/80" />
                        </div>
                        <div className="h-2 rounded-full bg-zinc-200/80" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardAnalyticsSkeleton({ premium = false }) {
    return (
        <>
            <div className="mb-4 flex justify-end">
                <div className="h-9 w-28 rounded-lg bg-zinc-200/80 animate-pulse" aria-hidden />
            </div>
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
    premium = false,
    summaryYear,
    summaryMonth,
    monthInputValue,
    onMonthChange,
}) {
    if (loading) {
        return <AnalyticsSkeleton premium={premium} />;
    }

    const maxMonth = format(new Date(), 'yyyy-MM');

    return (
        <div className={`mb-6 transition-opacity ${fetching ? 'opacity-80' : ''}`}>
            <div className="mb-4 flex justify-end">
                <MonthPickerField
                    id="dashboard-analytics-month"
                    variant="compact"
                    portal
                    value={monthInputValue}
                    onChange={onMonthChange}
                    max={maxMonth}
                    triggerAriaLabel="Select dashboard month"
                />
            </div>

            <DashboardPeriodStats summary={periodSummary} loading={false} premium={premium} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Suspense fallback={<ChartAreaSkeleton />}>
                    <RevenueTrendChart trend={analytics?.revenueTrend} />
                </Suspense>
                <PaymentBreakdownChart
                    breakdown={periodSummary?.paymentBreakdown}
                    periodLabel={periodSummary?.period?.label}
                />
            </div>
        </div>
    );
}
