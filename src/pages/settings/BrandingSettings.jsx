import FieldValidationMessage from '../../components/FieldValidationMessage';
import PremiumLogoSettings from '../../components/PremiumLogoSettings';
import BrandingFormFields from '../../components/settings/BrandingFormFields';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SettingsSaveBar, { SettingsEditingBanner } from '../../components/settings/SettingsSaveBar';
import { ViewField } from '../../components/settings/SettingsSection';
import useBusinessSettingsForm from '../../hooks/useBusinessSettingsForm';
import { CURRENCY_INFO } from '../../utils/currency';
import {
    buildBrandingFieldErrors,
    BRANDING_FIELD_ORDER,
} from '../../utils/settingsValidation';
import { SettingsEditButton, SettingsEditingStatus } from './SettingsLayout';

const FORM_ID = 'branding-form';

export default function BrandingSettings() {
    const {
        businessInfo,
        formData,
        setFormData,
        isEditing,
        saving,
        errors,
        setErrors,
        handleChange,
        handleSubmit,
        handleEdit,
        handleCancel,
    } = useBusinessSettingsForm({
        validate: buildBrandingFieldErrors,
        fieldOrder: BRANDING_FIELD_ORDER,
        payloadKeys: ['brandColor'],
        successMessage: 'Branding saved',
    });

    const brandColor = businessInfo.brandColor || '#16A34A';

    return (
        <SettingsPageShell
            title="Branding"
            subtitle="Visual identity on PDFs and across the app"
            backTo="/settings/business"
            backLabel="Business Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Business Settings', to: '/settings/business' },
                { label: 'Branding', to: '/settings/business/branding' },
            ]}
            actions={
                !isEditing ? (
                    <SettingsEditButton onClick={handleEdit} />
                ) : (
                    <SettingsEditingStatus />
                )
            }
        >
            <div className={isEditing ? 'pb-24 lg:pb-0' : undefined}>
            {isEditing ? <SettingsEditingBanner /> : null}

            {!isEditing ? (
                <div className="card space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <ViewField label="Currency">
                            {CURRENCY_INFO.symbol} {CURRENCY_INFO.name} ({CURRENCY_INFO.code})
                        </ViewField>
                        <div>
                            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                Brand color
                            </dt>
                            <dd className="mt-2 flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl border border-zinc-200 shadow-sm"
                                    style={{ backgroundColor: brandColor }}
                                />
                                <span className="text-sm font-mono font-medium text-zinc-700">
                                    {brandColor}
                                </span>
                            </dd>
                        </div>
                    </div>
                    <PremiumLogoSettings
                        formData={businessInfo}
                        setFormData={setFormData}
                        isEditing={false}
                        embedded
                    />
                </div>
            ) : (
                <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="card">
                    <BrandingFormFields
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
                        setFormData={setFormData}
                        setErrors={setErrors}
                        isEditing={isEditing}
                    />
                    {errors.submit ? (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <FieldValidationMessage message={errors.submit} />
                        </div>
                    ) : null}
                    <div className="mt-6 hidden lg:block">
                        <SettingsSaveBar
                            formId={FORM_ID}
                            saving={saving}
                            onCancel={handleCancel}
                            desktopOnly
                        />
                    </div>
                </form>
            )}

            {isEditing ? (
                <SettingsSaveBar
                    formId={FORM_ID}
                    saving={saving}
                    onCancel={handleCancel}
                    mobileOnly
                />
            ) : null}
            </div>
        </SettingsPageShell>
    );
}
