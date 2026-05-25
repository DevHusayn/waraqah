import { useEffect, useRef, useState } from 'react';
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
    'aria-label': ariaLabel,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const selected = options.find((opt) => opt.value === value);

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
        if (!open) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

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
                className={`input-field relative mt-1 flex w-full items-center justify-between gap-2 text-left ${
                    leadingIcon ? 'pl-9' : ''
                } ${!selected ? 'text-slate-400' : 'text-slate-900'} ${
                    error ? 'input-field--error' : ''
                }`}
            >
                {leadingIcon && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {leadingIcon}
                    </span>
                )}
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    aria-labelledby={id}
                    className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in scroll-x-touch"
                >
                    {options.map((opt) => {
                        const active = opt.value === value;
                        return (
                            <li key={opt.value} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                        active
                                            ? 'bg-brand-light text-brand font-semibold'
                                            : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
