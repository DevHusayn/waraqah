import FormSection from '../FormSection';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import DatePickerField from '../DatePickerField';
import ExpiryDateField from './ExpiryDateField';
import { inputClass } from '../../utils/formFieldValidation';

export default function DocumentDetailsSection({
    icon: Icon,
    title,
    description,
    idPrefix,
    numberLabel,
    numberDisplay,
    formData,
    fieldErrors,
    onChange,
    onIssueDateChange,
    expiry,
}) {
    return (
        <FormSection icon={Icon} title={title} description={description}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">{numberLabel}</label>
                    <input
                        type="text"
                        value={numberDisplay}
                        className="input-field bg-zinc-50 text-zinc-500 cursor-not-allowed"
                        readOnly
                        disabled
                    />
                </div>
                <div>
                    <RequiredLabel htmlFor={`${idPrefix}-tax-rate`}>Tax rate (%)</RequiredLabel>
                    <input
                        id={`${idPrefix}-tax-rate`}
                        type="number"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={onChange}
                        className={inputClass(Boolean(fieldErrors.taxRate))}
                        min="0"
                        max="100"
                        step="0.01"
                        aria-invalid={Boolean(fieldErrors.taxRate)}
                    />
                    <FieldValidationMessage message={fieldErrors.taxRate} />
                </div>
                <div>
                    <label className="label" htmlFor={`${idPrefix}-discount-value`}>
                        Discount (%)
                    </label>
                    <input
                        id={`${idPrefix}-discount-value`}
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={onChange}
                        className={inputClass(Boolean(fieldErrors.discountValue))}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        aria-invalid={Boolean(fieldErrors.discountValue)}
                    />
                    <FieldValidationMessage message={fieldErrors.discountValue} />
                </div>
                <div>
                    <RequiredLabel htmlFor={`${idPrefix}-date`}>Issue date</RequiredLabel>
                    <DatePickerField
                        id={`${idPrefix}-date`}
                        value={formData.date}
                        onChange={onIssueDateChange}
                        error={Boolean(fieldErrors.date)}
                        allowClear={false}
                        placeholder="Issue date"
                    />
                    <FieldValidationMessage message={fieldErrors.date} />
                </div>
                {expiry ? (
                    <ExpiryDateField
                        idPrefix={idPrefix}
                        label={expiry.label}
                        hasExpiry={formData[expiry.hasFieldKey]}
                        expiryValue={formData[expiry.dateFieldKey]}
                        dateFieldKey={expiry.dateFieldKey}
                        emptyHint={expiry.emptyHint}
                        minDate={formData.date}
                        fieldErrors={fieldErrors}
                        onToggle={expiry.onToggle}
                        onDateChange={expiry.onDateChange}
                    />
                ) : null}
            </div>
        </FormSection>
    );
}
