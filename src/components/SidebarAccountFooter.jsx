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
                className="h-8 w-8 rounded-md object-cover bg-white border border-zinc-200/80"
            />
        );
    }

    return (
        <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900 text-xs font-medium text-white"
            aria-hidden
        >
            {initials}
        </div>
    );
}

function AccountSkeleton() {
    return (
        <div className="mt-auto pt-4">
            <div className="rounded-lg border border-zinc-200/80 bg-white p-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-zinc-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-24 rounded bg-zinc-200" />
                        <div className="h-2.5 w-14 rounded bg-zinc-200" />
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
        <div className="mt-auto pt-4 border-t border-zinc-100">
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-2.5">
                <Link
                    to="/settings"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-md outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-zinc-900/10 p-1 -m-1"
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
                        to="/settings#premium"
                        onClick={onNavigate}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                        Manage branding
                    </Link>
                ) : (
                    <Link
                        to="/upgrade"
                        onClick={onNavigate}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                    >
                        Upgrade to Premium
                        <ChevronRight className="h-3 w-3 opacity-50" />
                    </Link>
                )}
            </div>
        </div>
    );
}
