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
        <div className="min-w-0 flex-1 sm:flex-none">
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
                className="!block w-full sm:!inline"
                triggerClassName="w-full justify-between sm:w-auto sm:justify-start"
            />
        </div>
    );
}
