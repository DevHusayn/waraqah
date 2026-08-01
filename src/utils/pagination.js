/** Shared list-pagination helpers for web + mobile. */

export const DEFAULT_PAGE_SIZE = 20;
export const PICKER_PAGE_SIZE = 100;

export function unwrapListResponse(payload) {
    if (Array.isArray(payload)) {
        return {
            data: payload,
            pagination: {
                page: 1,
                limit: payload.length,
                total: payload.length,
                totalPages: payload.length > 0 ? 1 : 0,
            },
            statusCounts: null,
        };
    }
    const data = Array.isArray(payload?.data) ? payload.data : [];
    const pagination = payload?.pagination || {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: data.length,
        totalPages: data.length > 0 ? 1 : 0,
    };
    return {
        data,
        pagination,
        statusCounts: payload?.statusCounts || null,
        summary: payload?.summary || null,
    };
}

export function buildListQuery({
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search,
    status,
    plan,
    activity,
    sort,
    year,
    month,
} = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search && String(search).trim()) params.set('search', String(search).trim());
    if (status && status !== 'all') params.set('status', status);
    if (plan && plan !== 'all') params.set('plan', plan);
    if (activity && activity !== 'all') params.set('activity', activity);
    if (sort) params.set('sort', sort);
    if (year != null && year !== '') params.set('year', String(year));
    if (month != null && month !== '') params.set('month', String(month));
    return params.toString();
}

/** Build query string for admin user export (no pagination). */
export function buildAdminUsersExportQuery({ search, status, plan, activity } = {}) {
    const params = new URLSearchParams();
    if (search && String(search).trim()) params.set('search', String(search).trim());
    if (status && status !== 'all') params.set('status', status);
    if (plan && plan !== 'all') params.set('plan', plan);
    if (activity && activity !== 'all') params.set('activity', activity);
    return params.toString();
}

export function buildAdminUsersExportFilename({ plan = 'all', status = 'all', activity = 'all', search = '' } = {}) {
    const parts = [];
    if (plan !== 'all') parts.push(plan);
    if (status !== 'all') parts.push(status);
    if (activity !== 'all') parts.push(activity === 'has_invoices' ? 'with-invoices' : 'no-invoices');
    if (search && String(search).trim()) parts.push('search');
    const slug = parts.length ? parts.join('-') : 'all';
    const date = new Date().toISOString().slice(0, 10);
    return `waraqah-users-${slug}-${date}.csv`;
}

/** Clamp page after a delete when the current page becomes empty. */
export function clampPage(page, totalPages) {
    const safeTotal = Math.max(0, Number(totalPages) || 0);
    if (safeTotal === 0) return 1;
    return Math.min(Math.max(1, page), safeTotal);
}
