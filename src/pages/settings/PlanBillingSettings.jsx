import { Link } from 'react-router-dom';
import { Sparkles, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { SettingsSection } from '../../components/settings/SettingsSection';
import SubscriptionBilling from '../../components/SubscriptionBilling';
import DevPlanToggle from '../../components/DevPlanToggle';
import { useSettings } from '../../context/SettingsContext';
import { isPremiumUser } from '../../utils/premium';
import { premiumUpgradeLabel } from '../../constants/pricing';

export default function PlanBillingSettings() {
    const { businessInfo } = useSettings();
    const [formData, setFormData] = useState(businessInfo);
    const premium = isPremiumUser(businessInfo);

    useEffect(() => {
        setFormData(businessInfo);
    }, [businessInfo]);

    return (
        <SettingsPageShell
            title="Plan and Billing"
            subtitle="Subscription status, invoice limits, and billing history"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Plan and Billing', to: '/settings/plan-billing' },
            ]}
        >
            <SettingsSection
                title="Current plan"
                description="Your subscription and usage limits"
            >
                <div className="space-y-4">
                    <div
                        className={`p-4 sm:p-5 rounded-xl ${
                            premium
                                ? 'border border-zinc-200 bg-zinc-50/60'
                                : 'premium-card'
                        }`}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {!premium ? (
                                        <Crown className="h-4 w-4 text-amber-600" aria-hidden />
                                    ) : null}
                                    <p className="text-sm font-semibold text-zinc-900">
                                        {premium ? 'Premium plan' : 'Free plan'}
                                    </p>
                                </div>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    {premium
                                        ? 'Unlimited invoices, brand assets, and PDF customization'
                                        : 'Limited monthly invoices — upgrade for full branding'}
                                </p>
                            </div>
                            {!premium ? (
                                <Link to="/upgrade" className="btn-primary text-sm py-2 shadow-lg shadow-brand/20">
                                    <Sparkles size={16} aria-hidden />
                                    {premiumUpgradeLabel()}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                    <DevPlanToggle formData={formData} setFormData={setFormData} />
                    <SubscriptionBilling />
                </div>
            </SettingsSection>
        </SettingsPageShell>
    );
}
