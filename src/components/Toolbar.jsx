export default function Toolbar({ children, className = '' }) {
    return (
        <div className={`mb-5 flex flex-col gap-2 sm:flex-row sm:items-center ${className}`.trim()}>
            {children}
        </div>
    );
}

export function ToolbarSearch({ icon: Icon, action, className = '', ...props }) {
    return (
        <div className={`flex min-w-0 flex-1 items-center gap-2 ${className}`.trim()}>
            <div className="relative min-w-0 flex-1">
                {Icon ? (
                    <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted/70" strokeWidth={1.75} />
                ) : null}
                <input className={`input-field h-[38px] ${Icon ? 'pl-9' : ''}`} {...props} />
            </div>
            {action}
        </div>
    );
}

export function ToolbarActions({ children, className = '' }) {
    return (
        <div
            className={`flex w-full min-w-0 flex-wrap items-stretch gap-2 sm:w-auto sm:shrink-0 sm:flex-nowrap sm:items-center [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-[calc(50%-0.25rem)] sm:[&>*]:basis-auto sm:[&>*]:flex-none ${className}`.trim()}
        >
            {children}
        </div>
    );
}
