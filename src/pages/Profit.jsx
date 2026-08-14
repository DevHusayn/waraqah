import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Crown, Wallet } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MonthPickerField from '../components/MonthPickerField';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { StatementContentSkeleton } from '../components/Skeleton';
import ReportStatGrid, { ReportStatCell } from '../components/ReportStatGrid';
import { useSettings } from '../context/SettingsContext';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { useProfitSummaryQuery } from '../hooks/useProfitSummaryQuery';
import PaginationBar from '../components/PaginationBar';
import { useClientPagedList } from '../hooks/useClientPagedList';
import { formatCurrency } from '../utils/currency';
import { formatMarginPercent } from '../utils/margin';
import { isPremiumUser } from '../utils/premium';
import { getExpenseCategoryLabel } from '@waraqah/shared';
import { format } from 'date-fns';

const ProfitTrendChart = lazy(() => import('../components/dashboard/ProfitTrendChart'));

const PRODUCT_COLUMNS = [
    { key: 'product', label: 'Product', width: '28%' },
    { key: 'qty', label: 'Qty sold', className: 'text-right', width: '12%' },
    { key: 'revenue', label: 'Revenue', className: 'text-right', width: '16%' },
    { key: 'cogs', label: 'COGS', className: 'text-right', width: '14%' },
    { key: 'profit', label: 'Profit', className: 'text-right', width: '14%' },
    { key: 'margin', label: 'Margin', className: 'text-right', width: '12%' },
];

const EXPENSE_COLUMNS = [
    { key: 'category', label: 'Category', width: '40%' },
    { key: 'amount', label: 'Amount', className: 'text-right', width: '30%' },
    { key: 'share', label: '% of expenses', className: 'text-right', width: '30%' },
];

function ChartSkeleton() {
    return (
        <div className="card lg:col-span-2 min-h-[280px] animate-pulse">
            <div className="mb-4 space-y-2">
                <div className="h-4 w-32 rounded bg-zinc-200/80" />
                <div className="h-3 w-56 max-w-full rounded bg-zinc-200/80" />
            </div>
            <div className="h-[220px] rounded-lg bg-zinc-200/80" />
        </div>
    );
}

