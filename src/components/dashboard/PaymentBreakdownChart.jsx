import { useMemo } from 'react';
import ChartCard from './ChartCard';
import { PAYMENT_BREAKDOWN_ROWS } from './chartColors';

function BreakdownRow({ label, value, max, barClass, muted = false }) {
    const widthPercent = max > 0 ? Math.round((value / max) * 100) : 0;

    return (
        <div className={`space-y-1.5 ${muted ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground-muted">{label}</span>
                <span className="font-semibold text-foreground tabular-nums">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-muted overflow-hidden" aria-hidden>
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

    const issuedInPeriod = breakdown?.issuedInPeriod ?? 0;
    const overdue = breakdown?.overdue ?? 0;
    const maxValue = useMemo(() => Math.max(...rows.map((row) => row.value), 0), [rows]);
    const hasData = issuedInPeriod > 0 || overdue > 0;

    return (
        <ChartCard
            title="Payment breakdown"
            subtitle={
                hasData
                    ? `${issuedInPeriod} issued in ${periodLabel || 'selected period'} · overdue by due date in period`
                    : periodLabel
                      ? `Issued in ${periodLabel}`
                      : 'Documents issued in the selected period'
            }
        >
            <div className="flex h-[220px] flex-col justify-center gap-4 py-1">
                {rows.map((row) => (
                    <BreakdownRow
                        key={row.key}
                        label={row.label}
                        value={row.value}
                        max={maxValue}
                        barClass={row.barClass}
                        muted={!hasData}
                    />
                ))}
            </div>
            {!hasData ? (
                <p className="mt-1 text-center text-xs text-foreground-muted">
                    Create invoices or receipts to see your payment breakdown.
                </p>
            ) : null}
        </ChartCard>
    );
}
