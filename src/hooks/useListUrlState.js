import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applyListUrlPatch, readListUrlValues } from '../utils/listUrlState';

export function useListUrlState(defaults) {
    const [searchParams, setSearchParams] = useSearchParams();
    const values = useMemo(
        () => readListUrlValues(searchParams, defaults),
        [searchParams, defaults]
    );

    const patch = useCallback(
        (partial) => {
            setSearchParams((prev) => applyListUrlPatch(prev, partial, defaults), { replace: true });
        },
        [defaults, setSearchParams]
    );

    const setPage = useCallback((page) => patch({ page }), [patch]);
    const setSearch = useCallback((q) => patch({ q, page: 1 }), [patch]);
    const setStatus = useCallback((status) => patch({ status, page: 1 }), [patch]);
    const setSort = useCallback((sort) => patch({ sort, page: 1 }), [patch]);
    const setCategory = useCallback((category) => patch({ category, page: 1 }), [patch]);
    const setView = useCallback((view) => patch({ view, page: 1 }), [patch]);
    const setPeriodMode = useCallback(
        (period) => patch({ period, startDate: '', endDate: '', page: 1 }),
        [patch]
    );
    const applyCustomRange = useCallback(
        (startDate, endDate) => patch({ period: 'custom', startDate, endDate, page: 1 }),
        [patch]
    );

    return {
        ...values,
        patch,
        setPage,
        setSearch,
        setStatus,
        setSort,
        setCategory,
        setView,
        setPeriodMode,
        applyCustomRange,
    };
}
