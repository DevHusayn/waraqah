import { FileText } from 'lucide-react';

const SIZES = {
    sm: {
        wrap: 'gap-2',
        iconBox: 'h-7 w-7 rounded-md',
        icon: 'h-3.5 w-3.5',
        text: 'text-[15px]',
        accent: 'h-0.5 w-5',
    },
    md: {
        wrap: 'gap-2.5',
        iconBox: 'h-9 w-9 rounded-md',
        icon: 'h-4 w-4',
        text: 'text-lg',
        accent: 'h-0.5 w-6',
    },
    lg: {
        wrap: 'gap-3',
        iconBox: 'h-11 w-11 rounded-lg',
        icon: 'h-5 w-5',
        text: 'text-2xl',
        accent: 'h-0.5 w-8',
    },
};

export function WaraqahWordmark({ size = 'md', inverted = false, showAccent = true, className = '' }) {
    const s = SIZES[size] || SIZES.md;
    const base = inverted ? 'text-white' : 'text-zinc-950';

    return (
        <span
            className={`inline-flex flex-col items-start leading-none ${className}`}
            aria-label="Waraqah"
        >
            <span className={`font-logo font-bold tracking-tight ${s.text} ${base}`}>
                Waraqah
            </span>
            {showAccent && (
                <span
                    className={`mt-1 rounded-full ${s.accent} ${
                        inverted ? 'bg-white/50' : 'bg-brand'
                    }`}
                    aria-hidden
                />
            )}
        </span>
    );
}

/**
 * Brand lockup: icon mark + wordmark.
 */
export default function WaraqahLogo({
    size = 'md',
    showIcon = true,
    showAccent = true,
    inverted = false,
    iconStyle = 'solid',
    subtitle,
    className = '',
}) {
    const s = SIZES[size] || SIZES.md;

    const iconBoxClass =
        iconStyle === 'solid'
            ? 'waraqah-logo-mark'
            : inverted
              ? 'bg-white/15 text-white'
              : 'bg-zinc-100 text-zinc-700';

    return (
        <span className={`inline-flex items-center min-w-0 ${s.wrap} ${className}`}>
            {showIcon && (
                <span
                    className={`flex shrink-0 items-center justify-center ${s.iconBox} ${iconBoxClass}`}
                    aria-hidden
                >
                    <FileText className={`${s.icon} shrink-0`} strokeWidth={2} />
                </span>
            )}
            <span className="min-w-0 flex flex-col items-start justify-center">
                <WaraqahWordmark size={size} inverted={inverted} showAccent={showAccent} />
                {subtitle?.trim() ? (
                    <span
                        className={`block w-full text-xs truncate mt-1 leading-tight ${
                            inverted ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                        title={subtitle}
                    >
                        {subtitle}
                    </span>
                ) : null}
            </span>
        </span>
    );
}
