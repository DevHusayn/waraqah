import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import WaraqahLogo from '../components/WaraqahLogo';
import { API_BASE, getNetworkErrorMessage } from '../utils/apiConfig';
import { AUTH_LOGIN_PATH } from '../constants/authRoutes';
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../utils/passwordValidation';

const RESET_URL = `${API_BASE}/auth/reset-password`;

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setAlert({ open: true, message: 'Passwords do not match.', type: 'error' });
            return;
        }
        if (!isStrongPassword(password)) {
            setAlert({ open: true, message: PASSWORD_REQUIREMENTS_MESSAGE, type: 'error' });
            return;
        }
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
                message: data.message || 'Your password has been updated. You can sign in now.',
                type: 'success',
            });
            setTimeout(() => navigate(AUTH_LOGIN_PATH), 2000);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message === 'Failed to fetch' ? getNetworkErrorMessage() : err.message,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 p-4">
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
                    <p className="text-base text-slate-600">Enter and confirm your new password below.</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-6 space-y-5"
                >
                    <div>
                        <label className="label">New password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field pr-16"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand font-semibold text-sm"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="label">Confirm password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="input-field"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="Repeat your password"
                        />
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

                <p className="mt-8 text-center text-slate-700 text-base">
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
