import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { isPremiumUser } from '../utils/premium';
import { formatCurrency } from '../utils/currency';
import { PREMIUM_PLAN_FEATURES } from '../constants/planFeatures';
import { PREMIUM_PRICE_NGN } from '../constants/pricing';
import PremiumPrice from '../components/PremiumPrice';
import Spinner from '../components/Spinner';
import DevPlanToggle from '../components/DevPlanToggle';

export default function Upgrade() {
    const { showToast } = useToast();
    const { businessInfo } = useSettings();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const monthlyAmount = plan?.amount ?? PREMIUM_PRICE_NGN;

    useEffect(() => {
        apiFetch('/payments/plan')
            .then(setPlan)
            .catch((err) => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    const handlePay = async () => {
        setPaying(true);
        try {
            const { authorization_url } = await apiFetch('/payments/initialize', {
                method: 'POST',
                body: JSON.stringify({ callbackOrigin: window.location.origin }),
            });
            window.location.assign(authorization_url);
        } catch (err) {
            showToast(err.message, 'error');
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-8 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
            </Link>

            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-zinc-100 text-zinc-600 mb-3">
                    <Crown className="h-5 w-5" />
                </div>
                <h1 className="page-title">Upgrade to Premium</h1>
                <p className="page-subtitle mt-1">
                    Unlimited invoices, your logo on PDFs, monthly statements, and profile branding.
                </p>
            </div>

            <div className="rounded-lg border border-zinc-200/80 bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-zinc-950">Premium</span>
                        <span className="ml-auto rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                            Monthly
                        </span>
                    </div>
                    <PremiumPrice amount={monthlyAmount} size="sm" className="mt-1" />
                </div>

                <ul className="px-5 py-4 space-y-2.5">
                    <li className="flex items-start gap-2 text-sm font-medium text-zinc-950 pb-2 border-b border-zinc-100">
                        <Check className="h-4 w-4 shrink-0 text-zinc-600 mt-0.5" strokeWidth={2.5} />
                        Everything in Free, plus:
                    </li>
                    {PREMIUM_PLAN_FEATURES.map((text) => (
                        <li key={text} className="flex items-start gap-2 text-sm text-zinc-600">
                            <Check className="h-4 w-4 shrink-0 text-zinc-500 mt-0.5" strokeWidth={2.5} />
                            {text}
                        </li>
                    ))}
                    <li className="flex items-start gap-3 text-xs text-zinc-500 pt-2">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-zinc-400">·</span>
                        Auto-renews monthly via Paystack ({formatCurrency(monthlyAmount)})
                    </li>
                    <li className="flex items-start gap-3 text-xs text-zinc-500">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-zinc-400">·</span>
                        Cancel anytime. Keep access until your billing period ends.
                    </li>
                </ul>

                <div className="px-5 pb-5 space-y-2">
                    {premium ? (
                        <div className="rounded-md bg-zinc-100 border border-zinc-200 px-3 py-2 text-sm text-zinc-700 text-center font-medium">
                            You already have Premium active.
                        </div>
                    ) : (
                        <>
                            {!plan?.paystackConfigured && (
                                <p className="text-sm text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2">
                                    Paystack is not configured on the server. Add your keys to{' '}
                                    <code className="text-xs">backend .env</code> on your server.
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handlePay}
                                disabled={paying || !plan?.paystackConfigured}
                                className="btn-primary w-full"
                            >
                                {paying ? (
                                    <>
                                        <Spinner className="!h-5 !w-5" />
                                        Redirecting to Paystack…
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="h-5 w-5" />
                                        Pay with Paystack
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    <p className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <Shield className="h-3.5 w-3.5" />
                        Secured by Paystack · Card, bank and USSD
                    </p>

                    <DevPlanToggle className="mt-4" />
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500 leading-relaxed">
                You will be charged {formatCurrency(monthlyAmount)} now and each month until you cancel.
                Paystack secures your card for renewals.
            </p>
        </div>
    );
}
