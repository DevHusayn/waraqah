const STYLES = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function StatusBadge({ status, className = '' }) {
    const key = (status || 'pending').toLowerCase();
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${STYLES[key] || STYLES.pending} ${className}`.trim()}
        >
            {status || 'pending'}
        </span>
    );
}
