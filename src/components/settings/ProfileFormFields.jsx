import FieldValidationMessage from '../FieldValidationMessage';
import RequiredLabel from '../RequiredLabel';
import { inputClass } from '../../utils/formFieldValidation';

export default function ProfileFormFields({
    formData,
    errors,
    onChange,
    idPrefix = 'settings-',
    emailInputId,
    autoCompleteSection,
}) {
    const fieldId = (key) => `${idPrefix}${key}`;
    const businessEmailId = emailInputId || fieldId('email');
    const autoComplete = (token) =>
        autoCompleteSection ? `${autoCompleteSection} ${token}` : token;

    const syncAddressAutofill = (value) => {
        if (!value) return;
        onChange({ target: { name: 'address', value } });
    };

    return (
        <div className="space-y-5">
            <div>
                <RequiredLabel htmlFor={fieldId('name')}>Business name</RequiredLabel>
                <input
                    id={fieldId('name')}
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={onChange}
                    className={inputClass(Boolean(errors.name))}
                    placeholder="e.g. Waraqah Invoice"
                    autoComplete={autoComplete('organization')}
                    aria-invalid={Boolean(errors.name)}
                />
                <FieldValidationMessage message={errors.name} />
            </div>

            <div>
                <RequiredLabel htmlFor={fieldId('address')}>Business address</RequiredLabel>
                {/* Hidden input catches browser address autofill (Chrome targets inputs, not textareas). */}
                <input
                    type="text"
                    tabIndex={-1}
                    aria-hidden="true"
                    autoComplete={autoComplete('street-address')}
                    className="sr-only"
                    onChange={(e) => syncAddressAutofill(e.target.value)}
                />
                <textarea
                    id={fieldId('address')}
                    name="address"
                    value={formData.address || ''}
                    onChange={onChange}
                    className={inputClass(Boolean(errors.address), 'resize-none min-h-[88px]')}
                    rows={3}
                    placeholder="123 Asokoro, Abuja"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.address)}
                />
                <FieldValidationMessage message={errors.address} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <RequiredLabel htmlFor={businessEmailId}>Email</RequiredLabel>
                    <input
                        id={businessEmailId}
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.email))}
                        placeholder="contact@company.com"
                        autoComplete={autoComplete('email')}
                        aria-invalid={Boolean(errors.email)}
                    />
                    <FieldValidationMessage message={errors.email} />
                </div>
                <div>
                    <RequiredLabel htmlFor={fieldId('phone')}>Phone</RequiredLabel>
                    <input
                        id={fieldId('phone')}
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.phone))}
                        placeholder="+234 818 121 0108"
                        autoComplete={autoComplete('tel')}
                        aria-invalid={Boolean(errors.phone)}
                    />
                    <FieldValidationMessage message={errors.phone} />
                </div>
            </div>

            <div>
                <label htmlFor={fieldId('website')} className="label">
                    Website <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                    id={fieldId('website')}
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={onChange}
                    className="input-field"
                    placeholder="https://www.example.com"
                    autoComplete={autoComplete('url')}
                />
            </div>
        </div>
    );
}
