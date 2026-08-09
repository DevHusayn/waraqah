const LOCKUP_GAP_PX = 4;

const SIZES = {
    sm: {
        text: 'text-[15px]',
        subtitle: 'text-xs',
        icon: 28,
    },
    md: {
        text: 'text-lg',
        subtitle: 'text-xs',
        icon: 36,
    },
    lg: {
        text: 'text-2xl',
        subtitle: 'text-sm',
        icon: 48,
    },
};

/**
 * Circular W mark — green badge on light backgrounds, white badge when inverted.
 */
export function WaraqahIcon({
    size = 'md',
    inverted = false,
    className = '',
}) {
    const s = SIZES[size] || SIZES.md;
    const src = inverted ? '/brand/waraqah-logo-light.svg' : '/brand/waraqah-logo.svg';

    return (
        <img
            src={src}
            alt=""
            width={s.icon}
            height={s.icon}
            className={`shrink-0 ${className}`.trim()}
            aria-hidden
        />
    );
}

/**
 * Brand wordmark — “Waraqah” in Bodoni Moda.
 */
export function WaraqahWordmark({
    size = 'md',
    inverted = false,
    className = '',
}) {
    const s = SIZES[size] || SIZES.md;
    const color = inverted ? 'text-white' : 'text-brand-hover';

    return (
        <span
            className={`inline-block font-brand font-semibold tracking-tight leading-none ${s.text} ${color} ${className}`}
            aria-label="Waraqah"
        >
            Waraqah
        </span>
    );
}

/**
 * Brand lockup: circular icon + Bodoni Moda wordmark (optionally with subtitle).
 */
export default function WaraqahLogo({
    size = 'md',
    inverted = false,
    subtitle,
    className = '',
    iconStyle,
    showIcon = true,
    align = 'start',
}) {
    const s = SIZES[size] || SIZES.md;
    const withIcon = showIcon !== false;
    const centered = align === 'center';

    return (
        <span
            className={`inline-flex min-w-0 flex-col ${
                centered ? 'items-center' : 'items-start'
            } justify-center ${className}`}
        >
            <span className="inline-flex min-w-0 items-center gap-1">
                {withIcon ? <WaraqahIcon size={size} inverted={inverted} /> : null}
                <WaraqahWordmark size={size} inverted={inverted} />
            </span>
            {subtitle?.trim() ? (
                <span
                    className={`mt-2 block w-full truncate font-sans leading-tight ${s.subtitle} ${
                        inverted ? 'text-zinc-300' : 'text-zinc-500'
                    } ${centered ? 'text-center' : ''}`}
                    style={withIcon && !centered ? { paddingLeft: `${s.icon + LOCKUP_GAP_PX}px` } : undefined}
                    title={subtitle}
                >
                    {subtitle}
                </span>
            ) : null}
        </span>
    );
}
