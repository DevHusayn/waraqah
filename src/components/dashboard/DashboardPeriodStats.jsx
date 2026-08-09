import { CheckCircle, Clock, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

function formatDocumentCounts(invoices, receipts) {
    const invoiceLabel = invoices === 1 ? 'invoice' : 'invoices';
    const receiptLabel = receipts === 1 ? 'receipt' : 'receipts';
    return `${invoices} ${invoiceLabel} · ${receipts} ${receiptLabel}`;
}

function TrendIndicator({ comparison, positiveDirection = 'up' }) {
    if (!comparison) return null;

    if (comparison.kind === 'unavailable') {
        return (
            <p className="text-xs font-medium text-zinc-500">
                — vs last month
            </p>
        );
    }

    if (comparison.kind === 'flat' || comparison.direction === 'flat') {
        return (
            <p className="text-xs font-medium text-zinc-500">
                No change vs last month
            </p>
        );
    }

    if (comparison.kind === 'new') {
        const isPositive = comparison.direction === positiveDirection;
        return (
            <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                <span aria-hidden>↗</span> New vs last month
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
            {percentLabel} vs last month
        </p>
    );
}

function PeriodStatCard({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    comparison,
    positiveDirection = 'up',
    detail,
    className = '',
}) {
    return (
        <div className={`stat-card min-w-0 ${className}`.trim()}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-zinc-500 font-medium leading-snug">{title}</p>
                <div className={`stat-card-icon shrink-0 ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
                </div>
            </div>
            <p className="stat-card-value" title={String(value)}>
                {value}
            </p>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3 min-h-[1rem]">
                <TrendIndicator comparison={comparison} positiveDirection={positiveDirection} />
                {detail ? (
                    <p className="text-[11px] text-zinc-500 sm:whitespace-nowrap sm:shrink-0">{detail}</p>
                ) : null}
            </div>
        </div>
    );
}

export default function DashboardPeriodStats({ summary, loading = false }) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className={`stat-card animate-pulse min-w-0${index === 2 ? ' col-span-2 sm:col-span-1' : ''}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="h-3 w-24 rounded bg-zinc-200/80" />
                            <div className="h-8 w-8 rounded-lg bg-zinc-200/80" />
                        </div>
                        <div className="h-6 w-28 rounded bg-zinc-200/80" />
                        <div className="h-3 w-32 rounded bg-zinc-200/80" />
                    </div>
                ))}
            </div>
        );
    }

    const current = summary?.current;
    const comparison = summary?.comparison;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <PeriodStatCard
                title="Total Revenue"
                value={formatCurrency(current?.totalRevenue ?? 0)}
                icon={FileText}
                iconBg="bg-brand-light"
                iconColor="text-brand"
                comparison={comparison?.totalRevenue}
            />
            <PeriodStatCard
                title="Outstanding"
                value={formatCurrency(current?.outstanding ?? 0)}
                icon={Clock}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                comparison={comparison?.outstanding}
                positiveDirection="down"
            />
            <PeriodStatCard
                title="Payments Received"
                value={String(current?.paymentsReceived ?? 0)}
                icon={CheckCircle}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                comparison={comparison?.paymentsReceived}
                detail={formatDocumentCounts(
                    current?.paidInvoices ?? 0,
                    current?.receiptsIssued ?? 0
                )}
                className="col-span-2 sm:col-span-1"
            />
        </div>
    );
}
