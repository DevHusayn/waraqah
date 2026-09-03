import { RECURRING_FREQUENCY_OPTIONS } from '@waraqah/shared';
import DatePickerField from './DatePickerField';
import CustomSelect from './CustomSelect';
import FieldValidationMessage from './FieldValidationMessage';

export default function RecurringScheduleFields({
    idPrefix = 'recurring',
    isRecurring,
    frequency,
    endDate,
    onToggle,
    onFrequencyChange,
    onEndDateChange,
    fieldErrors = {},
    compact = false,
}) {
    const toggleId = `${idPrefix}-toggle`;

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            <div className="flex items-center justify-between gap-3">
                <label className="label mb-0" htmlFor={toggleId}>
                    Repeat this
                </label>
                <button
                    id={toggleId}
                    type="button"
                    role="switch"
                    aria-checked={isRecurring}
                    onClick={onToggle}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                        isRecurring ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-600'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-surface shadow ring-0 transition ${
                            isRecurring ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>

            {isRecurring ? (
                <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                    <div>
                        <label className="label" htmlFor={`${idPrefix}-frequency`}>
                            Frequency
                        </label>
                        <CustomSelect
                            id={`${idPrefix}-frequency`}
                            value={frequency}
                            onChange={onFrequencyChange}
                            options={RECURRING_FREQUENCY_OPTIONS}
                            placeholder="How often"
                        />
                    </div>
                    <div>
                        <label className="label" htmlFor={`${idPrefix}-end-date`}>
                            End date{' '}
                            <span className="text-foreground-muted/70 font-normal">(optional)</span>
                        </label>
                        <DatePickerField
                            id={`${idPrefix}-end-date`}
                            value={endDate || ''}
                            onChange={onEndDateChange}
                            allowClear
                            placeholder="Until you stop it"
                            error={Boolean(fieldErrors.recurringEndDate)}
                        />
                        <FieldValidationMessage message={fieldErrors.recurringEndDate} />
                    </div>
                </div>
            ) : (
                <p className="text-xs text-foreground-muted">
                    Turn this on to automatically create the next one on a schedule.
                </p>
            )}
        </div>
    );
}
