import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_BUSINESS_TIMEZONE,
    formatPeriodPresetLabel,
    getPeriodComparisonLabel,
    getYearMonthInTimezone,
    isCurrentSummaryPeriod,
    parseMonthInputValue,
    toMonthInputValue,
} from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';

export function usePeriodFilter() {
    const { businessInfo } = useSettings();
    const timezone = businessInfo?.timezone || DEFAULT_BUSINESS_TIMEZONE;
    const currentPeriod = useMemo(() => getYearMonthInTimezone(timezone), [timezone]);
    const [mode, setMode] = useState('all');
    const [period, setPeriod] = useState(currentPeriod);

    useEffect(() => {
        setPeriod(getYearMonthInTimezone(timezone));
    }, [timezone]);

    const setMonthInputValue = useCallback((value) => {
        const parsed = parseMonthInputValue(value);
        if (!parsed) return;
        setPeriod(parsed);
        setMode('month');
    }, []);

    const setPeriodMode = useCallback(
        (nextMode) => {
            if (nextMode === 'month') {
                setPeriod(getYearMonthInTimezone(timezone));
                setMode('month');
                return;
            }
            if (nextMode === 'all' || nextMode === 'today') {
                setMode(nextMode);
            }
        },
        [timezone]
    );

    const isCurrentPeriod =
        mode === 'month' && isCurrentSummaryPeriod(period.year, period.month, timezone);
    const showComparison = mode !== 'all';
    const comparisonLabel = getPeriodComparisonLabel(mode, isCurrentPeriod);

    return {
        mode,
        setPeriodMode,
        year: mode === 'month' ? period.year : undefined,
        month: mode === 'month' ? period.month : undefined,
        summaryYear: mode === 'month' ? period.year : undefined,
        summaryMonth: mode === 'month' ? period.month : undefined,
        monthInputValue: toMonthInputValue(period.year, period.month),
        setMonthInputValue,
        calendarYear: period.year,
        calendarMonth: period.month,
        periodLabel: formatPeriodPresetLabel(mode, period.year, period.month),
        timezone,
        isCurrentPeriod,
        showComparison,
        comparisonLabel,
        queryPeriod: mode,
    };
}
