import { Link } from 'react-router-dom';
import { Crown, ChevronRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
    isPremiumUser,
    getBusinessInitials,
} from '../utils/premium';
import { getCompanyLogoAvatarUrl } from '../utils/brandAssets';

function SidebarAvatar({ businessInfo, premium }) {
    const logo = getCompanyLogoAvatarUrl(businessInfo);
    const showLogo = premium && logo.length > 0;
    const initials = getBusinessInitials(businessInfo.name);

    if (showLogo) {
        return (
            <img
                src={logo}
                alt=""
                className="h-7 w-7 rounded-md object-cover bg-white border border-zinc-200/60 shadow-soft"
            />
        );
    }

    return (
        <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand text-[10px] font-medium text-white shadow-soft"
            aria-hidden
        >
            {initials}
        </div>
    );
}

function AccountSkeleton() {
    return (
        <div className="mt-auto pt-4 border-t border-zinc-200/40">
            <div className="rounded-lg border border-zinc-200/50 bg-white/60 p-2.5 animate-pulse shadow-soft">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-zinc-200/80" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 rounded bg-zinc-200/80" />
                        <div className="h-2.5 w-14 rounded bg-zinc-200/60" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SidebarAccountFooter({ onNavigate }) {
    const { businessInfo, loading } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const displayName = businessInfo.name?.trim() || 'Your business';

    if (loading) {
        return <AccountSkeleton />;
    }

    return (
        <div className="mt-auto pt-4 border-t border-zinc-200/40">
            <div
                className={`rounded-lg p-2 shadow-soft backdrop-blur-sm ${
                    premium
                        ? 'border-2 border-amber-300/80 bg-amber-50'
                        : 'border border-zinc-200/50 bg-white/70'
                }`}
            >
                <Link
                    to="/settings"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-md outline-none transition-colors hover:bg-zinc-50/80 focus-visible:ring-2 focus-visible:ring-zinc-900/10 p-1 -m-1"
                >
                    <SidebarAvatar businessInfo={businessInfo} premium={premium} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-zinc-950 leading-snug">
                            {displayName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                            {premium ? (
                                <span className="inline-flex items-center gap-1 text-zinc-600">
                                    <Crown className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
                                    Premium
                                </span>
                            ) : (
                                'Free plan'
                            )}
                        </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden />
                </Link>

                {premium ? (
                    <Link
                        to="/settings/business/branding"
                        onClick={onNavigate}
                        className="premium-upgrade-btn mt-2 w-full px-2.5 py-1.5 text-[11px]"
                    >
                        <Crown className="h-3 w-3 text-amber-600 shrink-0" aria-hidden />
                        Manage branding
                        <ChevronRight className="h-3 w-3 opacity-60" />
                    </Link>
                ) : (
                    <Link
                        to="/upgrade"
                        onClick={onNavigate}
                        className="premium-upgrade-btn mt-2 w-full px-2.5 py-1.5 text-[11px]"
                    >
                        <Crown className="h-3 w-3 text-amber-600 shrink-0" aria-hidden />
                        Upgrade
                        <ChevronRight className="h-3 w-3 opacity-60" />
                    </Link>
                )}
            </div>
        </div>
    );
}
