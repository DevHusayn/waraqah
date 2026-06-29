import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Spinner from '../Spinner';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import ProfileFormFields from '../settings/ProfileFormFields';
import AccountFormFields from '../settings/AccountFormFields';
import { useSettings } from '../../context/SettingsContext';
import { useInvoice } from '../../context/InvoiceContext';
import { useAuth } from '../../context/AuthContext';
import { APP_CURRENCY } from '../../utils/currency';
import { getNetworkErrorMessage } from '../../utils/apiConfig';
import { authFetch, apiFetch } from '../../utils/api';
import {
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../../utils/formFieldValidation';
import { getPasswordStrength } from '../../utils/passwordValidation';
import {
    REGISTER_STEPS,
    clampRegisterStep,
    getRegisterFieldId,
    validateRegisterStep,
} from '../../utils/registerValidation';
import { BRAND_PRESETS } from '../../utils/settingsValidation';

const DRAFT_KEY = 'registerDraft';

export const REGISTER_INITIAL_FORM = {
    email: '',
    password: '',
    name: '',
    address: '',
    businessEmail: '',
    phone: '',
    website: '',
    defaultCurrency: APP_CURRENCY,
    brandColor: '#0284c7',
    paymentAccountName: '',
    paymentBankName: '',
    paymentAccountNumber: '',
    paymentInstructions: '',
};

function PasswordToggle({ visible, onToggle, label }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-[34px] p-1 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );
}

function loadDraft() {
    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return { ...REGISTER_INITIAL_FORM, ...parsed.form };
    } catch {
        return null;
    }
}

function saveDraft(form, confirmPassword) {
    try {
        sessionStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ form, confirmPassword })
        );
    } catch {
        /* ignore quota errors */
    }
}

export function clearRegisterDraft() {
    try {
        sessionStorage.removeItem(DRAFT_KEY);
    } catch {
        /* ignore */
    }
}

function StepIndicator({ currentStep }) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between gap-1 mb-2">
                {REGISTER_STEPS.map((step) => {
                    const done = step.id < currentStep;
                    const active = step.id === currentStep;
                    return (
                        <div
                            key={step.id}
                            className={`flex-1 h-1 rounded-full transition-colors ${
                                done || active ? 'bg-brand' : 'bg-zinc-200'
                            }`}
                            aria-hidden
                        />
                    );
                })}
            </div>
            <p className="text-xs font-medium text-zinc-500">
                Step {currentStep} of {REGISTER_STEPS.length}
            </p>
        </div>
    );
}

