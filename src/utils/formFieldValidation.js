const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function validateRequired(value, message) {
    return value?.trim() ? '' : message;
}

export function validateEmail(value, emptyMessage, invalidMessage) {
    if (!value?.trim()) return emptyMessage;
    if (!EMAIL_PATTERN.test(value.trim())) {
        return invalidMessage || 'Please enter a valid email address.';
    }
    return '';
}

export function validateOptionalEmail(value, invalidMessage) {
    if (!value?.trim()) return '';
    return validateEmail(value, '', invalidMessage);
}

export function validateHexColor(value, message) {
    if (!value?.trim()) return message;
    if (!HEX_COLOR_PATTERN.test(value.trim())) {
        return 'Please enter a valid color code (e.g. #0ea5e9).';
    }
    return '';
}

export function firstFieldError(errors, order) {
    return order.find((key) => errors[key]) || null;
}

/** Standard app input with optional error state */
export function inputClass(hasError, extra = '') {
    const base = hasError ? 'input-field input-field--error' : 'input-field';
    return extra ? `${base} ${extra}`.trim() : base;
}

/** Add error border to any existing input class string */
export function appendFieldErrorClass(className, hasError) {
    if (!hasError) return className;
    return `${className} border-red-400 focus:border-red-500 focus:ring-red-500/20`;
}

export function focusFieldById(id) {
    if (id) document.getElementById(id)?.focus();
}

export function clearFieldError(setErrors, name) {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
}
