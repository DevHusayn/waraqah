export default function Toolbar({ children, className = '' }) {
    return (
        <div className={`flex flex-col sm:flex-row gap-2 mb-5 ${className}`.trim()}>
            {children}
        </div>
    );
}

export function ToolbarSearch({ icon: Icon, className = '', ...props }) {
    return (
        <div className={`relative flex-1 ${className}`.trim()}>
            {Icon ? (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" strokeWidth={1.75} />
            ) : null}
            <input className={`input-field ${Icon ? 'pl-9' : ''}`} {...props} />
        </div>
    );
}

export function ToolbarActions({ children, className = '' }) {
    return (
        <div className={`flex items-center gap-2 shrink-0 ${className}`.trim()}>
            {children}
        </div>
    );
}
