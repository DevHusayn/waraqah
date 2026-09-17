import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const MENU_GAP = 4;
const MENU_MAX_HEIGHT = 320;
const MENU_FLIP_THRESHOLD = 180;

function getMenuStyle(triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < MENU_FLIP_THRESHOLD && spaceAbove > spaceBelow;
    const available = Math.max(openUp ? spaceAbove : spaceBelow, 120);
    const maxHeight = Math.min(MENU_MAX_HEIGHT, available);
    const width = rect.width;
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));

    return {
        position: 'fixed',
        left,
        width,
        minWidth: width,
        maxHeight,
        zIndex: 10050,
        ...(openUp
            ? { bottom: window.innerHeight - rect.top + MENU_GAP }
            : { top: rect.bottom + MENU_GAP }),
    };
}

export default function CustomSelect({
    id,
    value,
    onChange,
    options = [],
    placeholder = 'Choose an option',
    error = false,
    disabled = false,
    className = '',
    leadingIcon = null,
    searchable = false,
    searchPlaceholder = 'Search…',
    menuClassName = '',
    listClassName = '',
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [menuStyle, setMenuStyle] = useState(null);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);

    const selected = options.find((opt) => !opt.header && opt.value === value);
    const filtered = useMemo(() => {
        if (!searchable || !query.trim()) return options;
        const needle = query.trim().toLowerCase();
        return options.filter((opt) => {
            if (opt.header) return false;
            const haystack = `${opt.searchText || ''} ${opt.listLabel || ''} ${opt.label || ''} ${opt.value || ''}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [options, query, searchable]);

    useLayoutEffect(() => {
        if (!open) {
            setMenuStyle(null);
            return undefined;
        }

        const updatePosition = () => {
            if (!triggerRef.current) return;
            setMenuStyle(getMenuStyle(triggerRef.current));
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, filtered.length]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            return undefined;
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

    useEffect(() => {
        if (open && menuStyle && searchable) {
            searchRef.current?.focus();
        }
    }, [open, menuStyle, searchable]);

    const openUp = Boolean(menuStyle?.bottom);
    const menu =
        open && menuStyle ? (
            <div
                ref={menuRef}
                style={menuStyle}
                className={`flex overflow-hidden rounded-md border border-border bg-surface shadow-card-md animate-fade-in ${
                    openUp ? 'flex-col-reverse' : 'flex-col'
                } ${menuClassName || ''}`}
            >
                {searchable ? (
                    <div className={`shrink-0 p-2 ${openUp ? 'border-t' : 'border-b'} border-border`}>
                        <input
                            ref={searchRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="input-field h-9 py-0"
                            aria-label={searchPlaceholder}
                        />
                    </div>
                ) : null}
                <ul
                    role="listbox"
                    aria-labelledby={id}
                    className={`min-h-0 flex-1 overflow-y-auto ${listClassName}`.trim()}
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-foreground-muted">No matches</li>
                    ) : (
                        filtered.map((opt, index) => {
                            if (opt.header) {
                                return (
                                    <li
                                        key={`header-${opt.label}-${index}`}
                                        role="presentation"
                                        className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted/70"
                                    >
                                        {opt.label}
                                    </li>
                                );
                            }
                            const active = opt.value === value;
                            return (
                                <li key={opt.value} role="option" aria-selected={active}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                            active
                                                ? 'bg-zinc-100 text-foreground font-medium dark:bg-[rgb(var(--brand-ring)/0.22)] dark:text-foreground'
                                                : 'text-foreground-muted hover:bg-surface-muted'
                                        }`}
                                    >
                                        {opt.listLabel || opt.label}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        ) : null;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                ref={triggerRef}
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                aria-invalid={error}
                className={`input-field relative flex h-[38px] w-full items-center justify-between gap-2 py-0 text-left ${
                    leadingIcon ? 'pl-9' : ''
                } ${!selected ? 'text-foreground-muted/70' : 'text-foreground'} ${
                    error ? 'input-field--error' : ''
                }`}
            >
                {leadingIcon && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted/70">
                        {leadingIcon}
                    </span>
                )}
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-foreground-muted/70 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {menu && typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
        </div>
    );
}
