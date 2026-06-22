import FieldValidationMessage from '../FieldValidationMessage';
import RequiredLabel from '../RequiredLabel';
import { inputClass } from '../../utils/formFieldValidation';

export default function ProfileFormFields({ formData, errors, onChange }) {
    return (
        <div className="space-y-5">
            <div>
                <RequiredLabel htmlFor="settings-name">Business name</RequiredLabel>
                <input
                    id="settings-name"
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={onChange}
                    className={inputClass(Boolean(errors.name))}
                    placeholder="e.g. Waraqah Invoice"
                    aria-invalid={Boolean(errors.name)}
                />
                <FieldValidationMessage message={errors.name} />
            </div>

            <div>
                <RequiredLabel htmlFor="settings-address">Business address</RequiredLabel>
                <textarea
                    id="settings-address"
                    name="address"
                    value={formData.address || ''}
                    onChange={onChange}
                    className={inputClass(Boolean(errors.address), 'resize-none min-h-[88px]')}
                    rows={3}
                    placeholder="123 Asokoro, Abuja"
                    aria-invalid={Boolean(errors.address)}
                />
                <FieldValidationMessage message={errors.address} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <RequiredLabel htmlFor="settings-email">Email</RequiredLabel>
                    <input
                        id="settings-email"
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.email))}
                        placeholder="contact@company.com"
                        aria-invalid={Boolean(errors.email)}
                    />
                    <FieldValidationMessage message={errors.email} />
                </div>
                <div>
                    <RequiredLabel htmlFor="settings-phone">Phone</RequiredLabel>
                    <input
                        id="settings-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={onChange}
                        className={inputClass(Boolean(errors.phone))}
                        placeholder="+234 818 121 0108"
                        aria-invalid={Boolean(errors.phone)}
                    />
                    <FieldValidationMessage message={errors.phone} />
                </div>
            </div>

            <div>
                <label htmlFor="settings-website" className="label">
                    Website <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                    id="settings-website"
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={onChange}
                    className="input-field"
                    placeholder="https://www.example.com"
                />
            </div>
        </div>
    );
}
