import MonthPickerField from './MonthPickerField';
import MonthComparisonTrend from './MonthComparisonTrend';

function StatLoadingDots() {
    return (
        <span className="inline-flex items-center gap-1" aria-hidden>
            {[0, 1, 2].map((index) => (
                <span
                    key={index}
                    className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse"
                    style={{ animationDelay: `${index * 150}ms` }}
                />
            ))}
        </span>
    );
}

export default function ListSummaryStats({
    visible = true,
    totalLabel,
    total,
    newInPeriod,
    newComparison,
    comparisonLabel = 'vs last month',
    summaryLoading = false,
    periodLabel,
    periodPrefix = 'New this',
    monthInputValue,
    onPeriodChange,
}) {
    if (!visible) return null;

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-lg">
            <div className="stat-card stat-card-compact">
                <p className="text-xs text-zinc-500 font-medium leading-snug">{totalLabel}</p>
                <p className="stat-card-value">{total ?? '—'}</p>
            </div>
            <div className="stat-card stat-card-compact overflow-visible">
                <p className="text-xs text-zinc-500 font-medium leading-snug min-w-0">
                    <span>{periodPrefix} </span>
                    <MonthPickerField
                        variant="inline"
                        portal
                        value={monthInputValue}
                        onChange={onPeriodChange}
                        displayLabel={periodLabel}
                        triggerAriaLabel={`${periodPrefix} ${periodLabel}. Change month.`}
                    />
                </p>
                <p
                    className="stat-card-value min-h-[1.5rem] flex items-center"
                    aria-busy={summaryLoading}
                >
                    {summaryLoading ? <StatLoadingDots /> : (newInPeriod ?? '—')}
                </p>
                {!summaryLoading ? (
                    <MonthComparisonTrend comparison={newComparison} label={comparisonLabel} />
                ) : null}
            </div>
        </div>
    );
}
