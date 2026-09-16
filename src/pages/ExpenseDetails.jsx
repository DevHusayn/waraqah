import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Copy, Edit, Repeat, Trash2, Wallet } from 'lucide-react';
import {
    formatRecurringSummary,
    getExpenseCategoryLabel,
    recurringFieldsFromRecord,
} from '@waraqah/shared';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ActionMenu from '../components/ActionMenu';
import EmptyState from '../components/EmptyState';
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
import { expensePayeePath } from '../utils/expensePayee';

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

function DetailMetric({ label, value }) {
    return (
        <div className="rounded-lg border border-border/60 bg-surface-muted/50 px-3 py-2.5 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted/70">
                {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground break-words">{value}</p>
        </div>
    );
}

const mapExpense = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function ExpenseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const currency = useBusinessCurrency();

    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_EXPENSE);

    const loadExpense = useCallback(async () => {
        setLoading(true);
        try {
            const payload = await apiFetch(`/expenses/${id}`);
            const mapped = mapExpense(payload);
            if (String(mapped.vendor || '').trim()) {
                navigate(expensePayeePath(mapped.vendor), { replace: true });
                return;
            }
            setExpense(mapped);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to load expense.',
                type: 'error',
            });
            setExpense(null);
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadExpense();
    }, [loadExpense]);

    const categoryLabel = expense ? getExpenseCategoryLabel(expense.category) : '';
    const title = expense?.vendor || categoryLabel || 'Expense';
    const payrollPeriodLabel = expense?.payrollPeriod
        ? (() => {
            try {
                return format(parseISO(`${expense.payrollPeriod}-01`), 'MMMM yyyy');
            } catch {
                return expense.payrollPeriod;
            }
        })()
        : '';

    const recurringSummary = expense?.isRecurring
        ? formatRecurringSummary({
            frequency: expense.recurringFrequency,
            endDate: expense.recurringEndDate
                ? formatDisplayDate(expense.recurringEndDate)
                : undefined,
            nextDate: expense.recurringNextDate
                ? formatDisplayDate(expense.recurringNextDate)
                : undefined,
        })
        : '';

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setModalInitialData(EMPTY_EXPENSE);
    };

    const openEdit = () => {
        if (!expense) return;
        setEditingExpense(expense);
        setModalInitialData({
            date: expense.date || EMPTY_EXPENSE.date,
            amount: expense.amount ?? '',
            category: expense.category || EMPTY_EXPENSE.category,
            vendor: expense.vendor || '',
            description: expense.description || '',
            ...recurringFieldsFromRecord(expense),
        });
        setIsModalOpen(true);
    };

    const openDuplicate = () => {
        if (!expense) return;
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
                const updated = await apiFetch(`/expenses/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
                showToast('Expense updated successfully', 'success');
                setExpense(mapExpense(updated));
            } else {
                const created = await apiFetch('/expenses', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                showToast('Expense added successfully', 'success');
                const newId = created._id || created.id;
                invalidateExpenseQueries(user?.id);
                closeModal();
                const vendor = String(formData.vendor || '').trim();
                if (vendor) {
                    navigate(expensePayeePath(vendor), { replace: true });
                    return;
                }
                if (newId) {
                    navigate(`/expenses/${newId}`, { replace: true });
                    return;
                }
            }
            invalidateExpenseQueries(user?.id);
            closeModal();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save expense.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleStopRecurring = async () => {
        if (!expense) return;
        setStopping(true);
        try {
            const updated = await apiFetch(`/expenses/${expense.id}/stop-recurring`, {
                method: 'POST',
            });
            showToast('This expense will no longer repeat.', 'success');
            setExpense(mapExpense(updated));
            invalidateExpenseQueries(user?.id);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Could not stop repeating this expense.',
                type: 'error',
            });
        } finally {
            setStopping(false);
        }
    };

    const handleDelete = async () => {
        if (!expense) return;
        setDeleting(true);
        try {
            await apiFetch(`/expenses/${expense.id}`, { method: 'DELETE' });
            showToast('Expense deleted successfully', 'success');
            invalidateExpenseQueries(user?.id);
            navigate(expense.vendor ? expensePayeePath(expense.vendor) : '/expenses', { replace: true });
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete expense.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
            setConfirm(false);
        }
    };

    const menuItems = [
        {
            id: 'duplicate',
            label: 'Duplicate',
            icon: Copy,
            onClick: openDuplicate,
        },
        {
            id: 'stop-recurring',
            label: 'Stop repeating',
            icon: Repeat,
            hidden: !expense?.isRecurring,
            disabled: stopping,
            onClick: handleStopRecurring,
        },
        {
            id: 'delete',
            label: 'Delete expense',
            icon: Trash2,
            destructive: true,
            disabled: deleting,
            onClick: () => setConfirm(true),
        },
    ];

    if (loading) {
        return <PageSpinner label="Loading expense" />;
    }

    if (!expense) {
        return (
            <div className="card">
                <EmptyState
                    icon={Wallet}
                    title="Expense not found"
                    description="This expense may have been deleted."
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
                open={confirm}
                title="Delete expense?"
                description={
                    payrollPeriodLabel
                        ? `This salary payment for ${payrollPeriodLabel} will be removed, and that month will show as unpaid.`
                        : 'This expense will be removed from your records.'
                }
                confirmLabel="Delete expense"
                cancelLabel="Keep expense"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => !deleting && setConfirm(false)}
            />
            <ExpenseFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingExpense={editingExpense}
                initialData={modalInitialData}
            />

            <Link
                to={expense.vendor ? expensePayeePath(expense.vendor) : '/expenses'}
                className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground mb-4"
            >
                <ArrowLeft size={16} aria-hidden />
                {expense.vendor ? `Back to ${expense.vendor}` : 'Back to expenses'}
            </Link>

            <header className="card mb-8 overflow-hidden !p-0">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                            <Wallet className="h-6 w-6 text-brand" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground break-words">
                                    {title}
                                </h1>
                                {expense.isRecurring ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand">
                                        <Repeat size={12} aria-hidden />
                                        Recurring
                                    </span>
                                ) : null}
                                {payrollPeriodLabel ? (
                                    <span className="inline-flex items-center rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand">
                                        {payrollPeriodLabel} payroll
                                    </span>
                                ) : null}
                            </div>
                            {expense.description ? (
                                <p className="mt-1 text-sm leading-relaxed text-foreground-muted max-w-2xl">
                                    {expense.description}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button type="button" onClick={openEdit} className="btn-primary">
                            <Edit size={16} aria-hidden />
                            Edit
                        </button>
                        <ActionMenu
                            items={menuItems}
                            disabled={deleting}
                            ariaLabel="Expense actions"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
                    <DetailMetric
                        label="Amount"
                        value={formatCurrency(expense.amount || 0, currency)}
                    />
                    <DetailMetric label="Date" value={formatDisplayDate(expense.date)} />
                    <DetailMetric label="Category" value={categoryLabel} />
                    <DetailMetric
                        label="Paid to"
                        value={
                            expense.vendor ? (
                                <Link
                                    to={expensePayeePath(expense.vendor)}
                                    className="hover:text-brand hover:underline underline-offset-2"
                                >
                                    {expense.vendor}
                                </Link>
                            ) : (
                                'Not set'
                            )
                        }
                    />
                </div>

                {recurringSummary ? (
                    <div className="border-t border-border/60 bg-surface-muted/30 px-5 py-4 text-sm text-foreground-muted">
                        {recurringSummary}
                    </div>
                ) : null}
            </header>
        </>
    );
}
