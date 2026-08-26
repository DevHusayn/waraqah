import MonthComparisonTrend from './MonthComparisonTrend';
import AdaptiveStatValue from './AdaptiveStatValue';

export function ReportStatCell({
    title,
    value,
    comparison,
    comparisonLabel,
    detail,
    positiveDirection = 'up',
    valueClassName = '',
    titleClassName = '',
    className = '',
    reserveTrendSpace = false,
}) {
    const showTrendArea = reserveTrendSpace || comparison || detail;

    return (
        <div className={`bg-surface p-3.5 sm:p-4 flex flex-col gap-1.5 min-w-0 ${className}`.trim()}>
            <p className={`text-xs text-foreground-muted font-medium leading-snug ${titleClassName}`.trim()}>
                {title}
            </p>
            <AdaptiveStatValue value={value} variant="grid" valueClassName={valueClassName} />
            {showTrendArea ? (
                <div className="flex flex-col gap-1 min-h-[1.125rem]">
                    <MonthComparisonTrend
                        comparison={comparison}
                        positiveDirection={positiveDirection}
                        label={comparisonLabel}
                    />
                    {detail ? <p className="text-[11px] text-foreground-muted leading-snug">{detail}</p> : null}
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
            className={`mb-6 rounded-lg border border-border/80 overflow-hidden ${className}`.trim()}
        >
            <div className={`grid ${columns} gap-px bg-border`}>{children}</div>
            {footer}
        </div>
    );
}

export function ReportStatFooter({ title, value, titleClassName = '', valueClassName = '', className = '' }) {
    return (
        <div
            className={`border-t border-border/80 bg-surface px-3.5 py-3.5 sm:px-4 sm:py-4 ${className}`.trim()}
        >
            <p className={`text-xs font-medium uppercase tracking-wide ${titleClassName}`.trim()}>{title}</p>
            <AdaptiveStatValue value={value} variant="grid" valueClassName={valueClassName} className="mt-1" />
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
            className={`mb-6 rounded-lg border border-border/80 overflow-hidden animate-pulse ${className}`.trim()}
        >
            <div className={`grid ${columns} gap-px bg-border`}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className="bg-surface p-3.5 sm:p-4 space-y-2">
                        <div className="h-3 w-16 skeleton-bar" />
                        <div className="h-5 sm:h-6 w-20 max-w-full skeleton-bar" />
                        <div className="h-3 w-24 skeleton-bar" />
                    </div>
                ))}
            </div>
            {footer ? (
                <div className="border-t border-border/80 bg-surface px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-2">
                    <div className="h-3 w-20 skeleton-bar" />
                    <div className="h-5 sm:h-6 w-28 max-w-full skeleton-bar" />
                </div>
            ) : null}
        </div>
    );
}
