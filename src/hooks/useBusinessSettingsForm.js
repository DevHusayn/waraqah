import { useState, useEffect, useRef } from 'react';
import { withDefaultPaymentInstructions, withDefaultDocumentFooter } from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { firstFieldError, focusFieldById, clearFieldError } from '../utils/formFieldValidation';
import { SETTINGS_FIELD_IDS } from '../utils/settingsValidation';

function pickFormSlice(formData, keys) {
    return Object.fromEntries(keys.map((key) => [key, formData[key]]));
}

function getSaveErrorMessage(err) {
    const message = err?.message || '';
    if (
        err?.name === 'AbortError' ||
        err?.name === 'TimeoutError' ||
        /abort/i.test(message) ||
        /timed out/i.test(message)
    ) {
        return 'The request took too long. Please check your connection and try again.';
    }
    return message || 'Failed to save settings';
}

export default function useBusinessSettingsForm({
    validate,
    fieldOrder,
    payloadKeys,
    autoEditIfEmpty = false,
    successMessage = 'Settings saved successfully',
    interceptSubmit,
    onSaveError,
}) {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [formData, setFormData] = useState(businessInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const savingRef = useRef(false);

    useEffect(() => {
        if (!isEditing) {
            setFormData(businessInfo);
        }
    }, [businessInfo, isEditing]);

    useEffect(() => {
        if (autoEditIfEmpty && !businessInfo.name?.trim() && !businessInfo.email?.trim()) {
            setIsEditing(true);
        }
    }, [autoEditIfEmpty, businessInfo.name, businessInfo.email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setErrors, name);
    };

    const validateForm = () => {
        const newErrors = validate(formData);
        const firstInvalid = firstFieldError(newErrors, fieldOrder);
        if (firstInvalid) {
            setErrors(newErrors);
            focusFieldById(SETTINGS_FIELD_IDS[firstInvalid]);
            return false;
        }
        setErrors({});
        return true;
    };

    const saveForm = async (extraPayload = {}, { keepEditing = false, skipValidation = false, successMessage: toastMessage } = {}) => {
        if (savingRef.current) return false;
        if (!skipValidation && !validateForm()) return false;

        savingRef.current = true;
        setSaving(true);
        try {
            const update = skipValidation
                ? extraPayload
                : {
                    ...(payloadKeys ? pickFormSlice(formData, payloadKeys) : formData),
                    ...extraPayload,
                };
            await updateBusinessInfo(update);
            if (!keepEditing) setIsEditing(false);
            showToast(toastMessage || successMessage, 'success');
            return true;
        } catch (err) {
            const message = getSaveErrorMessage(err);
            if (onSaveError?.(message, err) === true) {
                return false;
            }
            setErrors({ submit: message });
            showToast(message, 'error');
            return false;
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (interceptSubmit?.(formData, businessInfo) === false) return;
        await saveForm();
    };

    const handleEdit = () => {
        setFormData(withDefaultDocumentFooter(withDefaultPaymentInstructions(businessInfo)));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(businessInfo);
        setIsEditing(false);
        setErrors({});
    };

    const finishEditing = () => {
        setIsEditing(false);
        setErrors({});
    };

    const updateField = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setErrors, name);
    };

    return {
        businessInfo,
        formData,
        setFormData,
        isEditing,
        saving,
        errors,
        setErrors,
        handleChange,
        handleSubmit,
        handleEdit,
        handleCancel,
        updateField,
        saveForm,
        finishEditing,
    };
}
