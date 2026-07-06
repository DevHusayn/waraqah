import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, FileText, Shield, Zap } from 'lucide-react';
import Spinner from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import RegisterWizard, { clearRegisterDraft } from '../components/auth/RegisterWizard';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import WaraqahLogo from '../components/WaraqahLogo';
import RequiredLabel from '../components/RequiredLabel';
import { getNetworkErrorMessage } from '../utils/apiConfig';
import { authFetch, apiFetch, applyLoginResponse, prepareForLogin } from '../utils/api';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';
import {
    validateRequired,
    validateEmail,
    firstFieldError,
    inputClass,
    focusFieldById,
} from '../utils/formFieldValidation';
import FieldValidationMessage from '../components/FieldValidationMessage';

const LOGIN_FIELD_ORDER = ['email', 'password'];

const FEATURES = [
    { id: 'pdf', icon: FileText, text: 'Professional PDF invoices & receipts' },
    { id: 'track', icon: Zap, text: 'Mark paid and track revenue instantly' },
    { id: 'storage', icon: Shield, text: 'Secure cloud storage for your records' },
];

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

function Auth() {
    const { setBusinessInfo } = useSettings();
    const { fetchUserData, resetAll } = useInvoice();
    const { isAuthenticated, setSession } = useAuth();
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        if (isLogin) {
            setForm({ email: '', password: '' });
        }
    }, [isLogin, location.pathname, location.key]);

    useEffect(() => {
        if (location.pathname === '/auth' && isLogin) {
            setForm({ email: '', password: '' });
        }
    }, [location.pathname, location.key, isLogin]);

    useEffect(() => {
        const resetForm = () => setForm({ email: '', password: '' });
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
        setFieldErrors({});
    }, [isLogin]);

    const switchMode = (login) => {
        setError('');
        setFieldErrors({});
        setIsLogin(login);
        if (login) {
            clearRegisterDraft();
        }
        const params = new URLSearchParams(searchParams);
        params.set('mode', login ? 'login' : 'register');
        if (!login) {
            params.set('step', '1');
        } else {
            params.delete('step');
        }
        if (returnTo) params.set('returnTo', returnTo);
        navigate({ pathname: '/auth', search: `?${params.toString()}` }, { replace: true });
    };

    useEffect(() => {
        if (isAuthenticated) {
            const safeReturn =
                returnTo && returnTo.startsWith('/') && !returnTo.startsWith('/auth')
                    ? returnTo
                    : '/';
            navigate(safeReturn, { replace: true });
        }
    }, [navigate, returnTo, isAuthenticated]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSocialSuccess = async (data) => {
        resetAll();
        applyLoginResponse(data);
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const errors = buildLoginFieldErrors(form);
        const firstInvalid = firstFieldError(errors, LOGIN_FIELD_ORDER);

        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(firstInvalid === 'email' ? 'auth-email' : 'auth-password');
            return;
        }

        setFieldErrors({});
        setSubmitLoading(true);
        try {
            await prepareForLogin();
            resetAll();
            const email = form.email.trim().toLowerCase();
            const data = await authFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: form.password }),
            });
            applyLoginResponse(data);
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
            if (err.code === 'EMAIL_NOT_VERIFIED') {
                setError(
                    'Please verify your email before signing in. Check your inbox for the verification link, or register again to receive a new one.',
                );
            } else {
                setError(err.message === 'Failed to fetch' ? getNetworkErrorMessage() : err.message);
            }
            resetAll();
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleForgotPassword = async (email) => {
        setResetLoading(true);
        try {
            const data = await authFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
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
        <div className="min-h-screen lg:grid lg:grid-cols-2 lg:max-h-screen lg:overflow-hidden">
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

            <div className="hidden lg:flex lg:h-screen lg:sticky lg:top-0 flex-col justify-between bg-gradient-to-br from-brand via-brand to-brand-hover text-white p-10 xl:p-12">
                <div>
                    <WaraqahLogo size="lg" inverted iconStyle="solid" />
                    <h2 className="mt-10 text-3xl font-semibold leading-tight max-w-sm">
                        Invoice professionally. Get paid faster.
                    </h2>
                    <p className="mt-4 text-white/80 text-base leading-relaxed max-w-md">
                        Create branded invoices, track payments, and manage clients — all in one
                        place.
                    </p>
                    <ul className="mt-10 space-y-4">
                        {FEATURES.map(({ id, icon: Icon, text }) => (
                            <li key={id} className="flex items-center gap-3 text-white/90">
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

            <div className="min-h-screen lg:h-screen lg:overflow-y-auto flex flex-col bg-zinc-50/80">
                <div
                    className={`flex-1 flex flex-col px-5 py-8 sm:px-8 sm:py-10 ${
                        !isLogin ? 'justify-start' : 'justify-center'
                    } lg:justify-center`}
                >
                    <div className="w-full max-w-[420px] mx-auto">
                        <div className="mb-6">
                            <WaraqahLogo size="md" />
                        </div>

                        <div className="rounded-xl border border-zinc-200/60 bg-white shadow-soft p-6 sm:p-8">
                            {isLogin ? (
                                <>
                                    <div className="mb-6">
                                        <h1 className="page-title">Welcome back</h1>
                                        <p className="page-subtitle">Sign in to manage your invoices</p>
                                    </div>

                                    <div className="flex rounded-md border border-zinc-200/80 bg-zinc-50/50 p-1 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => switchMode(true)}
                                            disabled={submitLoading}
                                            className="flex-1 rounded-[5px] py-2 text-[13px] font-medium transition-all duration-200 bg-brand-light text-brand shadow-soft"
                                        >
                                            Sign in
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => switchMode(false)}
                                            disabled={submitLoading}
                                            className="flex-1 rounded-[5px] py-2 text-[13px] font-medium transition-all duration-200 text-zinc-500 hover:text-zinc-800"
                                        >
                                            Register
                                        </button>
                                    </div>

                                    <form
                                        ref={authFormRef}
                                        onSubmit={handleSubmit}
                                        noValidate
                                        className="space-y-4"
                                    >
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
                                                className={inputClass(
                                                    Boolean(fieldErrors.password),
                                                    'pr-11'
                                                )}
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
                                                className="text-[13px] font-medium text-brand hover:underline"
                                                onClick={() => setResetModal(true)}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>

                                        {error && (
                                            <p className="text-[13px] text-red-700 bg-red-50 border border-red-200/80 rounded-md px-3 py-2">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className="btn-primary w-full !py-2.5"
                                            disabled={submitLoading}
                                            aria-busy={submitLoading}
                                        >
                                            {submitLoading ? (
                                                <>
                                                    <Spinner size="sm" inline />
                                                    Signing in…
                                                </>
                                            ) : (
                                                'Sign in'
                                            )}
                                        </button>

                                        <SocialAuthButtons
                                            disabled={submitLoading}
                                            onSuccess={handleSocialSuccess}
                                            onError={(message) => setError(message)}
                                        />
                                    </form>

                                    <p className="mt-5 pt-5 border-t border-zinc-100 text-center text-[13px] text-zinc-500">
                                        Don&apos;t have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => switchMode(false)}
                                            disabled={submitLoading}
                                            className="font-medium text-brand hover:underline disabled:opacity-50"
                                        >
                                            Register free
                                        </button>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex rounded-md border border-zinc-200/80 bg-zinc-50/50 p-1 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => switchMode(true)}
                                            disabled={submitLoading}
                                            className="flex-1 rounded-[5px] py-2 text-[13px] font-medium transition-all duration-200 text-zinc-500 hover:text-zinc-800"
                                        >
                                            Sign in
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => switchMode(false)}
                                            disabled={submitLoading}
                                            className="flex-1 rounded-[5px] py-2 text-[13px] font-medium transition-all duration-200 bg-brand-light text-brand shadow-soft"
                                        >
                                            Register
                                        </button>
                                    </div>

                                    <RegisterWizard returnTo={returnTo} />

                                    <p className="mt-5 pt-5 border-t border-zinc-100 text-center text-[13px] text-zinc-500">
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => switchMode(true)}
                                            disabled={submitLoading}
                                            className="font-medium text-brand hover:underline disabled:opacity-50"
                                        >
                                            Sign in
                                        </button>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Auth;
