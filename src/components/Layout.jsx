import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    PenLine,
    Users,
    Menu,
    X,
    LogOut,
    FileBarChart,
    Crown,
    Package,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import WaraqahLogo from './WaraqahLogo';
import AccountAvatar from './AccountAvatar';
import BusinessSetupCoachmark from './BusinessSetupCoachmark';
import ConfirmModal from './ConfirmModal';
import { isPremiumUser } from '../utils/premium';
import { needsBusinessSetup } from '@waraqah/shared';
import {
    clearBusinessSetupCoachmarkFlag,
    hasBusinessSetupCoachmarkFlag,
    isBusinessSetupCoachmarkDismissed,
} from '../utils/businessSetupCoachmark';
import { lockBodyScroll } from '../utils/bodyScrollLock';
import { APP_TAGLINE } from '../constants/brand';
import useAppLogout from '../hooks/useAppLogout';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Drafts', href: '/invoices/drafts', icon: PenLine, badgeKey: 'drafts' },
    { name: 'Statements', href: '/statements', icon: FileBarChart, premiumFeature: true },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
];

function NavLinks({ items, isActive, onNavigate, premium, badges }) {
    return (
        <div className="flex flex-col gap-0.5">
            {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showPremiumBadge = item.premiumFeature && !premium;
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onNavigate}
                        className={active ? 'nav-link nav-link-active' : 'nav-link'}
                    >
                        <Icon className="h-4 w-4 flex-shrink-0 opacity-80" strokeWidth={1.75} />
                        <span className="flex-1">{item.name}</span>
                        {showPremiumBadge ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Premium" />
                        ) : null}
                        {badge > 0 ? (
                            <span className="inline-flex min-w-[1.125rem] h-[18px] items-center justify-center rounded bg-brand text-white text-[10px] font-medium px-1 tabular-nums">
                                {badge > 99 ? '99+' : badge}
                            </span>
                        ) : null}
                    </Link>
                );
            })}
        </div>
    );
}

