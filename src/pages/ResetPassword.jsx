import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import WaraqahLogo from '../components/WaraqahLogo';
import RequiredLabel from '../components/RequiredLabel';
import FieldValidationMessage from '../components/FieldValidationMessage';
import { API_BASE, getNetworkErrorMessage } from '../utils/apiConfig';
import { AUTH_LOGIN_PATH } from '../constants/authRoutes';
import {
    isStrongPassword,
    getPasswordStrength,
    PASSWORD_REQUIREMENTS_MESSAGE,
} from '../utils/passwordValidation';
import {
    validateRequired,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';

const RESET_URL = `${API_BASE}/auth/reset-password`;
const RESET_FIELD_ORDER = ['password', 'confirm'];

function buildResetFieldErrors(password, confirm) {
    const errors = {
        password: validateRequired(password, 'Please enter your new password.'),
        confirm: !confirm.trim()
            ? 'Please confirm your new password.'
            : password !== confirm
              ? 'Passwords do not match.'
              : '',
    };
    if (password && !errors.password && !isStrongPassword(password)) {
        errors.password = PASSWORD_REQUIREMENTS_MESSAGE;
    }
    return errors;
}

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const passwordStrength = getPasswordStrength(password);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const hasConfirm = confirm.length > 0;
            const hasPassword = password.length > 0;
            if (!hasConfirm && !hasPassword) {
                setFieldErrors((prev) => ({ ...prev, confirm: '' }));
                return;
            }
            if (hasConfirm && password !== confirm) {
                setFieldErrors((prev) => ({
                    ...prev,
                    confirm: 'Passwords do not match.',
                }));
            } else if (hasConfirm) {
                setFieldErrors((prev) => ({ ...prev, confirm: '' }));
            }
        }, 400);
        return () => window.clearTimeout(timer);
    }, [confirm, password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = buildResetFieldErrors(password, confirm);
        const firstInvalid = firstFieldError(errors, RESET_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(firstInvalid === 'password' ? 'reset-password' : 'reset-confirm');
            return;
        }
        setFieldErrors({});

        if (!token) {
            setAlert({ open: true, message: 'This reset link is invalid.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            let res;
            try {
                res = await fetch(`${RESET_URL}/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password }),
                });
            } catch {
                throw new Error(getNetworkErrorMessage());
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not reset password.');
            setAlert({
                open: true,
                type: 'success',
                message: data.message || 'Your password has been updated. You can sign in now.',
            });
            setTimeout(() => navigate(AUTH_LOGIN_PATH), 2000);
        } catch (err) {
            setAlert({
                open: true,
                type: 'error',
                message: err.message === 'Failed to fetch' ? getNetworkErrorMessage() : err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-100 p-4">
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ ...alert, open: false })}
            />
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <WaraqahLogo size="lg" iconStyle="solid" showAccent={false} />
                </div>

                <div className="mb-6 text-center">
                    <h1 className="page-title text-3xl mb-2">Choose a new password</h1>
                    <p className="text-base text-zinc-600">Enter and confirm your new password below.</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5"
                >
                    <div>
                        <RequiredLabel htmlFor="reset-password">New password</RequiredLabel>
                        <div className="relative">
                            <input
                                id="reset-password"
                                type={showPassword ? 'text' : 'password'}
                                className={inputClass(Boolean(fieldErrors.password), 'pr-16')}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    clearFieldError(setFieldErrors, 'password');
                                }}
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                aria-invalid={Boolean(fieldErrors.password)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-brand font-semibold text-sm"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {password && (
                            <div className="mt-2">
                                <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${passwordStrength.barClass}`}
                                        style={{ width: `${passwordStrength.percent}%` }}
                                    />
                                </div>
                                <p
                                    className={`mt-1 text-xs ${
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
                        <FieldValidationMessage message={fieldErrors.password} />
                    </div>
                    <div>
                        <RequiredLabel htmlFor="reset-confirm">Confirm password</RequiredLabel>
                        <input
                            id="reset-confirm"
                            type={showPassword ? 'text' : 'password'}
                            className={inputClass(Boolean(fieldErrors.confirm))}
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value);
                                clearFieldError(setFieldErrors, 'confirm');
                            }}
                            autoComplete="new-password"
                            placeholder="Repeat your password"
                            aria-invalid={Boolean(fieldErrors.confirm)}
                        />
                        <FieldValidationMessage message={fieldErrors.confirm} />
                        {!fieldErrors.confirm && confirm.length > 0 && password === confirm && (
                            <p className="mt-1.5 text-xs font-medium text-emerald-600">Passwords match.</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn-primary w-full py-3.5 text-base"
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                Updating password...
                            </>
                        ) : (
                            'Update password'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-zinc-700 text-base">
                    <Link
                        to={AUTH_LOGIN_PATH}
                        className="inline-flex items-center justify-center gap-2 font-medium text-brand hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
