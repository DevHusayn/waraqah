import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function SettingsPageShell({
    title,
    subtitle,
    breadcrumbs = [],
    backTo,
    backLabel = 'Back',
    children,
    actions,
}) {
    return (
        <div className="min-w-0">
            {backTo ? (
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-brand mb-4 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    {backLabel}
                </Link>
            ) : breadcrumbs.length > 0 ? (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
                            {index > 0 ? <span aria-hidden>/</span> : null}
                            {index < breadcrumbs.length - 1 ? (
                                <Link to={crumb.to} className="hover:text-brand transition-colors truncate">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-zinc-600 truncate">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            ) : null}

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
                <div className="min-w-0">
                    <h1 className="page-title">{title}</h1>
                    {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
                </div>
                {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
            </div>

            {children}
        </div>
    );
}
