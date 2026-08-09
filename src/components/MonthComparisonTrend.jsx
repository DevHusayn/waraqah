export default function MonthComparisonTrend({
    comparison,
    positiveDirection = 'up',
    label = 'vs last month',
}) {
    if (!comparison) return null;

    if (comparison.kind === 'unavailable') {
        return (
            <p className="text-xs font-medium text-zinc-500">
                — {label}
            </p>
        );
    }

    if (comparison.kind === 'flat' || comparison.direction === 'flat') {
        return (
            <p className="text-xs font-medium text-zinc-500">
                No change {label}
            </p>
        );
    }

    if (comparison.kind === 'new') {
        const isPositive = comparison.direction === positiveDirection;
        return (
            <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                <span aria-hidden>↗</span> New {label}
            </p>
        );
    }

    const isUp = comparison.direction === 'up';
    const isPositive = comparison.direction === positiveDirection;
    const isCapped = comparison.kind === 'capped';
    const percentLabel = isCapped ? `${comparison.value}%+` : `${comparison.value}%`;

    return (
        <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            <span aria-hidden>{isUp ? '↗' : '↘'}</span>{' '}
            {percentLabel} {label}
        </p>
    );
}
