import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { lockBodyScroll } from '../utils/bodyScrollLock';

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const onChange = () => setIsMobile(media.matches);
        onChange();
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [breakpoint]);

    return isMobile;
}

function MenuItemButton({ item, onSelect, variant = 'default' }) {
    const Icon = item.icon;
    const isDestructive = item.destructive;
    const base =
        variant === 'sheet'
            ? 'w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium transition-colors disabled:opacity-50'
            : 'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium rounded-md transition-colors disabled:opacity-50';

    const tone = isDestructive
        ? 'text-red-600 hover:bg-red-50 active:bg-red-100/80'
        : 'text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100/80';

    return (
        <button
            type="button"
            role="menuitem"
            className={`${base} ${tone}`}
            onClick={() => {
                if (item.disabled) return;
                onSelect(item);
            }}
            disabled={item.disabled}
        >
            {Icon ? <Icon size={variant === 'sheet' ? 18 : 16} aria-hidden className="shrink-0" /> : null}
            <span>{item.label}</span>
        </button>
    );
}

function MenuItems({ items, onSelect, variant }) {
    const visible = items.filter((item) => !item.hidden);
    const normal = visible.filter((item) => !item.destructive);
    const destructive = visible.filter((item) => item.destructive);

    if (visible.length === 0) return null;

    return (
        <>
            {normal.map((item) => (
                <MenuItemButton key={item.id} item={item} onSelect={onSelect} variant={variant} />
            ))}
            {destructive.length > 0 && normal.length > 0 ? (
                <div
                    className={variant === 'sheet' ? 'my-1 border-t border-zinc-200' : 'my-1 border-t border-zinc-100'}
                    role="separator"
                />
            ) : null}
            {destructive.map((item) => (
                <MenuItemButton key={item.id} item={item} onSelect={onSelect} variant={variant} />
            ))}
        </>
    );
}

export default function ActionMenu({
    items = [],
    disabled = false,
    ariaLabel = 'More actions',
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const menuId = useId();
    const containerRef = useRef(null);
    const visibleCount = items.filter((item) => !item.hidden).length;

    const close = useCallback(() => setOpen(false), []);

    const handleSelect = useCallback(
        (item) => {
            close();
            item.onClick?.();
        },
        [close]
    );

    useEffect(() => {
        if (!open) return undefined;
        return lockBodyScroll();
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') close();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, close]);

    useEffect(() => {
        if (!open || isMobile) return undefined;

        const onPointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                close();
            }
        };

        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, isMobile, close]);

    if (visibleCount === 0) return null;

    return (
        <div ref={containerRef} className={`relative shrink-0 ${className}`}>
            <button
                type="button"
                className="btn-secondary h-full min-h-[40px] px-3 gap-1.5"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => setOpen((value) => !value)}
            >
                <MoreHorizontal size={18} aria-hidden />
                <span className="sr-only sm:not-sr-only sm:inline">More</span>
            </button>

            {open && isMobile ? (
                <div className="fixed inset-0 z-[9998]" role="presentation">
                    <button
                        type="button"
                        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px] animate-fade-in"
                        aria-label="Close menu"
                        onClick={close}
                    />
                    <div
                        id={menuId}
                        role="menu"
                        aria-label={ariaLabel}
                        className="absolute inset-x-0 bottom-0 z-[9999] rounded-t-2xl border border-zinc-200/60 bg-white shadow-lift animate-sheet-up safe-area-pb"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="h-1 w-10 rounded-full bg-zinc-200" aria-hidden />
                        </div>
                        <div className="px-2 pb-3">
                            <MenuItems items={items} onSelect={handleSelect} variant="sheet" />
                        </div>
                    </div>
                </div>
            ) : null}

            {open && !isMobile ? (
                <div
                    id={menuId}
                    role="menu"
                    aria-label={ariaLabel}
                    className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[220px] rounded-lg border border-zinc-200/80 bg-white p-1 shadow-lift animate-fade-in"
                >
                    <MenuItems items={items} onSelect={handleSelect} variant="default" />
                </div>
            ) : null}
        </div>
    );
}
