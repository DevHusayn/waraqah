export default function InvoiceUsageBanner({ label, className = '' }) {
    if (!label) return null;

    return (
        <p
            className={`text-sm font-medium text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2.5 ${className}`.trim()}
        >
            {label}
        </p>
    );
}
