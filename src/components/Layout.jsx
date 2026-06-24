import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    PenLine,
    Users,
    Settings as SettingsIcon,
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
import ConfirmModal from './ConfirmModal';
import WaraqahLogo from './WaraqahLogo';
import SidebarAccountFooter from './SidebarAccountFooter';
import { isPremiumUser } from '../utils/premium';
import { lockBodyScroll } from '../utils/bodyScrollLock';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Drafts', href: '/invoices/drafts', icon: PenLine, badgeKey: 'drafts' },
    { name: 'Statements', href: '/statements', icon: FileBarChart, premiumFeature: true },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
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
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { businessInfo, setBusinessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const { resetAll, draftInvoices } = useInvoice();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (!sidebarOpen) return undefined;
        return lockBodyScroll();
    }, [sidebarOpen]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        setBusinessInfo({ name: '', address: '', email: '', phone: '', website: '', defaultCurrency: 'NGN', taxRate: 10, brandColor: '#0ea5e9', plan: 'free', businessLogo: '', companyLogoUrl: '', companyLogoAvatarUrl: '', companyStampUrl: '', authorizedSignatureUrl: '', paymentAccountName: '', paymentBankName: '', paymentAccountNumber: '', paymentInstructions: '', invoiceTemplateId: 'classic' });
        resetAll();
        window.dispatchEvent(new Event('app-logout'));
        navigate('/auth');
    };

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

    const sidebarContent = (onNavigate) => (
        <>
            <div className="px-2 mb-5 min-w-0">
                <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
            </div>
            <nav className="flex flex-1 flex-col gap-0.5">
                <NavLinks
                    items={navigation}
                    isActive={isActive}
                    onNavigate={onNavigate}
                    premium={premium}
                    badges={{ drafts: draftInvoices.length }}
                />
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="nav-link text-red-600 hover:bg-red-50/80 hover:text-red-700 mt-4 w-full"
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                        Log out
                    </button>
                )}
            </nav>
            <SidebarAccountFooter onNavigate={onNavigate} />
        </>
    );

    return (
        <div className="min-h-screen bg-surface-muted">
            <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-[15.5rem] md:flex-col border-r border-zinc-200/50 bg-zinc-50/40 backdrop-blur-sm">
                <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-4">
                    {sidebarContent()}
                </div>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden overflow-hidden overscroll-none">
                    <div
                        className="fixed inset-0 bg-zinc-950/30 backdrop-blur-[3px] touch-none"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden
                    />
                    <div className="relative flex w-full max-w-[17rem] flex-1 flex-col bg-zinc-50/95 backdrop-blur-md border-r border-zinc-200/50 shadow-lift">
                        <button
                            type="button"
                            className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-500 hover:bg-white/80 hover:text-zinc-700 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-4 pt-11">
                            {sidebarContent(() => setSidebarOpen(false))}
                        </div>
                    </div>
                </div>
            )}

            <div className="md:pl-[15.5rem] flex flex-col flex-1 min-h-screen min-w-0">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl px-4 py-2.5 md:hidden">
                    <div className="flex items-center min-w-0">
                        <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2 text-zinc-600 hover:bg-zinc-100/80 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" strokeWidth={1.75} />
                    </button>
                </header>

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
                onConfirm={() => { setShowLogoutModal(false); handleLogout(); }}
                onCancel={() => setShowLogoutModal(false)}
            />
        </div>
    );
};

export default Layout;
