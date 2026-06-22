export default function PageHeader({ title, subtitle, breadcrumb, children }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="min-w-0">
                {breadcrumb ? (
                    <div className="mb-1 text-xs text-zinc-500">{breadcrumb}</div>
                ) : null}
                <h1 className="page-title">{title}</h1>
                {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
            </div>
            {children ? <div className="w-full sm:w-auto shrink-0">{children}</div> : null}
        </div>
    );
}
