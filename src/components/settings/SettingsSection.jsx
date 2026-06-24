import { Crown } from 'lucide-react';

export function SettingsSection({ icon: Icon, title, description, children, className = '' }) {
    return (
        <section className={`card ${className}`.trim()}>
            {(title || description) && (
                <div className="flex items-start gap-3 mb-6 pb-5 border-b border-zinc-100">
                    {Icon ? (
                        <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                            <Icon className="h-5 w-5 text-brand" aria-hidden />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        {title ? <h2 className="text-lg font-semibold text-zinc-900">{title}</h2> : null}
                        {description ? (
                            <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
                        ) : null}
                    </div>
                </div>
            )}
            {children}
        </section>
    );
}

export function ViewField({ label, value, icon: Icon, children }) {
    return (
        <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                {label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-zinc-900 break-words">
                {children ?? (value?.trim() ? value : '—')}
            </dd>
        </div>
    );
}

export function PlanBadge({ premium }) {
    if (premium) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">
                <Crown className="h-3 w-3 text-amber-500 shrink-0" aria-hidden />
                Premium
            </span>
        );
    }
    return (
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">
            Free plan
        </span>
    );
}
