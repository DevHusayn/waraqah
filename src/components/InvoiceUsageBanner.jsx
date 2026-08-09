import { Link } from 'react-router-dom';

export default function InvoiceUsageBanner({ label, className = '' }) {
    if (!label) return null;

    return (
        <div
            className={`flex items-center justify-between gap-3 text-sm font-medium text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2.5 ${className}`.trim()}
        >
            <span>{label}</span>
            <Link to="/upgrade" className="font-medium text-brand hover:underline shrink-0">
                Upgrade
            </Link>
        </div>
    );
}
