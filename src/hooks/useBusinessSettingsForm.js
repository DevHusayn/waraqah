import { useState, useEffect, useRef } from 'react';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (savingRef.current) return;

        const newErrors = validate(formData);
        const firstInvalid = firstFieldError(newErrors, fieldOrder);
        if (firstInvalid) {
            setErrors(newErrors);
            focusFieldById(SETTINGS_FIELD_IDS[firstInvalid]);
            return;
        }

        setErrors({});
        savingRef.current = true;
        setSaving(true);
        try {
            const update = payloadKeys ? pickFormSlice(formData, payloadKeys) : formData;
            await updateBusinessInfo(update);
            setIsEditing(false);
            showToast(successMessage, 'success');
        } catch (err) {
            const message = getSaveErrorMessage(err);
            setErrors({ submit: message });
            showToast(message, 'error');
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleEdit = () => {
        setFormData(businessInfo);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData(businessInfo);
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
    };
}
