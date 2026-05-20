import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import WaraqahLogo from './WaraqahLogo';
import { AUTH_LOGIN_PATH, AUTH_REGISTER_PATH } from '../constants/authRoutes';

const NAV_LINKS = [
    { label: 'Home', href: '#top' },
    { label: 'FAQ', href: '#faq' },
];

export default function LandingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const closeMenu = () => setOpen(false);
    const navLinkClass = 'text-sm font-medium text-slate-600 hover:text-brand transition-colors';

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200/80 shadow-sm'
                        : 'bg-transparent'
                }`}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <a href="#top" className="flex items-center min-w-0">
                        <WaraqahLogo size="md" iconStyle="solid" />
                    </a>

                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((item) => (
                            <a key={item.href} href={item.href} className={navLinkClass}>
                                {item.label}
                            </a>
                        ))}
                        <Link to={AUTH_LOGIN_PATH} className={navLinkClass}>
                            Log in
                        </Link>
                        <Link to={AUTH_REGISTER_PATH} className="btn-primary text-sm py-2.5 px-5 shadow-md shadow-brand/20">
                            Get started
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center rounded-xl p-2.5 text-slate-700 hover:bg-slate-100"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </header>

            {open && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm landing-menu-backdrop"
                        onClick={closeMenu}
                        aria-hidden
                    />
                    <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-2xl landing-menu-panel">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <WaraqahLogo size="sm" iconStyle="solid" />
                            <button
                                type="button"
                                onClick={closeMenu}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex flex-1 flex-col gap-1 p-4">
                            {NAV_LINKS.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-brand-light hover:text-brand"
                                >
                                    {item.label}
                                </a>
                            ))}
                            <Link
                                to={AUTH_LOGIN_PATH}
                                onClick={closeMenu}
                                className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Log in
                            </Link>
                        </nav>
                        <div className="border-t border-slate-100 p-4">
                            <Link to={AUTH_REGISTER_PATH} onClick={closeMenu} className="btn-primary w-full py-3">
                                Get started
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
