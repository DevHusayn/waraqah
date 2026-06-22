import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { firstFieldError, focusFieldById, clearFieldError } from '../utils/formFieldValidation';
import { SETTINGS_FIELD_IDS } from '../utils/settingsValidation';

export default function useBusinessSettingsForm({
    validate,
    fieldOrder,
    autoEditIfEmpty = false,
    successMessage = 'Settings saved successfully',
}) {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [formData, setFormData] = useState(businessInfo);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

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
        const newErrors = validate(formData);
        const firstInvalid = firstFieldError(newErrors, fieldOrder);
        if (firstInvalid) {
            setErrors(newErrors);
            focusFieldById(SETTINGS_FIELD_IDS[firstInvalid]);
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            const payload = buildBusinessInfoPayload(formData, businessInfo);
            await updateBusinessInfo(payload);
            setIsEditing(false);
            showToast(successMessage, 'success');
        } catch (err) {
            setErrors({ submit: err.message });
            showToast(err.message || 'Failed to save settings', 'error');
        } finally {
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
