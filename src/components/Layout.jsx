import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ClipboardList,
    PenLine,
    Users,
    Menu,
    X,
    LogOut,
    FileBarChart,
    Package,
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
import { APP_TAGLINE } from '../constants/brand';
import useAppLogout from '../hooks/useAppLogout';
import InstallPrompt from './InstallPrompt';
import NavLinks from './NavLinks';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Quotations', href: '/quotations', icon: ClipboardList },
    { name: 'Drafts', href: '/invoices/drafts', icon: PenLine, badgeKey: 'drafts' },
    { name: 'Statements', href: '/statements', icon: FileBarChart, premiumFeature: true },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
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
                    {showAccountAvatar ? <AccountAvatarPill /> : null}
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
                    onDismiss={() => setCoachmarkRevision((n) => n + 1)}
                />
            ) : null}

            {isAuthenticated ? <InstallPrompt /> : null}
        </div>
    );
};

export default memo(Layout);
