export {
    validateRequired,
    validateEmail,
    validateOptionalEmail,
    validateHexColor,
    firstFieldError,
} from '@waraqah/shared';

/** Standard app input with optional error state */
export function inputClass(hasError, extra = '', { shake = false } = {}) {
    const base = hasError ? 'input-field input-field--error' : 'input-field';
    const shakeClass = hasError && shake ? ' input-field--shake' : '';
    const combined = `${base}${shakeClass}`;
    return extra ? `${combined} ${extra}`.trim() : combined;
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
