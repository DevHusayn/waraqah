export default function FilterTabs({ tabs, value, onChange, className = '' }) {
    return (
        <div className={`border-b border-zinc-200/50 overflow-x-auto scroll-x-touch ${className}`.trim()}>
            <div className="inline-flex min-w-min gap-5">
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
                                <span
                                    className={`ml-1.5 inline-flex min-w-[1.125rem] items-center justify-center rounded px-1 py-px text-[10px] font-medium tabular-nums ${
                                        active
                                            ? 'bg-brand-light text-brand'
                                            : 'bg-zinc-50 text-zinc-400'
                                    }`}
                                >
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
