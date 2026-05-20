import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { isPremiumUser } from '../utils/premium';
import { formatCurrency } from '../utils/currency';
import { PREMIUM_PLAN_FEATURES } from '../constants/planFeatures';
import Spinner from '../components/Spinner';
import DevPlanToggle from '../components/DevPlanToggle';

export default function Upgrade() {
    const { showToast } = useToast();
    const { businessInfo } = useSettings();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const monthlyAmount = plan?.amount ?? 5000;

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
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand mb-8 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
            </Link>

            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4">
                    <Crown className="h-7 w-7" />
                </div>
                <h1 className="page-title">Upgrade to Premium</h1>
                <p className="page-subtitle mt-2">
                    Unlimited invoices, your logo on PDFs, monthly statements, and profile branding.
                </p>
            </div>

            <div className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-card-md overflow-hidden">
                <div className="px-6 py-5 border-b border-amber-100/80">
                    <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-semibold text-slate-900">Premium</span>
                        <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                            Monthly
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900 tracking-tight">
                            {formatCurrency(monthlyAmount)}
                        </span>
                        <span className="text-slate-500 font-medium">/ month</span>
                    </div>
                </div>

                <ul className="px-6 py-5 space-y-3">
                    <li className="flex items-start gap-3 text-sm font-semibold text-slate-900 pb-3 border-b border-amber-200/60">
                        <Check className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" strokeWidth={2.5} />
                        Everything in Free, plus:
                    </li>
                    {PREMIUM_PLAN_FEATURES.map((text) => (
                        <li key={text} className="flex items-start gap-3 text-sm text-slate-700">
                            <Check className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" strokeWidth={2.5} />
                            {text}
                        </li>
                    ))}
                    <li className="flex items-start gap-3 text-xs text-slate-500 pt-2">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-slate-400">·</span>
                        Auto-renews monthly via Paystack ({formatCurrency(monthlyAmount)})
                    </li>
                    <li className="flex items-start gap-3 text-xs text-slate-500">
                        <span className="h-5 w-5 shrink-0 flex items-center justify-center text-slate-400">·</span>
                        Cancel anytime. Keep access until your billing period ends.
                    </li>
                </ul>

                <div className="px-6 pb-6 space-y-3 bg-white/50">
                    {premium ? (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 text-center font-medium">
                            You already have Premium active.
                        </div>
                    ) : (
                        <>
                            {!plan?.paystackConfigured && (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                    Paystack is not configured on the server. Add your keys to{' '}
                                    <code className="text-xs">backend .env</code> on your server.
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handlePay}
                                disabled={paying || !plan?.paystackConfigured}
                                className="btn-primary w-full py-3.5 text-base gap-2"
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

                    <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Shield className="h-3.5 w-3.5" />
                        Secured by Paystack · Card, bank and USSD
                    </p>

                    <DevPlanToggle className="mt-4" />
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
                You will be charged {formatCurrency(monthlyAmount)} now and each month until you cancel.
                Paystack secures your card for renewals.
            </p>
        </div>
    );
}
