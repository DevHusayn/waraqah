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
    ...rest
}) {
    const displayValue =
        value === '' || value == null ? '' : formatAmountInput(String(value));

    const handleChange = (e) => {
        const raw = e.target.value;
        if (raw === '') {
            onChange('');
            return;
        }
        const formatted = formatAmountInput(raw);
        onChange(numeric ? parseAmountInput(formatted) : formatted);
    };

    return (
        <input
            id={id}
            name={name}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
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
