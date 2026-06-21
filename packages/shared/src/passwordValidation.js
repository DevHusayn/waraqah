const STRONG_PASSWORD =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
    'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

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
