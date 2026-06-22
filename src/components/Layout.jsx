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

function NavLinks({ navigation, isActive, onNavigate, premium }) {
    return (
        <>
            {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const showPremiumBadge = item.premiumFeature && !premium;
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onNavigate}
                        className={active ? 'nav-link nav-link-active' : 'nav-link'}
                    >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {showPremiumBadge ? (
                            <Crown className="h-4 w-4 text-amber-500 shrink-0" aria-label="Premium" />
                        ) : null}
                        {item.badge > 0 ? (
                            <span className="inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-brand text-white text-xs font-semibold px-1.5">
                                {item.badge > 99 ? '99+' : item.badge}
                            </span>
                        ) : null}
                    </Link>
                );
            })}
        </>
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

        const scrollY = window.scrollY;
        const { style } = document.body;
        const prev = {
            position: style.position,
            top: style.top,
            left: style.left,
            right: style.right,
            overflow: style.overflow,
            width: style.width,
        };

        style.position = 'fixed';
        style.top = `-${scrollY}px`;
        style.left = '0';
        style.right = '0';
        style.width = '100%';
        style.overflow = 'hidden';

        return () => {
            style.position = prev.position;
            style.top = prev.top;
            style.left = prev.left;
            style.right = prev.right;
            style.width = prev.width;
            style.overflow = prev.overflow;
            window.scrollTo(0, scrollY);
        };
    }, [sidebarOpen]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        setBusinessInfo({ name: '', address: '', email: '', phone: '', website: '', defaultCurrency: 'NGN', taxRate: 10, brandColor: '#0ea5e9', plan: 'free', businessLogo: '', companyLogoUrl: '', companyLogoAvatarUrl: '', companyStampUrl: '', authorizedSignatureUrl: '', paymentAccountName: '', paymentBankName: '', paymentAccountNumber: '', paymentInstructions: '', invoiceTemplateId: 'classic' });
        resetAll();
        window.dispatchEvent(new Event('app-logout'));
        navigate('/auth');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Drafts', href: '/invoices/drafts', icon: PenLine, badge: draftInvoices.length },
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Statements', href: '/statements', icon: FileBarChart, premiumFeature: true },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
        ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }] : []),
    ];

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
            <div className="px-2 mb-8 min-w-0">
                <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
            </div>
            <nav className="flex flex-1 flex-col gap-1">
                <NavLinks
                    navigation={navigation}
                    isActive={isActive}
                    onNavigate={onNavigate}
                    premium={premium}
                />
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className="nav-link text-red-600 hover:bg-red-50 mt-2 w-full"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        Log out
                    </button>
                )}
            </nav>
            <SidebarAccountFooter onNavigate={onNavigate} />
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-slate-200 bg-white">
                <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
                    {sidebarContent()}
                </div>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden overflow-hidden overscroll-none">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm touch-none"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden
                    />
                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white border-r border-slate-200 shadow-card-md">
                        <button
                            type="button"
                            className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 pt-14">
                            {sidebarContent(() => setSidebarOpen(false))}
                        </div>
                    </div>
                </div>
            )}

            <div className="md:pl-64 flex flex-col flex-1 min-h-screen min-w-0">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 py-3 md:hidden">
                    <div className="flex items-center min-w-0">
                        <WaraqahLogo size="sm" iconStyle="solid" showAccent={false} />
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-slate-100"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                <main className="flex-1 min-w-0 overflow-x-hidden">
                    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-w-0">
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
