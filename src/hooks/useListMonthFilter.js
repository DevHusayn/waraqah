import { useSummaryPeriod } from './useSummaryPeriod';
import { usePeriodFilter } from './usePeriodFilter';

/**
 * List pages expose two independent period controls:
 * - Stat card ("New this …") → summaryYear / summaryMonth (counts only, month-only)
 * - Toolbar filter → period presets on the document list (defaults to all time)
 */
export function useListMonthFilter() {
    const summary = useSummaryPeriod();
    const listPeriod = usePeriodFilter('all');

    return {
        summaryYear: summary.summaryYear,
        summaryMonth: summary.summaryMonth,
        monthInputValue: summary.monthInputValue,
        setMonthInputValue: summary.setMonthInputValue,
        periodLabel: summary.periodLabel,
        timezone: summary.timezone,
        isCurrentPeriod: summary.isCurrentPeriod,
        shiftPeriod: summary.shiftPeriod,
        listPeriodMode: listPeriod.mode,
        setListPeriodMode: listPeriod.setPeriodMode,
        listPeriodLabel: listPeriod.periodLabel,
        listIsThisMonth: listPeriod.isCurrentPeriod,
        listQueryPeriod: listPeriod.queryPeriod,
        listQueryParams: listPeriod.queryParams,
        listStartDate: listPeriod.startDate,
        listEndDate: listPeriod.endDate,
        listCustomDraftStartDate: listPeriod.customDraftStartDate,
        listCustomDraftEndDate: listPeriod.customDraftEndDate,
        setListCustomDraftRange: listPeriod.setCustomDraftRange,
        applyListCustomRange: listPeriod.applyCustomRange,
        listMaxDate: listPeriod.maxDate,
        filterActive: listPeriod.mode !== 'all',
        isDefaultListPeriod: listPeriod.mode === 'all',
    };
}
