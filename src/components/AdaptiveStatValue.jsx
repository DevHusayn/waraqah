const SIZE_TIERS = {
    card: [
        'text-xl leading-tight',
        'text-lg leading-snug',
        'text-base leading-snug',
        'text-sm leading-snug',
    ],
    compact: [
        'text-lg leading-snug',
        'text-base leading-snug',
        'text-sm leading-snug',
        'text-xs leading-snug',
    ],
    grid: [
        'text-sm sm:text-base lg:text-lg leading-snug',
        'text-xs sm:text-sm lg:text-base leading-snug',
        'text-[11px] sm:text-xs lg:text-sm leading-snug',
        'text-[10px] sm:text-[11px] lg:text-xs leading-snug',
    ],
};

function resolveSizeTier(length) {
    if (length <= 9) return 0;
    if (length <= 13) return 1;
    if (length <= 17) return 2;
    return 3;
}

export function getAdaptiveStatSizeClass(value, variant = 'card') {
    const tiers = SIZE_TIERS[variant] ?? SIZE_TIERS.card;
    const length = String(value ?? '').length;
    return tiers[resolveSizeTier(length)];
}

/**
 * Stat amount that scales down as the formatted value gets longer.
 */
export default function AdaptiveStatValue({
    value,
    variant = 'card',
    className = '',
    valueClassName = '',
    as: Tag = 'p',
    children,
    ...rest
}) {
    const display = children ?? value ?? '—';
    const measurable = [value, display].find(
        (entry) => typeof entry === 'string' || typeof entry === 'number'
    );
    const sizeClass = getAdaptiveStatSizeClass(measurable ?? '', variant);
    const title =
        typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : typeof measurable === 'number' || typeof measurable === 'string'
              ? String(measurable)
              : undefined;
    const measurableLength = measurable != null ? String(measurable).length : 0;

    return (
        <Tag
            className={`stat-card-value ${sizeClass} ${valueClassName} ${className}`.trim()}
            title={title && measurableLength > 13 ? title : undefined}
            {...rest}
        >
            {display}
        </Tag>
    );
}
