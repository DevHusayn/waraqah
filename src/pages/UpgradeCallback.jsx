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

export default function UpgradeCallback() {
    const [searchParams] = useSearchParams();
    const { refreshBusinessInfo, businessInfo } = useSettings();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [retryHint, setRetryHint] = useState('');
    const [checking, setChecking] = useState(false);

    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const businessInfoRef = useRef(businessInfo);
    const refreshBusinessInfoRef = useRef(refreshBusinessInfo);

    businessInfoRef.current = businessInfo;
    refreshBusinessInfoRef.current = refreshBusinessInfo;

    const applyPollResult = useCallback((result) => {
        setRetryHint('');

        if (result.status === 'success') {
            clearPendingPaymentReference();
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
            refreshBusinessInfo: (...args) => refreshBusinessInfoRef.current(...args),
        });

        applyPollResult(result);
        setChecking(false);
    }, [applyPollResult, reference]);

    useEffect(() => {
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

        const abortController = new AbortController();
        setStatus('loading');
        setRetryHint('');
        setMessage('');

        (async () => {
            const result = await pollSubscriptionStatus({
                reference,
                businessInfo: businessInfoRef.current,
                refreshBusinessInfo: (...args) => refreshBusinessInfoRef.current(...args),
                signal: abortController.signal,
                onAttempt: (attempt, delayMs) => {
                    if (abortController.signal.aborted) return;
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

            if (abortController.signal.aborted) return;
            applyPollResult(result);
        })();

        return () => {
            abortController.abort();
        };
    }, [reference, authLoading, isAuthenticated, applyPollResult]);

    if (status === 'loading') {