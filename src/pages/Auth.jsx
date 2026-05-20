
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { APP_CURRENCY } from '../utils/currency';
import {
    isStrongPassword,
    getPasswordStrength,
    PASSWORD_REQUIREMENTS_MESSAGE,
} from '../utils/passwordValidation';
import WaraqahLogo from '../components/WaraqahLogo';
import RequiredLabel from '../components/RequiredLabel';
import { API_BASE, getNetworkErrorMessage } from '../utils/apiConfig';
import {
    validateRequired,
    validateEmail,
    firstFieldError,
    inputClass,
    focusFieldById,
} from '../utils/formFieldValidation';
import FieldValidationMessage from '../components/FieldValidationMessage';

const BASE_URL = API_BASE;
const AUTH_URL = `${BASE_URL}/auth`;

const LOGIN_FIELD_ORDER = ['email', 'password'];
const REGISTER_FIELD_ORDER = [
    'email',
    'password',
    'confirmPassword',
    'name',
    'businessEmail',
    'address',
    'phone',
];

function getFieldId(key, isLogin) {
    const ids = {
        email: isLogin ? 'auth-email' : 'reg-email',
        password: isLogin ? 'auth-password' : 'reg-password',
        confirmPassword: 'reg-confirm-password',
        name: 'reg-name',
        businessEmail: 'reg-business-email',
        address: 'reg-address',
        phone: 'reg-phone',
    };
    return ids[key];
}

function buildLoginFieldErrors(form) {
    return {
        email: validateEmail(
            form.email,
            'Please enter your email address.',
            'Please enter a valid email address.'
        ),
        password: validateRequired(form.password, 'Please enter your password.'),
    };
}

function buildRegisterFieldErrors(form, confirmPassword) {
    const errors = {
        email: validateEmail(
            form.email,
            'Please enter your email address.',
            'Please enter a valid email address.'
        ),
        password: validateRequired(form.password, 'Please enter your password.'),
        confirmPassword: !confirmPassword.trim()
            ? 'Please confirm your password.'
            : form.password !== confirmPassword
              ? 'Passwords do not match.'
              : '',
        name: validateRequired(form.name, 'Please enter your business name.'),
        businessEmail: validateEmail(
            form.businessEmail,
            'Please enter your business email.',
            'Please enter a valid business email.'
        ),
        address: validateRequired(form.address, 'Please enter your business address.'),
        phone: validateRequired(form.phone, 'Please enter your phone number.'),
    };

    if (form.password && !errors.password && !isStrongPassword(form.password)) {
        errors.password = PASSWORD_REQUIREMENTS_MESSAGE;
    }

    return errors;
}

function focusField(fieldKey, isLogin) {
    focusFieldById(getFieldId(fieldKey, isLogin));
}

