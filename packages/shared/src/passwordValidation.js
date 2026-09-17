import { validateRequired } from './formFieldValidation.js';

const STRONG_PASSWORD =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
    'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

export const SAME_PASSWORD_MESSAGE = 'Choose a different password from your current one.';

export const CHANGE_PASSWORD_FIELD_ORDER = ['currentPassword', 'newPassword', 'confirmPassword'];

export function isStrongPassword(password) {
    return typeof password === 'string' && STRONG_PASSWORD.test(password);
}

export function getPasswordStrength(password) {
    if (!password) {
        return { level: 'empty', label: '', percent: 0, color: '#e2e8f0' };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (STRONG_PASSWORD.test(password)) {
        return { level: 'strong', label: 'Strong password', percent: 100, color: '#10b981' };
    }
    if (score >= 4) {
        return {
            level: 'fair',
            label: 'Almost there: add uppercase, lowercase, and a number',
            percent: 66,
            color: '#f59e0b',
        };
    }
    return { level: 'weak', label: 'Weak password', percent: 33, color: '#ef4444' };
}

export function buildChangePasswordFieldErrors({
    currentPassword = '',
    newPassword = '',
    confirmPassword = '',
} = {}) {
    const current = String(currentPassword);
    const next = String(newPassword);
    const confirm = String(confirmPassword);

    const errors = {
        currentPassword: validateRequired(current, 'Please enter your current password.'),
        newPassword: validateRequired(next, 'Please enter your new password.'),
        confirmPassword: !confirm.trim()
            ? 'Please confirm your new password.'
            : next !== confirm
              ? 'Passwords do not match.'
              : '',
    };

    if (next && !errors.newPassword && !isStrongPassword(next)) {
        errors.newPassword = PASSWORD_REQUIREMENTS_MESSAGE;
    }

    if (current && next && !errors.currentPassword && !errors.newPassword && current === next) {
        errors.newPassword = SAME_PASSWORD_MESSAGE;
    }

    return errors;
}
