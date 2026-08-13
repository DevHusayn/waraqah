import MonthComparisonTrend from './MonthComparisonTrend';

export function ReportStatCell({
    title,
    value,
    comparison,
    detail,
    positiveDirection = 'up',
    valueClassName = '',
    titleClassName = '',
    className = '',
    reserveTrendSpace = false,
}) {
    const showTrendArea = reserveTrendSpace || comparison || detail;

    return (
        <div className={`bg-white p-3.5 sm:p-4 flex flex-col gap-1.5 min-w-0 ${className}`.trim()}>
            <p className={`text-xs text-zinc-500 font-medium leading-snug ${titleClassName}`.trim()}>
                {title}
            </p>
            <p
                className={`text-sm sm:text-base lg:text-lg font-semibold text-zinc-950 tabular-nums tracking-[-0.02em] leading-snug min-w-0 ${valueClassName}`.trim()}
                title={typeof value === 'string' ? value : undefined}
            >
                {value}
            </p>
            {showTrendArea ? (
                <div className="flex flex-col gap-1 min-h-[1.125rem]">
                    <MonthComparisonTrend comparison={comparison} positiveDirection={positiveDirection} />
                    {detail ? <p className="text-[11px] text-zinc-500 leading-snug">{detail}</p> : null}
                </div>
            ) : null}
        </div>
    );
}

export default function ReportStatGrid({
    children,
    columns = 'grid-cols-2 sm:grid-cols-3',
    footer = null,
    className = '',
}) {
    return (
        <div
            className={`mb-6 rounded-lg border border-zinc-200/80 overflow-hidden ${className}`.trim()}
        >
            <div className={`grid ${columns} gap-px bg-zinc-200/80`}>{children}</div>
            {footer}
        </div>
    );
}

export function ReportStatFooter({ title, value, titleClassName = '', valueClassName = '', className = '' }) {
    return (
        <div
            className={`border-t border-zinc-200/80 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4 ${className}`.trim()}
        >
            <p className={`text-xs font-medium uppercase tracking-wide ${titleClassName}`.trim()}>{title}</p>
            <p
                className={`mt-1 text-sm sm:text-base lg:text-lg font-semibold tabular-nums tracking-[-0.02em] leading-snug min-w-0 ${valueClassName}`.trim()}
                title={typeof value === 'string' ? value : undefined}
            >
                {value}
            </p>
        </div>
    );
}

export function ReportStatGridSkeleton({
    count = 6,
    columns = 'grid-cols-2 sm:grid-cols-3',
    footer = false,
    className = '',
}) {
    return (
        <div
            className={`mb-6 rounded-lg border border-zinc-200/80 overflow-hidden animate-pulse ${className}`.trim()}
        >
            <div className={`grid ${columns} gap-px bg-zinc-200/80`}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="bg-white p-3.5 sm:p-4 space-y-2">
                        <div className="h-3 w-16 rounded bg-zinc-200/80" />
                        <div className="h-5 sm:h-6 w-20 max-w-full rounded bg-zinc-200/80" />
                        <div className="h-3 w-24 rounded bg-zinc-200/80" />
                    </div>
                ))}
            </div>
            {footer ? (
                <div className="border-t border-zinc-200/80 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-2">
                    <div className="h-3 w-20 rounded bg-zinc-200/80" />
                    <div className="h-5 sm:h-6 w-28 max-w-full rounded bg-zinc-200/80" />
                </div>
            ) : null}
        </div>
    );
}
