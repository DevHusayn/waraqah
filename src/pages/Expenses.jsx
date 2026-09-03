import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Crown, Copy, Edit, ListFilter, Plus, Repeat, Search, Trash2, Wallet } from 'lucide-react';
import {
    EXPENSE_CATEGORIES,
    getExpenseCategoryLabel,
    isPresetExpenseCategory,
    recurringFieldsFromRecord,
} from '@waraqah/shared';
import CustomSelect from '../components/CustomSelect';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ExpenseFormModal, {
    EMPTY_EXPENSE,
    buildDuplicateExpenseInitialData,
} from '../components/ExpenseFormModal';
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

const FILTER_ALL = 'all';
const FILTER_RECURRING = 'recurring';

const COLUMNS = [
    { key: 'date', label: 'Date', width: '16%' },
    { key: 'category', label: 'Category', width: '16%' },
    { key: 'details', label: 'Details', width: '38%' },
    { key: 'amount', label: 'Amount', className: 'text-right', width: '18%' },
    { key: 'actions', label: '', className: 'text-right', width: '14%' },
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
    const [editingExpense, setEditingExpense] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);
    const [confirmExpense, setConfirmExpense] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [listFilter, setListFilter] = useState(FILTER_ALL);
    const [stoppingId, setStoppingId] = useState(null);

    const listParams = useMemo(() => {
        const next = { ...queryParams };
        if (listFilter === FILTER_RECURRING) next.recurring = true;
        else if (listFilter && listFilter !== FILTER_ALL) next.category = listFilter;
        return next;
    }, [queryParams, listFilter]);

    const fetcher = useCallback(
        ({ page, limit, search, period, startDate, endDate, recurring, category }) =>
            apiFetch(
                `/expenses?${buildListQuery({
                    page,
                    limit,
                    search,
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
            listFilter &&
            listFilter !== FILTER_ALL &&
            listFilter !== FILTER_RECURRING &&
            !isPresetExpenseCategory(listFilter) &&
            !customCategories.includes(listFilter)
        ) {
            customCategories.push(listFilter);
        }
        return [
            { value: FILTER_ALL, label: 'All expenses' },
            { value: FILTER_RECURRING, label: 'Recurring' },
            ...EXPENSE_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.label,
            })),
            ...customCategories.map((category) => ({
                value: category,
                label: getExpenseCategoryLabel(category),
            })),
        ];
    }, [summary, listFilter]);

    const topCategories = useMemo(
        () => (summary?.byCategory || []).slice(0, 4),
        [summary]
    );

    const openModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setModalInitialData({
                date: expense.date || EMPTY_EXPENSE.date,
                amount: expense.amount ?? '',
                category: expense.category || EMPTY_EXPENSE.category,
                vendor: expense.vendor || '',
                description: expense.description || '',
                ...recurringFieldsFromRecord(expense),
            });
        } else {
            setEditingExpense(null);
            setModalInitialData({
                ...EMPTY_EXPENSE,
                date: format(new Date(), 'yyyy-MM-dd'),
            });
        }
        setIsModalOpen(true);
    };

    const openDuplicateModal = (expense) => {
        setEditingExpense(null);
        setModalInitialData(
            buildDuplicateExpenseInitialData(expense, {
                isCurrentPeriod: true,
                summaryYear: 1,
                summaryMonth: 1,
            })
        );
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setModalInitialData(EMPTY_EXPENSE);
    };

    const handleSubmit = async (formData, editing) => {
        try {
            if (editing) {
                await apiFetch(`/expenses/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
                showToast('Expense updated successfully', 'success');
            } else {
                await apiFetch('/expenses', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                showToast('Expense added successfully', 'success');
            }
            closeModal();
            invalidateExpenseQueries(user?.id);
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

    const handleStopRecurring = async (expense) => {
        setStoppingId(expense.id);
        try {
            await apiFetch(`/expenses/${expense.id}/stop-recurring`, { method: 'POST' });
            showToast('This expense will no longer repeat.', 'success');
            invalidateExpenseQueries(user?.id);
            await refresh();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Could not stop repeating this expense.',
                type: 'error',
            });
        } finally {
            setStoppingId(null);
        }
    };

    const handleDelete = async () => {
        if (!confirmExpense) return;
        setDeleting(true);
        try {
            await apiFetch(`/expenses/${confirmExpense.id}`, { method: 'DELETE' });
            showToast('Expense deleted successfully', 'success');
            invalidateExpenseQueries(user?.id);
            await refresh();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete expense.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
            setConfirmExpense(null);
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
            <ConfirmModal
                open={Boolean(confirmExpense)}
                title="Delete expense?"
                description="This expense will be removed from your records."
                confirmLabel="Delete expense"
                cancelLabel="Keep expense"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => !deleting && setConfirmExpense(null)}
            />
            <ExpenseFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingExpense={editingExpense}
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
                    <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
                        <CustomSelect
                            value={listFilter}
                            onChange={(next) => {
                                setListFilter(next);
                                setPage(1);
                            }}
                            options={filterOptions}
                            placeholder="Filter"
                            leadingIcon={<ListFilter size={14} />}
                            aria-label="Filter expenses"
                        />
                    </div>
                </ToolbarActions>
            </Toolbar>

            {showTableSkeleton ? (
                <ListPageSkeleton
                    rows={8}
                    columns={5}
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
                            : listFilter !== FILTER_ALL
                              ? 'No matching expenses'
                              : mode === 'month'
                                ? 'No expenses this month'
                                : 'No expenses in this period'
                    }
                    description={
                        search
                            ? 'Try a different search term.'
                            : listFilter !== FILTER_ALL
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
                    <DataTable
                        columns={COLUMNS}
                        fixedLayout
                        minWidth={720}
                        className={`scroll-x-touch transition-opacity ${summaryFetching ? 'opacity-80' : ''}`}
                        loading={loading}
                    >
                        {expenses.map((expense) => {
                            const details = [expense.vendor, expense.description]
                                .filter(Boolean)
                                .join(' · ');

                            return (
                                <DataTableRow key={expense.id}>
                                    <DataTableCell>{formatDisplayDate(expense.date)}</DataTableCell>
                                    <DataTableCell>
                                        <span className="inline-flex items-center gap-1.5">
                                            {getExpenseCategoryLabel(expense.category)}
                                            {expense.isRecurring ? (
                                                <Repeat size={12} className="text-brand" aria-label="Recurring" />
                                            ) : null}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-foreground-muted">{details || '—'}</span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right tabular-nums font-medium">
                                        {formatCurrency(expense.amount || 0)}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
                                                aria-label="Duplicate expense"
                                                title="Duplicate expense"
                                                onClick={() => openDuplicateModal(expense)}
                                            >
                                                <Copy size={16} aria-hidden />
                                            </button>
                                            {expense.isRecurring ? (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
                                                    aria-label="Stop repeating"
                                                    title="Stop repeating"
                                                    disabled={stoppingId === expense.id}
                                                    onClick={() => handleStopRecurring(expense)}
                                                >
                                                    <Repeat size={16} aria-hidden />
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted"
                                                aria-label="Edit expense"
                                                onClick={() => openModal(expense)}
                                            >
                                                <Edit size={16} aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 hover:bg-red-50"
                                                aria-label="Delete expense"
                                                onClick={() => setConfirmExpense(expense)}
                                            >
                                                <Trash2 size={16} aria-hidden />
                                            </button>
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>
                    <PaginationBar pagination={pagination} onPageChange={setPage} className="mt-4" />
                </>
            )}
        </>
    );
}
