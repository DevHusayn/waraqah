import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import FieldValidationMessage from '../../components/FieldValidationMessage';
import ProfileFormFields from '../../components/settings/ProfileFormFields';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SettingsSaveBar, { SettingsEditingBanner } from '../../components/settings/SettingsSaveBar';
import { ViewField } from '../../components/settings/SettingsSection';
import useBusinessSettingsForm from '../../hooks/useBusinessSettingsForm';
import {
    buildProfileFieldErrors,
    PROFILE_FIELD_ORDER,
} from '../../utils/settingsValidation';
import { SettingsEditButton, SettingsEditingStatus } from './SettingsLayout';

const FORM_ID = 'company-profile-form';

export default function CompanyProfileSettings() {
    const {
        businessInfo,
        formData,
        isEditing,
        saving,
        errors,
        handleChange,
        handleSubmit,
        handleEdit,
        handleCancel,
    } = useBusinessSettingsForm({
        validate: buildProfileFieldErrors,
        fieldOrder: PROFILE_FIELD_ORDER,
        payloadKeys: ['name', 'address', 'email', 'phone', 'website'],
        autoEditIfEmpty: true,
        successMessage: 'Company profile saved',
    });

    return (
        <SettingsPageShell
            title="Company Profile"
            subtitle="Contact details shown on every invoice and receipt"
            backTo="/settings/business"
            backLabel="Business Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Business Settings', to: '/settings/business' },
                { label: 'Company Profile', to: '/settings/business/company-profile' },
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
                <div className="card">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <ViewField label="Business name" value={businessInfo.name} />
                        <ViewField label="Email" value={businessInfo.email} icon={Mail} />
                        <ViewField label="Phone" value={businessInfo.phone} icon={Phone} />
                        <ViewField label="Website" value={businessInfo.website} icon={Globe} />
                        <div className="sm:col-span-2">
                            <ViewField label="Address" value={businessInfo.address} icon={MapPin} />
                        </div>
                    </dl>
                </div>
            ) : (
                <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="card">
                    <ProfileFormFields
                        formData={formData}
                        errors={errors}
                        onChange={handleChange}
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
