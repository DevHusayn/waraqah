const STYLES = {
    draft: 'bg-zinc-50 text-zinc-600 border-zinc-200/80',
    pending: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
    paid: 'bg-green-50/80 text-green-800 border-green-200/60',
    overdue: 'bg-red-50/80 text-red-800 border-red-200/60',
    cancelled: 'bg-zinc-50 text-zinc-500 border-zinc-200/80',
    sent: 'bg-sky-50/80 text-sky-800 border-sky-200/60',
    accepted: 'bg-green-50/80 text-green-800 border-green-200/60',
    rejected: 'bg-red-50/80 text-red-800 border-red-200/60',
    expired: 'bg-orange-50/80 text-orange-800 border-orange-200/60',
    converted: 'bg-violet-50/80 text-violet-800 border-violet-200/60',
};

const DOT_COLORS = {
    draft: 'bg-zinc-400',
    pending: 'bg-amber-500',
    paid: 'bg-green-600',
    overdue: 'bg-red-500',
    cancelled: 'bg-zinc-400',
    sent: 'bg-sky-500',
    accepted: 'bg-green-600',
    rejected: 'bg-red-500',
    expired: 'bg-orange-500',
    converted: 'bg-violet-500',
};

export default function StatusBadge({ status, className = '' }) {
    const key = (status || 'pending').toLowerCase();
    const style = STYLES[key] || STYLES.pending;
    const dotColor = DOT_COLORS[key] || DOT_COLORS.pending;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${style} ${className}`.trim()}
        >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden />
            {status || 'pending'}
        </span>
    );
}
