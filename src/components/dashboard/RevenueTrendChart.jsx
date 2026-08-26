import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { useTheme } from '../../context/ThemeContext';
import { getChartTheme } from '../../utils/chartTheme';
import ChartCard from './ChartCard';

function buildPlaceholderTrend(count = 12) {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
        const date = subMonths(now, count - 1 - index);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: format(date, 'MMM yyyy'),
            paid: 0,
            outstanding: 0,
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

function RevenueTooltip({ active, payload, theme }) {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className={theme.tooltipPanel}>
            <p className={theme.tooltipTitle}>{point.label}</p>
            <p className={`mt-1 ${theme.tooltipMuted}`}>
                Paid: <span className={theme.tooltipValue}>{formatCurrency(point.paid)}</span>
            </p>
            <p className={theme.tooltipMuted}>
                Outstanding:{' '}
                <span className={theme.tooltipValue}>{formatCurrency(point.outstanding)}</span>
            </p>
        </div>
    );
}

export default function RevenueTrendChart({ trend = [] }) {
    const { isDark } = useTheme();
    const chartTheme = getChartTheme(isDark);
    const chartData = trend.length ? trend : buildPlaceholderTrend();
    const hasData = trend.some((point) => point.paid > 0 || point.outstanding > 0);

    return (
        <ChartCard
            title="Revenue trend"
            subtitle="Paid and outstanding amounts by issue month"
            className="lg:col-span-2"
        >
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#16A34A" stopOpacity={hasData ? 0.22 : 0.08} />
                                <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: chartTheme.tick, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                            minTickGap={24}
                        />
                        <YAxis
                            tick={{ fill: chartTheme.tick, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatAxisCurrency}
                            width={56}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<RevenueTooltip theme={chartTheme} />} cursor={{ stroke: '#16A34A', strokeOpacity: 0.2 }} />
                        <Area
                            type="monotone"
                            dataKey="paid"
                            stroke="#16A34A"
                            strokeWidth={2.5}
                            strokeOpacity={hasData ? 1 : 0.35}
                            fill="url(#revenueTrendFill)"
                            dot={false}
                            activeDot={hasData ? { r: 4, fill: '#16A34A', stroke: chartTheme.activeDotStroke, strokeWidth: 2 } : false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {!hasData ? (
                <p className={chartTheme.emptyHint}>
                    Issue invoices or receipts to see monthly revenue trends.
                </p>
            ) : null}
        </ChartCard>
    );
}
