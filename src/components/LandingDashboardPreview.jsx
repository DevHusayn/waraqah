import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatCurrency } from '../utils/currency';
import { PAYMENT_BREAKDOWN_ROWS } from './dashboard/chartColors';

/** Demo trend: Jul paid matches Total Revenue; MoM deltas match stat card comparisons. */
const BASE_TREND = [
    { label: 'Feb 2026', paid: 620_000, outstanding: 720_000 },
    { label: 'Mar 2026', paid: 710_000, outstanding: 780_000 },
    { label: 'Apr 2026', paid: 820_000, outstanding: 820_000 },
    { label: 'May 2026', paid: 890_000, outstanding: 880_000 },
    { label: 'Jun 2026', paid: 1_055_000, outstanding: 994_000 },
    { label: 'Jul 2026', paid: 1_245_000, outstanding: 875_000 },
];

const SAMPLE_BREAKDOWN = {
    partialInvoices: 2,
    partialReceipts: 1,
    pending: 5,
    overdue: 3,
    total: 25,
};

const SAMPLE_COMPARISONS = {
    totalRevenue: { kind: 'percent', direction: 'up', value: 18 },
    outstanding: { kind: 'percent', direction: 'down', value: 12 },
    paymentsReceived: { kind: 'percent', direction: 'up', value: 27 },
    grossProfit: { kind: 'percent', direction: 'up', value: 22 },
};

/** Y-axis headroom so the peak month is not clipped. */
const TREND_Y_MAX = Math.max(...BASE_TREND.map((point) => point.paid)) * 1.12;

const SAMPLE_STATS = {
    totalRevenue: 1_245_000,
    outstanding: 875_000,
    paymentsReceived: 14,
    paidInvoices: 9,
    paidReceipts: 5,
    grossProfit: 412_000,
    monthLabel: 'Jul 2026',
};

function formatAxisCurrency(value) {
    const amount = Number(value) || 0;
    const abs = Math.abs(amount);
    const symbol = formatCurrency(0).replace(/[\d.,\s]/g, '').trim() || '₦';

    if (abs >= 1_000_000) {
        return `${symbol}${(amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    }
    if (abs >= 1_000) {
        return `${symbol}${(amount / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
    }
    return formatCurrency(amount);
}

function MiniStat({
    title,
    value,
    comparison,
    positiveDirection = 'up',
    detail,
}) {
    return (
        <div className="rounded-md border border-zinc-200/60 bg-white p-2.5 shadow-soft min-w-0 flex flex-col gap-1.5">
            <p className="text-[9px] font-medium text-zinc-500 leading-snug">{title}</p>
            <p className="text-[13px] font-semibold text-zinc-950 tabular-nums tracking-tight truncate leading-tight">
                {value}
            </p>
            <div className="flex flex-col gap-0.5 min-h-[1rem]">
                <MiniComparisonTrend comparison={comparison} positiveDirection={positiveDirection} />
                {detail ? (
                    <p className="text-[8px] text-zinc-500 truncate">{detail}</p>
                ) : null}
            </div>
        </div>
    );
}

function MiniComparisonTrend({ comparison, positiveDirection }) {
    if (!comparison) return null;

    const label = 'vs last month';

    if (comparison.kind === 'flat' || comparison.direction === 'flat') {
        return <p className="text-[8px] font-medium text-zinc-500">No change {label}</p>;
    }

    const isUp = comparison.direction === 'up';
    const isPositive = comparison.direction === positiveDirection;
    const isCapped = comparison.kind === 'capped';
    const percentLabel = isCapped ? `${comparison.value}%+` : `${comparison.value}%`;
    const color = isPositive ? 'text-green-600' : 'text-red-500';

    return (
        <p className={`text-[8px] font-medium ${color}`}>
            <span aria-hidden>{isUp ? '↗' : '↘'}</span> {percentLabel} {label}
        </p>
    );
}

function RevenueTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-md border border-zinc-200/80 bg-white px-2.5 py-1.5 shadow-soft text-[10px]">
            <p className="font-medium text-zinc-950">{point.label}</p>
            <p className="mt-0.5 text-zinc-600">
                Paid: <span className="font-medium text-zinc-950">{formatCurrency(point.paid)}</span>
            </p>
            <p className="text-zinc-600">
                Outstanding:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.outstanding)}</span>
            </p>
        </div>
    );
}

