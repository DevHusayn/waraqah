const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function validateRequired(value, message) {
    return value?.trim?.() ? '' : message;
}

export function validateEmail(value, emptyMessage, invalidMessage) {
    if (!value?.trim?.()) return emptyMessage;
    if (!EMAIL_PATTERN.test(value.trim())) {
        return invalidMessage || 'Please enter a valid email address.';
    }
    return '';
}

export function validateOptionalEmail(value, invalidMessage) {
    if (!value?.trim?.()) return '';
    return validateEmail(value, '', invalidMessage);
}

export function validateHexColor(value, message) {
    if (!value?.trim?.()) return message;
    if (!HEX_COLOR_PATTERN.test(value.trim())) {
        return 'Please enter a valid color code (e.g. #0ea5e9).';
    }
    return '';
}

export function firstFieldError(errors, order) {
    return order.find((key) => errors[key]) || null;
}
