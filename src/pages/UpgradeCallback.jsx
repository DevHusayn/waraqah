import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { clearPendingPaymentReference } from '../utils/pendingPayment';
import {
    checkSubscriptionStatusManual,
    MAX_POLL_ATTEMPTS,
    pollSubscriptionStatus,
} from '../utils/paymentVerification';
import { ANALYTICS_EVENTS } from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';

export default function UpgradeCallback() {
    const [searchParams] = useSearchParams();
    const { refreshBusinessInfo, setBusinessInfo, businessInfo } = useSettings();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [retryHint, setRetryHint] = useState('');
    const [checking, setChecking] = useState(false);

    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const businessInfoRef = useRef(businessInfo);
    const refreshBusinessInfoRef = useRef(refreshBusinessInfo);
    const setBusinessInfoRef = useRef(setBusinessInfo);
    const pollGenerationRef = useRef(0);

    businessInfoRef.current = businessInfo;
    refreshBusinessInfoRef.current = refreshBusinessInfo;
    setBusinessInfoRef.current = setBusinessInfo;

    const applyPollResult = useCallback((result) => {
        setRetryHint('');

        if (result.status === 'success') {
            clearPendingPaymentReference();
            captureEvent(ANALYTICS_EVENTS.UPGRADE_COMPLETED);
            window.dispatchEvent(new Event('app-login'));
            setStatus('success');
            setMessage(result.message);
            return;
        }

        setStatus('processing');
        setMessage(result.message);
    }, []);

    const handleCheckAgain = useCallback(async () => {
        setChecking(true);
        setRetryHint('');
        setStatus('loading');

        const result = await checkSubscriptionStatusManual({
            reference,
            businessInfo: businessInfoRef.current,
            setBusinessInfo: (...args) => setBusinessInfoRef.current(...args),
            refreshBusinessInfo: (...args) => refreshBusinessInfoRef.current(...args),
        });

        applyPollResult(result);
        setChecking(false);
    }, [applyPollResult, reference]);

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setMessage('No payment reference found. Return from Paystack should include ?reference= in the URL.');
            return undefined;
        }

        if (authLoading) {
            setRetryHint('Signing you in…');
            return undefined;
        }

        if (!isAuthenticated) {
            setStatus('error');
            setMessage('Please sign in to complete verification. Your payment reference was saved in the URL.');
            return undefined;
        }

        const pollGeneration = pollGenerationRef.current + 1;
        pollGenerationRef.current = pollGeneration;

        const abortController = new AbortController();
        setStatus('loading');
        setRetryHint('');
        setMessage('');

        (async () => {
            const result = await pollSubscriptionStatus({
                reference,
                businessInfo: businessInfoRef.current,
                setBusinessInfo: (...args) => setBusinessInfoRef.current(...args),
                refreshBusinessInfo: (...args) => refreshBusinessInfoRef.current(...args),
                signal: abortController.signal,
                onAttempt: (attempt, delayMs) => {
                    if (pollGeneration !== pollGenerationRef.current) return;
                    if (attempt >= MAX_POLL_ATTEMPTS) {
                        setRetryHint(`Final check… (${attempt}/${MAX_POLL_ATTEMPTS})`);
                        return;
                    }
                    if (delayMs > 0) {
                        setRetryHint(
                            `Checking again in ${Math.ceil(delayMs / 1000)}s… (${attempt}/${MAX_POLL_ATTEMPTS})`
                        );
                    } else {
                        setRetryHint('');
                    }
                },
            });

            if (pollGeneration !== pollGenerationRef.current) {
                return;
            }
            applyPollResult(result);
        })();

        return () => {
            abortController.abort();
        };
    }, [reference, authLoading, isAuthenticated, applyPollResult]);

    if (status === 'loading') {
        return (
            <div className="max-w-md mx-auto text-center py-20">
                <Spinner size="xl" centered className="mx-auto mb-4" />
                <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">Confirming payment…</h1>
                <p className="text-zinc-500 mt-2 text-[13px]">
                    {retryHint || 'Checking your subscription status…'}
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
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

    if (status === 'processing') {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <Clock className="h-14 w-14 text-amber-500 mx-auto mb-4" />
                <h1 className="page-title">Still processing</h1>
                <p className="text-zinc-600 mt-2 mb-8">{message}</p>
                <div className="flex flex-col gap-3 items-center">
                    <button
                        type="button"
                        onClick={handleCheckAgain}
                        disabled={checking}
                        className="btn-primary w-full sm:w-auto"
                    >
                        {checking ? (
                            <>
                                <Spinner size="sm" inline />
                                Checking…
                            </>
                        ) : (
                            'Check again'
                        )}
                    </button>
                    <Link to="/" className="btn-secondary w-full sm:w-auto">
                        Go to dashboard
                    </Link>
                    <p className="text-xs text-zinc-500 mt-2">
                        Premium usually activates within a minute. You can leave and check Plan &amp; Billing in
                        Settings.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto text-center py-16">
            <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
            <h1 className="page-title">Cannot verify payment</h1>
            <p className="text-zinc-600 mt-2 mb-8">{message}</p>
            <div className="flex flex-col gap-3 items-center">
                {!isAuthenticated ? (
                    <Link
                        to={`/auth?returnTo=${encodeURIComponent(
                            `/upgrade/callback?reference=${reference || ''}`
                        )}`}
                        className="btn-primary"
                    >
                        Sign in to verify payment
                    </Link>
                ) : (
                    <Link to="/upgrade" className="btn-secondary">
                        Back to upgrade
                    </Link>
                )}
            </div>
        </div>
    );
}
