import { useSummaryPeriod } from './useSummaryPeriod';
import { usePeriodFilter } from './usePeriodFilter';

/**
 * List pages expose two independent period controls:
 * - Stat card ("New this …") → summaryYear / summaryMonth (counts only, month-only)
 * - Toolbar filter → period=all|today|month on the document list (defaults to all time)
 */
export function useListMonthFilter() {
    const summary = useSummaryPeriod();
    const listPeriod = usePeriodFilter();

    return {
        summaryYear: summary.summaryYear,
        summaryMonth: summary.summaryMonth,
        monthInputValue: summary.monthInputValue,
        setMonthInputValue: summary.setMonthInputValue,
        periodLabel: summary.periodLabel,
        timezone: summary.timezone,
        isCurrentPeriod: summary.isCurrentPeriod,
        shiftPeriod: summary.shiftPeriod,
        listMonthInputValue: listPeriod.monthInputValue,
        setListMonthInputValue: listPeriod.setMonthInputValue,
        listPeriodMode: listPeriod.mode,
        setListPeriodMode: listPeriod.setPeriodMode,
        listPeriodLabel: listPeriod.periodLabel,
        listIsThisMonth: listPeriod.isCurrentPeriod,
        listYear: listPeriod.year,
        listMonth: listPeriod.month,
        listQueryPeriod: listPeriod.queryPeriod,
        allTime: listPeriod.mode === 'all',
        filterActive: listPeriod.mode !== 'all',
    };
}
