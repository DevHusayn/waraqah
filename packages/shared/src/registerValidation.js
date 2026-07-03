import {
    validateRequired,
    validateEmail,
    validateOptionalEmail,
    firstFieldError,
} from './formFieldValidation.js';
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from './passwordValidation.js';
import {
    buildAccountFieldErrors,
    buildBrandingFieldErrors,
} from './settingsValidation.js';

export const REGISTER_STEPS = [
    { id: 1, title: 'Your account', subtitle: 'Sign-in email and password' },
    { id: 2, title: 'Business profile', subtitle: 'How your business appears on invoices' },
    { id: 3, title: 'Account details', subtitle: 'Bank details for client payments (optional)' },
    { id: 4, title: 'Branding', subtitle: 'Pick your brand color' },
];

export const REGISTER_STEP_FIELD_ORDER = {
    1: ['email', 'password', 'confirmPassword'],
    2: ['name', 'businessEmail'],
    3: ['paymentAccountName', 'paymentBankName', 'paymentAccountNumber'],
    4: ['brandColor', 'acceptedTerms'],
};

export const REGISTER_INITIAL_FORM = {
    email: '',
    password: '',
    name: '',
    address: '',
    businessEmail: '',
    phone: '',
    website: '',
    defaultCurrency: 'NGN',
    brandColor: '#16A34A',
    paymentAccountName: '',
    paymentBankName: '',
    paymentAccountNumber: '',
    paymentInstructions: '',
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
    acceptedTerms: 'reg-legal-consent',
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
    return {
        name: validateRequired(form.name, 'Please enter your business name.'),
        businessEmail: validateOptionalEmail(
            form.businessEmail,
            'Please enter a valid business email.'
        ),
    };
}

export function buildRegisterStepErrors(step, form, confirmPassword, options = {}) {
    switch (step) {
        case 1:
            return buildCredentialsStepErrors(form, confirmPassword);
        case 2:
            return buildBusinessStepErrors(form);
        case 3:
            return buildAccountFieldErrors(form);
        case 4:
            return {
                ...buildBrandingFieldErrors(form),
                acceptedTerms: options.acceptedTerms
                    ? ''
                    : 'You must agree to the Terms and Privacy Policy to create an account.',
            };
        default:
            return {};
    }
}

export function validateRegisterStep(step, form, confirmPassword, options = {}) {
    const errors = buildRegisterStepErrors(step, form, confirmPassword, options);
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
