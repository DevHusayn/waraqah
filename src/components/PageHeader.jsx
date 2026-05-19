export default function PageHeader({ title, subtitle, children }) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    );
}
