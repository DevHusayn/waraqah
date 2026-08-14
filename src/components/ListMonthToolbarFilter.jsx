import { format } from 'date-fns';
import MonthPickerField from './MonthPickerField';

export default function ListMonthToolbarFilter({
    monthInputValue,
    onMonthChange,
    periodMode = 'all',
    onPeriodModeChange,
    periodLabel,
    isThisMonth = false,
}) {
    const maxMonth = format(new Date(), 'yyyy-MM');

    return (
        <div className="flex w-full sm:w-auto items-center gap-2">
            <MonthPickerField
                id="list-month-filter"
                variant="compact"
                portal
                showPeriodPresets
                periodMode={periodMode}
                isThisMonth={isThisMonth}
                onPeriodModeChange={onPeriodModeChange}
                value={monthInputValue}
                onChange={onMonthChange}
                displayLabel={periodLabel}
                max={maxMonth}
                triggerAriaLabel="Filter list by period"
            />
        </div>
    );
}
