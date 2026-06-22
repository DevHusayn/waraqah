export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = '',
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`.trim()}>
            {Icon ? (
                <Icon className="h-8 w-8 text-zinc-300 mb-3" aria-hidden />
            ) : null}
            <h3 className="text-sm font-medium text-zinc-900">{title}</h3>
            {description ? (
                <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
