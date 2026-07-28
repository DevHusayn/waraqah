export default function PageHeader({ title, subtitle, breadcrumb, eyebrow, children }) {
    return (
        <div className="mb-6 pb-5 border-b border-zinc-200/50 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="min-w-0">
                {breadcrumb ? (
                    <div className="mb-1.5 text-[11px] font-medium text-zinc-400 tracking-wide uppercase">
                        {breadcrumb}
                    </div>
                ) : null}
                {eyebrow ? (
                    <p className="mb-1.5 text-[11px] font-medium text-zinc-400 tracking-wide uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="page-title truncate" title={typeof title === 'string' ? title : undefined}>
                    {title}
                </h1>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            {children ? <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">{children}</div> : null}
        </div>
    );
}
