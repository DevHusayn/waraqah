import { useCallback, useEffect, useMemo, useState } from 'react';
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

function rangeFromUrl(url) {
    if (url?.period === 'custom' && url.startDate && url.endDate) {
        return {
            startDate: url.startDate,
            endDate: url.endDate,
            draftStartDate: url.startDate,
            draftEndDate: url.endDate,
        };
    }
    return createCustomRange();
}

export function usePeriodFilter(defaultMode = 'month', url) {
    const { businessInfo } = useSettings();
    const timezone = businessInfo?.timezone || DEFAULT_BUSINESS_TIMEZONE;
    const usingUrl = typeof url?.patch === 'function';
    const [modeState, setModeState] = useState(defaultMode);
    const mode = usingUrl ? (url.period || defaultMode) : modeState;
    const [customRange, setCustomRange] = useState(() => rangeFromUrl(url));
    const [appliedCustomRange, setAppliedCustomRange] = useState(createCustomRange);

    useEffect(() => {
        if (!usingUrl) return;
        if (url.period === 'custom' && url.startDate && url.endDate) {
            setCustomRange({
                startDate: url.startDate,
                endDate: url.endDate,
                draftStartDate: url.startDate,
                draftEndDate: url.endDate,
            });
        }
    }, [usingUrl, url?.period, url?.startDate, url?.endDate]);

    const activeStartDate = mode === 'custom'
        ? (usingUrl ? url.startDate || undefined : appliedCustomRange.startDate)
        : undefined;
    const activeEndDate = mode === 'custom'
        ? (usingUrl ? url.endDate || undefined : appliedCustomRange.endDate)
        : undefined;
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

    const isCurrentPeriod =
        mode !== 'custom' && mode !== 'all' && mode !== 'last-week' && mode !== 'last-month';
    const comparisonLabel = getPeriodComparisonLabel(mode, isCurrentPeriod);

    const setPeriodMode = useCallback((nextMode) => {
        if (usingUrl) {
            if (nextMode === 'custom') {
                url.patch({ period: 'custom', page: 1 });
                setCustomRange((prev) => ({
                    ...prev,
                    draftStartDate: prev.draftStartDate || prev.startDate,
                    draftEndDate: prev.draftEndDate || prev.endDate,
                }));
            } else {
                url.setPeriodMode(nextMode);
            }
            return;
        }
        setModeState(nextMode);
        if (nextMode === 'custom') {
            setCustomRange((prev) => ({
                ...prev,
                draftStartDate: prev.draftStartDate || prev.startDate,
                draftEndDate: prev.draftEndDate || prev.endDate,
            }));
        }
    }, [usingUrl, url]);

    const setCustomDraftRange = useCallback((partial) => {
        setCustomRange((prev) => ({ ...prev, ...partial }));
    }, []);

    const applyCustomRange = useCallback(() => {
        const { draftStartDate, draftEndDate } = customRange;
        if (!draftStartDate || !draftEndDate || draftStartDate > draftEndDate) return;
        if (usingUrl) {
            url.applyCustomRange(draftStartDate, draftEndDate);
            setCustomRange({
                startDate: draftStartDate,
                endDate: draftEndDate,
                draftStartDate,
                draftEndDate,
            });
            return;
        }
        setAppliedCustomRange({
            startDate: draftStartDate,
            endDate: draftEndDate,
            draftStartDate,
            draftEndDate,
        });
        setModeState('custom');
    }, [customRange, usingUrl, url]);

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
