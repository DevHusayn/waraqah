import { useCallback, useEffect, useRef, useState } from 'react';
import { clampPage, DEFAULT_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';

export function usePagedList({
    fetcher,
    limit = DEFAULT_PAGE_SIZE,
    debounceMs = 300,
    extraDeps = [],
    enabled = true,
}) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
    });
    const [statusCounts, setStatusCounts] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const requestIdRef = useRef(0);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs]);

    const load = useCallback(
        async (pageOverride) => {
            if (!enabled) return;
            const nextPage = pageOverride ?? page;
            const reqId = ++requestIdRef.current;
            setLoading(true);
            setError('');
            try {
                const payload = await fetcherRef.current({
                    page: nextPage,
                    limit,
                    search: debouncedSearch,
                });
                if (reqId !== requestIdRef.current) return;
                const unwrapped = unwrapListResponse(payload);
                const safePage = clampPage(nextPage, unwrapped.pagination.totalPages);
                if (safePage !== nextPage) {
                    setPage(safePage);
                    return;
                }
                setData(unwrapped.data);
                setPagination(unwrapped.pagination);
                if (unwrapped.statusCounts) setStatusCounts(unwrapped.statusCounts);
            } catch (err) {
                if (reqId !== requestIdRef.current) return;
                setError(err?.message || 'Could not load list');
                setData([]);
            } finally {
                if (reqId === requestIdRef.current) setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [enabled, page, limit, debouncedSearch, ...extraDeps]
    );

    useEffect(() => {
        load();
    }, [load]);

    const goToPage = useCallback((next) => {
        setPage((prev) => {
            const target = typeof next === 'function' ? next(prev) : next;
            return Math.max(1, target);
        });
    }, []);

    const refresh = useCallback(() => load(page), [load, page]);

    return {
        page,
        setPage: goToPage,
        search,
        setSearch,
        debouncedSearch,
        data,
        setData,
        pagination,
        statusCounts,
        loading,
        error,
        refresh,
        limit,
    };
}
