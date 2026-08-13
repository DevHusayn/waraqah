import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Crown, Copy, Edit, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { getExpenseCategoryLabel } from '@waraqah/shared';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ExpenseFormModal, {
    EMPTY_EXPENSE,
    buildDuplicateExpenseInitialData,
} from '../components/ExpenseFormModal';
import MonthPickerField from '../components/MonthPickerField';
import MonthComparisonTrend from '../components/MonthComparisonTrend';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import { ListPageSkeleton } from '../components/Skeleton';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useSummaryPeriod } from '../hooks/useSummaryPeriod';
import { useExpenseSummaryQuery } from '../hooks/useExpenseSummaryQuery';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { formatCurrency } from '../utils/currency';
import { isPremiumUser } from '../utils/premium';
import { invalidateExpenseQueries } from '../lib/queryClient';

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
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        isCurrentPeriod,
    } = useSummaryPeriod();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);
    const [confirmExpense, setConfirmExpense] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });

    const listParams = useMemo(
        () => ({ year: summaryYear, month: summaryMonth }),
        [summaryYear, summaryMonth]
    );

    const fetcher = useCallback(
        ({ page, limit, search, year, month }) =>
            apiFetch(
                `/expenses?${buildListQuery({
                    page,
                    limit,
                    search,
                    year,
                    month,
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

    const { data: summary, isFetching: summaryFetching } = useExpenseSummaryQuery(
        summaryYear,
        summaryMonth
    );

    const expenses = data.map(mapExpense);
    const comparisonLabel = isCurrentPeriod ? 'vs last month' : 'vs previous month';

    const openModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setModalInitialData({
                date: expense.date || EMPTY_EXPENSE.date,
                amount: expense.amount ?? '',
                category: expense.category || EMPTY_EXPENSE.category,
                vendor: expense.vendor || '',
                description: expense.description || '',
            });
        } else {
            setEditingExpense(null);
            setModalInitialData({
                ...EMPTY_EXPENSE,
                date: `${summaryYear}-${String(summaryMonth).padStart(2, '0')}-01`,
            });
        }
        setIsModalOpen(true);
    };

    const openDuplicateModal = (expense) => {
        setEditingExpense(null);
        setModalInitialData(
            buildDuplicateExpenseInitialData(expense, {
                summaryYear,
                summaryMonth,
                isCurrentPeriod,
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

    if (loading && expenses.length === 0 && !search) {
        return <ListPageSkeleton rows={8} columns={5} withAction={false} />;
    }

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

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs text-zinc-500 font-medium">Total expenses</p>
                    <p className="text-2xl font-semibold tabular-nums text-zinc-950">
                        {formatCurrency(summary?.totals?.totalExpenses ?? 0)}
                    </p>
                    <div className="mt-1 min-h-[1rem]">
                        <MonthComparisonTrend
                            comparison={summary?.comparison?.totalExpenses}
                            label={comparisonLabel}
                            positiveDirection="down"
                        />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{periodLabel}</p>
                </div>
                <MonthPickerField
                    variant="compact"
                    portal
                    value={monthInputValue}
                    onChange={setMonthInputValue}
                    triggerAriaLabel={`Change period from ${periodLabel}`}
                />
            </div>

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

            {summary?.byCategory?.length ? (
                <div className="mb-6 flex flex-wrap gap-2">
                    {summary.byCategory.slice(0, 4).map((row) => (
                        <span
                            key={row.category}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs text-zinc-700"
                        >
                            <span>{row.label}</span>
                            <span className="font-medium tabular-nums text-zinc-950">
                                {formatCurrency(row.amount)}
                            </span>
                        </span>
                    ))}
                </div>
            ) : null}

            <Toolbar className="mb-4">
                <ToolbarSearch
                    value={search}
                    onChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    placeholder="Search paid to or description…"
                    icon={Search}
                />
            </Toolbar>

            {expenses.length === 0 && !loading ? (
                <EmptyState
                    icon={Wallet}
                    title={search ? 'No expenses found' : 'No expenses this month'}
                    description={
                        search
                            ? 'Try a different search term.'
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
                                        {getExpenseCategoryLabel(expense.category)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-zinc-700">{details || '—'}</span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right tabular-nums font-medium">
                                        {formatCurrency(expense.amount || 0)}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100"
                                                aria-label="Duplicate expense"
                                                title="Duplicate expense"
                                                onClick={() => openDuplicateModal(expense)}
                                            >
                                                <Copy size={16} aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100"
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
