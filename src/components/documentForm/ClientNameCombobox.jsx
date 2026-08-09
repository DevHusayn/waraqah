import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterClientsForSuggestion, getClientBusiness } from '@waraqah/shared';
import { inputClass } from '../../utils/formFieldValidation';

function useDebouncedValue(value, delayMs = 200) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}

function getClientSubtitle(client) {
    const business = getClientBusiness(client);
    if (business) return business;
    if (client?.email) return client.email;
    return '';
}

export default function ClientNameCombobox({
    id,
    value,
    clients = [],
    selectedClientId,
    onNameChange,
    onSelectClient,
    error = false,
    placeholder = 'John Doe',
    listId,
}) {
    const generatedListId = useId();
    const suggestionListId = listId || `${generatedListId}-suggestions`;
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebouncedValue(value, 200);

    const suggestions = useMemo(() => {
        if (!open) return [];
        const query = String(debouncedQuery || '').trim();
        if (query.length < 1) return [];
        return filterClientsForSuggestion(clients, query, { limit: 8 });
    }, [clients, debouncedQuery, open]);

    const showList = open && String(value || '').trim().length >= 1;
    const showEmptyHint = showList && suggestions.length === 0;

    const closeList = useCallback(() => {
        setOpen(false);
        setActiveIndex(-1);
    }, []);

    const selectClient = useCallback(
        (client) => {
            if (!client) return;
            onSelectClient(client);
            closeList();
            inputRef.current?.focus();
        },
        [closeList, onSelectClient]
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
            selectClient(suggestions[activeIndex]);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeList();
        }
    };

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
                name="clientName"
                value={value}
                onChange={(event) => {
                    if (!open) setOpen(true);
                    onNameChange(event);
                }}
                onFocus={() => setOpen(true)}
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
                    className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
                >
                    {suggestions.map((client, index) => {
                        const subtitle = getClientSubtitle(client);
                        const isActive = index === activeIndex;
                        const isSelected = selectedClientId && client.id === selectedClientId;
                        return (
                            <button
                                key={client.id}
                                id={`${suggestionListId}-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={isActive || Boolean(isSelected)}
                                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors ${
                                    isActive ? 'bg-brand-subtle' : 'hover:bg-zinc-50'
                                }`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectClient(client)}
                            >
                                <span className="text-sm font-medium text-zinc-950">{client.name}</span>
                                {subtitle ? (
                                    <span className="text-xs text-zinc-500 truncate max-w-full">
                                        {subtitle}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                    {showEmptyHint ? (
                        <div className="px-3 py-2.5 text-xs text-zinc-500 border-t border-zinc-100">
                            New client — saved when you create or issue
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
