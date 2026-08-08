import { FilePlus } from 'lucide-react';
import MonthPickerField from './MonthPickerField';

export default function ListSummaryStats({
    visible = true,
    totalLabel,
    total,
    newInPeriod,
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
            <div className="stat-card">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="stat-card-icon bg-brand-light">
                        <TotalIcon className="h-4 w-4 text-brand" aria-hidden />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-snug">{totalLabel}</p>
                </div>
                <p className="stat-card-value">{total ?? '—'}</p>
            </div>
            <div className="stat-card overflow-visible">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="stat-card-icon bg-sky-50">
                        <NewIcon className="h-4 w-4 text-sky-600" aria-hidden />
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
                <p className={`stat-card-value${summaryLoading ? ' text-zinc-400 animate-pulse' : ''}`}>
                    {summaryLoading ? '…' : (newInPeriod ?? '—')}
                </p>
            </div>
        </div>
    );
}
