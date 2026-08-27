import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
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
    Warehouse,
    Truck,
    ShoppingCart,
    TrendingUp,
    Wallet,
    Settings,
    PanelLeft,
} from 'lucide-react';
import { useState, useEffect, useLayoutEffect, memo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import WaraqahLogo, { WaraqahIcon } from './WaraqahLogo';
import HoverTooltip from './HoverTooltip';
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
import ThemeToggle from './ThemeToggle';
import {
    applySidebarCollapsed,
    persistSidebarCollapsed,
    readSidebarCollapsed,
} from '../utils/sidebarLayout';

const NAV_SECTIONS = [
    {
        items: [{ name: 'Home', href: '/', icon: Home }],
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
            { name: 'Inventory', href: '/inventory', icon: Warehouse },
            { name: 'Suppliers', href: '/suppliers', icon: Truck },
            { name: 'Purchase orders', href: '/purchase-orders', icon: ShoppingCart },
        ],
    },
];

const Layout = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
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

    useLayoutEffect(() => {
        applySidebarCollapsed(sidebarCollapsed);
    }, [sidebarCollapsed]);

    useEffect(() => {
        if (!sidebarOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') setSidebarOpen(false);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [sidebarOpen]);

    const toggleSidebarCollapsed = () => {
        setSidebarCollapsed((current) => {
            const next = !current;
            persistSidebarCollapsed(next);
            return next;
        });
    };

    const adminItem = isAdmin
        ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }]
        : [];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        if (path === '/invoices') {
            return location.pathname === '/invoices' || location.pathname.startsWith('/invoices/');
        }
        if (path === '/settings') {
            return location.pathname === '/settings' || location.pathname.startsWith('/settings/');
        }
        return location.pathname.startsWith(path);
    };

    const navLinkProps = {
        isActive,
        premium,
        badges: { drafts: draftCount },
    };

    const iconLinkClass = (active, iconOnly = false) =>
        `${active ? 'nav-link nav-link-active' : 'nav-link'}${iconOnly ? ' nav-link-icon' : ''}`;

    const logoutButton = (iconOnly = false) => (
        <HoverTooltip label="Log out" enabled={iconOnly}>
            <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className={`nav-link text-red-600 hover:bg-red-50/80 hover:text-red-700 dark:hover:bg-red-950/40 w-full${
                    iconOnly ? ' nav-link-icon' : ''
                }`}
                aria-label={iconOnly ? 'Log out' : undefined}
            >
                <LogOut className={`${iconOnly ? 'h-[18px] w-[18px]' : 'h-4 w-4'} flex-shrink-0`} strokeWidth={1.75} />
                {iconOnly ? null : 'Log out'}
            </button>
        </HoverTooltip>
    );

    const settingsLink = (onNavigate, { className = '', iconOnly = false } = {}) => (
        <HoverTooltip label="Settings" enabled={iconOnly}>
            <Link
                to="/settings"
                onClick={onNavigate}
                className={`${iconLinkClass(isActive('/settings'), iconOnly)} ${className}`.trim()}
                aria-label={iconOnly ? 'Settings' : undefined}
            >
                <Settings
                    className={`${iconOnly ? 'h-[18px] w-[18px]' : 'h-4 w-4'} flex-shrink-0 opacity-80`}
                    strokeWidth={1.75}
                />
                {iconOnly ? null : 'Settings'}
            </Link>
        </HoverTooltip>
    );

    const sidebarFooter = (onNavigate, { linkClassName = '', iconOnly = false } = {}) => (
        isAuthenticated ? (
            <div className={`mt-4 pt-4 border-t border-border/50 flex flex-col ${iconOnly ? 'gap-1' : 'gap-0.5'} ${linkClassName}`.trim()}>
                {settingsLink(onNavigate, { iconOnly })}
                {logoutButton(iconOnly)}
            </div>
        ) : null
    );

    const sidebarContent = (onNavigate, { showBrand = true, showFooter = true, footerClassName = '', iconOnly = false } = {}) => (
        <>
            {showBrand ? (
                <div className="px-2 mb-5 min-w-0">
                    <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                </div>
            ) : null}
            <nav className="flex flex-col gap-0.5">
                <NavLinks sections={NAV_SECTIONS} onNavigate={onNavigate} iconOnly={iconOnly} {...navLinkProps} />
                {adminItem.length > 0 ? (
                    <div className={iconOnly ? 'mt-1' : 'mt-2'}>
                        <NavLinks items={adminItem} onNavigate={onNavigate} iconOnly={iconOnly} {...navLinkProps} />
                    </div>
                ) : null}
                {showFooter ? sidebarFooter(onNavigate, { linkClassName: footerClassName, iconOnly }) : null}
            </nav>
        </>
    );

    const collapseLabel = sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    const sidebarToggle = (
        <HoverTooltip label={collapseLabel}>
            <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                aria-label={collapseLabel}
                aria-expanded={!sidebarCollapsed}
                aria-controls="desktop-sidebar-nav"
            >
                <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
        </HoverTooltip>
    );

    return (
        <div className="min-h-screen bg-surface-muted">
            <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center border-b border-border/50 bg-surface">
                <div
                    className={`flex h-full w-[var(--sidebar-width)] shrink-0 items-center overflow-hidden min-w-0 transition-[width] duration-200 ease-smooth motion-reduce:transition-none ${
                        sidebarCollapsed ? 'justify-center px-0' : 'justify-between gap-1 px-3'
                    }`}
                >
                    {sidebarCollapsed ? (
                        <span className="inline-flex items-center justify-center">
                            <WaraqahIcon size="sm" />
                            <span className="sr-only">Waraqah</span>
                        </span>
                    ) : (
                        <>
                            <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                            {sidebarToggle}
                        </>
                    )}
                </div>
                <div className="flex flex-1 items-center gap-2 px-4 sm:px-6 lg:px-8">
                    {sidebarCollapsed ? sidebarToggle : null}
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                        {showAccountAvatar ? <AccountAvatarPill /> : null}
                    </div>
                </div>
            </header>

            <aside className="hidden md:fixed md:left-0 md:top-14 md:bottom-0 md:flex md:w-[var(--sidebar-width)] md:flex-col overflow-hidden border-r border-border/50 bg-surface-muted/80 transition-[width] duration-200 ease-smooth motion-reduce:transition-none">
                <div
                    id="desktop-sidebar-nav"
                    className={`flex flex-1 flex-col overflow-y-auto scroll-x-touch py-4 ${
                        sidebarCollapsed ? 'px-1.5' : 'px-2.5'
                    }`}
                >
                    {sidebarContent(undefined, { showBrand: false, iconOnly: sidebarCollapsed })}
                </div>
            </aside>

            <div className="md:pl-[var(--sidebar-width)] md:pt-14 flex flex-col flex-1 min-h-screen min-w-0 md:transition-[padding] duration-200 ease-smooth motion-reduce:transition-none">
                <header className="sticky top-0 z-50 flex md:hidden h-14 shrink-0 items-center justify-between border-b border-border/50 bg-surface px-4">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2 text-foreground-muted hover:bg-surface-muted transition-colors"
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
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        {showAccountAvatar ? <AccountAvatarPill compact /> : null}
                    </div>
                </header>

                <div
                    className={`fixed inset-0 z-[52] bg-zinc-950/40 md:hidden transition-opacity duration-300 ease-smooth ${
                        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden={!sidebarOpen}
                />

                <aside
                    className={`fixed z-[55] md:hidden flex w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-smooth will-change-transform top-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 ${
                        sidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-[calc(100%+0.75rem)] pointer-events-none'
                    }`}
                    aria-hidden={!sidebarOpen}
                    aria-label="Navigation menu"
                >
                    <div className="flex h-14 shrink-0 items-center px-4 min-w-0">
                        <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-x-touch px-4 pb-4 pt-2">
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
                        <div className="shrink-0 border-t border-border/50 px-4 py-4 flex flex-col gap-0.5 [&_.nav-link]:py-2.5">
                            {settingsLink(() => setSidebarOpen(false))}
                            {logoutButton()}
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
