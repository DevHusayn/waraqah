import { useEffect, useMemo, useRef, useState } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isAfter,
    isBefore,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateValue(value) {
    if (!value) return null;
    try {
        return startOfDay(parseISO(value));
    } catch {
        return null;
    }
}

export default function DatePickerField({
    id,
    value,
    onChange,
    min,
    max,
    disabled = false,
    error = false,
    allowClear = true,
    placeholder = 'Select date',
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    const selected = toDateValue(value);
    const minDate = min ? toDateValue(min) : null;
    const maxDate = max ? toDateValue(max) : null;
    const [viewMonth, setViewMonth] = useState(() => selected || maxDate || minDate || startOfDay(new Date()));

    useEffect(() => {
        if (selected) setViewMonth(selected);
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

    useEffect(() => {
        if (!open) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open]);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const isDayDisabled = (day) => {
        const d = startOfDay(day);
        if (!isSameMonth(day, viewMonth)) return true;
        if (minDate && isBefore(d, minDate)) return true;
        if (maxDate && isAfter(d, maxDate)) return true;
        return false;
    };

    const pickDate = (day) => {
        if (isDayDisabled(day)) return;
        onChange(format(day, 'yyyy-MM-dd'));
        setOpen(false);
    };

    const displayLabel = selected ? format(selected, 'MMM dd, yyyy') : placeholder;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-invalid={error}
                className={`input-field mt-1 flex items-center justify-between gap-2 text-left ${
                    !selected ? 'text-slate-400' : 'text-slate-900'
                } ${error ? 'input-field--error' : ''}`}
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
                    aria-label="Choose date"
                    className="absolute z-30 mt-1.5 w-full min-w-[288px] rounded-xl border border-slate-200 bg-white p-4 shadow-lg animate-fade-in"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setViewMonth((m) => subMonths(m, 1))}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <p className="text-sm font-semibold text-slate-900">
                            {format(viewMonth, 'MMMM yyyy')}
                        </p>
                        <button
                            type="button"
                            onClick={() => setViewMonth((m) => addMonths(m, 1))}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            aria-label="Next month"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="mb-1 grid grid-cols-7 gap-1">
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                className="py-1 text-center text-xs font-medium text-slate-400"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day) => {
                            const isSelected = selected && isSameDay(day, selected);
                            const isToday = isSameDay(day, new Date());
                            const disabledDay = isDayDisabled(day);

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    disabled={disabledDay}
                                    onClick={() => pickDate(day)}
                                    className={`h-9 rounded-lg text-sm transition-colors ${
                                        isSelected
                                            ? 'bg-brand text-white font-semibold shadow-sm'
                                            : isToday && !disabledDay
                                              ? 'border border-brand/40 text-brand font-medium'
                                              : !disabledDay
                                                ? 'text-slate-700 hover:bg-brand-light hover:text-brand'
                                                : 'text-slate-300 opacity-40 cursor-not-allowed'
                                    }`}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        {allowClear ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setOpen(false);
                                }}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Clear
                            </button>
                        ) : (
                            <span />
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                const today = startOfDay(new Date());
                                if (maxDate && isAfter(today, maxDate)) return;
                                if (minDate && isBefore(today, minDate)) return;
                                onChange(format(today, 'yyyy-MM-dd'));
                                setViewMonth(today);
                                setOpen(false);
                            }}
                            className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
