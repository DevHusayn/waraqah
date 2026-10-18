import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clampPage, DEFAULT_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { invalidateListSummaryQueries } from '../lib/queryClient';
import { useAuth } from '../context/AuthContext';

const SUMMARY_RESOURCES = new Set(['invoices', 'quotations', 'receipts', 'products', 'clients']);

const LIST_PLACEHOLDER_KEYS = ['year', 'month', 'period', 'status', 'sort', 'search', 'recurring', 'category', 'template'];

function listParamsChanged(prev = {}, curr = {}) {
    return LIST_PLACEHOLDER_KEYS.some((key) => prev[key] !== curr[key]);
}

function resolvePage(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * Paginated list backed by TanStack Query — caches pages and avoids refetch on back-navigation.
 * Pass `page`/`onPageChange` and `searchQuery`/`onSearchQueryChange` to keep state in the URL.
 */
export function usePagedQuery({
    queryKeyBase,
    fetcher,
    limit = DEFAULT_PAGE_SIZE,
    debounceMs = 300,
    extraParams = {},
    enabled = true,
    page: controlledPage,
    onPageChange,
    searchQuery,
    onSearchQueryChange,
}) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;
    const pageControlled = typeof onPageChange === 'function';
    const searchControlled = typeof onSearchQueryChange === 'function';
    const [internalPage, setInternalPage] = useState(1);
    const page = pageControlled ? resolvePage(controlledPage) : internalPage;
    const [search, setSearch] = useState(() => searchQuery ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(() => searchQuery ?? '');
    const skipUrlSearchSync = useRef(false);
    const isFirstSearchEffect = useRef(true);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const onPageChangeRef = useRef(onPageChange);
    onPageChangeRef.current = onPageChange;
    const onSearchQueryChangeRef = useRef(onSearchQueryChange);
    onSearchQueryChangeRef.current = onSearchQueryChange;
    const lastStatusCountsRef = useRef(null);
    const lastSummaryRef = useRef(null);
    const lastListRef = useRef([]);
    const committedSearch = searchControlled ? (searchQuery ?? '') : debouncedSearch;

    useEffect(() => {
        lastStatusCountsRef.current = null;
        lastSummaryRef.current = null;
        lastListRef.current = [];
    }, [userId]);

    useEffect(() => {
        if (!searchControlled) return;
        if (skipUrlSearchSync.current) {
            skipUrlSearchSync.current = false;
            return;
        }
        const next = searchQuery ?? '';
        setSearch(next);
        setDebouncedSearch(next);
    }, [searchControlled, searchQuery]);

    const applyPage = useCallback((next) => {
        const target = typeof next === 'function' ? next(page) : next;
        const safe = Math.max(1, Number(target) || 1);
        if (pageControlled) {
            onPageChangeRef.current?.(safe);
        } else {
            setInternalPage(safe);
        }
    }, [page, pageControlled]);
    const applyPageRef = useRef(applyPage);
    applyPageRef.current = applyPage;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchControlled) {
                if ((searchQuery ?? '') !== search) {
                    skipUrlSearchSync.current = true;
                    onSearchQueryChangeRef.current?.(search);
                }
            } else {
                setDebouncedSearch(search);
                if (isFirstSearchEffect.current) {
                    isFirstSearchEffect.current = false;
                } else {
                    applyPageRef.current(1);
                }
            }
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs, searchControlled, searchQuery]);

    useEffect(() => {
        lastListRef.current = [];
        lastStatusCountsRef.current = null;
        lastSummaryRef.current = null;
    }, [
        extraParams.year,
        extraParams.month,
        extraParams.period,
        extraParams.status,
        extraParams.sort,
        extraParams.recurring,
        extraParams.category,
        extraParams.plan,
        extraParams.activity,
        extraParams.auth,
        extraParams.template,
        committedSearch,
    ]);

    const queryParams = { page, limit, search: committedSearch, ...extraParams };
    const queryKey = queryKeys[queryKeyBase]
        ? queryKeys[queryKeyBase](userId, queryParams)
        : [queryKeyBase, userId, queryParams];

    const { data, isPending, isFetching, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            const payload = await fetcherRef.current({
                page,
                limit,
                search: committedSearch,
                ...extraParams,
            });
            const unwrapped = unwrapListResponse(payload);
            const safePage = clampPage(page, unwrapped.pagination.totalPages);
            if (safePage !== page) {
                applyPage(safePage);
            }
            return unwrapped;
        },
        enabled: enabled && Boolean(userId),
        staleTime: STALE_TIMES.lists,
        placeholderData: (prev, previousQuery) => {
            if (previousQuery?.queryKey?.[1] !== userId) return undefined;
            const prevParams = previousQuery?.queryKey?.[2];
            if (listParamsChanged(prevParams, queryParams)) return undefined;
            return keepPreviousData(prev);
        },
    });

    if (data?.data !== undefined) {
        lastListRef.current = data.data;
    }
    if (data?.statusCounts) {
        lastStatusCountsRef.current = data.statusCounts;
    }
    if (data?.summary) {
        lastSummaryRef.current = data.summary;
    }

    const resolvedList = data?.data ?? [];

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
        applyPage(next);
    }, [applyPage]);

    const refresh = useCallback(() => refetch(), [refetch]);

    const resetSearchAndPage = useCallback(() => {
        setSearch('');
        if (searchControlled) {
            skipUrlSearchSync.current = true;
            onSearchQueryChangeRef.current?.('');
        } else {
            setDebouncedSearch('');
            applyPage(1);
        }
    }, [applyPage, searchControlled]);

    const invalidateList = useCallback(() => {
        if (!userId) return;
        queryClient.invalidateQueries({ queryKey: [queryKeyBase, userId] });
        if (SUMMARY_RESOURCES.has(queryKeyBase)) {
            invalidateListSummaryQueries(userId, queryKeyBase);
        }
    }, [queryClient, queryKeyBase, userId]);

    return {
        page,
        setPage: goToPage,
        search,
        setSearch,
        debouncedSearch: committedSearch,
        data: resolvedList,
        setData,
        pagination: data?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 },
        statusCounts: data?.statusCounts ?? lastStatusCountsRef.current,
        summary: data?.summary ?? lastSummaryRef.current,
        loading: isPending,
        fetching: isFetching,
        error: error?.message || '',
        refresh,
        resetSearchAndPage,
        invalidateList,
        limit,
    };
}
