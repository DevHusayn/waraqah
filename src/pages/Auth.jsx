import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff, FileText, Shield, Zap } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
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

const FEATURES = [
    { icon: FileText, text: 'Professional PDF invoices & receipts' },
    { icon: Zap, text: 'Mark paid and track revenue instantly' },
    { icon: Shield, text: 'Secure cloud storage for your records' },
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

function PasswordToggle({ visible, onToggle, label }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-[34px] p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );
}

function Auth() {
    const { setBusinessInfo } = useSettings();
    const { fetchUserData, resetAll } = useInvoice();
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
    const initialForm = {
        email: '',
        password: '',
        name: '',
        address: '',
        businessEmail: '',
        phone: '',
        website: '',
        defaultCurrency: APP_CURRENCY,
        brandColor: '#0284c7',
    };
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetModal, setResetModal] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const authFormRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = searchParams.get('returnTo');

    useEffect(() => {
        setForm(initialForm);
    }, [isLogin, location.pathname, location.key]);

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

    const switchMode = (login) => {
        setError('');
        setFieldErrors({});
        setIsLogin(login);
        const params = new URLSearchParams(searchParams);
        params.set('mode', login ? 'login' : 'register');
        if (returnTo) params.set('returnTo', returnTo);
        navigate({ pathname: '/auth', search: `?${params.toString()}` }, { replace: true });
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
            await fetchUserData();
            try {
                const businessRes = await fetch(`${BASE_URL}/business-info`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${data.token}`,
                    },
                });
                if (businessRes.ok) {
                    setBusinessInfo(await businessRes.json());
                }
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

    const handleForgotPassword = async (email) => {
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
        <div className="min-h-screen lg:grid lg:grid-cols-2">
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ForgotPasswordModal
                open={resetModal}
                onClose={() => setResetModal(false)}
                onSubmit={handleForgotPassword}
                loading={resetLoading}
            />

            {/* Brand panel */}
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand via-brand to-brand-hover text-white p-12">
                <div>
                    <WaraqahLogo size="lg" className="[&_*]:text-white" />
                    <h2 className="mt-10 text-3xl font-semibold leading-tight max-w-sm">
                        Invoice professionally. Get paid faster.
                    </h2>
                    <p className="mt-4 text-white/80 text-base leading-relaxed max-w-md">
                        Create branded invoices, track payments, and manage clients — all in one
                        place.
                    </p>
                    <ul className="mt-10 space-y-4">
                        {FEATURES.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-white/90">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                                    <Icon size={18} aria-hidden />
                                </span>
                                <span className="text-sm font-medium">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="text-sm text-white/60">Trusted by businesses across Nigeria</p>
            </div>

            {/* Form panel */}
            <div className="flex flex-col justify-center min-h-screen p-6 sm:p-10 bg-slate-50">
                <div className="w-full max-w-md mx-auto">
                    <div className="lg:hidden flex justify-center mb-8">
                        <WaraqahLogo size="lg" />
                    </div>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand mb-6 transition-colors"
                    >
                        <ArrowLeft size={16} aria-hidden />
                        Back to home
                    </Link>

                    <div className="mb-6">
                        <h1 className="page-title text-2xl sm:text-3xl">
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="page-subtitle mt-1">
                            {isLogin
                                ? 'Sign in to manage your invoices'
                                : 'Start invoicing in under a minute'}
                        </p>
                    </div>

                    <div className="flex rounded-xl border border-slate-200 bg-white p-1 mb-6 shadow-sm">
                        <button
                            type="button"
                            onClick={() => switchMode(true)}
                            disabled={submitLoading}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                                isLogin
                                    ? 'bg-brand text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode(false)}
                            disabled={submitLoading}
                            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                                !isLogin
                                    ? 'bg-brand text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    <form
                        ref={authFormRef}
                        onSubmit={handleSubmit}
                        noValidate
                        className="card !p-6 space-y-5"
                    >
                        {isLogin ? (
                            <>
                                <div>
                                    <RequiredLabel htmlFor="auth-email">Email</RequiredLabel>
                                    <input
                                        id="auth-email"
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className={inputClass(Boolean(fieldErrors.email))}
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
                                        className={inputClass(Boolean(fieldErrors.password), 'pr-11')}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        aria-invalid={Boolean(fieldErrors.password)}
                                    />
                                    <PasswordToggle
                                        visible={showPassword}
                                        onToggle={() => setShowPassword(!showPassword)}
                                        label="password"
                                    />
                                    <FieldValidationMessage message={fieldErrors.password} />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm font-medium text-brand hover:underline"
                                        onClick={() => setResetModal(true)}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Account
                                    </p>
                                    <div>
                                        <RequiredLabel htmlFor="reg-email">Email</RequiredLabel>
                                        <input
                                            id="reg-email"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
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
                                            onChange={handleChange}
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
                                        {passwordStrength && form.password && (
                                            <div className="mt-2">
                                                <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
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
                                            onChange={handleConfirmPasswordChange}
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
                                            onToggle={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            label="confirm password"
                                        />
                                        <FieldValidationMessage message={fieldErrors.confirmPassword} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Business details
                                    </p>
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
                                            aria-invalid={Boolean(fieldErrors.businessEmail)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.businessEmail} />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="reg-address">Address</RequiredLabel>
                                        <input
                                            id="reg-address"
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            className={inputClass(Boolean(fieldErrors.address))}
                                            placeholder="123 Main Street, Lagos"
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
                                            Website <span className="text-slate-400 font-normal">(optional)</span>
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
                                        <div className="flex items-center gap-3">
                                            <input
                                                id="reg-brand-color"
                                                type="color"
                                                name="brandColor"
                                                value={form.brandColor}
                                                onChange={handleChange}
                                                className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer p-1"
                                            />
                                            <span className="text-sm font-mono text-slate-500">
                                                {form.brandColor}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="btn-primary w-full py-3"
                            disabled={submitLoading}
                            aria-busy={submitLoading}
                        >
                            {submitLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                                    {isLogin ? 'Signing in…' : 'Creating account…'}
                                </>
                            ) : isLogin ? (
                                'Sign in'
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            type="button"
                            onClick={() => switchMode(!isLogin)}
                            disabled={submitLoading}
                            className="font-semibold text-brand hover:underline disabled:opacity-50"
                        >
                            {isLogin ? 'Register free' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Auth;
