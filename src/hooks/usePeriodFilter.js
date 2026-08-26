import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
    DEFAULT_BUSINESS_TIMEZONE,
    buildPeriodQueryParams,
    formatPeriodPresetLabel,
    getPeriodComparisonLabel,
    isPeriodQueryReady,
} from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';

function createCustomRange() {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { startDate: today, endDate: today, draftStartDate: today, draftEndDate: today };
}

export function usePeriodFilter() {
    const { businessInfo } = useSettings();
    const timezone = businessInfo?.timezone || DEFAULT_BUSINESS_TIMEZONE;
    const [mode, setMode] = useState('month');
    const [customRange, setCustomRange] = useState(createCustomRange);
    const [appliedCustomRange, setAppliedCustomRange] = useState(createCustomRange);

    const activeStartDate = mode === 'custom' ? appliedCustomRange.startDate : undefined;
    const activeEndDate = mode === 'custom' ? appliedCustomRange.endDate : undefined;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const queryParams = useMemo(
        () =>
            buildPeriodQueryParams({
                mode,
                startDate: activeStartDate,
                endDate: activeEndDate,
            }),
        [mode, activeStartDate, activeEndDate]
    );

    const periodLabel = useMemo(
        () =>
            formatPeriodPresetLabel(mode, null, null, 'en-US', {
                timeZone: timezone,
                startDate: activeStartDate,
                endDate: activeEndDate,
            }),
        [mode, timezone, activeStartDate, activeEndDate]
    );

    const isCurrentPeriod = mode !== 'custom' && mode !== 'all';
    const comparisonLabel = getPeriodComparisonLabel(mode, isCurrentPeriod);

    const setPeriodMode = useCallback((nextMode) => {
        setMode(nextMode);
        if (nextMode === 'custom') {
            setCustomRange((prev) => ({
                ...prev,
                draftStartDate: prev.draftStartDate || prev.startDate,
                draftEndDate: prev.draftEndDate || prev.endDate,
            }));
        }
    }, []);

    const setCustomDraftRange = useCallback((partial) => {
        setCustomRange((prev) => ({ ...prev, ...partial }));
    }, []);

    const applyCustomRange = useCallback(() => {
        const { draftStartDate, draftEndDate } = customRange;
        if (!draftStartDate || !draftEndDate || draftStartDate > draftEndDate) return;
        setAppliedCustomRange({
            startDate: draftStartDate,
            endDate: draftEndDate,
            draftStartDate,
            draftEndDate,
        });
        setMode('custom');
    }, [customRange]);

    return {
        mode,
        setPeriodMode,
        periodLabel,
        timezone,
        isCurrentPeriod,
        showComparison: mode !== 'custom' && mode !== 'all',
        comparisonLabel,
        queryParams,
        queryPeriod: mode,
        startDate: activeStartDate,
        endDate: activeEndDate,
        customDraftStartDate: customRange.draftStartDate,
        customDraftEndDate: customRange.draftEndDate,
        setCustomDraftRange,
        applyCustomRange,
        maxDate: todayStr,
        isQueryReady: isPeriodQueryReady({
            mode,
            startDate: activeStartDate,
            endDate: activeEndDate,
        }),
    };
}
