import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { buildBusinessInfoPayload } from '../utils/businessPayload';
import { isPremiumUser, PLANS } from '../utils/premium';

/**
 * Shown when backend allows dev plan changes (ALLOW_DEV_PLAN=true, Paystack test mode).
 */
export default function DevPlanToggle({ formData, setFormData, className = '' }) {
    const { businessInfo, refreshBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [config, setConfig] = useState(null);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        apiFetch('/payments/plan')
            .then(setConfig)
            .catch(() => setConfig(null));
    }, []);

    if (!config?.devPlanToggleEnabled) {
        return null;
    }

    const premium = isPremiumUser(businessInfo);

    const applyPlan = async (plan) => {
        if (plan === PLANS.PREMIUM && premium) return;
        if (plan === PLANS.FREE && !premium) return;

        setSwitching(true);
        try {
            const payload = buildBusinessInfoPayload(
                { ...businessInfo, ...(formData || {}), plan },
                businessInfo
            );
            const updated = await apiFetch('/business-info', {
                method: 'PUT',
                body: JSON.stringify({ ...payload, plan }),
            });
            await refreshBusinessInfo();
            if (setFormData) {
                setFormData((prev) => ({
                    ...prev,
                    ...updated,
                    plan: updated.plan,
                    businessLogo: updated.businessLogo || '',
                    companyLogoUrl: updated.companyLogoUrl || '',
                    companyLogoAvatarUrl: updated.companyLogoAvatarUrl || '',
                    companyStampUrl: updated.companyStampUrl || '',
                    authorizedSignatureUrl: updated.authorizedSignatureUrl || '',
                }));
            }
            showToast(
                plan === PLANS.PREMIUM
                    ? 'Test mode: Premium plan enabled'
                    : 'Test mode: Free plan enabled',
                'success'
            );
        } catch (err) {
            showToast(err.message || 'Could not switch plan', 'error');
        } finally {
            setSwitching(false);
        }
    };

    return (
        <div
            className={`rounded-xl border border-dashed border-amber-300/80 bg-amber-50/90 p-3 ${className}`}
            role="group"
            aria-label="Test mode plan toggle"
        >
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                Test mode — switch plan
                {config.isPaystackTestMode ? (
                    <span className="font-normal text-amber-700">(Paystack test)</span>
                ) : null}
            </p>
            <div className="flex rounded-lg border border-amber-200/80 bg-white p-0.5 shadow-sm">
                <button
                    type="button"
                    disabled={switching}
                    onClick={() => applyPlan(PLANS.FREE)}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                        !premium
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                >
                    Free
                </button>
                <button
                    type="button"
                    disabled={switching}
                    onClick={() => applyPlan(PLANS.PREMIUM)}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                        premium
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                >
                    Premium
                </button>
            </div>
            {switching ? (
                <p className="text-xs text-amber-800 mt-2 text-center">Updating…</p>
            ) : (
                <p className="text-xs text-amber-700/90 mt-2 text-center leading-relaxed">
                    No payment required. For local / Paystack test use only.
                </p>
            )}
        </div>
    );
}
