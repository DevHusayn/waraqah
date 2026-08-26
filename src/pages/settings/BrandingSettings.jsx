import FieldValidationMessage from '../../components/FieldValidationMessage';
import PremiumLogoSettings from '../../components/PremiumLogoSettings';
import BrandingFormFields from '../../components/settings/BrandingFormFields';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SettingsSaveBar from '../../components/settings/SettingsSaveBar';
import { ViewField } from '../../components/settings/SettingsSection';
import useBusinessSettingsForm from '../../hooks/useBusinessSettingsForm';
import { CURRENCY_INFO } from '../../utils/currency';
import {
    buildBrandingFieldErrors,
    BRANDING_FIELD_ORDER,
} from '../../utils/settingsValidation';
import { SettingsEditButton, SettingsEditingStatus } from './SettingsLayout';

const FORM_ID = 'branding-form';

function BrandColorEditingBanner() {
    return (
        <div className="mb-6 rounded-xl border border-brand/20 bg-brand-subtle/60 px-4 py-3 text-sm text-foreground-muted">
            Editing brand color. Use Save changes to apply or Cancel to discard.
        </div>
    );
}

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
        successMessage: 'Brand color saved',
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
            <div className={`space-y-6 ${isEditing ? 'pb-24 lg:pb-0' : ''}`}>
                {!isEditing ? (
                    <div className="card">
                        <h2 className="text-base font-semibold text-foreground mb-4">Brand color</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <ViewField label="Currency">
                                {CURRENCY_INFO.symbol} {CURRENCY_INFO.name} ({CURRENCY_INFO.code})
                            </ViewField>
                            <div>
                                <dt className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                                    Brand color
                                </dt>
                                <dd className="mt-2 flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl border border-border shadow-sm"
                                        style={{ backgroundColor: brandColor }}
                                    />
                                    <span className="text-sm font-mono font-medium text-foreground-muted">
                                        {brandColor}
                                    </span>
                                </dd>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <BrandColorEditingBanner />
                        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="card">
                            <h2 className="text-base font-semibold text-foreground mb-4">Brand color</h2>
                            <BrandingFormFields
                                formData={formData}
                                errors={errors}
                                onChange={handleChange}
                                setFormData={setFormData}
                                setErrors={setErrors}
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
                        {isEditing ? (
                            <SettingsSaveBar
                                formId={FORM_ID}
                                saving={saving}
                                onCancel={handleCancel}
                                mobileOnly
                            />
                        ) : null}
                    </>
                )}

                <div className="card">
                    <PremiumLogoSettings
                        formData={businessInfo}
                        setFormData={setFormData}
                        canManage
                        standalone
                    />
                </div>
            </div>
        </SettingsPageShell>
    );
}
