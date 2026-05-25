import { Link } from 'react-router-dom';
import { Crown, Sparkles, ChevronRight } from 'lucide-react';
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

    const ringClass = premium
        ? 'ring-2 ring-amber-200/80 ring-offset-2 ring-offset-white'
        : 'ring-2 ring-slate-200/80 ring-offset-2 ring-offset-white';

    if (showLogo) {
        return (
            <img
                src={logo}
                alt=""
                className={`h-12 w-12 rounded-xl object-cover bg-white shadow-sm ${ringClass}`}
            />
        );
    }

    return (
        <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-sm ${ringClass}`}
            aria-hidden
        >
            {initials}
        </div>
    );
}

function AccountSkeleton() {
    return (
        <div className="mt-auto pt-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 rounded bg-slate-200" />
                        <div className="h-3 w-16 rounded-full bg-slate-200" />
                    </div>
                </div>
                <div className="mt-3 h-10 rounded-xl bg-slate-100" />
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
        <div className="mt-auto pt-6">
            <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Your account
            </p>
            <div
                className={
                    premium
                        ? 'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-white p-4 shadow-sm'
                        : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
                }
            >
                <Link
                    to="/settings"
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl outline-none transition-colors hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-brand/30 -m-1 p-1"
                >
                    <SidebarAvatar businessInfo={businessInfo} premium={premium} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-slate-900 leading-snug">
                            {displayName}
                        </p>
                        <p
                            className={
                                premium
                                    ? 'mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-800'
                                    : 'mt-1 text-xs font-medium text-slate-500'
                            }
                        >
                            {premium ? (
                                <>
                                    <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    Premium plan
                                </>
                            ) : (
                                'Free plan'
                            )}
                        </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                </Link>

                {premium ? (
                    <Link
                        to="/settings#premium"
                        onClick={onNavigate}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-50"
                    >
                        Manage branding
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </Link>
                ) : (
                    <Link
                        to="/upgrade"
                        onClick={onNavigate}
                        className="group mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md"
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 opacity-90" />
                            Upgrade to Premium
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                )}
            </div>
        </div>
    );
}
