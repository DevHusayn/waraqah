import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from '../utils/formFieldValidation';

function normalizeQuery(value) {
    return String(value || '').trim().toLowerCase();
}

function filterOptions(options, query) {
    const normalized = normalizeQuery(query);
    if (!normalized) return options;
    return options.filter((opt) => normalizeQuery(opt.label).includes(normalized));
}

export default function SearchableSelect({
    id,
    value,
    onChange,
    options = [],
    placeholder = 'Choose an option',
    searchPlaceholder = 'Type to search…',
    error = false,
    disabled = false,
    className = '',
    leadingIcon = null,
    emptyMessage = 'No matches found',
    'aria-label': ariaLabel,
}) {
    const rootRef = useRef(null);
    const searchRef = useRef(null);
    const ignoreNextToggleRef = useRef(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);

    const selected = options.find((opt) => opt.value === value);
    const filteredOptions = useMemo(() => filterOptions(options, query), [options, query]);

    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
    }, []);

    const selectOption = useCallback(
        (optionValue) => {
            ignoreNextToggleRef.current = true;
            close();
            onChange(optionValue);
        },
        [close, onChange]
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [close]);

    useEffect(() => {
        if (!open) return undefined;
        const handleEscape = (event) => {
            if (event.key === 'Escape') close();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [close, open]);

    useEffect(() => {
        if (open) {
            searchRef.current?.focus();
        }
    }, [open]);

    useEffect(() => {
        setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
    }, [filteredOptions]);

    const handleToggle = () => {
        if (disabled) return;
        if (ignoreNextToggleRef.current) {
            ignoreNextToggleRef.current = false;
            return;
        }
        setOpen((prev) => !prev);
    };

    const handleTriggerKeyDown = (event) => {
        if (disabled || open) return;

        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
            return;
        }

        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            setOpen(true);
            setQuery(event.key);
        }
    };

    const handleSearchKeyDown = (event) => {
        if (filteredOptions.length === 0) {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
            return;
        }

        if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectOption(filteredOptions[activeIndex].value);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                onKeyDown={handleTriggerKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                aria-invalid={error}
                className={`input-field relative flex w-full items-center justify-between gap-2 text-left ${
                    leadingIcon ? 'pl-9' : ''
                } ${!selected ? 'text-foreground-muted/70' : 'text-foreground'} ${
                    error ? 'input-field--error' : ''
                }`}
            >
                {leadingIcon ? (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted/70">
                        {leadingIcon}
                    </span>
                ) : null}
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-foreground-muted/70 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open ? (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-card-md animate-fade-in">
                    <div className="border-b border-border/50 p-2">
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder={searchPlaceholder}
                            className={inputClass(false, 'text-sm py-2')}
                            aria-label={`${ariaLabel || placeholder} search`}
                            autoComplete="off"
                        />
                    </div>
                    <ul
                        role="listbox"
                        aria-labelledby={id}
                        className="max-h-60 overflow-y-auto scroll-x-touch"
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, index) => {
                                const active = opt.value === value;
                                const highlighted = index === activeIndex;
                                return (
                                    <li key={opt.value} role="option" aria-selected={active}>
                                        <button
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => selectOption(opt.value)}
                                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                                highlighted
                                                    ? 'bg-brand-subtle text-foreground dark:bg-[rgb(var(--brand-ring)/0.22)] dark:text-foreground'
                                                    : active
                                                      ? 'bg-surface-muted text-foreground font-medium'
                                                      : 'text-foreground-muted hover:bg-surface-muted'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-3 py-2.5 text-sm text-foreground-muted">{emptyMessage}</li>
                        )}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
