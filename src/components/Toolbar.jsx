export default function Toolbar({ children, className = '' }) {
    return (
        <div className={`flex flex-col sm:flex-row gap-2 mb-5 ${className}`.trim()}>
            {children}
        </div>
    );
}

export function ToolbarSearch({ icon: Icon, action, className = '', ...props }) {
    return (
        <div className={`flex min-w-0 flex-1 items-center gap-2 ${className}`.trim()}>
            <div className="relative min-w-0 flex-1">
                {Icon ? (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
                ) : null}
                <input className={`input-field ${Icon ? 'pl-9' : ''}`} {...props} />
            </div>
            {action}
        </div>
    );
}

export function ToolbarActions({ children, className = '' }) {
    return (
        <div className={`flex w-full min-w-0 items-center gap-2 sm:w-auto sm:shrink-0 ${className}`.trim()}>
            {children}
        </div>
    );
}
