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
                className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
                    scrolled || open
                        ? 'bg-white border-b border-zinc-200/80'
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
                        onClick={() => setOpen((isOpen) => !isOpen)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            <div
                className={`fixed inset-x-0 top-14 bottom-0 z-30 bg-zinc-950/40 md:hidden transition-opacity duration-200 ease-out ${
                    open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeMenu}
                aria-hidden={!open}
            />

            <div
                className={`fixed inset-x-0 top-14 z-40 md:hidden transition-[opacity,transform] duration-200 ease-out ${
                    open
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'pointer-events-none opacity-0 -translate-y-1'
                }`}
                aria-hidden={!open}
            >
                <div className="border-b border-zinc-200/50 bg-white shadow-sm max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain px-4 py-4">
                    <nav className="flex flex-col gap-0.5">
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
                    <div className="mt-3 pt-3 border-t border-zinc-200/50">
                        <Link to={AUTH_REGISTER_PATH} onClick={closeMenu} className="btn-primary w-full">
                            Get started
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
