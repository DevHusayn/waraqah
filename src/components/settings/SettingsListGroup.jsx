export default function SettingsListGroup({ label, children, className = '' }) {
    return (
        <div className={className}>
            {label ? (
                <p className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    {label}
                </p>
            ) : null}
            <div className="data-table-wrap divide-y divide-zinc-200/80">{children}</div>
        </div>
    );
}
