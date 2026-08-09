import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clampPage, DEFAULT_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { useAuth } from '../context/AuthContext';

/**
 * Paginated list backed by TanStack Query — caches pages and avoids refetch on back-navigation.
 */
export function usePagedQuery({
    queryKeyBase,
    fetcher,
    limit = DEFAULT_PAGE_SIZE,
    debounceMs = 300,
    extraParams = {},
    enabled = true,
}) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const lastStatusCountsRef = useRef(null);
    const lastListRef = useRef([]);

    useEffect(() => {
        lastStatusCountsRef.current = null;
        lastListRef.current = [];
    }, [userId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs]);

    const queryParams = { page, limit, search: debouncedSearch, ...extraParams };
    const queryKey = queryKeys[queryKeyBase]
        ? queryKeys[queryKeyBase](userId, queryParams)
        : [queryKeyBase, userId, queryParams];

    const { data, isPending, isFetching, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            const payload = await fetcherRef.current({
                page,
                limit,
                search: debouncedSearch,
                ...extraParams,
            });
            const unwrapped = unwrapListResponse(payload);
            const safePage = clampPage(page, unwrapped.pagination.totalPages);
            if (safePage !== page) {
                setPage(safePage);
            }
            return unwrapped;
        },
        enabled: enabled && Boolean(userId),
        staleTime: STALE_TIMES.lists,
        placeholderData: (prev, previousQuery) => {
            if (previousQuery?.queryKey?.[1] !== userId) return undefined;
            return keepPreviousData(prev);
        },
    });

    if (data?.data !== undefined) {
        lastListRef.current = data.data;
    }
    if (data?.statusCounts) {
        lastStatusCountsRef.current = data.statusCounts;
    }

    const resolvedList =
        data?.data !== undefined ? data.data : isFetching ? lastListRef.current : [];

    const setData = useCallback(
        (updater) => {
            queryClient.setQueryData(queryKey, (old) => {
                if (!old?.data) return old;
                const nextData = typeof updater === 'function' ? updater(old.data) : updater;
                return { ...old, data: nextData };
            });
        },
        [queryClient, queryKey]
    );

    const goToPage = useCallback((next) => {
        setPage((prev) => {
            const target = typeof next === 'function' ? next(prev) : next;
            return Math.max(1, target);
        });
    }, []);

    const refresh = useCallback(() => refetch(), [refetch]);

    const resetSearchAndPage = useCallback(() => {
        setSearch('');
        setDebouncedSearch('');
        setPage(1);
    }, []);

    const invalidateList = useCallback(() => {
        if (!userId) return;
        queryClient.invalidateQueries({ queryKey: [queryKeyBase, userId] });
    }, [queryClient, queryKeyBase, userId]);

    return {
        page,
        setPage: goToPage,
        search,
        setSearch,
        debouncedSearch,
        data: resolvedList,
        setData,
        pagination: data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 },
        statusCounts: data?.statusCounts ?? lastStatusCountsRef.current,
        loading: isPending,
        fetching: isFetching,
        error: error?.message || '',
        refresh,
        resetSearchAndPage,
        invalidateList,
        limit,
    };
}
