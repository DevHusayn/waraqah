export default function ChartCard({ title, subtitle, children, className = '' }) {
    return (
        <div className={`card flex flex-col min-h-[280px] ${className}`.trim()}>
            <div className="mb-4">
                <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
                {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
            </div>
            <div className="flex-1 min-h-0">{children}</div>
        </div>
    );
}
