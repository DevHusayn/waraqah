import DatePickerField from '../DatePickerField';
import FieldValidationMessage from '../FieldValidationMessage';

export default function ExpiryDateField({
    idPrefix,
    label,
    hasExpiry,
    expiryValue,
    dateFieldKey,
    emptyHint,
    minDate,
    fieldErrors,
    onToggle,
    onDateChange,
}) {
    const toggleId = `${idPrefix}-${dateFieldKey}-toggle`;
    const inputId = `${idPrefix}-${dateFieldKey}`;

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-2">
                <label className="label mb-0" htmlFor={toggleId}>
                    {label}
                </label>
                <button
                    id={toggleId}
                    type="button"
                    role="switch"
                    aria-checked={hasExpiry}
                    aria-controls={inputId}
                    onClick={onToggle}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                        hasExpiry ? 'bg-brand' : 'bg-zinc-200'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                            hasExpiry ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            {hasExpiry ? (
                <>
                    <DatePickerField
                        id={inputId}
                        value={expiryValue}
                        onChange={onDateChange}
                        min={minDate || undefined}
                        error={Boolean(fieldErrors[dateFieldKey])}
                        allowClear={false}
                        placeholder={label}
                    />
                    <FieldValidationMessage message={fieldErrors[dateFieldKey]} />
                </>
            ) : (
                <p className="text-xs text-zinc-500">{emptyHint}</p>
            )}
        </div>
    );
}
