import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPaginationItems(page, totalPages) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const included = new Set([1, totalPages]);
    for (let n = page - 1; n <= page + 1; n += 1) {
        if (n >= 1 && n <= totalPages) included.add(n);
    }
    if (page <= 3) {
        included.add(2);
        included.add(3);
        included.add(4);
    }
    if (page >= totalPages - 2) {
        included.add(totalPages - 3);
        included.add(totalPages - 2);
        included.add(totalPages - 1);
    }

    const numbers = [...included].sort((a, b) => a - b);
    const items = [];
    for (const n of numbers) {
        const prev = items[items.length - 1];
        if (typeof prev === 'number' && n - prev > 1) items.push('ellipsis');
        items.push(n);
    }
    return items;
}

function pagerButtonClass(active) {
    const base =
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    if (active) {
        return `${base} text-white`;
    }
    return `${base} text-foreground-muted hover:bg-surface-muted hover:text-foreground`;
}

/**
 * Compact range + page controls for offset-paginated lists.
 * Hidden when there is at most one page.
 */
export default function PaginationBar({
    page: pageProp,
    totalPages: totalPagesProp,
    total: totalProp,
    limit: limitProp,
    pagination,
    onPageChange,
    className = '',
    disabled = false,
}) {
    const page = pagination?.page ?? pageProp ?? 1;
    const totalPages = pagination?.totalPages ?? totalPagesProp ?? 0;
    const total = pagination?.total ?? totalProp ?? 0;
    const limit = pagination?.limit ?? limitProp ?? 20;

    if (!totalPages || totalPages <= 1) return null;

    const canPrev = page > 1 && !disabled;
    const canNext = page < totalPages && !disabled;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    const items = getPaginationItems(page, totalPages);

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${className}`.trim()}
            role="navigation"
            aria-label="Pagination"
        >
            <p className="min-w-0 text-[13px] text-foreground-muted tabular-nums">
                {total > 0 ? (
                    <>
                        <span className="font-medium text-foreground">{start}–{end}</span>
                        <span className="text-foreground-muted/70"> of {total}</span>
                    </>
                ) : (
                    <>Page {page} of {totalPages}</>
                )}
            </p>
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/70 bg-surface p-0.5">
                <button
                    type="button"
                    className={pagerButtonClass(false)}
                    disabled={!canPrev}
                    onClick={() => onPageChange?.(page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} aria-hidden />
                </button>
                {items.map((item, index) =>
                    item === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="inline-flex h-8 min-w-8 items-center justify-center text-[13px] text-foreground-muted/70"
                            aria-hidden
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            className={pagerButtonClass(item === page)}
                            style={item === page ? { backgroundColor: 'var(--brand)' } : undefined}
                            disabled={disabled}
                            aria-current={item === page ? 'page' : undefined}
                            aria-label={`Page ${item}`}
                            onClick={() => onPageChange?.(item)}
                        >
                            {item}
                        </button>
                    )
                )}
                <button
                    type="button"
                    className={pagerButtonClass(false)}
                    disabled={!canNext}
                    onClick={() => onPageChange?.(page + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} aria-hidden />
                </button>
            </div>
        </div>
    );
}
