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
    const navLinkClass = 'text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors';

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
                    scrolled
                        ? 'bg-white/90 backdrop-blur-md border-b border-zinc-200/80'
                        : 'bg-transparent'
                }`}
            >
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <a href="#top" className="flex items-center min-w-0">
                        <WaraqahLogo size="md" iconStyle="solid" />
                    </a>

                    <nav className="hidden md:flex items-center gap-6">
                        {NAV_LINKS.map((item) => (
                            <a key={item.href} href={item.href} className={navLinkClass}>
                                {item.label}
                            </a>
                        ))}
                        <Link to={AUTH_LOGIN_PATH} className={navLinkClass}>
                            Log in
                        </Link>
                        <Link to={AUTH_REGISTER_PATH} className="btn-primary text-sm">
                            Get started
                        </Link>
                    </nav>

                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {open && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div
                        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] landing-menu-backdrop"
                        onClick={closeMenu}
                        aria-hidden
                    />
                    <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white border-l border-zinc-200/80 landing-menu-panel">
                        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                            <WaraqahLogo size="sm" iconStyle="solid" />
                            <button
                                type="button"
                                onClick={closeMenu}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav className="flex flex-1 flex-col gap-0.5 p-3">
                            {NAV_LINKS.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                >
                                    {item.label}
                                </a>
                            ))}
                            <Link
                                to={AUTH_LOGIN_PATH}
                                onClick={closeMenu}
                                className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                                Log in
                            </Link>
                        </nav>
                        <div className="border-t border-zinc-100 p-3">
                            <Link to={AUTH_REGISTER_PATH} onClick={closeMenu} className="btn-primary w-full">
                                Get started
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
