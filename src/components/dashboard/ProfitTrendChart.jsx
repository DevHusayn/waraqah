import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import ChartCard from './ChartCard';

function buildPlaceholderTrend(count = 12) {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
        const date = subMonths(now, count - 1 - index);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: format(date, 'MMM yyyy'),
            grossProfit: 0,
            totalExpenses: 0,
            netProfit: 0,
            revenue: 0,
        };
    });
}

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

function ProfitTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 shadow-soft text-xs">
            <p className="font-medium text-zinc-950">{point.label}</p>
            <p className="mt-1 text-zinc-600">
                Net profit:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.netProfit ?? 0)}</span>
            </p>
            <p className="text-zinc-600">
                Gross profit:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.grossProfit ?? 0)}</span>
            </p>
            <p className="text-zinc-600">
                Expenses:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.totalExpenses ?? 0)}</span>
            </p>
            <p className="text-zinc-600">
                Revenue:{' '}
                <span className="font-medium text-zinc-950">{formatCurrency(point.revenue ?? 0)}</span>
            </p>
        </div>
    );
}

export default function ProfitTrendChart({ trend = [] }) {
    const chartData = trend.length
        ? trend.map((point) => ({
              ...point,
              netProfit: point.netProfit ?? (point.grossProfit ?? 0) - (point.totalExpenses ?? 0),
              totalExpenses: point.totalExpenses ?? 0,
          }))
        : buildPlaceholderTrend();

    const hasData = chartData.some(
        (point) => (point.grossProfit ?? 0) > 0 || (point.totalExpenses ?? 0) > 0
    );

    return (
        <ChartCard
            title="Profit trend"
            subtitle="Net profit by month (gross profit minus expenses)"
            className="lg:col-span-2"
        >
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="netProfitTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#059669" stopOpacity={hasData ? 0.22 : 0.08} />
                                <stop offset="100%" stopColor="#059669" stopOpacity={0} />
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
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<ProfitTooltip />} cursor={{ stroke: '#059669', strokeOpacity: 0.2 }} />
                        <Area
                            type="monotone"
                            dataKey="netProfit"
                            stroke="#059669"
                            strokeWidth={2.5}
                            strokeOpacity={hasData ? 1 : 0.35}
                            fill="url(#netProfitTrendFill)"
                            dot={false}
                            activeDot={hasData ? { r: 4, fill: '#059669', stroke: '#fff', strokeWidth: 2 } : false}
                        />
                        <Line
                            type="monotone"
                            dataKey="grossProfit"
                            stroke="#7C3AED"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            strokeOpacity={hasData ? 0.7 : 0.25}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {!hasData ? (
                <p className="mt-3 text-center text-xs text-zinc-500">
                    Add unit costs on products, record paid sales, and log expenses to see profit trends.
                </p>
            ) : null}
        </ChartCard>
    );
}
