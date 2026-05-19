import { Link } from 'react-router-dom';
import { Crown, Sparkles, ChevronRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import {
    isPremiumUser,
    getBusinessInitials,
} from '../utils/premium';

function SidebarAvatar({ businessInfo, premium }) {
    const logo = (businessInfo.businessLogo || '').trim();
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
                className={`h-11 w-11 rounded-xl object-cover bg-white shadow-sm ${ringClass}`}
            />
        );
    }

    return (
        <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-sm ${ringClass}`}
            aria-hidden
        >
            {initials}
        </div>
    );
}

function AccountSkeleton() {
    return (
        <div className="mt-auto pt-4 px-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-16 rounded-full bg-slate-200" />
                        <div className="h-4 w-24 rounded bg-slate-200" />
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
        <div className="mt-auto pt-4 px-2 pb-1">
            <div
                className={
                    premium
                        ? 'rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 via-white to-white p-3.5 shadow-sm'
                        : 'rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 p-3.5 shadow-sm'
                }
            >
                <Link
                    to="/settings"
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl outline-none transition-colors hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-brand/30 -m-1 p-1"
                >
                    <SidebarAvatar businessInfo={businessInfo} premium={premium} />
                    <div className="min-w-0 flex-1">
                        <span
                            className={
                                premium
                                    ? 'inline-flex items-center gap-1 rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800'
                                    : 'inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600'
                            }
                        >
                            {premium ? (
                                <>
                                    <Crown className="h-3 w-3" aria-hidden />
                                    Premium
                                </>
                            ) : (
                                'Free plan'
                            )}
                        </span>
                        <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 leading-tight">
                            {displayName}
                        </p>
                    </div>
                </Link>

                {premium ? (
                    <Link
                        to="/settings#premium"
                        onClick={onNavigate}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-50"
                    >
                        Manage branding
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </Link>
                ) : (
                    <Link
                        to="/upgrade"
                        onClick={onNavigate}
                        className="group mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-brand/15 bg-brand/[0.06] px-3 py-2.5 text-sm font-semibold text-brand shadow-sm transition-all duration-200 hover:border-brand/30 hover:bg-brand hover:text-white hover:shadow-md"
                    >
                        <span className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 transition-colors group-hover:bg-white/20">
                                <Sparkles className="h-3.5 w-3.5" />
                            </span>
                            Upgrade
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                )}
            </div>
        </div>
    );
}