const Layout = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const handleLogout = useAppLogout();
    const { businessInfo, fetchBusinessAssets, loading: settingsLoading } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const { draftCount } = useInvoice();
    const { isAuthenticated, isAdmin, user } = useAuth();
    const [showSetupCoachmark, setShowSetupCoachmark] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || settingsLoading || !user?.id) {
            setShowSetupCoachmark(false);
            return;
        }

        const profileIncomplete = needsBusinessSetup(businessInfo);
        const dismissed = isBusinessSetupCoachmarkDismissed(user.id);
        const shouldShow =
            profileIncomplete &&
            !dismissed &&
            (hasBusinessSetupCoachmarkFlag() || user.authProvider === 'google');

        setShowSetupCoachmark(shouldShow);

        if (!profileIncomplete) {
            clearBusinessSetupCoachmarkFlag();
        }
    }, [isAuthenticated, settingsLoading, user, businessInfo]);

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        if (typeof window.requestIdleCallback === 'function') {
            const idleId = window.requestIdleCallback(() => {
                fetchBusinessAssets();
            }, { timeout: 2500 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timerId = window.setTimeout(() => {
            fetchBusinessAssets();
        }, 150);
        return () => window.clearTimeout(timerId);
    }, [isAuthenticated, fetchBusinessAssets]);

    useEffect(() => {
        if (!sidebarOpen) return undefined;
        return lockBodyScroll();
    }, [sidebarOpen]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const adminItem = isAdmin
        ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }]
        : [];

    const navigation = [...NAV_ITEMS, ...adminItem];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/invoices') {
            if (location.pathname.startsWith('/invoices/drafts')) return false;
            return location.pathname === '/invoices' || location.pathname.startsWith('/invoices/');
        }
        if (path === '/invoices/drafts') {
            return location.pathname.startsWith('/invoices/drafts');
        }
        return location.pathname.startsWith(path);
    };

    const sidebarContent = (onNavigate, { showBrand = true } = {}) => (
        <>
            {showBrand ? (
                <div className="px-2 mb-5 min-w-0">
                    <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} subtitle={APP_TAGLINE} />
                </div>
            ) : null}
            <nav className="flex flex-col gap-0.5">
                <NavLinks
                    items={navigation}
                    isActive={isActive}
                    onNavigate={onNavigate}
                    premium={premium}
                    badges={{ drafts: draftCount }}
                />
                {isAuthenticated ? (
                    <div className="mt-4 pt-4 border-t border-zinc-200/50">
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            className="nav-link text-red-600 hover:bg-red-50/80 hover:text-red-700 w-full"
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                            Log out
                        </button>
                    </div>
                ) : null}
            </nav>
        </>
    );

    return (
        <div className="min-h-screen bg-surface-muted">
            <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center border-b border-zinc-200/50 bg-white">
                <div className="flex h-full w-[15.5rem] shrink-0 items-center px-4 min-w-0">
                    <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} subtitle={APP_TAGLINE} />
                </div>
                <div className="flex flex-1 items-center justify-end px-4 sm:px-6 lg:px-8">
                    {isAuthenticated ? (
                        <Link
                            to="/settings"
                            data-business-setup-anchor
                            aria-label="Settings"
                            className="rounded-md p-1 outline-none transition-colors hover:bg-zinc-100/80 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                        >
                            <AccountAvatar size="sm" />
                        </Link>
                    ) : null}
                </div>
            </header>

            <aside className="hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:flex md:w-[15.5rem] md:flex-col border-r border-zinc-200/50 bg-zinc-50/40">
                <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-4">
                    {sidebarContent(undefined, { showBrand: false })}
                </div>
            </aside>

            <div className="md:pl-[15.5rem] md:pt-14 flex flex-col flex-1 min-h-screen min-w-0">
                <header className="sticky top-0 z-50 flex md:hidden items-center justify-between border-b border-zinc-200/50 bg-white px-4 py-2.5">
                    <div className="flex items-center min-w-0">
                        <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isAuthenticated ? (
                            <Link
                                to="/settings"
                                data-business-setup-anchor
                                aria-label="Settings"
                                className="rounded-md p-1 outline-none transition-colors hover:bg-zinc-100/80 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
                            >
                                <AccountAvatar size="sm" />
                            </Link>
                        ) : null}
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100/80 transition-colors"
                            onClick={() => setSidebarOpen((open) => !open)}
                            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? (
                                <X className="h-5 w-5 stroke-[1.75]" />
                            ) : (
                                <Menu className="h-5 w-5 stroke-[1.75]" />
                            )}
                        </button>
                    </div>
                </header>

                <div
                    className={`fixed inset-x-0 top-14 bottom-0 z-30 bg-zinc-950/40 md:hidden transition-opacity duration-200 ease-out ${
                        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden={!sidebarOpen}
                />

                <div
                    className={`fixed inset-x-0 top-14 z-40 md:hidden transition-[opacity,transform] duration-200 ease-out ${
                        sidebarOpen
                            ? 'opacity-100 translate-y-0 pointer-events-auto'
                            : 'pointer-events-none opacity-0 -translate-y-1'
                    }`}
                    aria-hidden={!sidebarOpen}
                >
                    <div className="border-b border-zinc-200/50 bg-white shadow-sm max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain px-4 py-4">
                        {sidebarContent(() => setSidebarOpen(false), { showBrand: false })}
                    </div>
                </div>

                <main className="flex-1 min-w-0 overflow-x-hidden">
                    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full min-w-0">
                        {children}
                    </div>
                </main>
            </div>

            <ConfirmModal
                open={showLogoutModal}
                title="Log out?"
                description="You will need to sign in again to access your account."
                confirmLabel="Log out"
                cancelLabel="Stay signed in"
                variant="danger"
                onConfirm={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                }}
                onCancel={() => setShowLogoutModal(false)}
            />

            {showSetupCoachmark ? (
                <BusinessSetupCoachmark
                    userId={user?.id}
                    authProvider={user?.authProvider}
                    onDismiss={() => setShowSetupCoachmark(false)}
                />
            ) : null}
        </div>
    );
};

export default Layout;
