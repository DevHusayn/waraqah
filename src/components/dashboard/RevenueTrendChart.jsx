import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatCurrency } from '../../utils/currency';
import ChartCard from './ChartCard';
import EmptyState from '../EmptyState';
import { TrendingUp } from 'lucide-react';

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

function RevenueTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 shadow-soft text-xs">
            <p className="font-medium text-zinc-950">{point.label}</p>
            <p className="mt-1 text-zinc-600">
                Paid: <span className="font-medium text-zinc-950">{formatCurrency(point.paid)}</span>
            </p>
            <p className="text-zinc-600">
                Outstanding:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.outstanding)}</span>
            </p>
        </div>
    );
}

export default function RevenueTrendChart({ trend = [] }) {
    const hasData = trend.some((point) => point.paid > 0 || point.outstanding > 0);

    return (
        <ChartCard
            title="Revenue trend"
            subtitle="Paid and outstanding amounts by invoice issue month"
            className="lg:col-span-2"
        >
            {!hasData ? (
                <div className="flex h-[220px] items-center justify-center">
                    <EmptyState
                        icon={TrendingUp}
                        title="No revenue data yet"
                        description="Issue invoices to see monthly revenue trends."
                    />
                </div>
            ) : (
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#16A34A" stopOpacity={0.22} />
                                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#71717a', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                                minTickGap={24}
                            />
                            <YAxis
                                tick={{ fill: '#71717a', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatAxisCurrency}
                                width={56}
                            />
                            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#16A34A', strokeOpacity: 0.2 }} />
                            <Area
                                type="monotone"
                                dataKey="paid"
                                stroke="#16A34A"
                                strokeWidth={2.5}
                                fill="url(#revenueTrendFill)"
                                dot={false}
                                activeDot={{ r: 4, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartCard>
    );
}
