import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import ChartCard from './ChartCard';
import EmptyState from '../EmptyState';
import { PAYMENT_BREAKDOWN_ROWS } from './chartColors';

function BreakdownRow({ label, value, max, barClass }) {
    const widthPercent = max > 0 ? Math.round((value / max) * 100) : 0;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-700">{label}</span>
                <span className="font-semibold text-zinc-950 tabular-nums">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden" aria-hidden>
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                    style={{ width: `${widthPercent}%` }}
                />
            </div>
        </div>
    );
}

export default function PaymentBreakdownChart({ breakdown, periodLabel }) {
    const rows = useMemo(
        () =>
            PAYMENT_BREAKDOWN_ROWS.map((row) => ({
                ...row,
                value: breakdown?.[row.key] ?? 0,
            })),
        [breakdown]
    );

    const total = breakdown?.total ?? 0;
    const maxValue = useMemo(() => Math.max(...rows.map((row) => row.value), 0), [rows]);
    const hasData = total > 0;

    return (
        <ChartCard
            title="Payment breakdown"
            subtitle={
                hasData
                    ? `Issued in ${periodLabel || 'selected month'} — ${total} total · fully paid shown above`
                    : periodLabel
                      ? `Issued in ${periodLabel}`
                      : 'Documents issued in the selected month'
            }
        >
            {!hasData ? (
                <div className="flex h-[220px] items-center justify-center">
                    <EmptyState
                        icon={Wallet}
                        title="No payment data yet"
                        description="Create invoices or receipts to see your payment breakdown."
                    />
                </div>
            ) : (
                <div className="flex h-[220px] flex-col justify-center gap-4 py-1">
                    {rows.map((row) => (
                        <BreakdownRow
                            key={row.key}
                            label={row.label}
                            value={row.value}
                            max={maxValue}
                            barClass={row.barClass}
                        />
                    ))}
                </div>
            )}
        </ChartCard>
    );
}
