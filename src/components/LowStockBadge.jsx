export default function LowStockBadge({ className = '' }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ${className}`.trim()}
        >
            Low stock
        </span>
    );
}
