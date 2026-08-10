import { FilePlus } from 'lucide-react';
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
    totalIcon: TotalIcon,
    newIcon: NewIcon = FilePlus,
    periodLabel,
    monthInputValue,
    onPeriodChange,
}) {
    if (!visible) return null;

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-lg">
            <div className="stat-card stat-card-compact">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="stat-card-icon bg-brand-light">
                        <TotalIcon className="h-3.5 w-3.5 text-brand" aria-hidden />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-snug">{totalLabel}</p>
                </div>
                <p className="stat-card-value">{total ?? '—'}</p>
            </div>
            <div className="stat-card stat-card-compact overflow-visible">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="stat-card-icon bg-sky-50">
                        <NewIcon className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-snug min-w-0">
                        <span>New this </span>
                        <MonthPickerField
                            variant="inline"
                            portal
                            value={monthInputValue}
                            onChange={onPeriodChange}
                            displayLabel={periodLabel}
                            triggerAriaLabel={`New this ${periodLabel}. Change month.`}
                        />
                    </p>
                </div>
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
