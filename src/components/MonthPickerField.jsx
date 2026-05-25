import { useEffect, useRef, useState } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
    { value: 0, label: 'Jan' },
    { value: 1, label: 'Feb' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' },
    { value: 4, label: 'May' },
    { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' },
    { value: 7, label: 'Aug' },
    { value: 8, label: 'Sep' },
    { value: 9, label: 'Oct' },
    { value: 10, label: 'Nov' },
    { value: 11, label: 'Dec' },
];

function parseMonthValue(value) {
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
    try {
        return parseISO(`${value}-01`);
    } catch {
        return null;
    }
}

function isMonthDisabled(year, monthIndex, max, min) {
    const maxParsed = max ? parseMonthValue(max) : null;
    const minParsed = min ? parseMonthValue(min) : null;
    const candidate = startOfMonth(new Date(year, monthIndex, 1));
    if (maxParsed && candidate > maxParsed) return true;
    if (minParsed && candidate < minParsed) return true;
    return false;
}

export default function MonthPickerField({
    id,
    value,
    onChange,
    max,
    min,
    disabled = false,
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const selected = parseMonthValue(value);
    const [viewYear, setViewYear] = useState(() =>
        selected ? selected.getFullYear() : new Date().getFullYear()
    );

    useEffect(() => {
        if (selected) setViewYear(selected.getFullYear());
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayLabel = selected ? format(selected, 'MMMM yyyy') : 'Select month';

    const pickMonth = (monthIndex) => {
        if (isMonthDisabled(viewYear, monthIndex, max, min)) return;
        const next = format(new Date(viewYear, monthIndex, 1), 'yyyy-MM');
        onChange(next);
        setOpen(false);
    };

    const selectedMonthIndex = selected ? selected.getMonth() : null;
    const selectedYear = selected ? selected.getFullYear() : null;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`input-field mt-1 flex items-center justify-between gap-2 text-left max-w-xs ${
                    !selected ? 'text-slate-400' : 'text-slate-900'
                }`}
            >
                <span className="flex items-center gap-2 truncate">
                    <Calendar size={18} className="shrink-0 text-brand" />
                    {displayLabel}
                </span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Choose month"
                    className="absolute z-30 mt-1.5 w-full min-w-[288px] max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-lg animate-fade-in"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setViewYear((y) => y - 1)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            aria-label="Previous year"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold text-slate-900">{viewYear}</p>
                        <button
                            type="button"
                            onClick={() => setViewYear((y) => y + 1)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            aria-label="Next year"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {MONTHS.map(({ value: monthIndex, label }) => {
                            const isSelected =
                                selectedMonthIndex === monthIndex && selectedYear === viewYear;
                            const monthDisabled = isMonthDisabled(viewYear, monthIndex, max, min);

                            return (
                                <button
                                    key={monthIndex}
                                    type="button"
                                    disabled={monthDisabled}
                                    onClick={() => pickMonth(monthIndex)}
                                    className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-brand text-white shadow-sm'
                                            : monthDisabled
                                              ? 'text-slate-300 cursor-not-allowed'
                                              : 'text-slate-700 hover:bg-brand-light hover:text-brand'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                const current = format(startOfMonth(now), 'yyyy-MM');
                                onChange(current);
                                setViewYear(now.getFullYear());
                                setOpen(false);
                            }}
                            className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                        >
                            This month
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
