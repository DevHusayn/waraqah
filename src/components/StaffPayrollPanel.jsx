import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Pencil, Plus, Users } from 'lucide-react';
import {
    getDefaultStatementMonth,
    parseStatementMonth,
} from '../utils/monthlyStatement';
import MonthPickerField from './MonthPickerField';
import AdaptiveStatValue from './AdaptiveStatValue';
import DataTable, { DataTableRow, DataTableCell } from './DataTable';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';
import { ListPageSkeleton } from './Skeleton';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';
import StaffFormModal, { EMPTY_STAFF } from './StaffFormModal';
import { useStaffPayrollQuery, useStaffQuery } from '../hooks/useStaffQueries';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import useBusinessCurrency from '../hooks/useBusinessCurrency';
import { invalidateStaffQueries } from '../lib/queryClient';
import { expensePayeePath } from '../utils/expensePayee';

const PAYROLL_COLUMNS = [
    { key: 'name', label: 'Name', width: '26%' },
    { key: 'role', label: 'Role', width: '20%' },
    { key: 'salary', label: 'Salary', width: '18%' },
    { key: 'status', label: 'Status', width: '16%' },
    { key: 'action', label: '', className: 'text-right', width: '20%' },
];

function staffToFormData(staff) {
    if (!staff) return EMPTY_STAFF;
    return {
        name: staff.name || '',
        role: staff.role || '',
        salary: staff.salary ?? '',
        isActive: staff.isActive !== false,
    };
}

function formatPaidDate(value) {
    if (!value) return '';
    try {
        return format(parseISO(value), 'MMM d');
    } catch {
        return value;
    }
}

