import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SettingsListItem({ to, icon: Icon, title, description }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-zinc-50/80 transition-colors group first:rounded-t-lg last:rounded-b-lg"
        >
            {Icon ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/60 bg-zinc-50 text-zinc-500 group-hover:text-brand group-hover:border-brand/20 group-hover:bg-brand-light/50 transition-colors">
                    <Icon className="h-4 w-4" aria-hidden />
                </span>
            ) : null}
            <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium text-zinc-950">{title}</span>
                {description ? (
                    <span className="block text-[13px] text-zinc-500 mt-0.5 leading-snug">{description}</span>
                ) : null}
            </span>
            <ChevronRight
                className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors"
                aria-hidden
            />
        </Link>
    );
}
