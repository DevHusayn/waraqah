import { formatCurrency } from '../../utils/currency';
import MonthComparisonTrend from '../MonthComparisonTrend';

function formatDocumentCounts(invoices, receipts) {
    const invoiceLabel = invoices === 1 ? 'invoice' : 'invoices';
    const receiptLabel = receipts === 1 ? 'receipt' : 'receipts';
    return `${invoices} ${invoiceLabel} · ${receipts} ${receiptLabel}`;
}

function PeriodStatCard({
    title,
    value,
    comparison,
    positiveDirection = 'up',
    detail,
    valueClassName = '',
    className = '',
}) {
    return (
        <div className={`stat-card min-w-0 ${className}`.trim()}>
            <p className="text-xs text-zinc-500 font-medium leading-snug">{title}</p>
            <p className={`stat-card-value ${valueClassName}`.trim()} title={String(value)}>
                {value}
            </p>
            <div className="flex flex-col gap-1 min-h-[1rem]">
                <div className="min-w-0">
                    <MonthComparisonTrend comparison={comparison} positiveDirection={positiveDirection} />
                </div>
                {detail ? (
                    <p className="text-[11px] text-zinc-500 leading-snug">{detail}</p>
                ) : null}
            </div>
        </div>
    );
}

export default function DashboardPeriodStats({ summary, loading = false, premium = false }) {
    if (loading) {
        return (
            <div className={`grid grid-cols-2 ${premium ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-6`}>
                {Array.from({ length: premium ? 4 : 3 }).map((_, index) => (
                    <div
                        key={index}
                        className={`stat-card animate-pulse min-w-0${
                            !premium && index === 2 ? ' col-span-2 sm:col-span-1' : ''
                        }`}
                    >
                        <div className="h-3 w-24 rounded bg-zinc-200/80" />
                        <div className="h-6 w-28 rounded bg-zinc-200/80" />
                        <div className="h-3 w-32 rounded bg-zinc-200/80" />
                        {!premium && index === 2 ? (
                            <div className="h-3 w-40 rounded bg-zinc-200/80" />
                        ) : null}
                    </div>
                ))}
            </div>
        );
    }

    const current = summary?.current;
    const comparison = summary?.comparison;
    const grossProfit = current?.grossProfit ?? 0;
    const profitPositive = grossProfit >= 0;

    return (
        <div className={`grid grid-cols-2 ${premium ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-6`}>
            <PeriodStatCard
                title="Total Revenue"
                value={formatCurrency(current?.totalRevenue ?? 0)}
                comparison={comparison?.totalRevenue}
            />
            <PeriodStatCard
                title="Outstanding"
                value={formatCurrency(current?.outstanding ?? 0)}
                comparison={comparison?.outstanding}
                positiveDirection="down"
            />
            <PeriodStatCard
                title="Fully received payment"
                value={String(current?.paymentsReceived ?? 0)}
                comparison={comparison?.paymentsReceived}
                detail={formatDocumentCounts(
                    current?.paidInvoices ?? 0,
                    current?.receiptsIssued ?? 0
                )}
                className={premium ? '' : 'col-span-2 sm:col-span-1'}
            />
            {premium ? (
                <PeriodStatCard
                    title="Gross profit"
                    value={formatCurrency(grossProfit)}
                    valueClassName={profitPositive ? '' : 'text-red-600'}
                    comparison={comparison?.grossProfit}
                />
            ) : null}
        </div>
    );
}
