import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Copy, Plus, Repeat, Trash2, User, Wallet } from 'lucide-react';
import { getExpenseCategoryLabel, recurringFieldsFromRecord } from '@waraqah/shared';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ActionMenu from '../components/ActionMenu';
import EmptyState from '../components/EmptyState';
import AdaptiveStatValue from '../components/AdaptiveStatValue';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import ExpenseFormModal, {
    EMPTY_EXPENSE,
    buildDuplicateExpenseInitialData,
} from '../components/ExpenseFormModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import useBusinessCurrency from '../hooks/useBusinessCurrency';
import { invalidateExpenseQueries } from '../lib/queryClient';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import { expensePayeePath, formatPayeeCategorySummary } from '../utils/expensePayee';

const EXPENSE_COLUMNS = [
    { key: 'date', label: 'Date', width: '20%' },
    { key: 'category', label: 'Category', width: '22%' },
    { key: 'details', label: 'Details', width: '30%' },
    { key: 'amount', label: 'Amount', className: 'text-right', width: '16%' },
    { key: 'actions', label: '', className: 'text-right', width: '12%' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

function StatCard({ title, value, detail }) {
    return (
        <div className="stat-card stat-card-compact">
            <p className="text-xs text-foreground-muted font-medium leading-snug">{title}</p>
            <AdaptiveStatValue value={value} variant="compact" />
            {detail ? <p className="mt-1 text-[11px] text-foreground-muted leading-snug">{detail}</p> : null}
        </div>
    );
}

const mapExpense = (entry) => ({ ...entry, id: entry._id || entry.id });

function expenseToFormData(expense) {
    return {
        date: expense.date || EMPTY_EXPENSE.date,
        amount: expense.amount ?? '',
        category: expense.category || EMPTY_EXPENSE.category,
        vendor: expense.vendor || '',
        description: expense.description || '',
        ...recurringFieldsFromRecord(expense),
    };
}

export default function ExpensePayeeDetails() {
    const { payeeName } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const currency = useBusinessCurrency();
    const name = decodeURIComponent(payeeName || '').trim();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirmExpense, setConfirmExpense] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stoppingId, setStoppingId] = useState(null);

    const { data, isPending, error } = useQuery({
        queryKey: queryKeys.expensePayee(user?.id, name),
        queryFn: () => apiFetch(`/expenses/payees/${encodeURIComponent(name)}`),
        enabled: isAuthenticated && Boolean(user?.id) && Boolean(name),
        staleTime: STALE_TIMES.lists,
    });

    const payee = data?.payee;
    const staff = data?.staff;
    const expenses = useMemo(
        () => (Array.isArray(data?.expenses) ? data.expenses.map(mapExpense) : []),
        [data]
    );

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setModalInitialData(EMPTY_EXPENSE);
    };

    const openAdd = () => {
        setEditingExpense(null);
        setModalInitialData({
            ...EMPTY_EXPENSE,
            date: format(new Date(), 'yyyy-MM-dd'),
            vendor: payee?.name || name,
        });
        setIsModalOpen(true);
    };

    const openEdit = (expense) => {
        setEditingExpense(expense);
        setModalInitialData(expenseToFormData(expense));
        setIsModalOpen(true);
    };

    const openDuplicate = (expense) => {
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
            invalidateExpenseQueries(user?.id);
            closeModal();
            const vendor = String(formData.vendor || '').trim();
            if (vendor && vendor.toLowerCase() !== name.toLowerCase()) {
                navigate(expensePayeePath(vendor), { replace: true });
            }
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
            setConfirmExpense(null);
            if (expenses.length <= 1) {
                navigate('/expenses', { replace: true });
            }
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete expense.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
        }
    };

    const menuItemsFor = (expense) => [
        {
            id: 'duplicate',
            label: 'Duplicate',
            icon: Copy,
            onClick: () => openDuplicate(expense),
        },
        {
            id: 'stop-recurring',
            label: 'Stop repeating',
            icon: Repeat,
            hidden: !expense.isRecurring,
            disabled: stoppingId === expense.id,
            onClick: () => handleStopRecurring(expense),
        },
        {
            id: 'delete',
            label: 'Delete expense',
            icon: Trash2,
            destructive: true,
            disabled: deleting,
            onClick: () => setConfirmExpense(expense),
        },
    ];

    if (!name) {
        return (
            <div className="card">
                <EmptyState
                    icon={Wallet}
                    title="Payee not found"
                    description="This payment name is missing."
                    action={
                        <Link to="/expenses" className="btn-secondary">
                            Back to expenses
                        </Link>
                    }
                />
            </div>
        );
    }

    if (isPending) {
        return <PageSpinner label="Loading payments" />;
    }

    if (error || !payee) {
        return (
            <div className="card">
                <EmptyState
                    icon={Wallet}
                    title="Payee not found"
                    description={error?.message || 'No expenses were found for this name.'}
                    action={
                        <Link to="/expenses" className="btn-secondary">
                            Back to expenses
                        </Link>
                    }
                />
            </div>
        );
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
                description={
                    confirmExpense?.payrollPeriod
                        ? 'This salary payment will be removed, and that month will show as unpaid.'
                        : 'This expense will be removed from your records.'
                }
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

            <Link
                to="/expenses"
                className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-4"
            >
                <ArrowLeft size={16} aria-hidden />
                Back to expenses
            </Link>

            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <User className="h-6 w-6 text-brand" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground break-words">
                            {payee.name}
                        </h1>
                        <p className="mt-1 text-sm text-foreground-muted">
                            {formatPayeeCategorySummary(payee.categories, getExpenseCategoryLabel)}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={openAdd} className="btn-primary shrink-0">
                    <Plus size={16} aria-hidden />
                    Add expense
                </button>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <StatCard
                    title="Total paid"
                    value={formatCurrency(payee.total || 0, currency)}
                    detail="All payments to this name"
                />
                <StatCard
                    title="Payments"
                    value={String(payee.count || 0)}
                    detail={payee.lastDate ? `Last on ${formatDisplayDate(payee.lastDate)}` : 'No payments yet'}
                />
                {staff ? (
                    <StatCard
                        title="Staff salary"
                        value={formatCurrency(staff.salary || 0, currency)}
                        detail={`${staff.role}${staff.isActive ? '' : ' · Inactive'}`}
                    />
                ) : (
                    <StatCard
                        title="Categories"
                        value={String(payee.categories?.length || 0)}
                        detail="Types of payments recorded"
                    />
                )}
            </div>

            {staff ? (
                <section className="card mb-6">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted/70">
                        Staff
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                        {staff.role} · {staff.isActive ? 'Active' : 'Inactive'} · monthly salary{' '}
                        {formatCurrency(staff.salary || 0, currency)}
                    </p>
                </section>
            ) : null}

            <section className="card !p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                    <h2 className="text-sm font-semibold text-foreground">All payments</h2>
                </div>

                {expenses.length === 0 ? (
                    <EmptyState
                        icon={Wallet}
                        title="No payments yet"
                        description="Add an expense paid to this person to see it here."
                    />
                ) : (
                    <>
                        <div className="md:hidden divide-y divide-border/50">
                            {expenses.map((expense) => {
                                const categoryLabel = getExpenseCategoryLabel(expense.category);
                                return (
                                    <div
                                        key={expense.id}
                                        className="flex items-start gap-2 px-5 py-3.5"
                                    >
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left hover:opacity-80"
                                            onClick={() => openEdit(expense)}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-medium text-foreground">
                                                    {categoryLabel}
                                                    {expense.isRecurring ? (
                                                        <Repeat size={12} className="ml-1.5 inline text-brand" aria-label="Recurring" />
                                                    ) : null}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-foreground-muted">
                                                    {formatDisplayDate(expense.date)}
                                                    {expense.description ? ` · ${expense.description}` : ''}
                                                </span>
                                            </span>
                                            <span className="shrink-0 tabular-nums font-semibold text-foreground">
                                                {formatCurrency(expense.amount || 0, currency)}
                                            </span>
                                        </button>
                                        <div className="shrink-0">
                                            <ActionMenu
                                                items={menuItemsFor(expense)}
                                                ariaLabel={`${categoryLabel} actions`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="hidden md:block">
                            <DataTable columns={EXPENSE_COLUMNS} fixedLayout>
                                {expenses.map((expense) => (
                                    <DataTableRow
                                        key={expense.id}
                                        onClick={() => openEdit(expense)}
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
                                        <DataTableCell className="whitespace-normal text-foreground-muted">
                                            {expense.description || '—'}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums font-medium">
                                            {formatCurrency(expense.amount || 0, currency)}
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <div onClick={(event) => event.stopPropagation()}>
                                                <ActionMenu
                                                    items={menuItemsFor(expense)}
                                                    ariaLabel={`${getExpenseCategoryLabel(expense.category)} actions`}
                                                />
                                            </div>
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                        </div>
                    </>
                )}
            </section>
        </>
    );
}
