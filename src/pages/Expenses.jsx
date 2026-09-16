import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Crown, ListFilter, Plus, Repeat, Search, Wallet } from 'lucide-react';
import {
    MANUAL_EXPENSE_CATEGORIES,
    getExpenseCategoryLabel,
} from '@waraqah/shared';
import CustomSelect from '../components/CustomSelect';
import FilterTabs from '../components/FilterTabs';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ExpenseFormModal, { EMPTY_EXPENSE } from '../components/ExpenseFormModal';
import StaffPayrollPanel from '../components/StaffPayrollPanel';
import MonthPickerField from '../components/MonthPickerField';
import MonthComparisonTrend from '../components/MonthComparisonTrend';
import AdaptiveStatValue from '../components/AdaptiveStatValue';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import { ListPageSkeleton } from '../components/Skeleton';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { useExpenseSummaryQuery } from '../hooks/useExpenseSummaryQuery';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { formatCurrency } from '../utils/currency';
import useBusinessCurrency from '../hooks/useBusinessCurrency';
import { isPremiumUser } from '../utils/premium';
import { invalidateExpenseQueries } from '../lib/queryClient';
import {
    expensePayeePath,
    formatPayeeCategorySummary,
    formatPayeePaymentCount,
} from '../utils/expensePayee';
import ListSortSelect from '../components/ListSortSelect';

const FILTER_ALL = 'all';
const VIEW_EXPENSES = 'expenses';
const VIEW_PAYROLL = 'payroll';

