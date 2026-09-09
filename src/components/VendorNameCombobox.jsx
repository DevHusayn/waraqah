import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { filterVendorsForSuggestion } from '@waraqah/shared';
import { inputClass } from '../utils/formFieldValidation';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

export default function VendorNameCombobox({
    id,
    value,
    vendors = [],
    onNameChange,
    onSelectVendor,
    error = false,
    placeholder = 'Who was paid?',
    listId,
}) {
    const generatedListId = useId();
    const suggestionListId = listId || `${generatedListId}-vendor-suggestions`;
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [listSuppressed, setListSuppressed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [listStyle, setListStyle] = useState(null);
    const debouncedQuery = useDebouncedValue(value, 200);

    const suggestions = useMemo(() => {
        if (!open) return [];
        const query = String(debouncedQuery || '').trim();
        if (query.length < 1) return [];
        return filterVendorsForSuggestion(vendors, query, { limit: 8 });
    }, [vendors, debouncedQuery, open]);

    const showList = open && !listSuppressed && String(value || '').trim().length >= 1;
    const showEmptyHint = showList && suggestions.length === 0;

    const closeList = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
    }, []);

    const selectVendor = useCallback(
        (name) => {
            if (!name) return;
            setListSuppressed(true);
            closeList();
            onSelectVendor(name);
            inputRef.current?.focus();
        },
        [closeList, onSelectVendor]
    );

    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && showList) {
            event.preventDefault();
            event.stopPropagation();
            closeList();
            return;
        }

        if (!showList || suggestions.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
            return;
        }

        if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectVendor(suggestions[activeIndex]);
        }
    };

    useEffect(() => {
        setListSuppressed(false);
        setOpen(false);
        setActiveIndex(-1);
    }, [id]);

    useEffect(() => {
        setActiveIndex(suggestions.length > 0 ? 0 : -1);
    }, [suggestions]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            const target = event.target;
            if (wrapperRef.current?.contains(target) || listRef.current?.contains(target)) {
                return;
            }
            closeList();
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [closeList]);

    useEffect(() => {
        if (!showList) {
            setListStyle(null);
            return undefined;
        }

        const updatePosition = () => {
            const trigger = inputRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const width = rect.width;
            const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
            setListStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left,
                width,
                zIndex: 10050,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showList, suggestions.length, showEmptyHint]);

    const list = showList && listStyle ? (
        <div
            ref={listRef}
            id={suggestionListId}
            role="listbox"
            style={listStyle}
            className="max-h-72 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg"
        >
            {suggestions.map((name, index) => {
                const isActive = index === activeIndex;
                return (
                    <button
                        key={`${name}-${index}`}
                        id={`${suggestionListId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`flex w-full items-start px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                            isActive ? 'bg-brand-subtle dark:bg-[rgb(var(--brand-ring)/0.22)]' : 'hover:bg-surface-muted'
                        }`}
                        onMouseDown={(event) => {
                            event.preventDefault();
                            selectVendor(name);
                        }}
                    >
                        <span className="text-foreground">{name}</span>
                    </button>
                );
            })}
            {showEmptyHint ? (
                <div className="px-3 py-2.5 text-xs text-foreground-muted border-t border-border/50">
                    New name — saved with this expense
                </div>
            ) : null}
        </div>
    ) : null;

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                id={id}
                type="text"
                name="vendor"
                value={value}
                onChange={(event) => {
                    setListSuppressed(false);
                    if (!open) setOpen(true);
                    onNameChange(event);
                }}
                onFocus={() => {
                    if (!listSuppressed) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={inputClass(Boolean(error))}
                placeholder={placeholder}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showList}
                aria-controls={showList ? suggestionListId : undefined}
                aria-activedescendant={
                    showList && activeIndex >= 0
                        ? `${suggestionListId}-option-${activeIndex}`
                        : undefined
                }
                aria-invalid={Boolean(error)}
                autoComplete="off"
            />
            {list && typeof document !== 'undefined' ? createPortal(list, document.body) : null}
        </div>
    );
}
