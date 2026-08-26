/** Section card with icon header — Settings / Create Invoice pattern */
export default function FormSection({ icon: Icon, title, description, children, actions, className = '' }) {
    return (
        <section className={`card ${className}`.trim()}>
            <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 min-w-0">
                    {Icon ? (
                        <div className="p-2 rounded-md bg-surface-muted border border-border/50 shrink-0">
                            <Icon className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} aria-hidden />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-[13px] font-semibold text-foreground tracking-[-0.01em]">{title}</h2>
                        {description ? (
                            <p className="text-[13px] text-foreground-muted mt-0.5 leading-snug">{description}</p>
                        ) : null}
                    </div>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            {children}
        </section>
    );
}