function staffInitials(name) {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function StaffAvatar({ name }) {
    return (
        <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-[11px] font-semibold tracking-wide text-brand"
            aria-hidden
        >
            {staffInitials(name)}
        </span>
    );
}

function PayrollStatus({ staff }) {
    if (staff.paid) {
        const date = formatPaidDate(staff.paidDate);
        return <StatusBadge status="paid" label={date ? `Paid ${date}` : 'Paid'} />;
    }
    if (!staff.isActive) {
        return <StatusBadge status="cancelled" label="Inactive" />;
    }
    return <StatusBadge status="pending" label="Unpaid" />;
}

function PayrollSection({ title, count, children }) {
    if (!children) return null;
    return (
        <div>
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 md:px-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted/80">
                    {title}
                </p>
                <span className="text-[11px] tabular-nums text-foreground-muted/70">{count}</span>
            </div>
            {children}
        </div>
    );
}

export default function StaffPayrollPanel({ openAddKey = 0 }) {
    const currency = useBusinessCurrency();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [monthValue, setMonthValue] = useState(getDefaultStatementMonth);
    const { year, month } = parseStatementMonth(monthValue);
    const periodLabel = format(parseISO(`${monthValue}-01`), 'MMMM yyyy');

    const { data: payroll, isLoading, isFetching } = useStaffPayrollQuery(year, month);
    const { data: allStaff = [] } = useStaffQuery();

    const [showInactive, setShowInactive] = useState(false);
    const [staffModalOpen, setStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState(null);
    const [payingId, setPayingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (openAddKey) {
            setEditingStaff(null);
            setStaffModalOpen(true);
        }
    }, [openAddKey]);

    const payrollStaff = payroll?.staff || [];
    const totals = payroll?.totals || { due: 0, paid: 0, remaining: 0, unpaidCount: 0, paidCount: 0 };

    const inactiveUnlisted = useMemo(() => {
        const listed = new Set(payrollStaff.map((row) => row.id));
        return allStaff
            .filter((staff) => staff.isActive === false && !listed.has(staff.id))
            .map((staff) => ({
                id: staff.id,
                name: staff.name,
                role: staff.role,
                salary: staff.salary,
                isActive: false,
                paid: false,
                amount: staff.salary,
                expenseId: null,
                paidDate: null,
            }));
    }, [allStaff, payrollStaff]);

    const rows = showInactive ? [...payrollStaff, ...inactiveUnlisted] : payrollStaff;
    const unpaidRows = rows.filter((staff) => !staff.paid && staff.isActive);
    const paidRows = rows.filter((staff) => staff.paid);
    const inactiveRows = rows.filter((staff) => !staff.paid && !staff.isActive);
    const hasInactive = allStaff.some((staff) => staff.isActive === false);
    const showSkeleton = isLoading && !payroll;
    const listedCount = unpaidRows.length + paidRows.length + inactiveRows.length;

    const openAdd = () => {
        setEditingStaff(null);
        setStaffModalOpen(true);
    };

    const openEdit = (staff) => {
        setEditingStaff(staff);
        setStaffModalOpen(true);
    };

    const closeStaffModal = () => {
        if (deleting) return;
        setStaffModalOpen(false);
        setEditingStaff(null);
    };

    const handleStaffSubmit = async (formData) => {
        try {
            if (editingStaff) {
                await apiFetch(`/staff/${editingStaff.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
                showToast('Staff updated', 'success');
            } else {
                await apiFetch('/staff', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                showToast('Staff added', 'success');
            }
            closeStaffModal();
            invalidateStaffQueries(user?.id);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save staff.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleDeleteStaff = () => {
        if (!editingStaff) return;
        setConfirm({
            type: 'delete',
            staff: editingStaff,
            title: 'Delete staff member?',
            description: 'They will be removed from your roster. If they already have salary payments, deactivate them instead.',
            confirmLabel: 'Delete staff',
            variant: 'danger',
        });
    };

    const handleMarkPaid = async (staff) => {
        setPayingId(staff.id);
        try {
            await apiFetch(`/staff/${staff.id}/pay`, {
                method: 'POST',
                body: JSON.stringify({ year, month }),
            });
            showToast(`${staff.name} marked paid`, 'success');
            invalidateStaffQueries(user?.id);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Could not mark this staff member paid.',
                type: 'error',
            });
        } finally {
            setPayingId(null);
        }
    };

    const requestUnpay = (staff) => {
        setConfirm({
            type: 'unpay',
            staff,
            title: 'Undo this payment?',
            description: `This removes the salary expense for ${staff.name} in ${periodLabel}.`,
            confirmLabel: 'Undo payment',
            variant: 'danger',
        });
    };

    const handleConfirm = async () => {
        if (!confirm?.staff) return;
        const staff = confirm.staff;
        if (confirm.type === 'unpay') {
            setPayingId(staff.id);
            try {
                await apiFetch(`/staff/${staff.id}/unpay`, {
                    method: 'POST',
                    body: JSON.stringify({ year, month }),
                });
                showToast('Payment removed', 'success');
                setConfirm(null);
                invalidateStaffQueries(user?.id);
            } catch (err) {
                setAlert({
                    open: true,
                    message: err.message || 'Could not undo this payment.',
                    type: 'error',
                });
            } finally {
                setPayingId(null);
            }
            return;
        }

        setDeleting(true);
        try {
            await apiFetch(`/staff/${staff.id}`, { method: 'DELETE' });
            showToast('Staff deleted', 'success');
            setConfirm(null);
            setStaffModalOpen(false);
            setEditingStaff(null);
            invalidateStaffQueries(user?.id);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Could not delete this staff member.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
        }
    };

    const openStaffRecord = (staff) => {
        if (staff.paid) {
            navigate(expensePayeePath(staff.name));
            return;
        }
        openEdit(staff);
    };

    const renderActions = (staff) => {
        const busy = payingId === staff.id;
        if (staff.paid) {
            return (
                <button
                    type="button"
                    className="btn-ghost text-xs text-foreground-muted"
                    disabled={busy}
                    onClick={(event) => {
                        event.stopPropagation();
                        requestUnpay(staff);
                    }}
                >
                    Undo
                </button>
            );
        }
        if (!staff.isActive) {
            return (
                <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={(event) => {
                        event.stopPropagation();
                        openEdit(staff);
                    }}
                >
                    Edit
                </button>
            );
        }
        return (
            <button
                type="button"
                className="btn-primary text-xs py-1.5 px-3"
                disabled={busy}
                onClick={(event) => {
                    event.stopPropagation();
                    handleMarkPaid(staff);
                }}
            >
                {busy ? 'Saving…' : 'Mark paid'}
            </button>
        );
    };

    const renderMobileRow = (staff) => (
        <div
            key={staff.id}
            className={`px-4 py-3.5 ${staff.paid ? 'bg-surface-muted/25' : ''}`}
        >
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => openStaffRecord(staff)}
                >
                    <StaffAvatar name={staff.name} />
                    <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                            <span className="font-medium text-foreground break-words">{staff.name}</span>
                            <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                                {formatCurrency(staff.amount || 0, currency)}
                            </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground-muted">
                            {staff.role || 'No role'}
                        </span>
                    </span>
                </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2 pl-12">
                <PayrollStatus staff={staff} />
                {renderActions(staff)}
            </div>
        </div>
    );

    const renderDesktopRow = (staff) => (
        <DataTableRow key={staff.id} className={staff.paid ? 'bg-surface-muted/20' : ''}>
            <DataTableCell>
                <button
                    type="button"
                    className="flex min-w-0 items-center gap-3 text-left"
                    onClick={() => openStaffRecord(staff)}
                >
                    <StaffAvatar name={staff.name} />
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground hover:text-brand">
                            {staff.name}
                        </span>
                    </span>
                </button>
            </DataTableCell>
            <DataTableCell>
                <span className="text-foreground-muted">{staff.role || '—'}</span>
            </DataTableCell>
            <DataTableCell className="tabular-nums font-medium">
                {formatCurrency(staff.amount || 0, currency)}
            </DataTableCell>
            <DataTableCell>
                <PayrollStatus staff={staff} />
            </DataTableCell>
            <DataTableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1">
                    <button
                        type="button"
                        className="btn-ghost px-1.5"
                        aria-label={`Edit ${staff.name}`}
                        onClick={() => openEdit(staff)}
                    >
                        <Pencil size={14} aria-hidden />
                    </button>
                    {renderActions(staff)}
                </div>
            </DataTableCell>
        </DataTableRow>
    );

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ConfirmModal
                open={Boolean(confirm)}
                title={confirm?.title}
                description={confirm?.description}
                confirmLabel={confirm?.confirmLabel}
                cancelLabel="Cancel"
                variant={confirm?.variant || 'default'}
                loading={confirm?.type === 'delete' ? deleting : payingId === confirm?.staff?.id}
                onConfirm={handleConfirm}
                onCancel={() => {
                    if (deleting || payingId) return;
                    setConfirm(null);
                }}
            />
            <StaffFormModal
                open={staffModalOpen}
                onClose={closeStaffModal}
                onSubmit={handleStaffSubmit}
                onDelete={editingStaff ? handleDeleteStaff : undefined}
                deleting={deleting}
                editingStaff={editingStaff}
                initialData={staffToFormData(editingStaff)}
            />

            <section
                className={`mb-6 overflow-hidden rounded-xl border border-border/80 bg-surface shadow-soft transition-opacity ${
                    isFetching ? 'opacity-80' : ''
                }`}
                aria-label="Payroll summary"
            >
                <div className="flex items-start justify-between gap-3 p-4 sm:gap-6 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground-muted">Payroll due</p>
                        <AdaptiveStatValue
                            value={formatCurrency(totals.due ?? 0, currency)}
                            variant="card"
                            className="mt-1"
                        />
                        <p className="mt-1.5 text-xs text-foreground-muted">{periodLabel}</p>
                    </div>
                    <div className="shrink-0">
                        <MonthPickerField
                            variant="compact"
                            portal
                            value={monthValue}
                            onChange={setMonthValue}
                            displayLabel={periodLabel}
                            max={getDefaultStatementMonth()}
                            triggerAriaLabel={`Change payroll month from ${periodLabel}`}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-px border-t border-border/70 bg-border/70">
                    <div className="bg-surface-muted/40 px-4 py-3 sm:px-5">
                        <p className="text-xs text-foreground-muted">Paid</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(totals.paid ?? 0, currency)}
                        </p>
                    </div>
                    <div className="bg-surface-muted/40 px-4 py-3 sm:px-5">
                        <p className="text-xs text-foreground-muted">Remaining</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(totals.remaining ?? 0, currency)}
                        </p>
                    </div>
                </div>
            </section>

            {listedCount > 0 ? (
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-foreground-muted">
                        <span className="font-medium tabular-nums text-foreground">{paidRows.length}</span>
                        {' of '}
                        <span className="tabular-nums">{listedCount}</span>
                        {' paid'}
                    </p>
                    {hasInactive ? (
                        <label className="inline-flex items-center gap-2 text-xs text-foreground-muted">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(event) => setShowInactive(event.target.checked)}
                                className="rounded border-border"
                            />
                            Show inactive
                        </label>
                    ) : null}
                </div>
            ) : hasInactive ? (
                <div className="mb-4 flex items-center justify-end">
                    <label className="inline-flex items-center gap-2 text-sm text-foreground-muted">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(event) => setShowInactive(event.target.checked)}
                            className="rounded border-border"
                        />
                        Show inactive staff
                    </label>
                </div>
            ) : null}

            {showSkeleton ? (
                <ListPageSkeleton
                    rows={6}
                    columns={5}
                    withHeader={false}
                    withToolbar={false}
                    withAction={false}
                />
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={allStaff.length === 0 ? 'No staff yet' : 'No staff for this month'}
                    description={
                        allStaff.length === 0
                            ? 'Add your team with their role and monthly salary, then mark them paid each month.'
                            : 'Inactive staff are hidden unless they were already paid this month.'
                    }
                    action={
                        allStaff.length === 0 ? (
                            <button type="button" onClick={openAdd} className="btn-primary">
                                <Plus size={16} aria-hidden />
                                Add staff
                            </button>
                        ) : null
                    }
                />
            ) : (
                <>
                    <div className={`md:hidden space-y-4 ${isFetching ? 'opacity-80' : ''}`}>
                        {unpaidRows.length ? (
                            <PayrollSection title="To pay" count={unpaidRows.length}>
                                <div className="overflow-hidden rounded-lg border border-border/60 bg-surface shadow-soft divide-y divide-border/50">
                                    {unpaidRows.map(renderMobileRow)}
                                </div>
                            </PayrollSection>
                        ) : null}
                        {paidRows.length ? (
                            <PayrollSection title="Paid" count={paidRows.length}>
                                <div className="overflow-hidden rounded-lg border border-border/60 bg-surface shadow-soft divide-y divide-border/50">
                                    {paidRows.map(renderMobileRow)}
                                </div>
                            </PayrollSection>
                        ) : null}
                        {inactiveRows.length ? (
                            <PayrollSection title="Inactive" count={inactiveRows.length}>
                                <div className="overflow-hidden rounded-lg border border-border/60 bg-surface shadow-soft divide-y divide-border/50">
                                    {inactiveRows.map(renderMobileRow)}
                                </div>
                            </PayrollSection>
                        ) : null}
                    </div>

                    <div className={`hidden md:block space-y-5 ${isFetching ? 'opacity-80' : ''}`}>
                        {unpaidRows.length ? (
                            <PayrollSection title="To pay" count={unpaidRows.length}>
                                <DataTable columns={PAYROLL_COLUMNS} fixedLayout>
                                    {unpaidRows.map(renderDesktopRow)}
                                </DataTable>
                            </PayrollSection>
                        ) : null}
                        {paidRows.length ? (
                            <PayrollSection title="Paid" count={paidRows.length}>
                                <DataTable columns={PAYROLL_COLUMNS} fixedLayout>
                                    {paidRows.map(renderDesktopRow)}
                                </DataTable>
                            </PayrollSection>
                        ) : null}
                        {inactiveRows.length ? (
                            <PayrollSection title="Inactive" count={inactiveRows.length}>
                                <DataTable columns={PAYROLL_COLUMNS} fixedLayout>
                                    {inactiveRows.map(renderDesktopRow)}
                                </DataTable>
                            </PayrollSection>
                        ) : null}
                    </div>
                </>
            )}
        </>
    );
}
