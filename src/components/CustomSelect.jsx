import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef(null);
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        if (searchable) {
            requestAnimationFrame(() => searchRef.current?.focus());
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, searchable]);

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
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

            {open && (
                <div className={`absolute z-30 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-card-md animate-fade-in ${menuClassName || 'w-full'}`}>
                    {searchable ? (
                        <div className="border-b border-border p-2">
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
                        className="max-h-80 overflow-y-auto"
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
            )}
        </div>
    );
}
