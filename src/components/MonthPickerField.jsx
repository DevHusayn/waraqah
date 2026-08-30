import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO, startOfMonth } from 'date-fns';
import { Calendar, CalendarRange, ChevronDown, ChevronLeft, ChevronRight, Check, SlidersHorizontal } from 'lucide-react';
import DatePickerField from './DatePickerField';

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

const QUICK_PERIOD_PRESETS = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'year', label: 'This year' },
];

function PeriodPresetButton({ label, selected, onClick, icon: Icon, className = '' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-all duration-150 ease-smooth ${
                selected
                    ? 'border-brand/45 bg-brand-subtle text-brand shadow-soft'
                    : 'border-border/70 bg-surface text-foreground-muted hover:border-border hover:bg-surface-muted/80 hover:text-foreground'
            } ${className}`.trim()}
        >
            <span className="flex min-w-0 items-center gap-2">
                {Icon ? <Icon size={15} className="shrink-0 opacity-80" strokeWidth={1.75} aria-hidden /> : null}
                <span className="truncate">{label}</span>
            </span>
            {selected ? (
                <Check size={15} className="shrink-0 text-brand" strokeWidth={2.5} aria-hidden />
            ) : (
                <span className="h-[15px] w-[15px] shrink-0" aria-hidden />
            )}
        </button>
    );
}

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

function PeriodPresetsPanel({
    periodMode = 'month',
    onPickPreset,
    customDraftStartDate,
    customDraftEndDate,
    onCustomDraftRangeChange,
    onCustomApply,
    maxDate,
}) {
    const [customExpanded, setCustomExpanded] = useState(periodMode === 'custom');
    const canApplyCustom =
        customDraftStartDate &&
        customDraftEndDate &&
        customDraftStartDate <= customDraftEndDate;

    useEffect(() => {
        if (periodMode === 'custom') setCustomExpanded(true);
    }, [periodMode]);

    const handlePickPreset = (presetId) => {
        if (presetId === 'custom') {
            setCustomExpanded(true);
            onPickPreset?.('custom');
            return;
        }
        setCustomExpanded(false);
        onPickPreset?.(presetId);
    };

    return (
        <div className="space-y-3">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted/80">
                    Filtered by
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {QUICK_PERIOD_PRESETS.map((preset) => (
                        <PeriodPresetButton
                            key={preset.id}
                            label={preset.label}
                            selected={periodMode === preset.id}
                            onClick={() => handlePickPreset(preset.id)}
                        />
                    ))}
                </div>
                <div className="mt-1.5">
                    <PeriodPresetButton
                        label="All time"
                        selected={periodMode === 'all'}
                        onClick={() => handlePickPreset('all')}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="border-t border-border/50 pt-3">
                <PeriodPresetButton
                    label="Custom range"
                    icon={CalendarRange}
                    selected={periodMode === 'custom'}
                    onClick={() => handlePickPreset('custom')}
                    className="w-full"
                />

                {customExpanded ? (
                    <div className="mt-2 space-y-3 rounded-lg border border-border/60 bg-surface-muted/40 p-3">
                        <div>
                            <label className="label mb-1" htmlFor="period-custom-start">
                                Start date
                            </label>
                            <DatePickerField
                                id="period-custom-start"
                                value={customDraftStartDate}
                                onChange={(next) => onCustomDraftRangeChange?.({ draftStartDate: next })}
                                max={maxDate}
                                allowClear={false}
                            />
                        </div>
                        <div>
                            <label className="label mb-1" htmlFor="period-custom-end">
                                End date
                            </label>
                            <DatePickerField
                                id="period-custom-end"
                                value={customDraftEndDate}
                                onChange={(next) => onCustomDraftRangeChange?.({ draftEndDate: next })}
                                min={customDraftStartDate}
                                max={maxDate}
                                allowClear={false}
                            />
                        </div>
                        <button
                            type="button"
                            disabled={!canApplyCustom}
                            onClick={() => onCustomApply?.()}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            Apply range
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
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
    showPeriodPresets = false,
    periodMode = 'month',
    isThisMonth = false,
    onPickPreset,
    customDraftStartDate,
    customDraftEndDate,
    onCustomDraftRangeChange,
    onCustomApply,
    maxDate,
}) {
    if (showPeriodPresets) {
        return (
            <PeriodPresetsPanel
                periodMode={periodMode}
                onPickPreset={onPickPreset}
                customDraftStartDate={customDraftStartDate}
                customDraftEndDate={customDraftEndDate}
                onCustomDraftRangeChange={onCustomDraftRangeChange}
                onCustomApply={onCustomApply}
                maxDate={maxDate}
            />
        );
    }

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
                    className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
                    aria-label={mode === 'year' ? 'Previous years' : 'Previous year'}
                >
                    <ChevronLeft size={18} />
                </button>

                {mode === 'month' ? (
                    <button
                        type="button"
                        onClick={() => setMode('year')}
                        className="min-w-[5.5rem] rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground hover:border-brand/30 hover:bg-brand-light/40 transition-colors"
                        aria-label="Select year"
                    >
                        {viewYear}
                    </button>
                ) : (
                    <span className="text-sm font-semibold text-foreground tabular-nums">
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
                    className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
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
                                          : 'text-foreground-muted hover:bg-brand-light hover:text-brand'
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
                                          : 'text-foreground-muted hover:bg-brand-light hover:text-brand'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {(
                <div className="mt-3 flex justify-end border-t border-border/50 pt-3">
                    <button
                        type="button"
                        onClick={onThisMonth}
                        className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
                    >
                        This month
                    </button>
                </div>
            )}
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
    triggerClassName = '',
    showPeriodPresets = false,
    periodMode = 'month',
    isThisMonth = false,
    onPeriodModeChange,
    customDraftStartDate,
    customDraftEndDate,
    onCustomDraftRangeChange,
    onCustomApply,
    maxDate,
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
            const width = 304;
            const isMobile = window.innerWidth < 640;
            const alignRight = isMobile && showPeriodPresets;
            const left = alignRight
                ? Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12)
                : Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
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
    }, [open, portal, showPeriodPresets]);

    const formattedLabel = selected ? format(selected, 'MMMM yyyy') : 'Select month';
    const compactLabel = selected ? format(selected, 'MMM yyyy') : 'Select month';
    const presetLabel =
        periodMode === 'today'
            ? 'Today'
            : periodMode === 'week'
              ? 'This week'
              : periodMode === 'month'
                ? 'This month'
                : periodMode === 'year'
                  ? 'This year'
                  : periodMode === 'all'
                    ? 'All time'
                    : periodMode === 'custom'
                      ? 'Custom'
                      : null;
    const triggerText =
        displayLabel ||
        presetLabel ||
        (variant === 'compact' ? compactLabel : formattedLabel);

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
        onPeriodModeChange?.('month');
        onChange(current);
        setViewYear(now.getFullYear());
        setMode('month');
        setOpen(false);
    };

    const pickPreset = (presetId) => {
        if (presetId === 'custom') {
            onPeriodModeChange?.('custom');
            return;
        }
        onPeriodModeChange?.(presetId);
        setOpen(false);
    };

    const handleCustomApply = () => {
        onCustomApply?.();
        setOpen(false);
    };

    const monthGridSelected = periodMode === 'month' || !showPeriodPresets;
    const selectedMonthIndex =
        monthGridSelected && selected ? selected.getMonth() : null;
    const selectedYear = monthGridSelected && selected ? selected.getFullYear() : null;

    const panel = open ? (
        <div
            ref={panelRef}
            role="dialog"
            aria-label={showPeriodPresets ? 'Choose period' : mode === 'year' ? 'Choose year' : 'Choose month'}
            style={portal ? panelStyle ?? undefined : undefined}
            className={`rounded-xl border border-border/80 bg-surface p-3.5 shadow-card-md animate-fade-in ${
                portal ? '' : 'absolute z-50 mt-1.5 right-0 w-[19rem] sm:left-0 sm:right-auto'
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
                showPeriodPresets={showPeriodPresets}
                periodMode={periodMode}
                isThisMonth={isThisMonth}
                onPickPreset={pickPreset}
                customDraftStartDate={customDraftStartDate}
                customDraftEndDate={customDraftEndDate}
                onCustomDraftRangeChange={onCustomDraftRangeChange}
                onCustomApply={handleCustomApply}
                maxDate={maxDate}
            />
        </div>
    ) : null;

    const toggleOpen = () => setOpen((prev) => !prev);
    const compactUsesMobileFilterIcon = isCompact && showPeriodPresets;
    const compactTriggerClassName = `inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-surface-muted/80 disabled:opacity-50 ${triggerClassName}`.trim();
    const mobileFilterIconClassName =
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted shadow-soft transition-colors hover:bg-surface-muted disabled:opacity-50 sm:hidden';

    return (
        <div ref={rootRef} className={`relative ${isInline || isCompact ? 'inline' : ''} ${className}`.trim()}>
            {isCompact ? (
                <div ref={triggerRef} className="inline-flex shrink-0">
                    {compactUsesMobileFilterIcon ? (
                        <button
                            id={id}
                            type="button"
                            disabled={disabled}
                            onClick={toggleOpen}
                            aria-haspopup="dialog"
                            aria-expanded={open}
                            aria-label={triggerAriaLabel || `Filter period, currently ${triggerText}`}
                            className={mobileFilterIconClassName}
                        >
                            <SlidersHorizontal size={18} aria-hidden />
                        </button>
                    ) : null}
                    <button
                        id={compactUsesMobileFilterIcon ? undefined : id}
                        type="button"
                        disabled={disabled}
                        onClick={toggleOpen}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-label={triggerAriaLabel || `Select period, currently ${triggerText}`}
                        className={`${compactTriggerClassName} ${compactUsesMobileFilterIcon ? 'hidden sm:inline-flex' : ''}`.trim()}
                    >
                        {showPeriodPresets ? (
                            <Calendar size={15} className="shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
                        ) : null}
                        <span className="tabular-nums max-w-[11rem] truncate">{triggerText}</span>
                        <ChevronDown
                            size={16}
                            className={`shrink-0 text-foreground-muted/70 transition-transform ${open ? 'rotate-180' : ''}`}
                            aria-hidden
                        />
                    </button>
                </div>
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
                    className="inline-flex items-center gap-0.5 max-w-full align-baseline text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
                >
                    <span className="underline decoration-zinc-400 underline-offset-[3px] hover:decoration-brand truncate">
                        {triggerText}
                    </span>
                    <ChevronDown
                        size={12}
                        className={`shrink-0 text-foreground-muted/70 transition-transform ${open ? 'rotate-180' : ''}`}
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
                        !selected && !presetLabel ? 'text-foreground-muted/70' : 'text-foreground'
                    }`}
                >
                    <span className="flex items-center gap-2 truncate">
                        <Calendar size={18} className="shrink-0 text-brand" />
                        {triggerText}
                    </span>
                    <ChevronDown
                        size={18}
                        className={`shrink-0 text-foreground-muted/70 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            )}

            {portal && panel ? createPortal(panel, document.body) : !portal ? panel : null}
        </div>
    );
}
