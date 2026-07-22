import { useEffect, useMemo, useRef, useState } from 'react';
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

function isYearDisabled(year, max, min) {
    const maxParsed = max ? parseMonthValue(max) : null;
    const minParsed = min ? parseMonthValue(min) : null;
    if (maxParsed && year > maxParsed.getFullYear()) return true;
    if (minParsed && year < minParsed.getFullYear()) return true;
    return false;
}

function buildYearOptions(centerYear, max, min) {
    const maxYear = max ? parseMonthValue(max)?.getFullYear() : centerYear + 6;
    const minYear = min ? parseMonthValue(min)?.getFullYear() : centerYear - 11;
    const end = Math.min(maxYear ?? centerYear + 6, centerYear + 6);
    const start = Math.max(minYear ?? centerYear - 11, end - 11);
    const years = [];
    for (let y = start; y <= end; y += 1) years.push(y);
    return years;
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
    const [mode, setMode] = useState('month'); // 'month' | 'year'
    const rootRef = useRef(null);

    const selected = parseMonthValue(value);
    const [viewYear, setViewYear] = useState(() =>
        selected ? selected.getFullYear() : new Date().getFullYear()
    );

    useEffect(() => {
        if (selected) setViewYear(selected.getFullYear());
    }, [value]);

    useEffect(() => {
        if (!open) setMode('month');
    }, [open]);

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

    const yearOptions = useMemo(
        () => buildYearOptions(viewYear, max, min),
        [viewYear, max, min]
    );

    const pickMonth = (monthIndex) => {
        if (isMonthDisabled(viewYear, monthIndex, max, min)) return;
        const next = format(new Date(viewYear, monthIndex, 1), 'yyyy-MM');
        onChange(next);
        setOpen(false);
    };

    const pickYear = (year) => {
        if (isYearDisabled(year, max, min)) return;
        setViewYear(year);
        setMode('month');
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
                    !selected ? 'text-zinc-400' : 'text-zinc-900'
                }`}
            >
                <span className="flex items-center gap-2 truncate">
                    <Calendar size={18} className="shrink-0 text-brand" />
                    {displayLabel}
                </span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={mode === 'year' ? 'Choose year' : 'Choose month'}
                    className="absolute z-30 mt-1.5 w-full min-w-[288px] max-w-xs rounded-xl border border-zinc-200 bg-white p-4 shadow-card animate-fade-in"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() =>
                                mode === 'year'
                                    ? setViewYear((y) => y - 12)
                                    : setViewYear((y) => y - 1)
                            }
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                            aria-label={mode === 'year' ? 'Previous years' : 'Previous year'}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode((m) => (m === 'year' ? 'month' : 'year'))}
                            className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
                            aria-label={mode === 'year' ? 'Show months' : 'Select year'}
                        >
                            {mode === 'year' ? `${yearOptions[0]} – ${yearOptions[yearOptions.length - 1]}` : viewYear}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                mode === 'year'
                                    ? setViewYear((y) => y + 12)
                                    : setViewYear((y) => y + 1)
                            }
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                            aria-label={mode === 'year' ? 'Next years' : 'Next year'}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {mode === 'year' ? (
                        <div className="grid grid-cols-3 gap-2">
                            {yearOptions.map((year) => {
                                const yearDisabled = isYearDisabled(year, max, min);
                                const isSelected = selectedYear === year;

                                return (
                                    <button
                                        key={year}
                                        type="button"
                                        disabled={yearDisabled}
                                        onClick={() => pickYear(year)}
                                        className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                            isSelected
                                                ? 'bg-brand text-white shadow-sm'
                                                : yearDisabled
                                                  ? 'text-zinc-300 cursor-not-allowed'
                                                  : 'text-zinc-700 hover:bg-brand-light hover:text-brand'
                                        }`}
                                    >
                                        {year}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
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
                                                  ? 'text-zinc-300 cursor-not-allowed'
                                                  : 'text-zinc-700 hover:bg-brand-light hover:text-brand'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-3 flex justify-end border-t border-zinc-100 pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                const current = format(startOfMonth(now), 'yyyy-MM');
                                onChange(current);
                                setViewYear(now.getFullYear());
                                setMode('month');
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
