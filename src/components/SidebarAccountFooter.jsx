import { Link } from 'react-router-dom';
import { Crown, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
    isPremiumUser,
    getBusinessInitials,
    getPlanLabel,
} from '../utils/premium';

function SidebarAvatar({ businessInfo, premium }) {
    const logo = businessInfo.businessLogo;
    const showLogo = premium && logo;
    const initials = getBusinessInitials(businessInfo.name);
    const brandColor = businessInfo.brandColor || '#0ea5e9';

    if (showLogo) {
        return (
            <img
                src={logo}
                alt=""
                className="h-10 w-10 rounded-xl object-cover border border-slate-200 bg-white flex-shrink-0"
            />
        );
    }

    return (
        <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: brandColor }}
            aria-hidden
        >
            {initials}
        </div>
    );
}

export default function SidebarAccountFooter() {
    const { businessInfo, loading } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const planLabel = getPlanLabel(businessInfo);

    if (loading) {
        return (
            <div className="mt-auto pt-4 border-t border-slate-200 px-2">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                </div>
            </div>
        );
    }

    return (
        <div className="mt-auto pt-4 border-t border-slate-200 px-2">
            <div className="flex items-center gap-3">
                <SidebarAvatar businessInfo={businessInfo} premium={premium} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {premium ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" aria-hidden />
                        ) : null}
                        <span
                            className={
                                premium
                                    ? 'text-sm font-medium text-amber-800'
                                    : 'text-sm font-medium text-slate-600'
                            }
                        >
                            {planLabel}
                        </span>
                    </div>
                    {businessInfo.name?.trim() ? (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{businessInfo.name.trim()}</p>
                    ) : null}
                </div>
            </div>

            {!premium ? (
                <Link
                    to="/settings#premium"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                >
                    <Sparkles className="h-4 w-4" />
                    Upgrade
                </Link>
            ) : null}
        </div>
    );
}
