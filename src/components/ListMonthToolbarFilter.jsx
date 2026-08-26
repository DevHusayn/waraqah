import MonthPickerField from './MonthPickerField';

export default function ListMonthToolbarFilter({
    periodMode = 'month',
    onPeriodModeChange,
    periodLabel,
    customDraftStartDate,
    customDraftEndDate,
    onCustomDraftRangeChange,
    onCustomApply,
    maxDate,
}) {
    return (
        <div className="min-w-0 flex-1 sm:flex-none">
            <MonthPickerField
                id="list-month-filter"
                variant="compact"
                portal
                showPeriodPresets
                periodMode={periodMode}
                onPeriodModeChange={onPeriodModeChange}
                displayLabel={periodLabel}
                maxDate={maxDate}
                customDraftStartDate={customDraftStartDate}
                customDraftEndDate={customDraftEndDate}
                onCustomDraftRangeChange={onCustomDraftRangeChange}
                onCustomApply={onCustomApply}
                triggerAriaLabel="Filter list by period"
                className="!block w-full sm:!inline"
                triggerClassName="w-full justify-between sm:w-auto sm:justify-start"
            />
        </div>
    );
}
