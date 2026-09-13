import { formatCurrency } from '../../utils/currency';
import MonthComparisonTrend from '../MonthComparisonTrend';
import AdaptiveStatValue from '../AdaptiveStatValue';

function PeriodStatCard({
    title,
    value,
    comparison,
    comparisonLabel,
    positiveDirection = 'up',
    detail,
    valueClassName = '',
    className = '',
}) {
    return (
        <div className={`stat-card min-w-0 ${className}`.trim()}>
            <p className="text-xs text-foreground-muted font-medium leading-snug">{title}</p>
            <AdaptiveStatValue value={value} valueClassName={valueClassName} />
            <div className="flex flex-col gap-1 min-h-[1rem]">
                <div className="min-w-0">
                    <MonthComparisonTrend
                        comparison={comparison}
                        positiveDirection={positiveDirection}
                        label={comparisonLabel}
                    />
                </div>
                {detail ? (
                    <p className="text-[11px] text-foreground-muted leading-snug">{detail}</p>
                ) : null}
            </div>
        </div>
    );
}

export default function DashboardPeriodStats({
    summary,
    loading = false,
    premium = false,
    showComparison = true,
    comparisonLabel,
}) {
    if (loading) {
        return (
            <div className={`grid grid-cols-2 ${premium ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-6`}>
                {Array.from({ length: premium ? 4 : 3 }).map((_, index) => (
                    <div
                        key={index}
                        className={`stat-card animate-pulse min-w-0${
                            !premium && index === 2 ? ' col-span-2 sm:col-span-1' : ''
                        }`}
                    >
                        <div className="h-3 w-24 skeleton-bar" />
                        <div className="h-6 w-28 skeleton-bar" />
                        <div className="h-3 w-32 skeleton-bar" />
                        {!premium && index === 2 ? (
                            <div className="h-3 w-40 skeleton-bar" />
                        ) : null}
                    </div>
                ))}
            </div>
        );
    }

    const current = summary?.current;
    const comparison = summary?.comparison;
    const netProfit = current?.netProfit ?? 0;
    const profitPositive = netProfit >= 0;

    return (
        <div className={`grid grid-cols-2 ${premium ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-6`}>
            <PeriodStatCard
                title="Total Revenue"
                value={formatCurrency(current?.totalRevenue ?? 0)}
                comparison={showComparison ? comparison?.totalRevenue : null}
                comparisonLabel={comparisonLabel}
            />
            <PeriodStatCard
                title="Outstanding"
                value={formatCurrency(current?.outstanding ?? 0)}
                comparison={showComparison ? comparison?.outstanding : null}
                comparisonLabel={comparisonLabel}
                positiveDirection="down"
            />
            <PeriodStatCard
                title="Expenses"
                value={formatCurrency(current?.totalExpenses ?? 0)}
                comparison={showComparison ? comparison?.totalExpenses : null}
                comparisonLabel={comparisonLabel}
                positiveDirection="down"
                className={premium ? '' : 'col-span-2 sm:col-span-1'}
            />
            {premium ? (
                <PeriodStatCard
                    title="Net profit"
                    value={formatCurrency(netProfit)}
                    valueClassName={profitPositive ? '' : 'text-red-600'}
                    comparison={showComparison ? comparison?.netProfit : null}
                    comparisonLabel={comparisonLabel}
                />
            ) : null}
        </div>
    );
}
