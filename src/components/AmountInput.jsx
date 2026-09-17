import { useState } from 'react';
import { formatAmountInput, parseAmountInput } from '../utils/numberInput';
import { inputClass } from '../utils/formFieldValidation';

/**
 * Text input that formats monetary amounts with thousands separators while typing.
 * Pass `numeric` to emit parsed numbers; otherwise emits formatted strings.
 */
export default function AmountInput({
    id,
    name,
    value,
    onChange,
    numeric = false,
    error = false,
    shake = false,
    className = '',
    placeholder = '0.00',
    disabled = false,
    autoComplete = 'off',
    onFocus,
    onBlur,
    ...rest
}) {
    const formattedValue =
        value === '' || value == null ? '' : formatAmountInput(String(value));
    // Keep in-progress text (e.g. "10.") so numeric mode does not swallow the decimal point.
    const [draft, setDraft] = useState(null);
    const displayValue = draft != null ? draft : formattedValue;

    const handleChange = (e) => {
        const raw = e.target.value;
        if (raw === '') {
            setDraft('');
            onChange('');
            return;
        }
        const formatted = formatAmountInput(raw);
        setDraft(formatted);
        onChange(numeric ? parseAmountInput(formatted) : formatted);
    };

    const handleFocus = (e) => {
        setDraft(formattedValue);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setDraft(null);
        onBlur?.(e);
    };

    return (
        <input
            id={id}
            name={name}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={inputClass(error, `${className} tabular-nums`.trim(), { shake: error && shake })}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={error || undefined}
            {...rest}
        />
    );
}

export { formatAmountInput, parseAmountInput };
