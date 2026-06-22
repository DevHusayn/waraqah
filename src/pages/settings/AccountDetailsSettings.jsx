import FieldValidationMessage from '../../components/FieldValidationMessage';
import AccountFormFields from '../../components/settings/AccountFormFields';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SettingsSaveBar, { SettingsEditingBanner } from '../../components/settings/SettingsSaveBar';
import { ViewField } from '../../components/settings/SettingsSection';
import useBusinessSettingsForm from '../../hooks/useBusinessSettingsForm';
import {
    buildAccountFieldErrors,
    ACCOUNT_FIELD_ORDER,
} from '../../utils/settingsValidation';
import { SettingsEditButton, SettingsEditingStatus } from './SettingsLayout';

const FORM_ID = 'account-details-form';

export default function AccountDetailsSettings() {
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
        validate: buildAccountFieldErrors,
        fieldOrder: ACCOUNT_FIELD_ORDER,
        successMessage: 'Account details saved',
    });

    return (
        <SettingsPageShell
            title="Account Details"
            subtitle="Bank information printed on invoices for client payments"
            backTo="/settings/business"
            backLabel="Business Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Business Settings', to: '/settings/business' },
                { label: 'Account Details', to: '/settings/business/account-details' },
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
                        <ViewField label="Account name" value={businessInfo.paymentAccountName} />
                        <ViewField label="Bank name" value={businessInfo.paymentBankName} />
                        <ViewField label="Account number" value={businessInfo.paymentAccountNumber} />
                        <div className="sm:col-span-2">
                            <ViewField
                                label="Payment instructions"
                                value={businessInfo.paymentInstructions}
                            />
                        </div>
                    </dl>
                </div>
            ) : (
                <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="card">
                    <AccountFormFields
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