const VIEW_TABS = [
    { value: VIEW_EXPENSES, label: 'Expenses' },
    { value: VIEW_PAYROLL, label: 'Staff payroll' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
    { value: 'recurring', label: 'Recurring' },
];

const COLUMNS = [
    { key: 'name', label: 'Paid to', width: '28%' },
    { key: 'categories', label: 'Categories', width: '32%' },
    { key: 'payments', label: 'Payments', width: '16%' },
    { key: 'amount', label: 'Amount', className: 'text-right', width: '24%' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

const mapListRow = (entry) => ({ ...entry, id: entry._id || entry.id });

function payeeRowHref(row) {
    if (row.kind === 'expense') return `/expenses/${row.id}`;
    return expensePayeePath(row.name);
}

export default function Expenses() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const currency = useBusinessCurrency();

    const {
        periodLabel,
        isCurrentPeriod,
        mode,
        setPeriodMode,
        queryParams,
        showComparison,
        comparisonLabel,
        customDraftStartDate,
        customDraftEndDate,
        setCustomDraftRange,
        applyCustomRange,
        maxDate,
    } = usePeriodFilter();

    const [view, setView] = useState(VIEW_EXPENSES);
    const [addStaffKey, setAddStaffKey] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
    const [sortBy, setSortBy] = useState('newest');
    const recurringOnly = sortBy === 'recurring';
    const sortParam = recurringOnly ? 'newest' : sortBy;

    const listParams = useMemo(() => {
        const next = { ...queryParams, sort: sortParam };
        if (recurringOnly) next.recurring = true;
        if (categoryFilter && categoryFilter !== FILTER_ALL) next.category = categoryFilter;
        return next;
    }, [queryParams, categoryFilter, recurringOnly, sortParam]);

    const hasListFilters = categoryFilter !== FILTER_ALL || recurringOnly;

    const fetcher = useCallback(
        ({ page, limit, search, sort, period, startDate, endDate, recurring, category }) =>
            apiFetch(
                `/expenses/payees?${buildListQuery({
                    page,
                    limit,
                    search,
                    sort,
                    period,
                    startDate,
                    endDate,
                    recurring,
                    category,
                })}`
            ),
        []
    );

    const {
        setPage,
        search,
        setSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedQuery({
        queryKeyBase: 'expensePayees',
        fetcher,
        extraParams: listParams,
    });

    const { data: summary, isFetching: summaryFetching } = useExpenseSummaryQuery(queryParams);

    const rows = data.map(mapListRow);

    const filterOptions = useMemo(() => {
        const selectableIds = new Set(MANUAL_EXPENSE_CATEGORIES.map((category) => category.id));
        const extraCategories = (summary?.byCategory || [])
            .map((row) => row.category)
            .filter((category) => category && !selectableIds.has(category));
        if (
            categoryFilter &&
            categoryFilter !== FILTER_ALL &&
            !selectableIds.has(categoryFilter) &&
            !extraCategories.includes(categoryFilter)
        ) {
            extraCategories.push(categoryFilter);
        }
        return [
            { value: FILTER_ALL, label: 'All categories' },
            ...MANUAL_EXPENSE_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.label,
            })),
            ...extraCategories.map((category) => ({
                value: category,
                label: getExpenseCategoryLabel(category),
            })),
        ];
    }, [summary, categoryFilter]);

    const topCategories = useMemo(
        () => (summary?.byCategory || []).slice(0, 4),
        [summary]
    );

    const openModal = () => {
        setModalInitialData({
            ...EMPTY_EXPENSE,
            date: format(new Date(), 'yyyy-MM-dd'),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalInitialData(EMPTY_EXPENSE);
    };

    const handleSubmit = async (formData) => {
        try {
            const created = await apiFetch('/expenses', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            showToast('Expense added successfully', 'success');
            closeModal();
            invalidateExpenseQueries(user?.id);
            const vendor = String(formData.vendor || '').trim();
            if (vendor) {
                navigate(expensePayeePath(vendor));
                return;
            }
            await refresh();
            await refresh();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save expense.',
                type: 'error',
            });
            throw err;
        }
    };

    const showTableSkeleton = loading && rows.length === 0;

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ExpenseFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingExpense={null}
                initialData={modalInitialData}
            />

            <PageHeader
                title="Expenses"
                subtitle={
                    view === VIEW_PAYROLL
                        ? 'Record your team and mark salaries paid each month'
                        : 'Track running costs for your business'
                }
            >
                {view === VIEW_PAYROLL ? (
                    <button
                        type="button"
                        onClick={() => setAddStaffKey((key) => key + 1)}
                        className="btn-primary"
                    >
                        <Plus size={16} aria-hidden />
                        Add staff
                    </button>
                ) : (
                    <button type="button" onClick={() => openModal()} className="btn-primary">
                        <Plus size={16} aria-hidden />
                        Add expense
                    </button>
                )}
            </PageHeader>

            <FilterTabs
                tabs={VIEW_TABS}
                value={view}
                onChange={(next) => {
                    setView(next);
                    setAddStaffKey(0);
                }}
                className="mb-4"
            />

            {view === VIEW_PAYROLL ? <StaffPayrollPanel openAddKey={addStaffKey} /> : null}

            {view === VIEW_EXPENSES ? (
            <>

            <section
                className={`mb-6 overflow-hidden rounded-xl border border-border/80 bg-surface shadow-soft transition-opacity ${
                    summaryFetching ? 'opacity-80' : ''
                }`}
                aria-label="Expense summary"
            >
                <div className="flex items-start justify-between gap-3 p-4 sm:gap-6 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground-muted">Total expenses</p>
                        <AdaptiveStatValue
                            value={formatCurrency(summary?.totals?.totalExpenses ?? 0, currency)}
                            variant="card"
                            className="mt-1"
                        />
                        <div className="mt-1.5 min-h-[1rem]">
                            {showComparison ? (
                                <MonthComparisonTrend
                                    comparison={summary?.comparison?.totalExpenses}
                                    label={comparisonLabel}
                                    positiveDirection="down"
                                />
                            ) : (
                                <p className="text-xs text-foreground-muted">{periodLabel}</p>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <MonthPickerField
                            variant="compact"
                            portal
                            showPeriodPresets
                            periodMode={mode}
                            isThisMonth={isCurrentPeriod}
                            onPeriodModeChange={setPeriodMode}
                            displayLabel={periodLabel}
                            maxDate={maxDate}
                            customDraftStartDate={customDraftStartDate}
                            customDraftEndDate={customDraftEndDate}
                            onCustomDraftRangeChange={setCustomDraftRange}
                            onCustomApply={applyCustomRange}
                            triggerAriaLabel={`Change period from ${periodLabel}`}
                        />
                    </div>
                </div>

                {topCategories.length ? (
                    <div className="border-t border-border/70 bg-surface-muted/40 px-4 py-3 sm:px-5">
                        <div className="flex flex-wrap gap-2">
                            {topCategories.map((row) => (
                                <span
                                    key={row.category}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs text-foreground-muted"
                                >
                                    <span>{row.label}</span>
                                    <span className="font-medium tabular-nums text-foreground">
                                        {formatCurrency(row.amount, currency)}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>

            {!premium ? (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-violet-200/80 bg-violet-50/60 px-4 py-3 text-sm text-violet-950">
                    <Crown className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                    <p>
                        Record expenses on any plan.{' '}
                        <Link to="/upgrade" className="font-medium underline underline-offset-2">
                            Upgrade to Premium
                        </Link>{' '}
                        to see net profit alongside gross profit.
                    </p>
                </div>
            ) : null}

            <Toolbar className="mb-4">
                <ToolbarSearch
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search name or description…"
                    icon={Search}
                    aria-label="Search expenses"
                />
                <ToolbarActions>
                    <div className="min-w-0 sm:w-48 sm:flex-none">
                        <CustomSelect
                            value={categoryFilter}
                            onChange={(next) => {
                                setCategoryFilter(next);
                                setPage(1);
                            }}
                            options={filterOptions}
                            placeholder="Category"
                            leadingIcon={<ListFilter size={14} />}
                            aria-label="Filter expenses by category"
                        />
                    </div>
                    <ListSortSelect
                        value={sortBy}
                        onChange={(next) => {
                            setSortBy(next);
                            setPage(1);
                        }}
                        options={SORT_OPTIONS}
                        ariaLabel="Sort or filter expenses"
                    />
                </ToolbarActions>
            </Toolbar>

            {showTableSkeleton ? (
                <ListPageSkeleton
                    rows={8}
                    columns={4}
                    withHeader={false}
                    withToolbar={false}
                    withAction={false}
                />
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={Wallet}
                    title={
                        search
                            ? 'No expenses found'
                            : recurringOnly
                              ? 'No recurring expenses'
                              : hasListFilters
                                ? 'No matching expenses'
                                : mode === 'month'
                                  ? 'No expenses this month'
                                  : mode === 'last-month'
                                    ? 'No expenses last month'
                                    : mode === 'last-week'
                                      ? 'No expenses last week'
                                      : 'No expenses in this period'
                    }
                    description={
                        search
                            ? 'Try a different search term.'
                            : recurringOnly
                              ? 'None of your expenses are set to repeat.'
                              : hasListFilters
                                ? 'Try a different filter or add an expense in this group.'
                                : 'Add rent, transport, and other running costs.'
                    }
                    action={
                        !search ? (
                            <button type="button" onClick={() => openModal()} className="btn-primary">
                                <Plus size={16} aria-hidden />
                                Add expense
                            </button>
                        ) : null
                    }
                />
            ) : (
                <>
                    <div className={`md:hidden rounded-lg border border-border/60 bg-surface shadow-soft overflow-hidden divide-y divide-border/50 transition-opacity ${summaryFetching ? 'opacity-80' : ''}`}>
                        {rows.map((row) => {
                            const isPayee = row.kind !== 'expense';
                            const title = isPayee
                                ? row.name
                                : getExpenseCategoryLabel(row.category);
                            const amount = isPayee ? row.total : row.amount;
                            const subtitle = isPayee
                                ? `${formatPayeePaymentCount(row.count)} · ${formatPayeeCategorySummary(row.categories, getExpenseCategoryLabel)}`
                                : [formatDisplayDate(row.date), row.description].filter(Boolean).join(' · ');

                            return (
                                <Link
                                    key={row.id}
                                    to={payeeRowHref(row)}
                                    className="flex items-start gap-2 px-4 py-3.5 hover:bg-surface-muted/70"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-medium text-foreground break-words">
                                                {title}
                                            </p>
                                            <p className="shrink-0 tabular-nums font-semibold text-foreground">
                                                {formatCurrency(amount || 0, currency)}
                                            </p>
                                        </div>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-foreground-muted">
                                            <span>{subtitle}</span>
                                            {row.isRecurring ? (
                                                <Repeat size={11} className="text-brand" aria-label="Recurring" />
                                            ) : null}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden md:block">
                        <DataTable
                            columns={COLUMNS}
                            fixedLayout
                            className={`transition-opacity ${summaryFetching ? 'opacity-80' : ''}`}
                        >
                            {rows.map((row) => {
                                const isPayee = row.kind !== 'expense';
                                const title = isPayee
                                    ? row.name
                                    : getExpenseCategoryLabel(row.category) || 'Expense';
                                const amount = isPayee ? row.total : row.amount;
                                const categories = isPayee
                                    ? formatPayeeCategorySummary(row.categories, getExpenseCategoryLabel)
                                    : (row.description || '—');
                                const payments = isPayee
                                    ? formatPayeePaymentCount(row.count)
                                    : formatDisplayDate(row.date);

                                return (
                                    <DataTableRow
                                        key={row.id}
                                        onClick={() => navigate(payeeRowHref(row))}
                                        className="cursor-pointer"
                                    >
                                        <DataTableCell>
                                            <span className="inline-flex items-center gap-1.5 font-medium">
                                                {title}
                                                {row.isRecurring ? (
                                                    <Repeat size={12} className="text-brand" aria-label="Recurring" />
                                                ) : null}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="whitespace-normal">
                                            <span className="text-foreground-muted">{categories}</span>
                                        </DataTableCell>
                                        <DataTableCell className="text-foreground-muted">
                                            {payments}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums font-medium">
                                            {formatCurrency(amount || 0, currency)}
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                    </div>
                    <PaginationBar pagination={pagination} onPageChange={setPage} className="mt-4" />
                </>
            )}
            </>
            ) : null}
        </>
    );
}
