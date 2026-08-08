import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_BUSINESS_TIMEZONE,
    formatSummaryPeriodLabel,
    getYearMonthInTimezone,
    isCurrentSummaryPeriod,
    parseMonthInputValue,
    shiftSummaryPeriod,
    toMonthInputValue,
} from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';

export function useSummaryPeriod() {
    const { businessInfo } = useSettings();
    const timezone = businessInfo?.timezone || DEFAULT_BUSINESS_TIMEZONE;
    const currentPeriod = useMemo(() => getYearMonthInTimezone(timezone), [timezone]);
    const [period, setPeriod] = useState(currentPeriod);

    useEffect(() => {
        setPeriod(getYearMonthInTimezone(timezone));
    }, [timezone]);

    const setMonthInputValue = useCallback((value) => {
        const parsed = parseMonthInputValue(value);
        if (parsed) setPeriod(parsed);
    }, []);

    const shiftPeriod = useCallback((deltaMonths) => {
        setPeriod((prev) => shiftSummaryPeriod(prev.year, prev.month, deltaMonths));
    }, []);

    return {
        summaryYear: period.year,
        summaryMonth: period.month,
        timezone,
        monthInputValue: toMonthInputValue(period.year, period.month),
        setMonthInputValue,
        shiftPeriod,
        periodLabel: formatSummaryPeriodLabel(period.year, period.month),
        isCurrentPeriod: isCurrentSummaryPeriod(period.year, period.month, timezone),
    };
}
