import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SettingsListItem({ to, icon: Icon, title, description, onClick, right }) {
    const className =
        'flex items-center gap-3 px-4 py-3.5 bg-surface hover:bg-surface-muted transition-colors group first:rounded-t-lg last:rounded-b-lg w-full text-left';

    const content = (
        <>
            {Icon ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-surface-muted text-foreground-muted group-hover:text-brand group-hover:border-brand/20 group-hover:bg-brand-light/50 transition-colors">
                    <Icon className="h-4 w-4" aria-hidden />
                </span>
            ) : null}
            <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium text-foreground">{title}</span>
                {description ? (
                    <span className="block text-[13px] text-foreground-muted mt-0.5 leading-snug">{description}</span>
                ) : null}
            </span>
            {right ?? (
                <ChevronRight
                    className="h-4 w-4 shrink-0 text-foreground-muted/50 group-hover:text-foreground-muted transition-colors"
                    aria-hidden
                />
            )}
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={className}>
                {content}
            </button>
        );
    }

    return (
        <Link to={to} className={className}>
            {content}
        </Link>
    );
}
