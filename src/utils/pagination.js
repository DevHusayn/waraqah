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
    summaryYear,
    summaryMonth,
    summaryOnly,
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
    if (summaryYear != null && summaryYear !== '') params.set('summaryYear', String(summaryYear));
    if (summaryMonth != null && summaryMonth !== '') params.set('summaryMonth', String(summaryMonth));
    if (summaryOnly) params.set('summaryOnly', '1');
    return params.toString();
}

/** Build query string for filtered list CSV export (no pagination). */
export function buildListExportQuery({ search, status, sort, year, month } = {}) {
    const params = new URLSearchParams();
    if (search && String(search).trim()) params.set('search', String(search).trim());
    if (status && status !== 'all') params.set('status', status);
    if (sort) params.set('sort', sort);
    if (year != null && year !== '') params.set('year', String(year));
    if (month != null && month !== '') params.set('month', String(month));
    return params.toString();
}

export function slugifyFilenamePart(value, fallback = 'export') {
    const slug = String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
    return slug || fallback;
}

export function buildListExportFilename(companyName, resource, { status = 'all', year, month, search } = {}) {
    const parts = [
        slugifyFilenamePart(companyName, 'business'),
        slugifyFilenamePart(resource, 'export'),
    ];

    const filterParts = [];
    if (year != null && year !== '' && month != null && month !== '') {
        filterParts.push(`${year}-${String(month).padStart(2, '0')}`);
    }
    if (status && status !== 'all') {
        filterParts.push(status);
    }
    if (search && String(search).trim()) {
        filterParts.push('search');
    }
    if (filterParts.length > 0) {
        parts.push(filterParts.join('-'));
    }
    parts.push('filtered');
    parts.push(new Date().toISOString().slice(0, 10));

    return `${parts.join('-')}.csv`;
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

/** Fetch every page from a paginated list API until all rows are loaded. */
export async function fetchAllListPages(fetchPage, { limit = DEFAULT_PAGE_SIZE } = {}) {
    const all = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const payload = await fetchPage({ page, limit });
        const { data, pagination } = unwrapListResponse(payload);
        all.push(...data);
        totalPages = Math.max(1, pagination.totalPages || 1);
        page += 1;
    }

    return all;
}
