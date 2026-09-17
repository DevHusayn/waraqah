import { Globe, Mail, MapPin, Phone, Clock3, Banknote, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import {
    APP_CURRENCY,
    DEFAULT_COUNTRY,
    canCorrectBooksRebase,
    formatExchangeRateValue,
    getCountryName,
    getCurrencyInfo,
    getLastBooksRebase,
    getTimezoneLabel,
    needsBooksCurrencyRebase,
    isBooksRebaseRateError,
    normalizeCurrency,
} from '@waraqah/shared';
import BooksCurrencyRebaseModal from '../../components/BooksCurrencyRebaseModal';
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

function formatRebaseDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function CompanyProfileSettings() {
    const [rebaseMode, setRebaseMode] = useState(null);
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
        saveForm,
        finishEditing,
    } = useBusinessSettingsForm({
        validate: buildProfileFieldErrors,
        fieldOrder: PROFILE_FIELD_ORDER,
        payloadKeys: ['name', 'address', 'email', 'phone', 'website', 'timezone', 'country', 'defaultCurrency'],
        autoEditIfEmpty: true,
        successMessage: 'Company profile saved',
        interceptSubmit: (form, saved) => {
            if (needsBooksCurrencyRebase(form.defaultCurrency, saved.defaultCurrency, saved.hasBooksAmounts)) {
                setRebaseMode('convert');
                return false;
            }
            return true;
        },
        onSaveError: (message) => {
            if (isBooksRebaseRateError(message)) {
                setRebaseMode((current) => current || 'convert');
                return true;
            }
            return false;
        },
    });

    const lastRebase = getLastBooksRebase(businessInfo);
    const canCorrect = canCorrectBooksRebase(businessInfo);
    const convertFrom = normalizeCurrency(businessInfo.defaultCurrency || APP_CURRENCY);
    const convertTo = normalizeCurrency(formData.defaultCurrency || APP_CURRENCY);
    const modalFrom = rebaseMode === 'correct' && lastRebase ? lastRebase.from : convertFrom;
    const modalTo = rebaseMode === 'correct' && lastRebase ? lastRebase.to : convertTo;

    const handleConfirmRebase = async (rate) => {
        if (rebaseMode === 'correct') {
            const ok = await saveForm(
                { currencyExchangeRate: rate },
                {
                    keepEditing: true,
                    skipValidation: true,
                    successMessage: 'Books rate updated',
                }
            );
            if (!ok) return;
            setRebaseMode(null);
            return;
        }

        const ok = await saveForm(
            { currencyExchangeRate: rate },
            {
                keepEditing: true,
                successMessage: `Books converted to ${normalizeCurrency(formData.defaultCurrency || APP_CURRENCY)}`,
            }
        );
        if (!ok) return;
        setRebaseMode(null);
        requestAnimationFrame(() => finishEditing());
    };

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
                            <ViewField
                                label="Country"
                                value={getCountryName(businessInfo.country || DEFAULT_COUNTRY)}
                                icon={MapPin}
                            />
                            <ViewField
                                label="Currency"
                                value={(() => {
                                    const info = getCurrencyInfo(businessInfo.defaultCurrency || APP_CURRENCY);
                                    return `${info.symbol} ${info.name} (${info.code})`;
                                })()}
                                icon={Banknote}
                            />
                            <ViewField
                                label="Business timezone"
                                value={getTimezoneLabel(businessInfo.timezone)}
                                icon={Clock3}
                            />
                        </dl>
                    </div>
                ) : (
                    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="card">
                        <ProfileFormFields
                            formData={formData}
                            errors={errors}
                            onChange={handleChange}
                            showTimezone
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
                                onCancel={() => {
                                    setRebaseMode(null);
                                    handleCancel();
                                }}
                                desktopOnly
                            />
                        </div>
                    </form>
                )}

                {canCorrect && lastRebase ? (
                    <div className="card mt-4">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                                <ArrowRightLeft size={18} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                                            Last books conversion
                                        </p>
                                        <p className="mt-1.5 text-base font-semibold text-foreground tabular-nums tracking-tight">
                                            1 {lastRebase.from}
                                            <span className="mx-1.5 font-normal text-foreground-muted">=</span>
                                            {formatExchangeRateValue(lastRebase.rate)} {lastRebase.to}
                                        </p>
                                        <p className="mt-1 text-sm text-foreground-muted leading-relaxed">
                                            {formatRebaseDate(lastRebase.at)
                                                ? `Converted ${formatRebaseDate(lastRebase.at)}. `
                                                : ''}
                                            Fix the rate if it was entered by mistake. Newer records are
                                            left unchanged.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-secondary text-sm py-2 px-3.5 shrink-0 self-start"
                                        onClick={() => setRebaseMode('correct')}
                                        disabled={saving}
                                    >
                                        Update rate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {isEditing ? (
                    <SettingsSaveBar
                        formId={FORM_ID}
                        saving={saving}
                        onCancel={() => {
                            setRebaseMode(null);
                            handleCancel();
                        }}
                        mobileOnly
                    />
                ) : null}
            </div>
            <BooksCurrencyRebaseModal
                open={Boolean(rebaseMode)}
                mode={rebaseMode || 'convert'}
                fromCurrency={modalFrom}
                toCurrency={modalTo}
                initialRate={rebaseMode === 'correct' && lastRebase ? lastRebase.rate : ''}
                saving={saving}
                onCancel={() => setRebaseMode(null)}
                onConfirm={handleConfirmRebase}
            />
        </SettingsPageShell>
    );
}