export default function RegisterWizard({ returnTo }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setBusinessInfo } = useSettings();
    const { fetchUserData, resetAll } = useInvoice();
    const { setSession } = useAuth();

    const step = clampRegisterStep(searchParams.get('step') || 1);
    const currentStepMeta = REGISTER_STEPS[step - 1];

    const [form, setForm] = useState(() => loadDraft() || REGISTER_INITIAL_FORM);
    const [confirmPassword, setConfirmPassword] = useState(() => {
        try {
            const raw = sessionStorage.getItem(DRAFT_KEY);
            if (!raw) return '';
            return JSON.parse(raw).confirmPassword || '';
        } catch {
            return '';
        }
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const passwordStrength = getPasswordStrength(form.password);

    useEffect(() => {
        saveDraft(form, confirmPassword);
    }, [form, confirmPassword]);

    useEffect(() => {
        const onLogout = () => {
            setForm(REGISTER_INITIAL_FORM);
            setConfirmPassword('');
            clearRegisterDraft();
        };
        window.addEventListener('app-logout', onLogout);
        return () => window.removeEventListener('app-logout', onLogout);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (step !== 1) return;
            const hasConfirm = confirmPassword.length > 0;
            const hasPassword = form.password.length > 0;
            if (!hasConfirm && !hasPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                return;
            }
            if (hasConfirm && form.password !== confirmPassword) {
                setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: 'Passwords do not match.',
                }));
            } else if (hasConfirm) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
        }, 400);
        return () => window.clearTimeout(timer);
    }, [confirmPassword, form.password, step]);

    const goToStep = useCallback(
        (nextStep) => {
            const params = new URLSearchParams(searchParams);
            params.set('mode', 'register');
            params.set('step', String(clampRegisterStep(nextStep)));
            if (returnTo) params.set('returnTo', returnTo);
            navigate({ pathname: '/auth', search: `?${params.toString()}` }, { replace: true });
        },
        [navigate, returnTo, searchParams]
    );

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        const fieldName = name === 'email' ? 'businessEmail' : name;
        setForm((prev) => ({ ...prev, [fieldName]: value }));
        const errorKey = name === 'email' ? 'businessEmail' : name;
        if (fieldErrors[errorKey]) {
            setFieldErrors((prev) => ({ ...prev, [errorKey]: '' }));
        }
    };

    const handleContinue = () => {
        setError('');
        const { errors, firstInvalid } = validateRegisterStep(step, form, confirmPassword);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getRegisterFieldId(firstInvalid));
            return;
        }
        setFieldErrors({});
        goToStep(step + 1);
    };

    const handleBack = () => {
        setError('');
        setFieldErrors({});
        goToStep(step - 1);
    };

    const handleRegister = async () => {
        setError('');

        for (let s = 1; s <= REGISTER_STEPS.length; s += 1) {
            const { errors, firstInvalid } = validateRegisterStep(s, form, confirmPassword);
            if (firstInvalid) {
                setFieldErrors(errors);
                if (s !== step) {
                    goToStep(s);
                } else {
                    focusFieldById(getRegisterFieldId(firstInvalid));
                }
                return;
            }
        }

        setFieldErrors({});
        setSubmitLoading(true);
        try {
            const email = form.email.trim().toLowerCase();
            const body = {
                email,
                password: form.password,
                name: form.name,
                businessInfo: {
                    name: form.name,
                    address: form.address,
                    email: form.businessEmail.trim().toLowerCase(),
                    phone: form.phone,
                    website: form.website,
                    defaultCurrency: APP_CURRENCY,
                    brandColor: form.brandColor,
                    paymentAccountName: form.paymentAccountName,
                    paymentBankName: form.paymentBankName,
                    paymentAccountNumber: form.paymentAccountNumber,
                    paymentInstructions: form.paymentInstructions,
                },
            };

            const data = await authFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(body),
            });

            clearRegisterDraft();
            setSession(data.user);
            await fetchUserData();

            try {
                const info = await apiFetch('/business-info');
                setBusinessInfo(info);
            } catch (businessErr) {
                console.error('Failed to fetch business info:', businessErr);
            }

            window.dispatchEvent(new Event('app-login'));
            const safeReturn =
                returnTo && returnTo.startsWith('/') && !returnTo.startsWith('/auth')
                    ? returnTo
                    : '/';
            navigate(safeReturn, { replace: true });
        } catch (err) {
            setError(err.message === 'Failed to fetch' ? getNetworkErrorMessage() : err.message);
            resetAll();
        } finally {
            setSubmitLoading(false);
        }
    };

    const profileFormData = {
        name: form.name,
        address: form.address,
        email: form.businessEmail,
        phone: form.phone,
        website: form.website,
    };

    const profileErrors = {
        name: fieldErrors.name,
        address: fieldErrors.address,
        email: fieldErrors.businessEmail,
        phone: fieldErrors.phone,
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="page-title">{currentStepMeta.title}</h2>
                <p className="page-subtitle mt-1">{currentStepMeta.subtitle}</p>
            </div>

            <StepIndicator currentStep={step} />

            <div className="space-y-4">
                {step === 1 && (
                    <>
                        <div>
                            <RequiredLabel htmlFor="reg-email">Email</RequiredLabel>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleFieldChange}
                                className={inputClass(Boolean(fieldErrors.email))}
                                placeholder="you@example.com"
                                autoComplete="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                            />
                            <FieldValidationMessage message={fieldErrors.email} />
                        </div>
                        <div className="relative">
                            <RequiredLabel htmlFor="reg-password">Password</RequiredLabel>
                            <input
                                id="reg-password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleFieldChange}
                                className={inputClass(Boolean(fieldErrors.password), 'pr-11')}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                aria-invalid={Boolean(fieldErrors.password)}
                            />
                            <PasswordToggle
                                visible={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                                label="password"
                            />
                            <FieldValidationMessage message={fieldErrors.password} />
                            {form.password && (
                                <div className="mt-2">
                                    <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${passwordStrength.barClass}`}
                                            style={{ width: `${passwordStrength.percent}%` }}
                                        />
                                    </div>
                                    <p
                                        className={`mt-1 text-xs font-medium ${
                                            passwordStrength.level === 'strong'
                                                ? 'text-emerald-600'
                                                : passwordStrength.level === 'fair'
                                                  ? 'text-amber-600'
                                                  : 'text-red-600'
                                        }`}
                                    >
                                        {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <RequiredLabel htmlFor="reg-confirm-password">
                                Confirm password
                            </RequiredLabel>
                            <input
                                id="reg-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (fieldErrors.confirmPassword) {
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            confirmPassword: '',
                                        }));
                                    }
                                }}
                                className={inputClass(
                                    Boolean(fieldErrors.confirmPassword),
                                    'pr-11'
                                )}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                            />
                            <PasswordToggle
                                visible={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                label="confirm password"
                            />
                            <FieldValidationMessage message={fieldErrors.confirmPassword} />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <ProfileFormFields
                        formData={profileFormData}
                        errors={profileErrors}
                        onChange={handleProfileChange}
                        idPrefix="reg-"
                        emailInputId="reg-business-email"
                    />
                )}

                {step === 3 && (
                    <AccountFormFields
                        formData={form}
                        errors={fieldErrors}
                        onChange={handleFieldChange}
                        idPrefix="reg-"
                    />
                )}

                {step === 4 && (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-500">
                            Used in PDF headers, accents, and your invoice theme.
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/60">
                            <div
                                className="w-full sm:w-20 h-14 rounded-xl border-2 border-white shadow-md shrink-0"
                                style={{ backgroundColor: form.brandColor || '#0284c7' }}
                                aria-hidden
                            />
                            <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        name="brandColor"
                                        value={form.brandColor || '#0284c7'}
                                        onChange={handleFieldChange}
                                        className="h-11 w-14 rounded-lg border border-zinc-200 cursor-pointer bg-white p-1"
                                        aria-label="Pick brand color"
                                    />
                                    <input
                                        id="reg-brand-color"
                                        type="text"
                                        name="brandColor"
                                        value={form.brandColor || '#0284c7'}
                                        onChange={handleFieldChange}
                                        className={inputClass(
                                            Boolean(fieldErrors.brandColor),
                                            'font-mono text-sm'
                                        )}
                                        placeholder="#0284c7"
                                        aria-invalid={Boolean(fieldErrors.brandColor)}
                                    />
                                </div>
                                <FieldValidationMessage message={fieldErrors.brandColor} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-zinc-500 mb-2.5">Quick picks</p>
                            <div className="flex flex-wrap gap-2">
                                {BRAND_PRESETS.map((preset) => {
                                    const selected =
                                        (form.brandColor || '#0284c7').toLowerCase() ===
                                        preset.color;
                                    return (
                                        <button
                                            key={preset.color}
                                            type="button"
                                            title={preset.name}
                                            onClick={() => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    brandColor: preset.color,
                                                }));
                                                clearFieldError(setFieldErrors, 'brandColor');
                                            }}
                                            className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-105 ${
                                                selected
                                                    ? 'border-zinc-900 ring-2 ring-offset-2 ring-zinc-400'
                                                    : 'border-white shadow-sm hover:border-zinc-200'
                                            }`}
                                            style={{ backgroundColor: preset.color }}
                                            aria-label={`${preset.name}${selected ? ' (selected)' : ''}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-[13px] text-red-700 bg-red-50 border border-red-200/80 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                <div className="flex gap-3 pt-2">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="btn-secondary flex-1 !py-2.5"
                            disabled={submitLoading}
                        >
                            Back
                        </button>
                    ) : null}
                    {step < REGISTER_STEPS.length ? (
                        <button
                            type="button"
                            onClick={handleContinue}
                            className="btn-primary flex-1 !py-2.5"
                            disabled={submitLoading}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleRegister}
                            className="btn-primary flex-1 !py-2.5"
                            disabled={submitLoading}
                            aria-busy={submitLoading}
                        >
                            {submitLoading ? (
                                <>
                                    <Spinner size="sm" inline />
                                    Creating account…
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
