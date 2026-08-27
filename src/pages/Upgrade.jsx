import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { isPremiumUser } from '../utils/premium';
import { formatCurrency } from '../utils/currency';
import { PREMIUM_PLAN_FEATURES } from '../constants/planFeatures';
import {
    PREMIUM_PRICE_NGN,
    PREMIUM_PRICE_YEARLY_NGN,
    PREMIUM_YEARLY_SAVINGS_NGN,
    premiumIntervalSuffix,
} from '../constants/pricing';
import PremiumPrice from '../components/PremiumPrice';
import Spinner from '../components/Spinner';
import DevPlanToggle from '../components/DevPlanToggle';
import { usePaystackReturnSync } from '../hooks/usePaystackReturnSync';
import { setPendingPaymentReference } from '../utils/pendingPayment';
import { ANALYTICS_EVENTS } from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';

export default function Upgrade() {
    const { showToast } = useToast();
    const { businessInfo } = useSettings();
    const [plan, setPlan] = useState(null);
    const [paying, setPaying] = useState(false);
    const [billingInterval, setBillingInterval] = useState('monthly');

    const premium = isPremiumUser(businessInfo);
    const isYearly = billingInterval === 'yearly';
    const selectedPlan = plan?.plans?.[billingInterval];
    const amount = selectedPlan?.amount ?? (isYearly ? PREMIUM_PRICE_YEARLY_NGN : PREMIUM_PRICE_NGN);
    const savings = selectedPlan?.savings ?? PREMIUM_YEARLY_SAVINGS_NGN;

    usePaystackReturnSync(() => setPaying(false));

    useEffect(() => {
        apiFetch('/payments/plan')
            .then(setPlan)
            .catch(() => {
                /* Optional: pricing uses local constants; ignore offline/errors on load */
            });
    }, []);

    const handlePay = async () => {
        setPaying(true);
        try {
            const { authorization_url, reference } = await apiFetch('/payments/initialize', {
                method: 'POST',
                body: JSON.stringify({
                    callbackOrigin: window.location.origin,
                    interval: billingInterval,
                }),
            });
            setPendingPaymentReference(reference);
            captureEvent(ANALYTICS_EVENTS.UPGRADE_STARTED, { billing_interval: billingInterval });
            window.location.assign(authorization_url);
        } catch (err) {
            showToast(err.message, 'error');
            setPaying(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-brand mb-8 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
            </Link>

            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-amber-300/80 mb-3">
                    <Crown className="h-5 w-5 text-amber-500" aria-hidden />
                </div>
                <h1 className="page-title">Upgrade to Premium</h1>
                <p className="page-subtitle mt-1">
                    Unlimited invoices and quotations, your logo on PDFs, monthly statements, and profile branding.
                </p>
            </div>

            <div className="premium-card">
                <div className="px-5 py-4 border-b border-amber-200/70 dark:border-amber-800/50">
                    <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-foreground">Premium</span>
                    </div>

                    {!premium && (
                        <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 mb-3 dark:bg-black/30">
                            <button
                                type="button"
                                onClick={() => setBillingInterval('monthly')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${billingInterval === 'monthly'
                                        ? 'bg-surface text-foreground shadow-sm dark:bg-surface-elevated'
                                        : 'text-foreground-muted hover:text-foreground'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingInterval('yearly')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${billingInterval === 'yearly'
                                        ? 'bg-surface text-foreground shadow-sm dark:bg-surface-elevated'
                                        : 'text-foreground-muted hover:text-foreground'
                                    }`}
                            >
                                Yearly
                                <span className="ml-1 text-[10px] font-bold uppercase text-green-700 dark:text-green-400">
                                    Save ₦{savings.toLocaleString('en-NG')}
                                </span>
                            </button>
                        </div>
                    )}

                    <PremiumPrice
                        amount={amount}
                        size="sm"
                        className="mt-1"
                        suffix={premiumIntervalSuffix(billingInterval)}
                        savingsLabel={isYearly ? '2 months free' : ''}
                    />
                </div>

                <ul className="px-5 py-4 space-y-2.5">
                    <li className="flex items-start gap-2 text-sm font-semibold text-foreground pb-2 border-b border-amber-200/70 dark:border-amber-800/50">
                        <Check className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" strokeWidth={2.5} />
                        Everything in Free, plus:
                    </li>
                    {PREMIUM_PLAN_FEATURES.map((text) => (
                        <li key={text} className="flex items-start gap-2 text-sm text-foreground-muted">
                            <Check className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" strokeWidth={2.5} />
                            {text}
                        </li>
                    ))}
                    <li className="flex items-start gap-3 text-xs text-foreground-muted pt-2">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-foreground-muted/70">·</span>
                        Auto-renews {isYearly ? 'yearly' : 'monthly'} via Paystack ({formatCurrency(amount)})
                    </li>
                    <li className="flex items-start gap-3 text-xs text-foreground-muted">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-foreground-muted/70">·</span>
                        Cancel anytime. Keep access until your billing period ends.
                    </li>
                </ul>

                <div className="px-5 pb-5 space-y-2">
                    {premium ? (
                        <div className="rounded-md bg-zinc-100 border border-border px-3 py-2 text-sm text-foreground-muted text-center font-medium dark:bg-surface-muted">
                            You already have Premium active.
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={paying}
                            className="btn-primary w-full"
                        >
                            {paying ? (
                                <>
                                    <Spinner size="sm" inline />
                                    Redirecting to Paystack…
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5" />
                                    Pay with Paystack
                                </>
                            )}
                        </button>
                    )}

                    <p className="flex items-center justify-center gap-2 text-xs text-foreground-muted">
                        <Shield className="h-3.5 w-3.5" />
                        Secured by Paystack · Card, bank and USSD
                    </p>

                    <DevPlanToggle className="mt-4" />
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-foreground-muted leading-relaxed">
                {isYearly
                    ? `You will be charged ${formatCurrency(amount)} now and each year until you cancel. Paystack secures your card for renewals.`
                    : `You will be charged ${formatCurrency(amount)} now and each month until you cancel. Paystack secures your card for renewals.`}
            </p>
        </div>
    );
}
