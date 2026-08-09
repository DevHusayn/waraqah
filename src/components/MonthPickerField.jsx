import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

function MonthPickerPanel({
    mode,
    setMode,
    viewYear,
    setViewYear,
    yearOptions,
    selectedMonthIndex,
    selectedYear,
    max,
    min,
    onPickMonth,
    onPickYear,
    onThisMonth,
}) {
    return (
        <>
            <div className="mb-3 flex items-center justify-between gap-2">
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

                {mode === 'month' ? (
                    <button
                        type="button"
                        onClick={() => setMode('year')}
                        className="min-w-[5.5rem] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:border-brand/30 hover:bg-brand-light/40 transition-colors"
                        aria-label="Select year"
                    >
                        {viewYear}
                    </button>
                ) : (
                    <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                        {yearOptions[0]} – {yearOptions[yearOptions.length - 1]}
                    </span>
                )}

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
                <div className="grid grid-cols-3 gap-1.5">
                    {yearOptions.map((year) => {
                        const yearDisabled = isYearDisabled(year, max, min);
                        const isSelected = selectedYear === year;

                        return (
                            <button
                                key={year}
                                type="button"
                                disabled={yearDisabled}
                                onClick={() => onPickYear(year)}
                                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
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
                <div className="grid grid-cols-4 gap-1.5">
                    {MONTHS.map(({ value: monthIndex, label }) => {
                        const isSelected =
                            selectedMonthIndex === monthIndex && selectedYear === viewYear;
                        const monthDisabled = isMonthDisabled(viewYear, monthIndex, max, min);

                        return (
                            <button
                                key={monthIndex}
                                type="button"
                                disabled={monthDisabled}
                                onClick={() => onPickMonth(monthIndex)}
                                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
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
                    onClick={onThisMonth}
                    className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                >
                    This month
                </button>
            </div>
        </>
    );
}

export default function MonthPickerField({
    id,
    value,
    onChange,
    max,
    min,
    disabled = false,
    className = '',
    variant = 'field',
    displayLabel,
    portal = false,
    triggerAriaLabel,
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState('month');
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const [panelStyle, setPanelStyle] = useState(null);

    const selected = parseMonthValue(value);
    const [viewYear, setViewYear] = useState(() =>
        selected ? selected.getFullYear() : new Date().getFullYear()
    );

    const isInline = variant === 'inline';
    const isCompact = variant === 'compact';

    useEffect(() => {
        if (selected) setViewYear(selected.getFullYear());
    }, [value]);

    useEffect(() => {
        if (!open) setMode('month');
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;

        const handleClickOutside = (event) => {
            const target = event.target;
            if (rootRef.current?.contains(target)) return;
            if (panelRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    useEffect(() => {
        if (!open || !portal) {
            setPanelStyle(null);
            return undefined;
        }

        const updatePosition = () => {
            const trigger = triggerRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            const width = 288;
            const left = Math.min(
                Math.max(12, rect.left),
                window.innerWidth - width - 12
            );
            setPanelStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left,
                width,
                zIndex: 60,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, portal]);

    const formattedLabel = selected ? format(selected, 'MMMM yyyy') : 'Select month';
    const compactLabel = selected ? format(selected, 'MMM yyyy') : 'Select month';
    const triggerText = displayLabel || (variant === 'compact' ? compactLabel : formattedLabel);

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

    const goToThisMonth = () => {
        const now = new Date();
        const current = format(startOfMonth(now), 'yyyy-MM');
        onChange(current);
        setViewYear(now.getFullYear());
        setMode('month');
        setOpen(false);
    };

    const selectedMonthIndex = selected ? selected.getMonth() : null;
    const selectedYear = selected ? selected.getFullYear() : null;

    const panel = open ? (
        <div
            ref={panelRef}
            role="dialog"
            aria-label={mode === 'year' ? 'Choose year' : 'Choose month'}
            style={portal ? panelStyle ?? undefined : undefined}
            className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-card animate-fade-in ${
                portal ? '' : 'absolute z-50 mt-1.5 left-0 w-[18rem]'
            }`}
        >
            <MonthPickerPanel
                mode={mode}
                setMode={setMode}
                viewYear={viewYear}
                setViewYear={setViewYear}
                yearOptions={yearOptions}
                selectedMonthIndex={selectedMonthIndex}
                selectedYear={selectedYear}
                max={max}
                min={min}
                onPickMonth={pickMonth}
                onPickYear={pickYear}
                onThisMonth={goToThisMonth}
            />
        </div>
    ) : null;

    return (
        <div ref={rootRef} className={`relative ${isInline || isCompact ? 'inline' : ''} ${className}`.trim()}>
            {isCompact ? (
                <button
                    ref={triggerRef}
                    id={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={triggerAriaLabel || `Select month, currently ${triggerText}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-soft transition-colors hover:bg-zinc-50 disabled:opacity-50"
                >
                    <span className="tabular-nums">{triggerText}</span>
                    <ChevronDown
                        size={16}
                        className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                    />
                </button>
            ) : isInline ? (
                <button
                    ref={triggerRef}
                    id={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((prev) => !prev)}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={triggerAriaLabel || `Select month, currently ${triggerText}`}
                    className="inline-flex items-center gap-0.5 max-w-full align-baseline text-zinc-600 hover:text-zinc-800 transition-colors disabled:opacity-50"
                >
                    <span className="underline decoration-zinc-400 underline-offset-[3px] hover:decoration-brand truncate">
                        {triggerText}
                    </span>
                    <ChevronDown
                        size={12}
                        className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                    />
                </button>
            ) : (
                <button
                    ref={triggerRef}
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
                        {triggerText}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            )}

            {portal && panel ? createPortal(panel, document.body) : !portal ? panel : null}
        </div>
    );
}
