/** Section card with icon header — matches Settings / Create Invoice pattern */
export default function FormSection({ icon: Icon, title, description, children, actions, className = '' }) {
    return (
        <section className={`card ${className}`.trim()}>
            <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 min-w-0">
                    {Icon ? (
                        <div className="p-2 rounded-md bg-zinc-100 shrink-0">
                            <Icon className="h-4 w-4 text-zinc-600" aria-hidden />
                        </div>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
                        {description ? (
                            <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
                        ) : null}
                    </div>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
            {children}
        </section>
    );
}
