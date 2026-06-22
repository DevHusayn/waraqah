import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getCompanyLogoAvatarUrl } from '../../utils/brandAssets';
import { getBusinessInitials, isPremiumUser } from '../../utils/premium';
import { PlanBadge } from './SettingsSection';

export default function BusinessSummaryCard({ businessInfo, className = '' }) {
    const premium = isPremiumUser(businessInfo);
    const logoUrl = getCompanyLogoAvatarUrl(businessInfo);
    const brandColor = businessInfo.brandColor || '#0284c7';

    return (
        <div
            className={`${
                premium ? 'card' : 'premium-card'
            } flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 ${className}`.trim()}
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {logoUrl ? (
                    <div className="h-14 w-14 rounded-xl border border-zinc-200 bg-white p-1.5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                ) : (
                    <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: brandColor }}
                    >
                        {getBusinessInitials(businessInfo.name)}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-zinc-900 truncate">
                            {businessInfo.name?.trim() || 'Your business'}
                        </h2>
                        <PlanBadge premium={premium} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-0.5 truncate">
                        {businessInfo.email || 'Add your business email to get started'}
                    </p>
                </div>
            </div>
            {!premium ? (
                <Link
                    to="/upgrade"
                    className="btn-primary shrink-0 gap-2 text-sm py-2 shadow-lg shadow-brand/20"
                >
                    <Sparkles size={16} aria-hidden />
                    Upgrade
                </Link>
            ) : null}
        </div>
    );
}
