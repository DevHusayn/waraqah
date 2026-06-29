import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import Spinner from '../components/Spinner';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function UpgradeCallback() {
    const [searchParams] = useSearchParams();
    const { refreshBusinessInfo, setBusinessInfo } = useSettings();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const verified = useRef(false);

    useEffect(() => {
        if (verified.current) return;

        const reference = searchParams.get('reference') || searchParams.get('trxref');
        if (!reference) {
            setStatus('error');
            setMessage('No payment reference found. Return from Paystack should include ?reference= in the URL.');
            return;
        }

        if (authLoading) return;

        if (!isAuthenticated) {
            setStatus('error');
            setMessage('Please sign in to complete verification. Your payment reference was saved in the URL.');
            return;
        }

        verified.current = true;

        apiFetch(`/payments/verify/${encodeURIComponent(reference)}`)
            .then((data) => {
                if (data.businessInfo) {
                    setBusinessInfo(data.businessInfo);
                }
                return refreshBusinessInfo();
            })
            .then(() => {
                window.dispatchEvent(new Event('app-login'));
                setStatus('success');
                setMessage('Payment successful. Premium is now active.');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.message || 'Payment verification failed.');
            });
    }, [searchParams, setBusinessInfo, refreshBusinessInfo, authLoading, isAuthenticated]);

    if (status === 'loading') {
        return (
            <div className="max-w-md mx-auto text-center py-20">
                <Spinner size="xl" centered className="mx-auto mb-4" />
                <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">Confirming payment…</h1>
                <p className="text-zinc-500 mt-2 text-[13px]">Please wait while we verify with Paystack.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                <h1 className="page-title">Payment successful</h1>
                <p className="text-zinc-600 mt-2 mb-8">{message}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/settings/plan-billing" className="btn-primary">
                        Upload your logo
                    </Link>
                    <Link to="/" className="btn-secondary">
                        Go to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto text-center py-16">
            <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
            <h1 className="page-title">Payment incomplete</h1>
            <p className="text-zinc-600 mt-2 mb-8">{message}</p>
            <div className="flex flex-col gap-3 items-center">
                <Link to="/upgrade" className="btn-primary">
                    Try again
                </Link>
                {!isAuthenticated ? (
                    <Link
                        to={`/auth?returnTo=${encodeURIComponent(
                            `/upgrade/callback?reference=${searchParams.get('reference') || searchParams.get('trxref') || ''}`
                        )}`}
                        className="text-sm text-brand underline"
                    >
                        Sign in to verify payment
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

