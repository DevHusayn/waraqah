import { useEffect, useMemo, useState } from 'react';
import { clampPage, DEFAULT_PAGE_SIZE } from '../utils/pagination';

/**
 * Paginate an in-memory list (e.g. detail-page tables loaded in one activity payload).
 */
export function useClientPagedList(items, { limit = DEFAULT_PAGE_SIZE, resetKey } = {}) {
    const [page, setPage] = useState(1);
    const list = Array.isArray(items) ? items : [];
    const total = list.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    useEffect(() => {
        setPage(1);
    }, [resetKey]);

    useEffect(() => {
        setPage((current) => clampPage(current, totalPages));
    }, [totalPages]);

    const pagination = useMemo(() => {
        const safePage = clampPage(page, totalPages);
        return {
            page: safePage,
            limit,
            total,
            totalPages,
        };
    }, [page, limit, total, totalPages]);

    const data = useMemo(() => {
        if (total === 0) return [];
        const start = (pagination.page - 1) * limit;
        return list.slice(start, start + limit);
    }, [list, pagination.page, limit, total]);

    const setPageSafe = (next) => {
        setPage((prev) => {
            const target = typeof next === 'function' ? next(prev) : next;
            return Math.max(1, target);
        });
    };

    return {
        page: pagination.page,
        setPage: setPageSafe,
        data,
        pagination,
    };
}
