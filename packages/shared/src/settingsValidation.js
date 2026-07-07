import {
    validateRequired,
    validateEmail,
    validateHexColor,
} from './formFieldValidation.js';

export const PROFILE_FIELD_ORDER = ['name', 'address', 'email', 'phone'];
export const ACCOUNT_FIELD_ORDER = [
    'paymentAccountName',
    'paymentBankName',
    'paymentAccountNumber',
];
export const BRANDING_FIELD_ORDER = ['brandColor'];

export const SETTINGS_FIELD_IDS = {
    name: 'settings-name',
    address: 'settings-address',
    email: 'settings-email',
    phone: 'settings-phone',
    brandColor: 'settings-brand-color',
    paymentAccountName: 'settings-payment-account-name',
    paymentBankName: 'settings-payment-bank-name',
    paymentAccountNumber: 'settings-payment-account-number',
};

export function buildProfileFieldErrors(formData) {
    return {
        name: validateRequired(formData.name, 'Please enter your business name.'),
        address: validateRequired(formData.address, 'Please enter your business address.'),
        email: validateEmail(
            formData.email,
            'Please enter your business email.',
            'Please enter a valid business email.'
        ),
        phone: validateRequired(formData.phone, 'Please enter your phone number.'),
    };
}

/** True when required company profile fields are still missing (e.g. after OAuth sign-in). */
export function needsBusinessSetup(formData = {}) {
    const errors = buildProfileFieldErrors(formData);
    return Object.values(errors).some(Boolean);
}

export function buildAccountFieldErrors(formData) {
    const errors = {};
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

export function buildBrandingFieldErrors(formData) {
    return {
        brandColor: validateHexColor(formData.brandColor, 'Please choose a brand color.'),
    };
}

export function buildSettingsFieldErrors(formData) {
    return {
        ...buildProfileFieldErrors(formData),
        ...buildAccountFieldErrors(formData),
        ...buildBrandingFieldErrors(formData),
    };
}

export const BRAND_PRESETS = [
    { color: '#16A34A', name: 'Emerald' },
    { color: '#86EFAC', name: 'Mint' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#f59e0b', name: 'Amber' },
    { color: '#ef4444', name: 'Red' },
    { color: '#64748b', name: 'Slate' },
];
