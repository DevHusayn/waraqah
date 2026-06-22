import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, XCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { isPremiumUser } from '../utils/premium';
import { premiumPriceLabel } from '../constants/pricing';

export default function SubscriptionBilling() {
    const { businessInfo, refreshBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [cancelling, setCancelling] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const hasSubscription = Boolean(businessInfo.paystackSubscriptionCode);
    const isActiveSub = businessInfo.subscriptionStatus === 'active';
    const renewsAt = businessInfo.premiumUntil || businessInfo.subscriptionRenews;

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

    if (!premium && !hasSubscription) {
        return (
            <Link
                to="/upgrade"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
            >
                <Sparkles className="h-4 w-4" />
                Subscribe — {premiumPriceLabel()}/month
            </Link>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 space-y-2">
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
            {isActiveSub && hasSubscription && (
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    {cancelling ? 'Cancelling…' : 'Cancel auto-renewal'}
                </button>
            )}
        </div>
    );
}
