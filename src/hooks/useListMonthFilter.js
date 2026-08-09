import { useCallback, useState } from 'react';
import { parseMonthInputValue } from '@waraqah/shared';
import { useSummaryPeriod } from './useSummaryPeriod';

/**
 * List pages expose two independent month controls:
 * - Stat card ("New this …") → summaryYear / summaryMonth (counts only)
 * - Toolbar filter → year / month on the document list (defaults to all time)
 */
export function useListMonthFilter() {
    const summary = useSummaryPeriod();
    const [listAllTime, setListAllTime] = useState(true);
    const [listMonthInputValue, setListMonthInputValueState] = useState(summary.monthInputValue);

    const setListMonthInputValue = useCallback((value) => {
        if (!parseMonthInputValue(value)) return;
        setListMonthInputValueState(value);
        setListAllTime(false);
    }, []);

    const showAllTime = useCallback(() => {
        setListAllTime(true);
    }, []);

    const listPeriod = parseMonthInputValue(listMonthInputValue);
    const listYear = listAllTime || !listPeriod ? undefined : listPeriod.year;
    const listMonth = listAllTime || !listPeriod ? undefined : listPeriod.month;

    return {
        summaryYear: summary.summaryYear,
        summaryMonth: summary.summaryMonth,
        monthInputValue: summary.monthInputValue,
        setMonthInputValue: summary.setMonthInputValue,
        periodLabel: summary.periodLabel,
        timezone: summary.timezone,
        isCurrentPeriod: summary.isCurrentPeriod,
        shiftPeriod: summary.shiftPeriod,
        listMonthInputValue,
        setListMonthInputValue,
        allTime: listAllTime,
        setAllTime: showAllTime,
        listYear,
        listMonth,
        filterActive: !listAllTime,
    };
}
