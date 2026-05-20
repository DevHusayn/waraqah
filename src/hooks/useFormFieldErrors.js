import { useState, useCallback } from 'react';
import { clearFieldError } from '../utils/formFieldValidation';

export function useFormFieldErrors() {
    const [errors, setErrors] = useState({});

    const clearError = useCallback((name) => {
        clearFieldError(setErrors, name);
    }, []);

    const clearAll = useCallback(() => setErrors({}), []);

    return { errors, setErrors, clearError, clearAll };
}
