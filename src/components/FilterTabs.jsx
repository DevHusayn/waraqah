export default function FilterTabs({ tabs, value, onChange, className = '' }) {
    return (
        <div className={`border-b border-zinc-200/80 overflow-x-auto scroll-x-touch ${className}`.trim()}>
            <div className="inline-flex min-w-min gap-6">
                {tabs.map((tab) => {
                    const active = value === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => onChange(tab.value)}
                            className={`filter-tab ${active ? 'filter-tab-active' : 'filter-tab-inactive'}`}
                            aria-current={active ? 'true' : undefined}
                        >
                            {tab.label}
                            {tab.count != null ? (
                                <span className={`ml-1.5 tabular-nums ${active ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {tab.count}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