function BreakdownRow({ label, value, max, barClass }) {
    const widthPercent = max > 0 ? Math.round((value / max) * 100) : 0;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[9px]">
                <span className="text-zinc-700 truncate">{label}</span>
                <span className="font-semibold text-zinc-950 tabular-nums shrink-0">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden" aria-hidden>
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                    style={{ width: `${widthPercent}%` }}
                />
            </div>
        </div>
    );
}

export default function LandingDashboardPreview() {
    const breakdownRows = PAYMENT_BREAKDOWN_ROWS.map((row) => ({
        ...row,
        value: SAMPLE_BREAKDOWN[row.key] ?? 0,
    }));
    const maxBreakdown = Math.max(...breakdownRows.map((row) => row.value), 1);

    return (
        <div className="landing-dashboard-preview text-left">
            <div className="px-3 pt-2.5 pb-1 flex justify-end bg-white">
                <div className="rounded-md border border-zinc-200/80 bg-white px-2 py-1 text-[9px] font-medium text-zinc-700 tabular-nums shadow-sm">
                    {SAMPLE_STATS.monthLabel}
                    <span className="ml-1 text-zinc-400" aria-hidden>▾</span>
                </div>
            </div>

            <div className="px-3 pb-3 space-y-2.5 bg-white">
                <div className="grid grid-cols-2 gap-2">
                    <MiniStat
                        title="Total Revenue"
                        value={formatCurrency(SAMPLE_STATS.totalRevenue)}
                        comparison={SAMPLE_COMPARISONS.totalRevenue}
                    />
                    <MiniStat
                        title="Outstanding"
                        value={formatCurrency(SAMPLE_STATS.outstanding)}
                        comparison={SAMPLE_COMPARISONS.outstanding}
                        positiveDirection="down"
                    />
                    <MiniStat
                        title="Fully received payment"
                        value={String(SAMPLE_STATS.paymentsReceived)}
                        comparison={SAMPLE_COMPARISONS.paymentsReceived}
                        detail={`${SAMPLE_STATS.paidInvoices} invoices · ${SAMPLE_STATS.paidReceipts} receipts`}
                    />
                    <MiniStat
                        title="Gross profit"
                        value={formatCurrency(SAMPLE_STATS.grossProfit)}
                        comparison={SAMPLE_COMPARISONS.grossProfit}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-2">
                    <div className="rounded-md border border-zinc-200/60 bg-white p-2.5 shadow-soft min-w-0">
                        <div className="mb-2">
                            <p className="text-[10px] font-semibold text-zinc-950">Revenue trend</p>
                            <p className="text-[8px] text-zinc-500 mt-0.5 leading-snug">
                                Paid and outstanding amounts by issue month
                            </p>
                        </div>
                        <div className="h-[108px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={BASE_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="landingRevenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#16A34A" stopOpacity={0.22} />
                                            <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#71717a', fontSize: 7 }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        minTickGap={8}
                                    />
                                    <YAxis
                                        tick={{ fill: '#71717a', fontSize: 7 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={formatAxisCurrency}
                                        width={34}
                                        domain={[0, TREND_Y_MAX]}
                                    />
                                    <Tooltip
                                        content={<RevenueTooltip />}
                                        cursor={{ stroke: '#16A34A', strokeOpacity: 0.2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="paid"
                                        stroke="#16A34A"
                                        strokeWidth={2}
                                        fill="url(#landingRevenueTrendFill)"
                                        dot={false}
                                        activeDot={{ r: 3, fill: '#16A34A', stroke: '#fff', strokeWidth: 1.5 }}
                                        isAnimationActive
                                        animationDuration={900}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-md border border-zinc-200/60 bg-white p-2.5 shadow-soft min-w-0">
                        <div className="mb-2">
                            <p className="text-[10px] font-semibold text-zinc-950">Payment breakdown</p>
                            <p className="text-[7px] text-zinc-500 mt-0.5 leading-snug">
                                Issued in {SAMPLE_STATS.monthLabel}, {SAMPLE_BREAKDOWN.total} total · fully paid shown above
                            </p>
                        </div>
                        <div className="flex flex-col justify-center gap-2.5 py-0.5">
                            {breakdownRows.map((row) => (
                                <BreakdownRow
                                    key={row.key}
                                    label={row.label}
                                    value={row.value}
                                    max={maxBreakdown}
                                    barClass={row.barClass}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
