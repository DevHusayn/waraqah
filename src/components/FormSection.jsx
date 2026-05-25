/** Section card with icon header — matches Settings / Clients pattern */
export default function FormSection({ icon: Icon, title, description, children, actions, className = '' }) {
    return (
        <section className={`card ${className}`.trim()}>
            <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3 min-w-0">
                    {Icon ? (
                        <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                            <Icon className="h-5 w-5 text-brand" aria-hidden />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        {description ? (
                            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                        ) : null}
                    </div>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            {children}
        </section>
    );
}
