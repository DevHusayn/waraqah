import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterProductsForSuggestion } from '@waraqah/shared';
import { inputClass } from '../../utils/formFieldValidation';
import { formatCurrency } from '../../utils/currency';
import { formatStockLabel } from '../../utils/stockWarnings';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

function getProductSubtitle(product, productPriceField, currency) {
    const price = Number(product?.[productPriceField]) || 0;
    const priceLabel = price > 0 ? formatCurrency(price, currency) : null;
    const stockLabel = formatStockLabel(product);
    return [priceLabel, stockLabel].filter(Boolean).join(' · ');
}

export default function LineItemDescriptionCombobox({
    id,
    value,
    products = [],
    productPriceField = 'unitPrice',
    currency,
    onDescriptionChange,
    onSelectProduct,
    error = false,
    shake = false,
    placeholder = 'Service or product',
    listId,
}) {
    const generatedListId = useId();
    const suggestionListId = listId || `${generatedListId}-product-suggestions`;
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [listSuppressed, setListSuppressed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebouncedValue(value, 200);

    const suggestions = useMemo(() => {
        if (!open || products.length === 0) return [];
        const query = String(debouncedQuery || '').trim();
        if (query.length < 1) return [];
        return filterProductsForSuggestion(products, query, { limit: 8 });
    }, [debouncedQuery, open, products]);

    const showList =
        open &&
        !listSuppressed &&
        products.length > 0 &&
        String(value || '').trim().length >= 1;
    const showEmptyHint = showList && suggestions.length === 0;

    const closeList = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
    }, []);

    const selectProduct = useCallback(
        (product) => {
            if (!product) return;
            setListSuppressed(true);
            closeList();
            onSelectProduct(product);
            inputRef.current?.focus();
        },
        [closeList, onSelectProduct]
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
            selectProduct(suggestions[activeIndex]);
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
            <textarea
                ref={inputRef}
                id={id}
                value={value}
                onChange={(event) => {
                    setListSuppressed(false);
                    if (!open) setOpen(true);
                    onDescriptionChange(event.target.value);
                }}
                onFocus={() => {
                    if (!listSuppressed) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={inputClass(Boolean(error), 'resize-none min-h-[72px]', {
                    shake: shake && error,
                })}
                rows={2}
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
                    {suggestions.map((product, index) => {
                        const subtitle = getProductSubtitle(product, productPriceField, currency);
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={product.id}
                                id={`${suggestionListId}-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors ${
                                    isActive ? 'bg-brand-subtle dark:bg-[rgb(var(--brand-ring)/0.22)]' : 'hover:bg-surface-muted'
                                }`}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    selectProduct(product);
                                }}
                            >
                                <span className="text-sm font-medium text-foreground">{product.name}</span>
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
                            No saved product match — continue with a custom description
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
