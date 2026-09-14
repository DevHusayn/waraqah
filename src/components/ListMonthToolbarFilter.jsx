import MonthPickerField from './MonthPickerField';

export default function ListMonthToolbarFilter({
    id = 'list-month-filter',
    periodMode = 'month',
    onPeriodModeChange,
    periodLabel,
    customDraftStartDate,
    customDraftEndDate,
    onCustomDraftRangeChange,
    onCustomApply,
    maxDate,
    triggerAriaLabel = 'Filter list by period',
    className = '',
}) {
    return (
        <div className={`min-w-0 flex-1 sm:flex-none ${className}`.trim()}>
            <MonthPickerField
                id={id}
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
                triggerAriaLabel={triggerAriaLabel}
                className="!block w-full sm:!inline"
                triggerClassName="w-full justify-between sm:w-auto sm:justify-start"
            />
        </div>
    );
}
