export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = '',
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`.trim()}>
            {Icon ? (
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-surface-muted/80">
                    <Icon className="h-4 w-4 text-foreground-muted/70" aria-hidden />
                </div>
            ) : null}
            <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
            {description ? (
                <p className="mt-1 text-[13px] text-foreground-muted max-w-xs leading-relaxed">{description}</p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