export default function Profit() {
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const {
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        summaryYear,
        summaryMonth,
        mode,
        setPeriodMode,
        queryPeriod,
        isCurrentPeriod,
        showComparison,
        comparisonLabel,
    } = usePeriodFilter();

    const { data, isPending, isFetching } = useProfitSummaryQuery(
        queryPeriod,
        summaryYear,
        summaryMonth,
        {
            enabled: premium,
        }
    );

    const productsPage = useClientPagedList(data?.byProduct, {
        resetKey: `${queryPeriod}-${summaryYear}-${summaryMonth}`,
    });

    const maxMonth = format(new Date(), 'yyyy-MM');

    if (!premium) {
        return (
            <div>
                <PageHeader
                    title="Profit"
                    subtitle="Track gross profit and margin across your paid sales"
                />
                <div className="premium-card max-w-lg mx-auto p-8">
                    <EmptyState
                        icon={Crown}
                        title="Understand your margins"
                        description="Upgrade to Premium to unlock profit analytics with product breakdowns, trends, and month-over-month comparisons."
                        action={
                            <Link to="/upgrade" className="premium-upgrade-btn text-sm py-2 px-4">
                                <Crown size={16} className="text-amber-600 shrink-0" aria-hidden />
                                Upgrade to Premium
                            </Link>
                        }
                    />
                </div>
            </div>
        );
    }

    const totals = data?.totals;
    const comparison = data?.comparison;
    const missingCostCount = totals?.linesMissingCost ?? 0;
    const grossProfit = totals?.grossProfit ?? 0;
    const totalExpenses = totals?.totalExpenses ?? 0;
    const netProfit = totals?.netProfit ?? grossProfit - totalExpenses;
    const profitPositive = grossProfit >= 0;
    const netPositive = netProfit >= 0;

    return (
        <div>
            <PageHeader
                title="Profit"
                subtitle={`Gross and net profit for ${periodLabel}`}
            />

            {isPending ? (
                <StatementContentSkeleton />
            ) : (
                <div className={`transition-opacity ${isFetching ? 'opacity-80' : ''}`}>
                    <div className="mb-4 flex justify-end">
                        <MonthPickerField
                            id="profit-month"
                            variant="compact"
                            portal
                            showPeriodPresets
                            periodMode={mode}
                            isThisMonth={isCurrentPeriod}
                            onPeriodModeChange={setPeriodMode}
                            value={monthInputValue}
                            onChange={setMonthInputValue}
                            displayLabel={periodLabel}
                            max={maxMonth}
                            triggerAriaLabel="Select profit period"
                        />
                    </div>

                    <ReportStatGrid>
                        <ReportStatCell
                            title="Gross profit"
                            value={formatCurrency(grossProfit)}
                            comparison={showComparison ? comparison?.grossProfit : null}
                            comparisonLabel={comparisonLabel}
                            valueClassName={profitPositive ? '' : 'text-red-600'}
                            reserveTrendSpace={showComparison}
                        />
                        <ReportStatCell
                            title="Total expenses"
                            value={formatCurrency(totalExpenses)}
                            comparison={showComparison ? comparison?.totalExpenses : null}
                            comparisonLabel={comparisonLabel}
                            positiveDirection="down"
                            reserveTrendSpace={showComparison}
                        />
                        <ReportStatCell
                            title="Net profit"
                            value={formatCurrency(netProfit)}
                            comparison={showComparison ? comparison?.netProfit : null}
                            comparisonLabel={comparisonLabel}
                            valueClassName={netPositive ? '' : 'text-red-600'}
                            reserveTrendSpace={showComparison}
                        />
                        <ReportStatCell
                            title="Gross margin"
                            value={formatMarginPercent(totals?.marginPercent ?? null)}
                            comparison={showComparison ? comparison?.marginPercent : null}
                            comparisonLabel={comparisonLabel}
                            reserveTrendSpace={showComparison}
                        />
                        <ReportStatCell
                            title="Net margin"
                            value={formatMarginPercent(totals?.netMarginPercent ?? null)}
                            comparison={showComparison ? comparison?.netMarginPercent : null}
                            comparisonLabel={comparisonLabel}
                            reserveTrendSpace={showComparison}
                        />
                        <ReportStatCell
                            title="Revenue"
                            value={formatCurrency(totals?.revenue ?? 0)}
                            comparison={showComparison ? comparison?.revenue : null}
                            comparisonLabel={comparisonLabel}
                            detail="Paid sales in period"
                            reserveTrendSpace={showComparison}
                        />
                    </ReportStatGrid>

                    {missingCostCount > 0 ? (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" aria-hidden />
                            <p>
                                {missingCostCount} catalog line {missingCostCount === 1 ? 'item still has' : 'items still have'} no
                                unit cost —{' '}
                                <Link to="/products" className="font-medium underline underline-offset-2">
                                    set unit cost on the linked products
                                </Link>
                                . Costs on invoices issued before that was set are filled in from the product catalog automatically.
                            </p>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <Suspense fallback={<ChartSkeleton />}>
                            <ProfitTrendChart trend={data?.trend} />
                        </Suspense>
                    </div>

                    <section className="mb-6">
                        <h2 className="text-sm font-semibold text-zinc-900 mb-3">By category</h2>
                        {data?.byExpenseCategory?.length ? (
                            <DataTable columns={EXPENSE_COLUMNS} fixedLayout minWidth={480}>
                                {data.byExpenseCategory.map((row) => (
                                    <DataTableRow key={row.category}>
                                        <DataTableCell>
                                            {getExpenseCategoryLabel(row.category)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {formatCurrency(row.amount ?? 0)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {row.sharePercent != null ? `${row.sharePercent}%` : '—'}
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                        ) : (
                            <div className="card">
                                <EmptyState
                                    icon={Wallet}
                                    title={mode === 'month' ? 'No expenses this month' : 'No expenses in this period'}
                                    description="Record operating costs on the Expenses page to see net profit."
                                    action={
                                        <Link to="/expenses" className="btn-secondary text-sm py-2 px-4">
                                            Go to Expenses
                                        </Link>
                                    }
                                />
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-zinc-900 mb-3">By product</h2>
                        {data?.byProduct?.length ? (
                            <>
                            <DataTable columns={PRODUCT_COLUMNS} fixedLayout minWidth={720} className="scroll-x-touch">
                                {productsPage.data.map((row) => (
                                    <DataTableRow key={row.productId}>
                                        <DataTableCell>
                                            <Link
                                                to={`/products/${row.productId}`}
                                                className="font-medium text-zinc-950 hover:text-brand"
                                            >
                                                {row.name}
                                            </Link>
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {Math.round((row.qtySold ?? 0) * 10) / 10}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {formatCurrency(row.revenue ?? 0)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {formatCurrency(row.cogs ?? 0)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums font-medium">
                                            {formatCurrency(row.grossProfit ?? 0)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            {formatMarginPercent(row.marginPercent ?? null)}
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                            <PaginationBar
                                pagination={productsPage.pagination}
                                onPageChange={productsPage.setPage}
                            />
                            </>
                        ) : (
                            <div className="card">
                                <EmptyState
                                    title={mode === 'month' ? 'No product sales this month' : 'No product sales in this period'}
                                    description="Paid invoices and receipts with catalog products will appear here."
                                />
                            </div>
                        )}
                    </section>

                    <p className="mt-6 text-xs text-zinc-500">
                        Gross profit is revenue minus cost of goods sold (COGS) on paid and partial sales only.
                        Net profit subtracts operating expenses recorded on{' '}
                        <Link to="/expenses" className="underline underline-offset-2">
                            Expenses
                        </Link>
                        . Pending and unpaid invoices are excluded. Receipts count once payment is recorded.
                    </p>
                </div>
            )}
        </div>
    );
}
