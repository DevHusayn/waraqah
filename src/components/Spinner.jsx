const SIZES = {
    xs: { svg: 'h-3.5 w-3.5', stroke: 3 },
    sm: { svg: 'h-4 w-4', stroke: 2.5 },
    md: { svg: 'h-5 w-5', stroke: 2.25 },
    lg: { svg: 'h-7 w-7', stroke: 2 },
    xl: { svg: 'h-9 w-9', stroke: 1.75 },
};

/**
 * Hybrid Linear / Vercel loading indicator — smooth arc on soft track.
 */
export default function Spinner({
    size = 'md',
    className = '',
    label,
    centered = false,
    inline = false,
}) {
    const s = SIZES[size] || SIZES.md;
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const arc = circumference * 0.72;

    const wrapClass = inline
        ? 'inline-flex items-center gap-2'
        : centered
          ? 'flex flex-col items-center justify-center gap-2.5'
          : 'inline-flex flex-col items-center gap-2.5';

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={`${wrapClass} ${className}`.trim()}
        >
            <svg
                className={`waraqah-spinner ${s.svg}`}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
            >
                <circle
                    className="waraqah-spinner-track"
                    cx="12"
                    cy="12"
                    r={radius}
                    strokeWidth={s.stroke}
                />
                <circle
                    className="waraqah-spinner-arc"
                    cx="12"
                    cy="12"
                    r={radius}
                    strokeWidth={s.stroke}
                    strokeDasharray={`${arc} ${circumference}`}
                    strokeDashoffset={0}
                />
            </svg>
            {label ? (
                <span className="text-[12px] font-medium text-zinc-500 tracking-normal">{label}</span>
            ) : (
                <span className="sr-only">Loading</span>
            )}
        </div>
    );
}

export function SpinnerOverlay({ label = 'Loading…' }) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-lg">
            <Spinner size="lg" label={label} centered />
        </div>
    );
}

/** Centered spinner for full-width page sections (detail views, lists). */
export function PageSpinner({ label = 'Loading…', className = '' }) {
    return (
        <div className={`flex items-center justify-center py-20 ${className}`.trim()}>
            <Spinner size="lg" label={label} centered />
        </div>
    );
}

/** Minimal public-route loader (no skeleton chrome). */
export function PublicPageSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
            <Spinner size="lg" centered />
        </div>
    );
}

export { PageLoader } from './Skeleton';
