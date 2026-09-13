export default function PageHeader({ title, subtitle, breadcrumb, eyebrow, greeting, children, inlineActions = false }) {
    return (
        <div
            className={`mb-6 pb-5 border-b border-border/50 flex gap-3 min-w-0 ${
                inlineActions
                    ? 'flex-row items-start justify-between'
                    : 'flex-col sm:flex-row sm:items-end sm:justify-between'
            }`}
        >
            <div className="min-w-0 flex-1">
                {breadcrumb ? (
                    <div className="mb-1.5 text-[11px] font-medium text-foreground-muted/70 tracking-wide uppercase">
                        {breadcrumb}
                    </div>
                ) : null}
                {eyebrow ? (
                    <p className="mb-1.5 text-[11px] font-medium text-foreground-muted/70 tracking-wide uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                {greeting ? (
                    <p className="mb-0.5 text-[13px] font-medium text-foreground-muted leading-snug">
                        {greeting}{' '}
                        <span aria-hidden="true">👋</span>
                    </p>
                ) : null}
                <h1 className="page-title line-clamp-2 break-words" title={typeof title === 'string' ? title : undefined}>
                    {title}
                </h1>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            {children ? (
                <div
                    className={`${
                        inlineActions ? 'w-auto' : 'w-full sm:w-auto'
                    } shrink-0 flex items-center gap-2`}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}
