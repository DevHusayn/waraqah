import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Building2,
    Save,
    Edit,
    X,
    Palette,
    Crown,
    Mail,
    Phone,
    MapPin,
    Globe,
    Sparkles,
    Loader2,
    Landmark,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { CURRENCY_INFO } from '../utils/currency';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { getCompanyLogoAvatarUrl } from '../utils/brandAssets';
import { getBusinessInitials, isPremiumUser } from '../utils/premium';
import PremiumLogoSettings from '../components/PremiumLogoSettings';
import SubscriptionBilling from '../components/SubscriptionBilling';
import DevPlanToggle from '../components/DevPlanToggle';
import { premiumUpgradeLabel } from '../constants/pricing';
import PageHeader from '../components/PageHeader';
import FieldValidationMessage from '../components/FieldValidationMessage';
import RequiredLabel from '../components/RequiredLabel';
import {
    validateRequired,
    validateEmail,
    validateHexColor,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';

const SETTINGS_FIELD_ORDER = ['name', 'address', 'email', 'phone', 'brandColor'];

const BRAND_PRESETS = [
    { color: '#0284c7', name: 'Sky' },
    { color: '#0ea5e9', name: 'Blue' },
    { color: '#6366f1', name: 'Indigo' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#10b981', name: 'Green' },
    { color: '#f59e0b', name: 'Amber' },
    { color: '#ef4444', name: 'Red' },
    { color: '#ec4899', name: 'Pink' },
];

const SECTIONS = [
    { id: 'profile', label: 'Company', icon: Building2 },
    { id: 'account', label: 'Account details', icon: Landmark },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'plan', label: 'Plan & billing', icon: Crown },
];

function buildSettingsFieldErrors(formData) {
    const errors = {
        name: validateRequired(formData.name, 'Please enter your business name.'),
        address: validateRequired(formData.address, 'Please enter your business address.'),
        email: validateEmail(
            formData.email,
            'Please enter your business email.',
            'Please enter a valid business email.'
        ),
        phone: validateRequired(formData.phone, 'Please enter your phone number.'),
        brandColor: validateHexColor(formData.brandColor, 'Please choose a brand color.'),
    };

    const hasPartialPayment =
        formData.paymentAccountName?.trim() ||
        formData.paymentBankName?.trim() ||
        formData.paymentAccountNumber?.trim();

    if (hasPartialPayment) {
        if (!formData.paymentAccountName?.trim()) {
            errors.paymentAccountName = 'Please enter the account name.';
        }
        if (!formData.paymentBankName?.trim()) {
            errors.paymentBankName = 'Please enter the bank name.';
        }
        if (!formData.paymentAccountNumber?.trim()) {
            errors.paymentAccountNumber = 'Please enter the account number.';
        }
    }

    return errors;
}

function SettingsSection({ id, icon: Icon, title, description, children }) {
    return (
        <section id={id} className="card scroll-mt-28">
            <div className="flex items-start gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                    <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

function ViewField({ label, value, icon: Icon, children }) {
    return (
        <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                {label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-slate-900 break-words">
                {children ?? (value?.trim() ? value : '—')}
            </dd>
        </div>
    );
}

function PlanBadge({ premium }) {
    if (premium) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                <Crown className="h-3 w-3" aria-hidden />
                Premium
            </span>
        );
    }
    return (
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
            Free plan
        </span>
    );
}

function SectionNav({ activeId, onSelect }) {
    return (
        <nav aria-label="Settings sections" className="space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = activeId === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                            active
                                ? 'bg-brand-light text-brand'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        {label}
                    </button>
                );
            })}
        </nav>
    );
}

