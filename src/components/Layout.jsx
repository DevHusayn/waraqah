import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ClipboardList,
    Receipt,
    PenLine,
    Users,
    Menu,
    X,
    LogOut,
    FileBarChart,
    Package,
    Truck,
    ShoppingCart,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import WaraqahLogo from './WaraqahLogo';
import AccountAvatarPill from './AccountAvatarPill';
import BusinessSetupCoachmark from './BusinessSetupCoachmark';
import ConfirmModal from './ConfirmModal';
import { isPremiumUser } from '../utils/premium';
import { hasLikelyAuthSession, getCachedBusinessSummary } from '../utils/authHint';
import { needsBusinessSetup } from '@waraqah/shared';
import {
    clearBusinessSetupCoachmarkFlag,
    hasBusinessSetupCoachmarkFlag,
    isBusinessSetupCoachmarkDismissed,
} from '../utils/businessSetupCoachmark';
import { lockBodyScroll } from '../utils/bodyScrollLock';
import useAppLogout from '../hooks/useAppLogout';
import InstallPrompt from './InstallPrompt';
import NavLinks from './NavLinks';

const NAV_SECTIONS = [
    {
        items: [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
        label: 'Sales',
        items: [
            { name: 'Invoices', href: '/invoices', icon: FileText },
            { name: 'Receipts', href: '/receipts', icon: Receipt },
            { name: 'Quotations', href: '/quotations', icon: ClipboardList },
            { name: 'Drafts', href: '/drafts', icon: PenLine, badgeKey: 'drafts' },
        ],
    },
    {
        label: 'Finance',
        items: [
            { name: 'Statements', href: '/statements', icon: FileBarChart, premiumFeature: true },
            { name: 'Profit', href: '/profit', icon: TrendingUp, premiumFeature: true },
            { name: 'Expenses', href: '/expenses', icon: Wallet },
        ],
    },
    {
        label: 'Directory',
        items: [
            { name: 'Clients', href: '/clients', icon: Users },
            { name: 'Products', href: '/products', icon: Package },
            { name: 'Suppliers', href: '/suppliers', icon: Truck },
            { name: 'Purchase orders', href: '/purchase-orders', icon: ShoppingCart },
        ],
    },
];

const Layout = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const handleLogout = useAppLogout();
    const {
        businessInfo,
        businessInfoReady,
        fetchBusinessAssets,
        loading: settingsLoading,
    } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const { draftCount } = useInvoice();
    const { isAuthenticated, isAdmin, user, loading: authLoading } = useAuth();
    const showAccountAvatar = isAuthenticated || authLoading || hasLikelyAuthSession();
    const [, setCoachmarkRevision] = useState(0);
    const dismissed = isBusinessSetupCoachmarkDismissed(user?.id);

    const showSetupCoachmark =
        isAuthenticated &&
        !settingsLoading &&
        businessInfoReady &&
        Boolean(user?.id) &&
        user.authProvider === 'google' &&
        needsBusinessSetup(businessInfo) &&
        !dismissed &&
        hasBusinessSetupCoachmarkFlag();

    useEffect(() => {
        if (!user?.id) return;
        const cached = getCachedBusinessSummary(user.id);
        if (cached && !needsBusinessSetup(cached)) {
            clearBusinessSetupCoachmarkFlag();
        }
    }, [user?.id]);

    useEffect(() => {
        if (!businessInfoReady || needsBusinessSetup(businessInfo)) return;
        clearBusinessSetupCoachmarkFlag();
    }, [businessInfoReady, businessInfo]);

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

    useEffect(() => {
        if (!sidebarOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') setSidebarOpen(false);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [sidebarOpen]);

    const adminItem = isAdmin
        ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }]
        : [];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/invoices') {
            return location.pathname === '/invoices' || location.pathname.startsWith('/invoices/');
        }
        return location.pathname.startsWith(path);
    };

    const navLinkProps = {
        isActive,
        premium,
        badges: { drafts: draftCount },
    };

    const logoutButton = (
        <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="nav-link text-red-600 hover:bg-red-50/80 hover:text-red-700 w-full"
        >
            <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
            Log out
        </button>
    );

    const sidebarContent = (onNavigate, { showBrand = true, showLogout = true } = {}) => (
        <>
            {showBrand ? (
                <div className="px-2 mb-5 min-w-0">
                    <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                </div>
            ) : null}
            <nav className="flex flex-col gap-0.5">
                <NavLinks sections={NAV_SECTIONS} onNavigate={onNavigate} {...navLinkProps} />
                {adminItem.length > 0 ? (
                    <div className="mt-2">
                        <NavLinks items={adminItem} onNavigate={onNavigate} {...navLinkProps} />
                    </div>
                ) : null}
                {showLogout && isAuthenticated ? (
                    <div className="mt-4 pt-4 border-t border-zinc-200/50">
                        {logoutButton}
                    </div>
                ) : null}
            </nav>
        </>
    );

    return (
        <div className="min-h-screen bg-surface-muted">
            <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center border-b border-zinc-200/50 bg-white">
                <div className="flex h-full w-[15.5rem] shrink-0 items-center px-4 min-w-0">
                    <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                </div>
                <div className="flex flex-1 items-center justify-end px-4 sm:px-6 lg:px-8">
                    {showAccountAvatar ? <AccountAvatarPill /> : null}
                </div>
            </header>

            <aside className="hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:flex md:w-[15.5rem] md:flex-col border-r border-zinc-200/50 bg-zinc-50/40">
                <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-4">
                    {sidebarContent(undefined, { showBrand: false })}
                </div>
            </aside>

            <div className="md:pl-[15.5rem] md:pt-14 flex flex-col flex-1 min-h-screen min-w-0">
                <header className="sticky top-0 z-50 flex md:hidden h-14 shrink-0 items-center justify-between border-b border-zinc-200/50 bg-white px-4">
                    <div className="flex items-center min-w-0">
                        <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {showAccountAvatar ? <AccountAvatarPill /> : null}
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
                    className={`fixed top-14 inset-x-0 bottom-0 z-40 bg-zinc-950/40 md:hidden transition-opacity duration-300 ease-smooth ${
                        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden={!sidebarOpen}
                />

                <aside
                    className={`fixed z-[45] md:hidden flex w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-smooth will-change-transform top-[calc(3.5rem+0.75rem)] bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 ${
                        sidebarOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-[calc(100%+0.75rem)] pointer-events-none'
                    }`}
                    aria-hidden={!sidebarOpen}
                    aria-label="Navigation menu"
                >
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
                        <NavLinks
                            sections={NAV_SECTIONS}
                            onNavigate={() => setSidebarOpen(false)}
                            {...navLinkProps}
                            className="gap-1.5 [&_.nav-link]:py-2.5"
                        />
                        {adminItem.length > 0 ? (
                            <div className="mt-2">
                                <NavLinks
                                    items={adminItem}
                                    onNavigate={() => setSidebarOpen(false)}
                                    {...navLinkProps}
                                    className="gap-1.5 [&_.nav-link]:py-2.5"
                                />
                            </div>
                        ) : null}
                    </div>

                    {isAuthenticated ? (
                        <div className="shrink-0 border-t border-zinc-200/50 px-4 py-4">
                            {logoutButton}
                        </div>
                    ) : null}
                </aside>

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
                    onDismiss={() => setCoachmarkRevision((n) => n + 1)}
                />
            ) : null}

            {isAuthenticated ? <InstallPrompt /> : null}
        </div>
    );
};

export default memo(Layout);
