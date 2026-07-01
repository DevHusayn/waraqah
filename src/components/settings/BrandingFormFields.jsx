import FieldValidationMessage from '../FieldValidationMessage';
import RequiredLabel from '../RequiredLabel';
import PremiumLogoSettings from '../PremiumLogoSettings';
import { inputClass, clearFieldError } from '../../utils/formFieldValidation';
import { BRAND_PRESETS } from '../../utils/settingsValidation';

export default function BrandingFormFields({
    formData,
    errors,
    onChange,
    setFormData,
    setErrors,
    isEditing,
}) {
    return (
        <div className="space-y-6">
            <div>
                <RequiredLabel htmlFor="settings-brand-color">Brand color</RequiredLabel>
                <p className="text-sm text-zinc-500 mb-4">
                    Used in PDF headers, accents, and your invoice theme.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/60">
                    <div
                        className="w-full sm:w-24 h-16 sm:h-24 rounded-xl border-2 border-white shadow-md shrink-0"
                        style={{ backgroundColor: formData.brandColor || '#16A34A' }}
                        aria-hidden
                    />
                    <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                name="brandColor"
                                value={formData.brandColor || '#16A34A'}
                                onChange={onChange}
                                className="h-11 w-14 rounded-lg border border-zinc-200 cursor-pointer bg-white p-1"
                                aria-label="Pick brand color"
                            />
                            <input
                                id="settings-brand-color"
                                type="text"
                                name="brandColor"
                                value={formData.brandColor || '#16A34A'}
                                onChange={onChange}
                                className={inputClass(Boolean(errors.brandColor), 'font-mono text-sm')}
                                placeholder="#16A34A"
                                aria-invalid={Boolean(errors.brandColor)}
                            />
                        </div>
                        <FieldValidationMessage message={errors.brandColor} />
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-medium text-zinc-500 mb-2.5">Quick picks</p>
                    <div className="flex flex-wrap gap-2">
                        {BRAND_PRESETS.map((preset) => {
                            const selected =
                                (formData.brandColor || '#16A34A').toLowerCase() === preset.color;
                            return (
                                <button
                                    key={preset.color}
                                    type="button"
                                    title={preset.name}
                                    onClick={() => {
                                        setFormData((prev) => ({ ...prev, brandColor: preset.color }));
                                        clearFieldError(setErrors, 'brandColor');
                                    }}
                                    className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-105 ${
                                        selected
                                            ? 'border-zinc-900 ring-2 ring-offset-2 ring-zinc-400'
                                            : 'border-white shadow-sm hover:border-zinc-200'
                                    }`}
                                    style={{ backgroundColor: preset.color }}
                                    aria-label={`${preset.name}${selected ? ' (selected)' : ''}`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            <PremiumLogoSettings
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                embedded
            />
        </div>
    );
}
