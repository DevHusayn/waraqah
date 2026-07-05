import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { authFetch } from '../utils/api';
import { AUTH_LOGIN_PATH } from '../constants/authRoutes';
import WaraqahLogo from '../components/WaraqahLogo';
import Spinner from '../components/Spinner';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await authFetch(`/auth/verify-email/${token}`, { method: 'POST' });
                if (cancelled) return;
                setStatus('success');
                setMessage(data.message || 'Your email has been verified. You can sign in now.');
            } catch (err) {
                if (cancelled) return;
                setStatus('error');
                setMessage(err.message || 'This verification link is invalid or has expired.');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md card text-center">
                <Link to="/" className="inline-flex mb-6">
                    <WaraqahLogo className="h-8 w-auto" />
                </Link>

                {status === 'loading' ? (
                    <Spinner label="Verifying your email…" />
                ) : status === 'success' ? (
                    <>
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                            <CheckCircle2 size={24} aria-hidden />
                        </div>
                        <h1 className="text-xl font-semibold text-zinc-900">Email verified</h1>
                        <p className="mt-2 text-sm text-zinc-600">{message}</p>

                        <Link
                            to={AUTH_LOGIN_PATH}
                            className="btn-primary w-full inline-flex justify-center mt-6"
                        >
                            Sign in
                        </Link>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-semibold text-zinc-900">Verification failed</h1>
                        <p className="mt-2 text-sm text-zinc-600">{message}</p>

                        <Link
                            to={AUTH_LOGIN_PATH}
                            className="btn-primary w-full inline-flex justify-center mt-6"
                        >
                            Sign in
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
