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
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50/80">
                    <Icon className="h-4 w-4 text-zinc-400" aria-hidden />
                </div>
            ) : null}
            <h3 className="text-[13px] font-medium text-zinc-900">{title}</h3>
            {description ? (
                <p className="mt-1 text-[13px] text-zinc-500 max-w-xs leading-relaxed">{description}</p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
