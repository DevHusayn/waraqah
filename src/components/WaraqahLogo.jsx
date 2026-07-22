const SIZES = {
    sm: {
        text: 'text-[15px]',
        subtitle: 'text-xs',
    },
    md: {
        text: 'text-lg',
        subtitle: 'text-xs',
    },
    lg: {
        text: 'text-2xl',
        subtitle: 'text-sm',
    },
};

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
 * Brand lockup: Bodoni Moda wordmark (optionally with subtitle).
 * Extra props (showIcon, showAccent, iconStyle) are accepted by callers and ignored.
 */
export default function WaraqahLogo({
    size = 'md',
    inverted = false,
    subtitle,
    className = '',
}) {
    const s = SIZES[size] || SIZES.md;

    return (
        <span className={`inline-flex min-w-0 flex-col items-start justify-center ${className}`}>
            <WaraqahWordmark size={size} inverted={inverted} />
            {subtitle?.trim() ? (
                <span
                    className={`mt-1 block w-full truncate font-sans leading-tight ${s.subtitle} ${
                        inverted ? 'text-zinc-300' : 'text-zinc-500'
                    }`}
                    title={subtitle}
                >
                    {subtitle}
                </span>
            ) : null}
        </span>
    );
}
