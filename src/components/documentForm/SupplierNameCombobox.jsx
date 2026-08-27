import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterSuppliersForSuggestion, getSupplierCompany } from '@waraqah/shared';
import { inputClass } from '../../utils/formFieldValidation';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

function getSupplierSubtitle(supplier) {
    const company = getSupplierCompany(supplier);
    if (company && company !== supplier?.name) return company;
    if (supplier?.email) return supplier.email;
    return '';
}

export default function SupplierNameCombobox({
    id,
    value,
    suppliers = [],
    selectedSupplierId,
    onNameChange,
    onSelectSupplier,
    error = false,
    placeholder = 'Supplier name',
    listId,
}) {
    const generatedListId = useId();
    const suggestionListId = listId || `${generatedListId}-supplier-suggestions`;
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [listSuppressed, setListSuppressed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebouncedValue(value, 200);

    const suggestions = useMemo(() => {
        if (!open) return [];
        const query = String(debouncedQuery || '').trim();
        if (query.length < 1) return [];
        return filterSuppliersForSuggestion(suppliers, query, { limit: 8 });
    }, [suppliers, debouncedQuery, open]);

    const showList = open && !listSuppressed && String(value || '').trim().length >= 1;
    const showEmptyHint = showList && suggestions.length === 0;

    const closeList = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
    }, []);

    const selectSupplier = useCallback(
        (supplier) => {
            if (!supplier) return;
            setListSuppressed(true);
            closeList();
            onSelectSupplier(supplier);
            inputRef.current?.focus();
        },
        [closeList, onSelectSupplier]
    );

    const handleKeyDown = (event) => {
        if (!showList || suggestions.length === 0) {
            if (event.key === 'Escape') closeList();
            return;
        }

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
            selectSupplier(suggestions[activeIndex]);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeList();
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
            if (!wrapperRef.current?.contains(event.target)) {
                closeList();
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [closeList]);

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                id={id}
                type="text"
                name="supplierName"
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

            {showList ? (
                <div
                    id={suggestionListId}
                    role="listbox"
                    className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
                >
                    {suggestions.map((supplier, index) => {
                        const subtitle = getSupplierSubtitle(supplier);
                        const isActive = index === activeIndex;
                        const isSelected = selectedSupplierId && supplier.id === selectedSupplierId;
                        return (
                            <button
                                key={supplier.id}
                                id={`${suggestionListId}-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={isActive || Boolean(isSelected)}
                                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors ${
                                    isActive ? 'bg-brand-subtle dark:bg-[rgb(var(--brand-ring)/0.22)]' : 'hover:bg-surface-muted'
                                }`}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectSupplier(supplier);
                                }}
                            >
                                <span className="text-sm font-medium text-foreground">{supplier.name}</span>
                                {subtitle ? (
                                    <span className="text-xs text-foreground-muted truncate max-w-full">
                                        {subtitle}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                    {showEmptyHint ? (
                        <div className="px-3 py-2.5 text-xs text-foreground-muted border-t border-border/50">
                            New supplier — saved when you place the order
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