const Settings = () => {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [formData, setFormData] = useState(businessInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeSection, setActiveSection] = useState('profile');

    const premium = isPremiumUser(businessInfo);
    const displayInfo = isEditing ? formData : businessInfo;
    const logoUrl = getCompanyLogoAvatarUrl(displayInfo);
    const brandColor = displayInfo.brandColor || '#0284c7';

    useEffect(() => {
        if (!isEditing) {
            setFormData(businessInfo);
        }
    }, [businessInfo, isEditing]);

    useEffect(() => {
        if (!businessInfo.name?.trim() && !businessInfo.email?.trim()) {
            setIsEditing(true);
        }
    }, [businessInfo.name, businessInfo.email]);

    const scrollToSection = useCallback((id) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setErrors, name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = buildSettingsFieldErrors(formData);
        const firstInvalid = firstFieldError(newErrors, SETTINGS_FIELD_ORDER);
        if (firstInvalid) {
            setErrors(newErrors);
            const ids = {
                name: 'settings-name',
                address: 'settings-address',
                email: 'settings-email',
                phone: 'settings-phone',
                brandColor: 'settings-brand-color',
                paymentAccountName: 'settings-payment-account-name',
                paymentBankName: 'settings-payment-bank-name',
                paymentAccountNumber: 'settings-payment-account-number',
            };
            const sectionMap = {
                brandColor: 'branding',
                paymentAccountName: 'account',
                paymentBankName: 'account',
                paymentAccountNumber: 'account',
            };
            focusFieldById(ids[firstInvalid]);
            scrollToSection(sectionMap[firstInvalid] || (firstInvalid === 'brandColor' ? 'branding' : 'profile'));
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            const payload = buildBusinessInfoPayload(formData, businessInfo);
            await updateBusinessInfo(payload);
            setIsEditing(false);
            showToast('Settings saved successfully', 'success');
        } catch (err) {
            setErrors({ submit: err.message });
            showToast(err.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setFormData(businessInfo);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(businessInfo);
        setIsEditing(false);
        setErrors({});
    };

    const profileForm = (
        <div className="space-y-5">
            <div>
                <RequiredLabel htmlFor="settings-name">Business name</RequiredLabel>
                <input
                    id="settings-name"
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        className={inputClass(Boolean(errors.phone))}
                        placeholder="+234 818 121 0108"
                        aria-invalid={Boolean(errors.phone)}
                    />
                    <FieldValidationMessage message={errors.phone} />
                </div>
            </div>

            <div>
                <label htmlFor="settings-website" className="label">
                    Website <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                    id="settings-website"
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://www.example.com"
                />
            </div>
        </div>
    );

    const accountForm = (
        <div className="space-y-5">
            <p className="text-sm text-slate-500">
                Bank details appear on invoice PDFs so clients know where to pay you.
            </p>
            <div>
                <label htmlFor="settings-payment-account-name" className="label">
                    Account name
                </label>
                <input
                    id="settings-payment-account-name"
                    type="text"
                    name="paymentAccountName"
                    value={formData.paymentAccountName || ''}
                    onChange={handleChange}
                    className={inputClass(Boolean(errors.paymentAccountName))}
                    placeholder="e.g. Waraqah Ltd"
                    aria-invalid={Boolean(errors.paymentAccountName)}
                />
                <FieldValidationMessage message={errors.paymentAccountName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="settings-payment-bank-name" className="label">
                        Bank name
                    </label>
                    <input
                        id="settings-payment-bank-name"
                        type="text"
                        name="paymentBankName"
                        value={formData.paymentBankName || ''}
                        onChange={handleChange}
                        className={inputClass(Boolean(errors.paymentBankName))}
                        placeholder="e.g. GTBank"
                        aria-invalid={Boolean(errors.paymentBankName)}
                    />
                    <FieldValidationMessage message={errors.paymentBankName} />
                </div>
                <div>
                    <label htmlFor="settings-payment-account-number" className="label">
                        Account number
                    </label>
                    <input
                        id="settings-payment-account-number"
                        type="text"
                        name="paymentAccountNumber"
                        value={formData.paymentAccountNumber || ''}
                        onChange={handleChange}
                        className={inputClass(Boolean(errors.paymentAccountNumber))}
                        placeholder="0123456789"
                        aria-invalid={Boolean(errors.paymentAccountNumber)}
                    />
                    <FieldValidationMessage message={errors.paymentAccountNumber} />
                </div>
            </div>
            <div>
                <label htmlFor="settings-payment-instructions" className="label">
                    Payment instructions <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                    id="settings-payment-instructions"
                    name="paymentInstructions"
                    value={formData.paymentInstructions || ''}
                    onChange={handleChange}
                    className="input-field resize-none min-h-[72px]"
                    rows={2}
                    placeholder="e.g. Use invoice number as payment reference"
                />
            </div>
        </div>
    );

    const brandingForm = (
        <div className="space-y-6">
            <div>
                <RequiredLabel htmlFor="settings-brand-color">Brand color</RequiredLabel>
                <p className="text-sm text-slate-500 mb-4">
                    Used in PDF headers, accents, and your invoice theme.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div
                        className="w-full sm:w-24 h-16 sm:h-24 rounded-xl border-2 border-white shadow-md shrink-0"
                        style={{ backgroundColor: formData.brandColor || '#0284c7' }}
                        aria-hidden
                    />
                    <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                name="brandColor"
                                value={formData.brandColor || '#0284c7'}
                                onChange={handleChange}
                                className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer bg-white p-1"
                                aria-label="Pick brand color"
                            />
                            <input
                                id="settings-brand-color"
                                type="text"
                                name="brandColor"
                                value={formData.brandColor || '#0284c7'}
                                onChange={handleChange}
                                className={inputClass(Boolean(errors.brandColor), 'font-mono text-sm')}
                                placeholder="#0284c7"
                                aria-invalid={Boolean(errors.brandColor)}
                            />
                        </div>
                        <FieldValidationMessage message={errors.brandColor} />
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 mb-2.5">Quick picks</p>
                    <div className="flex flex-wrap gap-2">
                        {BRAND_PRESETS.map((preset) => {
                            const selected = (formData.brandColor || '#0284c7').toLowerCase() === preset.color;
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
                                            ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-400'
                                            : 'border-white shadow-sm hover:border-slate-200'
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

    const saveActions = (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
            <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary sm:min-w-[120px]"
            >
                <X size={18} aria-hidden />
                Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary sm:min-w-[160px]">
                {saving ? (
                    <>
                        <Loader2 size={18} className="animate-spin" aria-hidden />
                        Saving…
                    </>
                ) : (
                    <>
                        <Save size={18} aria-hidden />
                        Save changes
                    </>
                )}
            </button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-24 lg:pb-8">
            <PageHeader
                title="Settings"
                subtitle="Manage your company profile, branding, and subscription"
            >
                {!isEditing ? (
                    <button type="button" onClick={handleEdit} className="btn-primary">
                        <Edit size={18} aria-hidden />
                        Edit settings
                    </button>
                ) : (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                        Editing
                    </span>
                )}
            </PageHeader>

            {!isEditing && (
                <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {logoUrl ? (
                            <div className="h-16 w-16 rounded-xl border border-slate-200 bg-white p-1.5 shrink-0 overflow-hidden flex items-center justify-center">
                                <img
                                    src={logoUrl}
                                    alt=""
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div
                                className="h-16 w-16 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-sm"
                                style={{ backgroundColor: brandColor }}
                            >
                                {getBusinessInitials(displayInfo.name)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-slate-900 truncate">
                                    {displayInfo.name?.trim() || 'Your business'}
                                </h2>
                                <PlanBadge premium={premium} />
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5 truncate">
                                {displayInfo.email || 'Add your business email to get started'}
                            </p>
                        </div>
                    </div>
                    {!premium && (
                        <Link to="/upgrade" className="btn-primary shrink-0 gap-2">
                            <Sparkles size={18} aria-hidden />
                            Upgrade
                        </Link>
                    )}
                </div>
            )}

            {isEditing && (
                <div className="mb-6 rounded-xl border border-brand/20 bg-brand-subtle/60 px-4 py-3 text-sm text-slate-700">
                    You are editing your settings. Changes apply to all future invoices and PDFs.
                </div>
            )}

            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <aside className="lg:col-span-3 mb-6 lg:mb-0">
                    <div className="lg:sticky lg:top-24 space-y-4">
                        <div className="flex gap-2 overflow-x-auto scroll-x-touch pb-1 lg:hidden -mx-1 px-1">
                            {SECTIONS.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => scrollToSection(id)}
                                    className={`filter-pill shrink-0 flex items-center gap-1.5 ${
                                        activeSection === id
                                            ? 'filter-pill-active'
                                            : 'filter-pill-inactive'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" aria-hidden />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="hidden lg:block card !p-3">
                            <SectionNav activeId={activeSection} onSelect={scrollToSection} />
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-9 space-y-6">
                    {!isEditing ? (
                        <>
                            <SettingsSection
                                id="profile"
                                icon={Building2}
                                title="Company profile"
                                description="Contact details shown on every invoice and receipt"
                            >
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <ViewField label="Business name" value={businessInfo.name} />
                                    <ViewField
                                        label="Email"
                                        value={businessInfo.email}
                                        icon={Mail}
                                    />
                                    <ViewField
                                        label="Phone"
                                        value={businessInfo.phone}
                                        icon={Phone}
                                    />
                                    <ViewField
                                        label="Website"
                                        value={businessInfo.website}
                                        icon={Globe}
                                    />
                                    <div className="sm:col-span-2">
                                        <ViewField
                                            label="Address"
                                            value={businessInfo.address}
                                            icon={MapPin}
                                        />
                                    </div>
                                </dl>
                            </SettingsSection>

                            <SettingsSection
                                id="account"
                                icon={Landmark}
                                title="Account details"
                                description="Bank information printed on invoices for client payments"
                            >
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
                            </SettingsSection>

                            <SettingsSection
                                id="branding"
                                icon={Palette}
                                title="Branding"
                                description="Visual identity on PDFs and across the app"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <ViewField label="Currency">
                                        {CURRENCY_INFO.symbol} {CURRENCY_INFO.name} ({CURRENCY_INFO.code})
                                    </ViewField>
                                    <div>
                                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                            Brand color
                                        </dt>
                                        <dd className="mt-2 flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm"
                                                style={{ backgroundColor: brandColor }}
                                            />
                                            <span className="text-sm font-mono font-medium text-slate-700">
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
                            </SettingsSection>

                            <SettingsSection
                                id="plan"
                                icon={Crown}
                                title="Plan & billing"
                                description="Subscription status and invoice limits"
                            >
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {premium ? 'Premium plan' : 'Free plan'}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                {premium
                                                    ? 'Unlimited invoices, brand assets, and PDF customization'
                                                    : 'Limited monthly invoices — upgrade for full branding'}
                                            </p>
                                        </div>
                                        {!premium && (
                                            <Link to="/upgrade" className="btn-primary text-sm py-2">
                                                <Sparkles size={16} aria-hidden />
                                                {premiumUpgradeLabel()}
                                            </Link>
                                        )}
                                    </div>
                                    <DevPlanToggle formData={formData} setFormData={setFormData} />
                                    <SubscriptionBilling />
                                </div>
                            </SettingsSection>
                        </>
                    ) : (
                        <form id="settings-form" onSubmit={handleSubmit} noValidate className="space-y-6">
                            <SettingsSection
                                id="profile"
                                icon={Building2}
                                title="Company profile"
                                description="Contact details shown on every invoice and receipt"
                            >
                                {profileForm}
                            </SettingsSection>

                            <SettingsSection
                                id="account"
                                icon={Landmark}
                                title="Account details"
                                description="Bank information printed on invoices for client payments"
                            >
                                {accountForm}
                            </SettingsSection>

                            <SettingsSection
                                id="branding"
                                icon={Palette}
                                title="Branding"
                                description="Visual identity on PDFs and across the app"
                            >
                                {brandingForm}
                            </SettingsSection>

                            <SettingsSection
                                id="plan"
                                icon={Crown}
                                title="Plan & billing"
                                description="Subscription status and invoice limits"
                            >
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {isPremiumUser(formData) ? 'Premium plan' : 'Free plan'}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                Brand assets require an active Premium subscription.
                                            </p>
                                        </div>
                                        {!isPremiumUser(formData) && (
                                            <Link to="/upgrade" className="btn-primary text-sm py-2">
                                                <Sparkles size={16} aria-hidden />
                                                Upgrade
                                            </Link>
                                        )}
                                    </div>
                                    <DevPlanToggle formData={formData} setFormData={setFormData} />
                                    <SubscriptionBilling />
                                </div>
                            </SettingsSection>

                            {errors.submit && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                    <FieldValidationMessage message={errors.submit} />
                                </div>
                            )}

                            <div className="hidden lg:flex items-center justify-end gap-3 pt-2">
                                {saveActions}
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)]">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                                className="btn-secondary flex-1"
                            >
                                <X size={18} aria-hidden />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="settings-form"
                                disabled={saving}
                                className="btn-primary flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" aria-hidden />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} aria-hidden />
                                        Save changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
