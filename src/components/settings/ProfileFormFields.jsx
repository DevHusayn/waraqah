import FieldValidationMessage from '../FieldValidationMessage';
import RequiredLabel from '../RequiredLabel';
import { inputClass } from '../../utils/formFieldValidation';

const DEFAULT_REQUIRED_FIELDS = ['name', 'address', 'email', 'phone'];

function ProfileFieldLabel({ htmlFor, required, children }) {
    if (required) {
        return <RequiredLabel htmlFor={htmlFor}>{children}</RequiredLabel>;
    }
    return (
        <label htmlFor={htmlFor} className="label">
            {children}{' '}
            <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
    );
}

export default function ProfileFormFields({
    formData,
    errors,
    onChange,
    idPrefix = 'settings-',
    emailInputId,
    autoCompleteSection,
    requiredFields = DEFAULT_REQUIRED_FIELDS,
}) {
    const fieldId = (key) => `${idPrefix}${key}`;
    const businessEmailId = emailInputId || fieldId('email');
    const autoComplete = (token) =>
        autoCompleteSection ? `${autoCompleteSection} ${token}` : token;
    const isRequired = (key) => requiredFields.includes(key);

    const syncAddressAutofill = (value) => {
        if (!value) return;
        onChange({ target: { name: 'address', value } });
    };

    return (
        <div className="space-y-5">
            <div>
                <ProfileFieldLabel htmlFor={fieldId('name')} required={isRequired('name')}>
                    Business name
                </ProfileFieldLabel>
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
                <ProfileFieldLabel htmlFor={fieldId('address')} required={isRequired('address')}>
                    Business address
                </ProfileFieldLabel>
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
                    <ProfileFieldLabel htmlFor={businessEmailId} required={isRequired('email')}>
                        Business email
                    </ProfileFieldLabel>
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
                    <ProfileFieldLabel htmlFor={fieldId('phone')} required={isRequired('phone')}>
                        Phone
                    </ProfileFieldLabel>
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
