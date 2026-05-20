import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings as SettingsIcon, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import ConfirmModal from './ConfirmModal';
import { APP_TAGLINE } from '../constants/brand';
import WaraqahLogo from './WaraqahLogo';
import SidebarAccountFooter from './SidebarAccountFooter';

function NavLinks({ navigation, isActive, onNavigate }) {
    return (
        <>
            {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onNavigate}
                        className={active ? 'nav-link nav-link-active' : 'nav-link'}
                    >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {item.name}
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
    const { resetAll } = useInvoice();
    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        setBusinessInfo({ name: '', address: '', email: '', phone: '', website: '', defaultCurrency: 'NGN', taxRate: 10, brandColor: '#0ea5e9', plan: 'free', businessLogo: '' });
        resetAll();
        window.dispatchEvent(new Event('app-logout'));
        navigate('/auth');
    };

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
        ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: LayoutDashboard }] : []),
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const businessName = businessInfo.name?.trim();

    const sidebarContent = (onNavigate) => (
        <>
            <div className="px-2 mb-8 min-w-0">
                <WaraqahLogo size="sm" iconStyle="soft" />
                <p className="text-xs text-slate-500 truncate mt-2 pl-0.5">{businessName || APP_TAGLINE}</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
                <NavLinks navigation={navigation} isActive={isActive} onNavigate={onNavigate} />
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
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden />
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

            <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 py-3 md:hidden">
                    <div className="flex items-center min-w-0">
                        <WaraqahLogo size="sm" iconStyle="soft" />
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

                <main className="flex-1">
                    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            <ConfirmModal
                open={showLogoutModal}
                onConfirm={() => { setShowLogoutModal(false); handleLogout(); }}
                onCancel={() => setShowLogoutModal(false)}
                message="Are you sure you want to log out?"
            />
        </div>
    );
};

export default Layout;
