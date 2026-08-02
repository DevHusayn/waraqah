import { useState, useEffect, useRef } from 'react';
import { usePaystackReturnSync } from '../hooks/usePaystackReturnSync';
import { setPendingPaymentReference } from '../utils/pendingPayment';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, XCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { canCancelPremiumAutoRenewal, isPremiumAutoRenewing, isPremiumUser } from '../utils/premium';
import {
    premiumPriceLabel,
    premiumYearlyPriceLabel,
    PREMIUM_YEARLY_SAVINGS_NGN,
} from '../constants/pricing';
import Spinner from '../components/Spinner';

export default function SubscriptionBilling() {
    const { businessInfo, refreshBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [cancelling, setCancelling] = useState(false);
    const [switching, setSwitching] = useState(false);

    usePaystackReturnSync(() => setSwitching(false));

    const premium = isPremiumUser(businessInfo);
    const hasSubscription = Boolean(businessInfo.paystackSubscriptionCode);
    const isActiveSub = isPremiumAutoRenewing(businessInfo);
    const canCancelAutoRenewal = canCancelPremiumAutoRenewal(businessInfo);
    const renewsAt = businessInfo.premiumUntil || businessInfo.subscriptionRenews;
    const billingInterval = businessInfo.billingInterval || 'monthly';
    const isMonthly = billingInterval === 'monthly';
    const syncAttemptedRef = useRef(false);

    useEffect(() => {
        if (!premium || hasSubscription || syncAttemptedRef.current) return;
        syncAttemptedRef.current = true;

        apiFetch('/payments/subscription/sync', { method: 'POST' })
            .then(() => refreshBusinessInfo())
            .catch(() => {
                syncAttemptedRef.current = false;
            });
    }, [premium, hasSubscription, refreshBusinessInfo]);

    const handleCancel = async () => {
        if (!window.confirm('Cancel auto-renewal? You keep Premium until the end of the current billing period.')) {
            return;
        }
        setCancelling(true);
        try {
            const data = await apiFetch('/payments/subscription/cancel', { method: 'POST' });
            await refreshBusinessInfo();
            showToast(data.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setCancelling(false);
        }
    };

    const handleSwitchToYearly = async () => {
        setSwitching(true);
        try {
            const { authorization_url, reference } = await apiFetch('/payments/initialize', {
                method: 'POST',
                body: JSON.stringify({
                    callbackOrigin: window.location.origin,
                    interval: 'yearly',
                    switchFromMonthly: true,
                }),
            });
            setPendingPaymentReference(reference);
            window.location.assign(authorization_url);
        } catch (err) {
            showToast(err.message, 'error');
            setSwitching(false);
        }
    };

    if (!premium && !hasSubscription) {
        return (
            <Link
                to="/upgrade"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
            >
                <Sparkles className="h-4 w-4" />
                Subscribe — from {premiumPriceLabel()}/month
            </Link>
        );
    }

    const billingLabel = billingInterval === 'yearly'
        ? `Billed yearly · ${premiumYearlyPriceLabel()}/yr`
        : `Billed monthly · ${premiumPriceLabel()}/mo`;

    return (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-zinc-700">{billingLabel}</p>
            {renewsAt && (
                <p className="flex items-center gap-2 text-sm text-zinc-600">
                    <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                    {isActiveSub ? (
                        <>
                            Renews on{' '}
                            <span className="font-medium text-zinc-800">
                                {new Date(renewsAt).toLocaleDateString('en-NG', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        </>
                    ) : (
                        <>
                            Premium until{' '}
                            <span className="font-medium text-zinc-800">
                                {new Date(renewsAt).toLocaleDateString('en-NG', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        </>
                    )}
                </p>
            )}
            {businessInfo.subscriptionStatus === 'attention' && (
                <p className="text-sm text-amber-800">Last renewal failed. Update your card in Paystack or resubscribe.</p>
            )}
            {businessInfo.subscriptionStatus === 'cancelled' && (
                <p className="text-sm text-zinc-600">Auto-renewal is off.</p>
            )}
            {isActiveSub && hasSubscription && isMonthly && (
                <button
                    type="button"
                    onClick={handleSwitchToYearly}
                    disabled={switching}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline transition-colors disabled:opacity-50"
                >
                    {switching ? (
                        <>
                            <Spinner size="sm" inline />
                            Redirecting to Paystack…
                        </>
                    ) : (
                        <>Switch to yearly & save ₦{PREMIUM_YEARLY_SAVINGS_NGN.toLocaleString('en-NG')}</>
                    )}
                </button>
            )}
            {canCancelAutoRenewal && (
                <div className="pt-3 mt-1 border-t border-zinc-200 space-y-2">
                    <p className="text-sm text-zinc-600">
                        Auto-renewal is on. Cancel anytime — you keep Premium until the end of your billing period.
                    </p>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        <XCircle className="h-4 w-4" />
                        {cancelling ? 'Cancelling…' : 'Cancel auto-renewal'}
                    </button>
                </div>
            )}
        </div>
    );
}