function Auth() {
    const { setBusinessInfo } = useSettings();
    const { fetchUserData, resetAll } = useInvoice();
    const [searchParams] = useSearchParams();
    const authMode = searchParams.get('mode');
    const [isLogin, setIsLogin] = useState(authMode !== 'register');
    const initialForm = {
        email: '',
        password: '',
        name: '',
        address: '',
        businessEmail: '',
        phone: '',
        website: '',
        defaultCurrency: APP_CURRENCY,
        brandColor: '#0ea5e9',
    };
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetModal, setResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [resetEmailError, setResetEmailError] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const authFormRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = searchParams.get('returnTo');

    // Always reset form fields when Auth page is shown, switching login/register, or on logout
    useEffect(() => {
        setForm(initialForm);
    }, [isLogin, location.pathname, location.key]);

    // Extra: force reset when arriving at /auth route (even if already there)
    useEffect(() => {
        if (location.pathname === '/auth') {
            setForm(initialForm);
        }
    }, [location.pathname, location.key]);

    useEffect(() => {
        const resetForm = () => setForm(initialForm);
        window.addEventListener('app-logout', resetForm);
        return () => window.removeEventListener('app-logout', resetForm);
    }, []);

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'register') setIsLogin(false);
        else if (mode === 'login') setIsLogin(true);
    }, [searchParams]);

    useEffect(() => {
        setError('');
        setConfirmPassword('');
        setFieldErrors({});
    }, [isLogin]);

    useEffect(() => {
        if (isLogin) return undefined;
        const timer = window.setTimeout(() => {
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
    }, [confirmPassword, form.password, isLogin]);

    const passwordStrength = !isLogin ? getPasswordStrength(form.password) : null;

    const toggleMode = () => {
        setError('');
        setFieldErrors({});
        const nextIsLogin = !isLogin;
        setIsLogin(nextIsLogin);
        const params = new URLSearchParams(searchParams);
        params.set('mode', nextIsLogin ? 'login' : 'register');
        if (returnTo) params.set('returnTo', returnTo);
        navigate(
            { pathname: '/auth', search: `?${params.toString()}` },
            { replace: true }
        );
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            const safeReturn =
                returnTo && returnTo.startsWith('/') && !returnTo.startsWith('/auth')
                    ? returnTo
                    : '/';
            navigate(safeReturn, { replace: true });
        }
    }, [navigate, returnTo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        if (fieldErrors.confirmPassword) {
            setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const errors = isLogin
            ? buildLoginFieldErrors(form)
            : buildRegisterFieldErrors(form, confirmPassword);
        const order = isLogin ? LOGIN_FIELD_ORDER : REGISTER_FIELD_ORDER;
        const firstInvalid = firstFieldError(errors, order);

        if (firstInvalid) {
            setFieldErrors(errors);
            focusField(firstInvalid, isLogin);
            return;
        }

        setFieldErrors({});
        setSubmitLoading(true);
        try {
            const email = form.email.trim().toLowerCase();
            let body = { email, password: form.password };
            if (!isLogin) {
                body.businessInfo = {
                    name: form.name,
                    address: form.address,
                    email: form.businessEmail.trim().toLowerCase(),
                    phone: form.phone,
                    website: form.website,
                    defaultCurrency: APP_CURRENCY,
                    brandColor: form.brandColor,
                };
            }
            let res;
            try {
                res = await fetch(`${AUTH_URL}/${isLogin ? 'login' : 'register'}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } catch {
                throw new Error(getNetworkErrorMessage());
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error');
            localStorage.setItem('token', data.token);
            if (data.user && typeof data.user.isAdmin !== 'undefined') {
                localStorage.setItem('isAdmin', data.user.isAdmin);
            } else {
                localStorage.removeItem('isAdmin');
            }
            // After login or registration, fetch all user data and company info
            await fetchUserData();
            // Always fetch the latest business info after login or registration
            try {
                const businessRes = await fetch(`${BASE_URL}/business-info`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`
                    }
                });
                if (businessRes.ok) {
                    const info = await businessRes.json();
                    setBusinessInfo(info);
                }
            } catch (businessErr) {
                console.error("Failed to fetch business info:", businessErr);
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

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(
            resetEmail,
            'Please enter your email address.',
            'Please enter a valid email address.'
        );
        if (emailError) {
            setResetEmailError(emailError);
            return;
        }
        setResetEmailError('');
        const email = resetEmail.trim().toLowerCase();
        setResetLoading(true);
        try {
            let res;
            try {
                res = await fetch(`${AUTH_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
            } catch {
                throw new Error(getNetworkErrorMessage());
            }
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Could not send reset email. Please try again.');
            }
            setResetModal(false);
            setResetEmail('');
            setAlert({
                open: true,
                type: 'success',
                message:
                    data.message ||
                    'If an account exists for that email, we sent a link to reset your password.',
            });
        } catch (err) {
            setAlert({
                open: true,
                type: 'error',
                message: err.message === 'Failed to fetch' ? getNetworkErrorMessage() : err.message,
            });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100">
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />

            {/* Password Reset Modal */}
            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-200 relative">
                        <button
                            type="button"
                            onClick={() => {
                                setResetModal(false);
                                setResetEmailError('');
                            }}
                            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-semibold text-slate-900 pr-8">Forgot password?</h2>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            Enter the email on your account. We will send you a link to choose a new password.
                        </p>
                        <form onSubmit={handleForgotPassword} noValidate className="mt-6 space-y-5">
                            <div>
                                <label className="label">Email address</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className={inputClass(Boolean(resetEmailError))}
                                    placeholder="you@example.com"
                                    value={resetEmail}
                                    onChange={(e) => {
                                        setResetEmail(e.target.value);
                                        if (resetEmailError) setResetEmailError('');
                                    }}
                                    autoComplete="email"
                                    aria-invalid={Boolean(resetEmailError)}
                                    aria-describedby={resetEmailError ? 'reset-email-error' : undefined}
                                />
                                <FieldValidationMessage
                                    id="reset-email-error"
                                    message={resetEmailError}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary w-full py-3.5 text-base"
                                disabled={resetLoading}
                                aria-busy={resetLoading}
                            >
                                {resetLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                        Sending link...
                                    </>
                                ) : (
                                    'Send reset link'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}


            {/* Right Side: Auth Form */}
            <div className="flex items-center justify-center min-h-screen p-4 sm:p-10 w-full">
                <div className="w-full max-w-md">
                    <div className="md:hidden flex justify-center mb-8">
                        <WaraqahLogo size="lg" />
                    </div>

                    <div className="mb-8 text-center md:text-left">
                        <Link
                            to="/"
                            className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand mb-4 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Back to home
                        </Link>
                        <h1 className="page-title text-3xl sm:text-4xl mb-2 text-slate-900">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="mt-1 text-base text-slate-600">
                            {isLogin ? 'Sign in to manage your invoices.' : 'Register to start invoicing professionally.'}
                        </p>
                    </div>

                    <form
                        ref={authFormRef}
                        onSubmit={handleSubmit}
                        noValidate
                        className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-6 space-y-6"
                    >

                        <div className="space-y-5">
                            {isLogin ? (
                                <>
                                    <div>
                                        <RequiredLabel htmlFor="auth-email">Email address</RequiredLabel>
                                        <input
                                            id="auth-email"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.email), 'placeholder:text-slate-500')}
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            aria-invalid={Boolean(fieldErrors.email)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.email} />
                                    </div>
                                    <div className="relative">
                                        <RequiredLabel htmlFor="auth-password">Password</RequiredLabel>
                                        <input
                                            id="auth-password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.password), 'placeholder:text-slate-500')}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            aria-invalid={Boolean(fieldErrors.password)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.password} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-[34px] text-slate-500 hover:text-brand font-semibold text-sm"
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <RequiredLabel htmlFor="reg-email">Email address</RequiredLabel>
                                        <input
                                            id="reg-email"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.email), 'placeholder:text-slate-500')}
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
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.password), 'placeholder:text-slate-500')}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            aria-invalid={Boolean(fieldErrors.password)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.password} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-[34px] text-slate-500 hover:text-brand font-semibold text-sm"
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                        {passwordStrength && form.password && (
                                            <div className="mt-2">
                                                <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
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
                                    </div>
                                    <div className="relative">
                                        <RequiredLabel htmlFor="reg-confirm-password">
                                            Confirm password
                                        </RequiredLabel>
                                        <input
                                            id="reg-confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={handleConfirmPasswordChange}
                                            className={inputClass(
                                                Boolean(fieldErrors.confirmPassword),
                                                'placeholder:text-slate-500'
                                            )}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-[34px] text-slate-500 hover:text-brand font-semibold text-sm"
                                        >
                                            {showConfirmPassword ? 'Hide' : 'Show'}
                                        </button>
                                        <FieldValidationMessage message={fieldErrors.confirmPassword} />
                                        {!fieldErrors.confirmPassword &&
                                            confirmPassword.length > 0 &&
                                            form.password === confirmPassword && (
                                                <p className="mt-1.5 text-xs font-medium text-emerald-600">
                                                    Passwords match.
                                                </p>
                                            )}
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="reg-name">Business name</RequiredLabel>
                                        <input
                                            id="reg-name"
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.name))}
                                            placeholder="Your business name"
                                            aria-invalid={Boolean(fieldErrors.name)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.name} />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="reg-business-email">
                                            Business email
                                        </RequiredLabel>
                                        <input
                                            id="reg-business-email"
                                            type="email"
                                            name="businessEmail"
                                            value={form.businessEmail}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.businessEmail))}
                                            placeholder="billing@yourbusiness.com"
                                            autoComplete="email"
                                            aria-invalid={Boolean(fieldErrors.businessEmail)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.businessEmail} />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="reg-address">Business address</RequiredLabel>
                                        <input
                                            id="reg-address"
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.address))}
                                            placeholder="123 Main Street"
                                            aria-invalid={Boolean(fieldErrors.address)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.address} />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="reg-phone">Phone</RequiredLabel>
                                        <input
                                            id="reg-phone"
                                            type="tel"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.phone))}
                                            placeholder="+234 810 000 0000"
                                            aria-invalid={Boolean(fieldErrors.phone)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.phone} />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-website" className="label">
                                            Website
                                        </label>
                                        <input
                                            id="reg-website"
                                            type="url"
                                            name="website"
                                            value={form.website}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="https://yourbusiness.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-brand-color" className="label">
                                            Brand color
                                        </label>
                                        <input
                                            id="reg-brand-color"
                                            type="color"
                                            name="brandColor"
                                            value={form.brandColor}
                                            onChange={handleChange}
                                            className="w-12 h-12 p-0 border-2 border-gray-200 rounded-full bg-white/90 cursor-pointer"
                                            title="Choose your brand color"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-brand hover:text-brand-hover"
                                    onClick={() => setResetModal(true)}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

                        <button
                            type="submit"
                            className="btn-primary w-full py-3.5 text-base"
                            disabled={submitLoading}
                            aria-busy={submitLoading}
                        >
                            {submitLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </>
                            ) : (
                                isLogin ? 'Sign in' : 'Create account'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-700 text-base">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            onClick={toggleMode}
                            disabled={submitLoading}
                            className="ml-2 font-medium text-brand hover:underline disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {isLogin ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Auth;
