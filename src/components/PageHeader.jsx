export default function PageHeader({ title, subtitle, children }) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between min-w-0">
            <div className="min-w-0">
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {children && <div className="w-full sm:w-auto shrink-0">{children}</div>}
        </div>
    );
}
