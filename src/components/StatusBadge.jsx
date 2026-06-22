const DOT_COLORS = {
    draft: 'bg-zinc-400',
    pending: 'bg-amber-500',
    paid: 'bg-emerald-500',
    overdue: 'bg-red-500',
    cancelled: 'bg-zinc-400',
};

export default function StatusBadge({ status, className = '' }) {
    const key = (status || 'pending').toLowerCase();
    const dotColor = DOT_COLORS[key] || DOT_COLORS.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 capitalize ${className}`.trim()}
        >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden />
            {status || 'pending'}
        </span>
    );
}
