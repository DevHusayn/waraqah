import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Prev / page indicator / Next controls for offset-paginated lists.
 * Hidden when there is at most one page.
 */
export default function PaginationBar({
    page = 1,
    totalPages = 0,
    total = 0,
    onPageChange,
    className = '',
    disabled = false,
}) {
    if (!totalPages || totalPages <= 1) return null;

    const canPrev = page > 1 && !disabled;
    const canNext = page < totalPages && !disabled;

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${className}`.trim()}
            role="navigation"
            aria-label="Pagination"
        >
            <p className="text-sm text-zinc-500">
                Page {page} of {totalPages}
                {total > 0 ? (
                    <span className="text-zinc-400"> · {total} total</span>
                ) : null}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="btn-secondary"
                    disabled={!canPrev}
                    onClick={() => onPageChange?.(page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} aria-hidden />
                    Prev
                </button>
                <button
                    type="button"
                    className="btn-secondary"
                    disabled={!canNext}
                    onClick={() => onPageChange?.(page + 1)}
                    aria-label="Next page"
                >
                    Next
                    <ChevronRight size={16} aria-hidden />
                </button>
            </div>
        </div>
    );
}
