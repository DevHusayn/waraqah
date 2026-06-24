import {
    validateRequired,
    validateEmail,
    validateHexColor,
    firstFieldError,
} from './formFieldValidation';
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from './passwordValidation';
import { buildProfileFieldErrors, buildAccountFieldErrors, buildBrandingFieldErrors } from './settingsValidation';

export const REGISTER_STEPS = [
    { id: 1, title: 'Your account', subtitle: 'Sign-in email and password' },
    { id: 2, title: 'Business profile', subtitle: 'How your business appears on invoices' },
    { id: 3, title: 'Account details', subtitle: 'Bank details for client payments (optional)' },
    { id: 4, title: 'Branding', subtitle: 'Pick your brand color' },
];

export const REGISTER_STEP_FIELD_ORDER = {
    1: ['email', 'password', 'confirmPassword'],
    2: ['name', 'businessEmail', 'address', 'phone'],
    3: ['paymentAccountName', 'paymentBankName', 'paymentAccountNumber'],
    4: ['brandColor'],
};

const REGISTER_FIELD_IDS = {
    email: 'reg-email',
    password: 'reg-password',
    confirmPassword: 'reg-confirm-password',
    name: 'reg-name',
    businessEmail: 'reg-business-email',
    address: 'reg-address',
    phone: 'reg-phone',
    website: 'reg-website',
    paymentAccountName: 'reg-payment-account-name',
    paymentBankName: 'reg-payment-bank-name',
    paymentAccountNumber: 'reg-payment-account-number',
    paymentInstructions: 'reg-payment-instructions',
    brandColor: 'reg-brand-color',
};

export function getRegisterFieldId(key) {
    return REGISTER_FIELD_IDS[key] || key;
}

function buildCredentialsStepErrors(form, confirmPassword) {
    const errors = {
        email: validateEmail(
            form.email,
            'Please enter your email address.',
            'Please enter a valid email address.'
        ),
        password: validateRequired(form.password, 'Please enter your password.'),
        confirmPassword: !confirmPassword.trim()
            ? 'Please confirm your password.'
            : form.password !== confirmPassword
              ? 'Passwords do not match.'
              : '',
    };

    if (form.password && !errors.password && !isStrongPassword(form.password)) {
        errors.password = PASSWORD_REQUIREMENTS_MESSAGE;
    }

    return errors;
}

function buildBusinessStepErrors(form) {
    const profileErrors = buildProfileFieldErrors({
        name: form.name,
        address: form.address,
        email: form.businessEmail,
        phone: form.phone,
    });

    return {
        name: profileErrors.name,
        businessEmail: profileErrors.email,
        address: profileErrors.address,
        phone: profileErrors.phone,
    };
}

export function buildRegisterStepErrors(step, form, confirmPassword) {
    switch (step) {
        case 1:
            return buildCredentialsStepErrors(form, confirmPassword);
        case 2:
            return buildBusinessStepErrors(form);
        case 3:
            return buildAccountFieldErrors(form);
        case 4:
            return buildBrandingFieldErrors(form);
        default:
            return {};
    }
}

export function validateRegisterStep(step, form, confirmPassword) {
    const errors = buildRegisterStepErrors(step, form, confirmPassword);
    const order = REGISTER_STEP_FIELD_ORDER[step] || [];
    const firstInvalid = firstFieldError(errors, order);
    return { errors, firstInvalid };
}

export function clampRegisterStep(step) {
    const n = Number(step);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > REGISTER_STEPS.length) return REGISTER_STEPS.length;
    return Math.floor(n);
}
