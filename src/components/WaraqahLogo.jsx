import { FileText } from 'lucide-react';

const SIZES = {
    sm: {
        wrap: 'gap-2',
        iconBox: 'h-8 w-8 rounded-lg',
        icon: 'h-4 w-4',
        text: 'text-base',
        accent: 'h-0.5 w-6',
    },
    md: {
        wrap: 'gap-2.5',
        iconBox: 'h-10 w-10 rounded-xl',
        icon: 'h-5 w-5',
        text: 'text-lg',
        accent: 'h-0.5 w-7',
    },
    lg: {
        wrap: 'gap-3',
        iconBox: 'h-12 w-12 rounded-xl',
        icon: 'h-6 w-6',
        text: 'text-2xl',
        accent: 'h-0.5 w-9',
    },
};

/** Stylized wordmark: Wara + gradient qah */
export function WaraqahWordmark({ size = 'md', inverted = false, showAccent = true, className = '' }) {
    const s = SIZES[size] || SIZES.md;
    const base = inverted ? 'text-white' : 'text-slate-900';
    const gradient = inverted
        ? 'bg-gradient-to-r from-sky-200 to-white bg-clip-text text-transparent'
        : 'bg-gradient-to-r from-primary-600 to-sky-400 bg-clip-text text-transparent';

    return (
        <span
            className={`inline-flex flex-col items-start leading-none ${className}`}
            aria-label="Waraqah"
        >
            <span className={`font-logo font-extrabold tracking-tight ${s.text} ${base}`}>
                <span>Wara</span>
                <span className={gradient}>qah</span>
            </span>
            {showAccent && (
                <span
                    className={`mt-1 rounded-full ${s.accent} ${
                        inverted ? 'bg-white/70' : 'bg-gradient-to-r from-primary-600 to-sky-400'
                    }`}
                    aria-hidden
                />
            )}
        </span>
    );
}

/**
 * Brand lockup: icon mark + wordmark.
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} showIcon
 * @param {boolean} inverted - for dark backgrounds (landing CTA, etc.)
 * @param {'solid'|'soft'} iconStyle - solid brand fill vs light background
 */
export default function WaraqahLogo({
    size = 'md',
    showIcon = true,
    showAccent = true,
    inverted = false,
    iconStyle = 'solid',
    className = '',
}) {
    const s = SIZES[size] || SIZES.md;

    const iconBoxClass =
        iconStyle === 'solid'
            ? inverted
                ? 'bg-white text-primary-600 shadow-md'
                : 'waraqah-logo-mark'
            : inverted
              ? 'bg-white/15 text-white'
              : 'bg-brand-light text-primary-600';

    return (
        <span className={`inline-flex items-center min-w-0 ${s.wrap} ${className}`}>
            {showIcon && (
                <span
                    className={`flex shrink-0 items-center justify-center ${s.iconBox} ${iconBoxClass}`}
                    aria-hidden
                >
                    <FileText className={`${s.icon} shrink-0`} strokeWidth={2.25} />
                </span>
            )}
            <WaraqahWordmark size={size} inverted={inverted} showAccent={showAccent} />
        </span>
    );
}
