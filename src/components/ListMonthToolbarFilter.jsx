import { format } from 'date-fns';
import MonthPickerField from './MonthPickerField';

export default function ListMonthToolbarFilter({
    monthInputValue,
    onMonthChange,
    allTime,
    onShowAllTime,
}) {
    const maxMonth = format(new Date(), 'yyyy-MM');

    return (
        <div className="flex w-full sm:w-auto items-center gap-2">
            <MonthPickerField
                id="list-month-filter"
                variant="compact"
                portal
                value={monthInputValue}
                onChange={onMonthChange}
                max={maxMonth}
                triggerAriaLabel="Filter list by month"
            />
            {!allTime ? (
                <button
                    type="button"
                    onClick={onShowAllTime}
                    className="text-[13px] font-medium text-zinc-500 hover:text-zinc-800 whitespace-nowrap"
                >
                    All time
                </button>
            ) : null}
        </div>
    );
}
