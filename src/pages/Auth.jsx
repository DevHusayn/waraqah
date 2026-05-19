
import React, { useState, useEffect } from 'react';
import AlertModal from '../components/AlertModal';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { APP_CURRENCY } from '../utils/currency';
import { applyBrandTheme } from '../utils/brandTheme';
import { APP_NAME } from '../constants/brand';

// Unified URL Configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_URL = `${BASE_URL}/auth`;

function Auth() {
    const { setBusinessInfo } = useSettings();
    const { fetchUserData, resetAll } = useInvoice();
    const [isLogin, setIsLogin] = useState(true);
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
    const [resetModal, setResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
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
        applyBrandTheme(isLogin ? '#0284c7' : form.brandColor);
    }, [isLogin, form.brandColor]);

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
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Strong password requirements (only for registration)
        if (!isLogin) {
            const password = form.password;
            const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
            if (!strong.test(password)) {
                setError('Password must be at least 8 characters, include uppercase, lowercase, and a number.');
                return;
            }
        }
        try {
            let body = { email: form.email, password: form.password };
            if (!isLogin) {
                body.businessInfo = {
                    name: form.name,
                    address: form.address,
                    email: form.businessEmail,
                    phone: form.phone,
                    website: form.website,
                    defaultCurrency: APP_CURRENCY,
                    brandColor: form.brandColor,
                };
            }
            const res = await fetch(`${AUTH_URL}/${isLogin ? 'login' : 'register'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
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
            setError(err.message);
            resetAll();
        }
    };

    // Password reset handler
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setError('');
        try {
            const res = await fetch(`${AUTH_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
            setAlert({ open: true, message: 'Password reset link sent! Check your email.', type: 'success' });
            setResetModal(false);
            setResetEmail('');
        } catch (err) {
            setAlert({ open: true, message: err.message, type: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--brand-subtle)_0%,_transparent_50%)] pointer-events-none" aria-hidden />
            <AlertModal open={alert.open} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, open: false })} />

            {/* Password Reset Modal */}
            {resetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 relative">
                        <button onClick={() => setResetModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-primary-600 text-xl font-bold">&times;</button>
                        <h2 className="text-2xl font-bold mb-4 text-primary-700 text-center">Reset Password</h2>
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Enter your email"
                                    value={resetEmail}
                                    onChange={e => setResetEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary-600 via-blue-600 to-primary-700 hover:from-primary-700 hover:to-blue-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-primary-200 transition-all text-lg tracking-wide disabled:opacity-60"
                                disabled={resetLoading}
                            >
                                {resetLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </div>
                </div>
            )}


            {/* Right Side: Auth Form */}
            <div className="flex items-center justify-center min-h-screen p-4 sm:p-10 bg-transparent w-full">
                <div className="w-full max-w-md">
                    <div className="md:hidden flex justify-center mb-8">
                        <span className="text-2xl font-semibold text-brand">{APP_NAME}</span>
                    </div>

                    <div className="mb-8 text-center md:text-left">
                        <h1 className="page-title text-3xl sm:text-4xl mb-2">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="page-subtitle">
                            {isLogin ? 'Sign in to manage your invoices.' : 'Register to start invoicing professionally.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="card space-y-6 shadow-card-md">

                        <div className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email" name="email" value={form.email} onChange={handleChange}
                                    className="input-field"
                                    placeholder="name@company.com" required
                                />
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                                <input
                                    type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                                    className="input-field"
                                    placeholder="••••••••" required
                                />
                                <button
                                    type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[34px] text-gray-400 hover:text-primary-600 font-bold"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            {/* Registration-only fields */}
                            {!isLogin && (
                                <>
                                    {/* Business Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
                                        <input
                                            type="text" name="name" value={form.name} onChange={handleChange}
                                            className="input-field"
                                            placeholder="Your Business Name" required
                                        />
                                    </div>
                                    {/* Business Email */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Email</label>
                                        <input
                                            type="email" name="businessEmail" value={form.businessEmail} onChange={handleChange}
                                            className="input-field"
                                            placeholder="business@email.com" required
                                        />
                                    </div>
                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Address</label>
                                        <input
                                            type="text" name="address" value={form.address} onChange={handleChange}
                                            className="input-field"
                                            placeholder="123 Main St, City" required
                                        />
                                    </div>
                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel" name="phone" value={form.phone} onChange={handleChange}
                                            className="input-field"
                                            placeholder="+1 234 567 8900" required
                                        />
                                    </div>
                                    {/* Website */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                                        <input
                                            type="url" name="website" value={form.website} onChange={handleChange}
                                            className="input-field"
                                            placeholder="https://yourbusiness.com"
                                        />
                                    </div>
{/* Brand Color */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Color</label>
                                        <input
                                            type="color" name="brandColor" value={form.brandColor} onChange={handleChange}
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
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                    onClick={() => setResetModal(true)}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

                        <button type="submit" className="btn-primary w-full py-3.5 text-base">
                            {isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-600 text-base">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 font-medium text-brand hover:underline"
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
