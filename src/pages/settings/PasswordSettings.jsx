import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { REPLAY_MASK } from '@waraqah/shared';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import RequiredLabel from '../../components/RequiredLabel';
import FieldValidationMessage from '../../components/FieldValidationMessage';
import Spinner from '../../components/Spinner';
import { SettingsEditButton, SettingsEditingStatus } from './SettingsLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../utils/api';
import {
    buildChangePasswordFieldErrors,
    CHANGE_PASSWORD_FIELD_ORDER,
    getPasswordStrength,
} from '../../utils/passwordValidation';
import {
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../../utils/formFieldValidation';

const FIELD_IDS = {
    currentPassword: 'change-password-current',
    newPassword: 'change-password-new',
    confirmPassword: 'change-password-confirm',
};

const EMPTY_FORM = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

function PasswordToggle({ visible, onToggle, label }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-brand font-semibold text-sm"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
            {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
    );
}

export default function PasswordSettings() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const usesGoogle = (user?.authProvider || 'local') === 'google';

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const passwordStrength = getPasswordStrength(form.newPassword);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (!form.confirmPassword) return;
            setFieldErrors((prev) => ({
                ...prev,
                confirmPassword:
                    form.newPassword !== form.confirmPassword ? 'Passwords do not match.' : '',
            }));
        }, 400);
        return () => window.clearTimeout(timer);
    }, [form.confirmPassword, form.newPassword]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFieldErrors({});
        setShowCurrent(false);
        setShowNew(false);
    };

    const closeForm = () => {
        resetForm();
        setIsEditing(false);
    };

    const handleChange = (name) => (event) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = buildChangePasswordFieldErrors(form);
        const firstInvalid = firstFieldError(errors, CHANGE_PASSWORD_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(FIELD_IDS[firstInvalid]);
            return;
        }
        setFieldErrors({});
        setSaving(true);
        try {
            const data = await apiFetch('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }),
            });
            closeForm();
            showToast(data.message || 'Your password has been updated.', 'success');
        } catch (err) {
            const message = err.message || 'Could not update password.';
            if (/current password is incorrect/i.test(message)) {
                setFieldErrors({ currentPassword: message });
                focusFieldById(FIELD_IDS.currentPassword);
            } else {
                showToast(message, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsPageShell
            title="Password"
            subtitle="Change the password you use to sign in to Waraqah"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Password', to: '/settings/password' },
            ]}
            actions={
                usesGoogle ? null : isEditing ? (
                    <SettingsEditingStatus />
                ) : (
                    <SettingsEditButton onClick={() => setIsEditing(true)}>
                        Update password
                    </SettingsEditButton>
                )
            }
        >
            {usesGoogle ? (
                <div className="card space-y-2">
                    <h2 className="text-base font-semibold text-foreground">Google sign-in</h2>
                    <p className="text-sm text-foreground-muted leading-relaxed max-w-xl">
                        This account uses Google to sign in, so there is no Waraqah password to change.
                        Use your Google account if you need to update how you access Waraqah.
                    </p>
                </div>
            ) : !isEditing ? (
                <div className="card space-y-2">
                    <h2 className="text-base font-semibold text-foreground">Sign-in password</h2>
                    <p className="text-sm text-foreground-muted leading-relaxed max-w-xl">
                        Your password is set and used to sign in to Waraqah. We never show it here.
                    </p>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className={`card space-y-5 ${REPLAY_MASK.NO_CAPTURE}`}
                >
                    <div>
                        <RequiredLabel htmlFor={FIELD_IDS.currentPassword}>Current password</RequiredLabel>
                        <div className="relative">
                            <input
                                id={FIELD_IDS.currentPassword}
                                type={showCurrent ? 'text' : 'password'}
                                className={inputClass(Boolean(fieldErrors.currentPassword), 'pr-16')}
                                value={form.currentPassword}
                                onChange={handleChange('currentPassword')}
                                autoComplete="current-password"
                                aria-invalid={Boolean(fieldErrors.currentPassword)}
                            />
                            <PasswordToggle
                                visible={showCurrent}
                                onToggle={() => setShowCurrent((value) => !value)}
                                label="current password"
                            />
                        </div>
                        <FieldValidationMessage message={fieldErrors.currentPassword} />
                    </div>

                    <div>
                        <RequiredLabel htmlFor={FIELD_IDS.newPassword}>New password</RequiredLabel>
                        <div className="relative">
                            <input
                                id={FIELD_IDS.newPassword}
                                type={showNew ? 'text' : 'password'}
                                className={inputClass(Boolean(fieldErrors.newPassword), 'pr-16')}
                                value={form.newPassword}
                                onChange={handleChange('newPassword')}
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                aria-invalid={Boolean(fieldErrors.newPassword)}
                            />
                            <PasswordToggle
                                visible={showNew}
                                onToggle={() => setShowNew((value) => !value)}
                                label="new password"
                            />
                        </div>
                        {form.newPassword ? (
                            <div className="mt-2">
                                <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${passwordStrength.percent}%`,
                                            backgroundColor: passwordStrength.color,
                                        }}
                                    />
                                </div>
                                <p
                                    className={`mt-1 text-xs ${
                                        passwordStrength.level === 'strong'
                                            ? 'text-green-600'
                                            : passwordStrength.level === 'fair'
                                              ? 'text-amber-600'
                                              : 'text-red-600'
                                    }`}
                                >
                                    {passwordStrength.label}
                                </p>
                            </div>
                        ) : null}
                        <FieldValidationMessage message={fieldErrors.newPassword} />
                    </div>

                    <div>
                        <RequiredLabel htmlFor={FIELD_IDS.confirmPassword}>Confirm new password</RequiredLabel>
                        <input
                            id={FIELD_IDS.confirmPassword}
                            type={showNew ? 'text' : 'password'}
                            className={inputClass(Boolean(fieldErrors.confirmPassword))}
                            value={form.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            autoComplete="new-password"
                            placeholder="Repeat your new password"
                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        />
                        <FieldValidationMessage message={fieldErrors.confirmPassword} />
                        {!fieldErrors.confirmPassword &&
                        form.confirmPassword.length > 0 &&
                        form.newPassword === form.confirmPassword ? (
                            <p className="mt-1.5 text-xs font-medium text-green-600">Passwords match.</p>
                        ) : null}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary py-3"
                            disabled={saving}
                            aria-busy={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" inline />
                                    Updating password...
                                </>
                            ) : (
                                'Update password'
                            )}
                        </button>
                    </div>
                </form>
            )}
        </SettingsPageShell>
    );
}
