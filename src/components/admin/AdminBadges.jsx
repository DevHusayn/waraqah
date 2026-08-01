import { Ban, CheckCircle, Crown } from 'lucide-react';

export function StatusBadge({ status }) {
    const active = status === 'active';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}
        >
            {active ? <CheckCircle size={12} aria-hidden /> : <Ban size={12} aria-hidden />}
            {status || 'unknown'}
        </span>
    );
}

export function PlanBadge({ plan }) {
    const premium = plan === 'premium';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                premium ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
            }`}
        >
            {premium ? <Crown size={12} aria-hidden /> : null}
            {plan || 'free'}
        </span>
    );
}

export function UsageBadge({ usage }) {
    if (!usage || usage.unlimited) {
        return (
            <span className="text-xs font-medium text-zinc-500">Unlimited</span>
        );
    }
    const atLimit = !usage.canCreate;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums ${
                atLimit
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
            }`}
        >
            {usage.used}/{usage.limit} this month
        </span>
    );
}

export function PaymentStatusBadge({ status }) {
    const key = (status || 'pending').toLowerCase();
    const styles = {
        success: 'bg-green-50/80 text-green-800 border-green-200/60',
        pending: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
        failed: 'bg-red-50/80 text-red-800 border-red-200/60',
    };
    const style = styles[key] || styles.pending;
    const label = key === 'success' ? 'Paid' : key;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${style}`}
        >
            {label}
        </span>
    );
}

export function UserAvatar({ name, email, size = 'lg' }) {
    const label = (name || email || '?').trim();
    const initials = label
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || '?';

    const sizes = {
        lg: 'h-14 w-14 text-lg',
        md: 'h-10 w-10 text-sm',
    };

    return (
        <div
            className={`${sizes[size] || sizes.lg} rounded-xl bg-brand-light text-brand font-semibold flex items-center justify-center shrink-0`}
            aria-hidden
        >
            {initials}
        </div>
    );
}
