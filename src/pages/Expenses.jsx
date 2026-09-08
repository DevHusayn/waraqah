import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Crown, ListFilter, Plus, Repeat, Search, Wallet } from 'lucide-react';
import {
    EXPENSE_CATEGORIES,
    getExpenseCategoryLabel,
    isPresetExpenseCategory,
} from '@waraqah/shared';
import CustomSelect from '../components/CustomSelect';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ExpenseFormModal, { EMPTY_EXPENSE } from '../components/ExpenseFormModal';
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
import { isPremiumUser } from '../utils/premium';
import { invalidateExpenseQueries } from '../lib/queryClient';
import ListSortSelect from '../components/ListSortSelect';

const FILTER_ALL = 'all';
const FILTER_RECURRING = 'recurring';

const TYPE_FILTER_OPTIONS = [
    { value: FILTER_ALL, label: 'All expenses' },
    { value: FILTER_RECURRING, label: 'Recurring' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
];

const COLUMNS = [
    { key: 'date', label: 'Date', width: '22%' },
    { key: 'category', label: 'Category', width: '24%' },
    { key: 'details', label: 'Details', width: '36%' },
    { key: 'amount', label: 'Amount', className: 'text-right', width: '18%' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

const mapExpense = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function Expenses() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL);
    const [typeFilter, setTypeFilter] = useState(FILTER_ALL);
    const [sortBy, setSortBy] = useState('newest');

    const listParams = useMemo(() => {
        const next = { ...queryParams, sort: sortBy };
        if (typeFilter === FILTER_RECURRING) next.recurring = true;
        if (categoryFilter && categoryFilter !== FILTER_ALL) next.category = categoryFilter;
        return next;
    }, [queryParams, categoryFilter, typeFilter, sortBy]);

    const hasListFilters = categoryFilter !== FILTER_ALL || typeFilter !== FILTER_ALL;

    const fetcher = useCallback(
        ({ page, limit, search, sort, period, startDate, endDate, recurring, category }) =>
            apiFetch(
                `/expenses?${buildListQuery({
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
        queryKeyBase: 'expenses',
        fetcher,
        extraParams: listParams,
    });

    const { data: summary, isFetching: summaryFetching } = useExpenseSummaryQuery(queryParams);

    const expenses = data.map(mapExpense);

    const filterOptions = useMemo(() => {
        const customCategories = (summary?.byCategory || [])
            .map((row) => row.category)
            .filter((category) => category && !isPresetExpenseCategory(category));
        if (
            categoryFilter &&
            categoryFilter !== FILTER_ALL &&
            !isPresetExpenseCategory(categoryFilter) &&
            !customCategories.includes(categoryFilter)
        ) {
            customCategories.push(categoryFilter);
        }
        return [
            { value: FILTER_ALL, label: 'All categories' },
            ...EXPENSE_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.label,
            })),
            ...customCategories.map((category) => ({
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
            const newId = created._id || created.id;
            if (newId) {
                navigate(`/expenses/${newId}`);
                return;
            }
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

    const showTableSkeleton = loading && expenses.length === 0;

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

            <PageHeader title="Expenses" subtitle="Track running costs for your business">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add expense
                </button>
            </PageHeader>

            <section
                className={`mb-6 overflow-hidden rounded-xl border border-border/80 bg-surface shadow-soft transition-opacity ${
                    summaryFetching ? 'opacity-80' : ''
                }`}
                aria-label="Expense summary"
            >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground-muted">Total expenses</p>
                        <AdaptiveStatValue
                            value={formatCurrency(summary?.totals?.totalExpenses ?? 0)}
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
                                        {formatCurrency(row.amount)}
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
                    placeholder="Search paid to or description…"
                    icon={Search}
                    aria-label="Search expenses"
                />
                <ToolbarActions>
                    <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
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
                    <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                        <CustomSelect
                            value={typeFilter}
                            onChange={(next) => {
                                setTypeFilter(next);
                                setPage(1);
                            }}
                            options={TYPE_FILTER_OPTIONS}
                            placeholder="Type"
                            leadingIcon={<Repeat size={14} />}
                            aria-label="Filter recurring expenses"
                        />
                    </div>
                    <ListSortSelect
                        value={sortBy}
                        onChange={(next) => {
                            setSortBy(next);
                            setPage(1);
                        }}
                        options={SORT_OPTIONS}
                        ariaLabel="Sort expenses"
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
            ) : expenses.length === 0 ? (
                <EmptyState
                    icon={Wallet}
                    title={
                        search
                            ? 'No expenses found'
                            : hasListFilters
                              ? 'No matching expenses'
                              : mode === 'month'
                                ? 'No expenses this month'
                                : 'No expenses in this period'
                    }
                    description={
                        search
                            ? 'Try a different search term.'
                            : hasListFilters
                              ? 'Try a different filter or add an expense in this group.'
                            : 'Add rent, salaries, transport, and other running costs.'
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
                        {expenses.map((expense) => {
                            const details = [expense.vendor, expense.description]
                                .filter(Boolean)
                                .join(' · ');
                            const categoryLabel = getExpenseCategoryLabel(expense.category);

                            return (
                                <Link
                                    key={expense.id}
                                    to={`/expenses/${expense.id}`}
                                    className="flex items-start gap-2 px-4 py-3.5 hover:bg-surface-muted/70"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-medium text-foreground break-words">
                                                {details || categoryLabel}
                                            </p>
                                            <p className="shrink-0 tabular-nums font-semibold text-foreground">
                                                {formatCurrency(expense.amount || 0)}
                                            </p>
                                        </div>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-foreground-muted">
                                            <span>{formatDisplayDate(expense.date)}</span>
                                            {details ? (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        {categoryLabel}
                                                        {expense.isRecurring ? (
                                                            <Repeat size={11} className="text-brand" aria-label="Recurring" />
                                                        ) : null}
                                                    </span>
                                                </>
                                            ) : expense.isRecurring ? (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="inline-flex items-center gap-1">
                                                        Recurring
                                                        <Repeat size={11} className="text-brand" aria-hidden />
                                                    </span>
                                                </>
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
                            {expenses.map((expense) => {
                                const details = [expense.vendor, expense.description]
                                    .filter(Boolean)
                                    .join(' · ');

                                return (
                                    <DataTableRow
                                        key={expense.id}
                                        onClick={() => navigate(`/expenses/${expense.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <DataTableCell>{formatDisplayDate(expense.date)}</DataTableCell>
                                        <DataTableCell>
                                            <span className="inline-flex items-center gap-1.5">
                                                {getExpenseCategoryLabel(expense.category)}
                                                {expense.isRecurring ? (
                                                    <Repeat size={12} className="text-brand" aria-label="Recurring" />
                                                ) : null}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="whitespace-normal">
                                            <span className="text-foreground-muted">{details || '—'}</span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums font-medium">
                                            {formatCurrency(expense.amount || 0)}
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
    );
}
