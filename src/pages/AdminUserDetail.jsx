import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Ban,
    CheckCircle,
    Crown,
    Mail,
    Shield,
    Trash2,
    Unlock,
    RotateCcw,
    FileText,
    Users,
    Receipt,
    Activity,
    StickyNote,
    AlertTriangle,
    Pencil,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ModalShell from '../components/ModalShell';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import { usePagedList } from '../hooks/usePagedList';
import { buildListQuery } from '../utils/pagination';
import {
    StatusBadge,
    PlanBadge,
    UsageBadge,
    PaymentStatusBadge,
    UserAvatar,
} from '../components/admin/AdminBadges';

function formatDateTime(value) {
    if (!value) return '—';
    return format(new Date(value), 'MMM d, yyyy · h:mm a');
}

function formatDate(value) {
    if (!value) return '—';
    return format(new Date(value), 'MMM d, yyyy');
}

function SectionCard({ title, icon: Icon, children, className = '' }) {
    return (
        <section className={`card ${className}`.trim()}>
            <div className="flex items-center gap-2 mb-4">
                {Icon ? <Icon size={18} className="text-foreground-muted/70 shrink-0" aria-hidden /> : null}
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function StatItem({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-foreground-muted font-medium">{label}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{value}</p>
        </div>
    );
}

const ACTIVITY_ICONS = {
    account_created: Users,
    login: Activity,
    suspended: Ban,
    reactivated: CheckCircle,
    plan_upgraded: Crown,
    plan_downgraded: Crown,
    subscription_cancelled: Receipt,
    subscription_payment_failed: AlertTriangle,
    payment_success: Receipt,
    payment_failed: AlertTriangle,
    invoice_created: FileText,
    quotation_created: FileText,
};

function ActivityFeed({ userId }) {
    const fetcher = useCallback(
        ({ page, limit }) =>
            apiFetch(`/auth/admin/users/${userId}/activity?${buildListQuery({ page, limit })}`),
        [userId]
    );

    const { setPage, data: events, pagination, loading, error } = usePagedList({ fetcher });

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    if (loading && events.length === 0) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Events will appear here as the user interacts with Waraqah."
            />
        );
    }

    return (
        <>
            <ul className="divide-y divide-zinc-100">
                {events.map((event) => {
                    const Icon = ACTIVITY_ICONS[event.type] || Activity;
                    return (
                        <li key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-foreground-muted" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                                {event.description ? (
                                    <p className="text-xs text-foreground-muted mt-0.5">{event.description}</p>
                                ) : null}
                                <p className="text-[11px] text-foreground-muted/70 mt-1 tabular-nums">
                                    {formatDateTime(event.at)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="mt-4 pt-4 border-t border-border/50">
                <PaginationBar
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    onPageChange={setPage}
                    disabled={loading}
                />
            </div>
        </>
    );
}

function PaymentHistoryTable({ userId }) {
    const fetcher = useCallback(
        ({ page, limit }) =>
            apiFetch(`/auth/admin/users/${userId}/payments?${buildListQuery({ page, limit })}`),
        [userId]
    );

    const { setPage, data: payments, pagination, loading, error } = usePagedList({ fetcher });

    const columns = [
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount', className: 'text-right' },
        { key: 'status', label: 'Status' },
        { key: 'reference', label: 'Reference' },
    ];

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    if (loading && payments.length === 0) {
        return (
            <div className="flex justify-center py-6">
                <Spinner />
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <EmptyState
                icon={Receipt}
                title="No payments"
                description="Paystack subscription charges will appear here."
            />
        );
    }

    return (
        <>
            <DataTable columns={columns}>
                {payments.map((payment) => (
                    <DataTableRow key={payment.id}>
                        <DataTableCell>
                            <span className="text-foreground-muted tabular-nums">
                                {formatDate(payment.paidAt || payment.createdAt)}
                            </span>
                        </DataTableCell>
                        <DataTableCell className="text-right">
                            <span className="font-medium text-foreground tabular-nums">
                                {formatCurrency(payment.amount)}
                            </span>
                        </DataTableCell>
                        <DataTableCell>
                            <PaymentStatusBadge status={payment.status} />
                        </DataTableCell>
                        <DataTableCell>
                            <span className="text-xs text-foreground-muted font-mono truncate max-w-[180px] block">
                                {payment.reference || '—'}
                            </span>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <div className="mt-4">
                <PaginationBar
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    onPageChange={setPage}
                    disabled={loading}
                />
            </div>
        </>
    );
}

function SubscriptionHistory({ userId }) {
    const fetcher = useCallback(
        ({ page, limit }) =>
            apiFetch(
                `/auth/admin/users/${userId}/subscription-history?${buildListQuery({ page, limit })}`
            ),
        [userId]
    );

    const { setPage, data: events, pagination, loading, error } = usePagedList({ fetcher });

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    if (loading && events.length === 0) {
        return (
            <div className="flex justify-center py-4">
                <Spinner size="sm" />
            </div>
        );
    }

    if (events.length === 0) {
        return <p className="text-sm text-foreground-muted">No subscription changes recorded.</p>;
    }

    return (
        <>
            <ul className="divide-y divide-zinc-100">
                {events.map((event) => (
                    <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        {event.description ? (
                            <p className="text-xs text-foreground-muted mt-0.5">{event.description}</p>
                        ) : null}
                        <p className="text-[11px] text-foreground-muted/70 mt-0.5">{formatDateTime(event.at)}</p>
                    </li>
                ))}
            </ul>
            {pagination.totalPages > 1 ? (
                <div className="mt-3">
                    <PaginationBar
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={setPage}
                        disabled={loading}
                    />
                </div>
            ) : null}
        </>
    );
}

function AdminNotesSection({ userId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const [error, setError] = useState('');

    const loadNotes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/notes`);
            setNotes(data?.data || []);
        } catch (e) {
            setError(e.message);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleAdd = async () => {
        const body = draft.trim();
        if (!body) return;
        setSaving(true);
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ body }),
            });
            setNotes((prev) => [data.note, ...prev]);
            setDraft('');
        } catch (e) {
            setError(e.message);
        }
        setSaving(false);
    };

    const handleSaveEdit = async (noteId) => {
        const body = editDraft.trim();
        if (!body) return;
        setSaving(true);
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/notes/${noteId}`, {
                method: 'PATCH',
                body: JSON.stringify({ body }),
            });
            setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)));
            setEditingId(null);
            setEditDraft('');
        } catch (e) {
            setError(e.message);
        }
        setSaving(false);
    };

    return (
        <SectionCard title="Admin notes" icon={StickyNote}>
            {error ? (
                <p className="text-sm text-red-600 mb-3">{error}</p>
            ) : null}
            <div className="mb-4">
                <textarea
                    className="input-field min-h-[88px] resize-y"
                    placeholder="Add a note about this user (e.g. manual upgrade, reported bug…)"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={saving}
                />
                <div className="mt-2 flex justify-end">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAdd}
                        disabled={saving || !draft.trim()}
                    >
                        {saving ? <Spinner size="sm" inline /> : 'Add note'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                </div>
            ) : notes.length === 0 ? (
                <p className="text-sm text-foreground-muted">No admin notes yet.</p>
            ) : (
                <ul className="space-y-3">
                    {notes.map((note) => (
                        <li key={note.id} className="rounded-xl border border-border/50 bg-surface-muted/50 p-3">
                            {editingId === note.id ? (
                                <>
                                    <textarea
                                        className="input-field min-h-[72px] resize-y mb-2"
                                        value={editDraft}
                                        onChange={(e) => setEditDraft(e.target.value)}
                                        disabled={saving}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            className="btn-secondary text-sm"
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditDraft('');
                                            }}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary text-sm"
                                            onClick={() => handleSaveEdit(note.id)}
                                            disabled={saving || !editDraft.trim()}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.body}</p>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        <p className="text-[11px] text-foreground-muted/70">
                                            {note.authorName || 'Admin'} · {formatDateTime(note.createdAt)}
                                        </p>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground"
                                            onClick={() => {
                                                setEditingId(note.id);
                                                setEditDraft(note.body);
                                            }}
                                        >
                                            <Pencil size={12} aria-hidden />
                                            Edit
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </SectionCard>
    );
}

function DeleteAccountModal({ open, email, onConfirm, onCancel, loading }) {
    const [confirmEmail, setConfirmEmail] = useState('');

    useEffect(() => {
        if (!open) setConfirmEmail('');
    }, [open]);

    const matches = confirmEmail.trim().toLowerCase() === (email || '').trim().toLowerCase();

    return (
        <ModalShell
            open={open}
            onClose={loading ? undefined : onCancel}
            size="sm"
            ariaLabelledby="delete-user-title"
        >
            <div className="p-5 sm:p-6">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md mb-3 bg-red-50 text-red-600">
                        <AlertTriangle size={18} aria-hidden />
                    </div>
                    <h2 id="delete-user-title" className="text-base font-semibold text-foreground">
                        Delete account permanently?
                    </h2>
                    <p className="mt-1.5 text-sm text-foreground-muted leading-relaxed">
                        This removes the user, their business info, invoices, clients, and all related
                        data. Type <strong className="font-medium text-foreground">{email}</strong> to
                        confirm.
                    </p>
                </div>
                <input
                    type="text"
                    className="input-field mt-4"
                    placeholder="Type email to confirm"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                />
                <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
                    <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-danger flex-1"
                        onClick={onConfirm}
                        disabled={loading || !matches}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" inline tone="on-color" />
                                Deleting…
                            </>
                        ) : (
                            'Delete account'
                        )}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

export default function AdminUserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const currentUserId = currentUser?.id ? String(currentUser.id) : '';

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirmStatus, setConfirmStatus] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}`, { cache: 'no-store' });
            setProfile(data);
            setNotFound(false);
        } catch (e) {
            if (e.status === 403) {
                setForbidden(true);
            } else if (e.status === 404) {
                setNotFound(true);
            } else {
                setAlert({ open: true, message: e.message });
            }
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const isSelf = profile?.user?.id === currentUserId;
    const isPremium = profile?.billing?.plan === 'premium';
    const isLocked =
        profile?.user?.lockUntil ||
        (profile?.user?.failedLoginAttempts && profile.user.failedLoginAttempts >= 5);

    const handleStatus = async () => {
        setActionLoading('status');
        try {
            await apiFetch(`/auth/admin/users/${userId}/status`, { method: 'PATCH' });
            setConfirmStatus(false);
            await loadProfile();
            setAlert({
                open: true,
                message: 'User status updated.',
                type: 'success',
            });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handlePlan = async () => {
        setActionLoading('plan');
        const nextPlan = isPremium ? 'free' : 'premium';
        try {
            await apiFetch(`/auth/admin/users/${userId}/plan`, {
                method: 'PATCH',
                body: JSON.stringify({ plan: nextPlan }),
            });
            await loadProfile();
            setAlert({ open: true, message: 'Plan updated.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleUnlock = async () => {
        setActionLoading('unlock');
        try {
            await apiFetch(`/auth/admin/users/${userId}/unlock`, { method: 'PATCH' });
            await loadProfile();
            setAlert({ open: true, message: 'Account unlocked.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleResetQuota = async () => {
        setActionLoading('quota');
        try {
            await apiFetch(`/auth/admin/users/${userId}/invoice-usage/reset`, { method: 'PATCH' });
            await loadProfile();
            setAlert({ open: true, message: 'Free quota reset.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleDelete = async () => {
        setActionLoading('delete');
        try {
            await apiFetch(`/auth/admin/users/${userId}`, { method: 'DELETE' });
            setConfirmDelete(false);
            navigate('/admin', { replace: true });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    if (forbidden) {
        return <Navigate to="/" replace />;
    }

    if (loading && !profile) {
        return (
            <div className="max-w-6xl mx-auto flex justify-center py-20">
                <Spinner />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="max-w-3xl mx-auto">
                <EmptyState
                    icon={Users}
                    title="User not found"
                    description="This account may have been deleted."
                    action={
                        <Link to="/admin" className="btn-secondary">
                            Back to admin
                        </Link>
                    }
                />
            </div>
        );
    }

    if (!profile) return null;

    const { user, businessInfo, stats, invoiceUsage, billing } = profile;
    const busy = Boolean(actionLoading);

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ConfirmModal
                open={confirmStatus}
                title={user.status === 'active' ? 'Suspend user?' : 'Reactivate user?'}
                description={
                    user.status === 'active'
                        ? 'The user will be unable to sign in until reactivated.'
                        : 'The user will regain access to their account.'
                }
                confirmLabel={user.status === 'active' ? 'Suspend' : 'Reactivate'}
                variant={user.status === 'active' ? 'danger' : 'default'}
                loading={actionLoading === 'status'}
                onConfirm={handleStatus}
                onCancel={() => setConfirmStatus(false)}
            />
            <DeleteAccountModal
                open={confirmDelete}
                email={user.email}
                loading={actionLoading === 'delete'}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />

            <div className="max-w-6xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to users
                </Link>

                <div className="card mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <UserAvatar name={user.name} email={user.email} />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold text-foreground truncate">
                                    {user.name || 'Unnamed user'}
                                </h1>
                                {user.isAdmin ? (
                                    <Shield size={16} className="text-brand shrink-0" aria-label="Admin" />
                                ) : null}
                                <StatusBadge status={user.status} />
                                <PlanBadge plan={billing.plan} />
                            </div>
                            <p className="text-sm text-foreground-muted mt-1 truncate">{user.email}</p>
                            {businessInfo?.name ? (
                                <p className="text-sm text-foreground-muted mt-0.5 font-medium">{businessInfo.name}</p>
                            ) : (
                                <p className="text-xs text-red-600 mt-0.5 font-medium">Business info missing</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                                type="button"
                                className="btn-secondary text-sm"
                                disabled={busy || isSelf}
                                onClick={() => setConfirmStatus(true)}
                            >
                                {user.status === 'active' ? (
                                    <>
                                        <Ban size={14} aria-hidden />
                                        Suspend
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={14} aria-hidden />
                                        Reactivate
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary text-sm"
                                disabled={busy}
                                onClick={handlePlan}
                            >
                                <Crown size={14} aria-hidden />
                                {isPremium ? 'Downgrade' : 'Upgrade'}
                            </button>
                            <a href={`mailto:${user.email}`} className="btn-secondary text-sm">
                                <Mail size={14} aria-hidden />
                                Email
                            </a>
                            {isLocked ? (
                                <button
                                    type="button"
                                    className="btn-secondary text-sm"
                                    disabled={busy || isSelf}
                                    onClick={handleUnlock}
                                >
                                    <Unlock size={14} aria-hidden />
                                    Unlock
                                </button>
                            ) : null}
                            {!isPremium ? (
                                <button
                                    type="button"
                                    className="btn-secondary text-sm"
                                    disabled={busy}
                                    onClick={handleResetQuota}
                                >
                                    <RotateCcw size={14} aria-hidden />
                                    Reset quota
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <SectionCard title="Account overview" icon={Users}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                <StatItem label="Joined" value={formatDate(user.createdAt)} />
                                <StatItem label="Last login" value={formatDateTime(user.lastLogin)} />
                                <StatItem label="Last active" value={formatDateTime(user.lastActiveAt)} />
                            </div>
                            <div className="pt-4 border-t border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted/70 mb-2">
                                    Free quota this month
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <UsageBadge usage={invoiceUsage} />
                                    {!invoiceUsage?.unlimited && invoiceUsage?.periodEnd ? (
                                        <span className="text-xs text-foreground-muted">
                                            Resets {formatDate(invoiceUsage.periodEnd)}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted/70 mb-3">
                                    All-time totals
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <StatItem label="Invoices" value={stats.invoiceCount} />
                                    <StatItem label="Quotations" value={stats.quotationCount} />
                                    <StatItem label="Clients" value={stats.clientCount} />
                                    <StatItem label="Products" value={stats.productCount} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Activity timeline" icon={Activity}>
                            <ActivityFeed userId={userId} />
                        </SectionCard>

                        <SectionCard title="Billing & subscription" icon={Receipt}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 pb-5 border-b border-border/50">
                                <div>
                                    <p className="text-xs text-foreground-muted">Current plan</p>
                                    <div className="mt-1">
                                        <PlanBadge plan={billing.plan} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-muted">Billing cycle</p>
                                    <p className="text-sm font-medium text-foreground mt-1 capitalize">
                                        {billing.billingInterval || (billing.plan === 'premium' ? '—' : 'N/A')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-muted">Subscription status</p>
                                    <p className="text-sm font-medium text-foreground mt-1 capitalize">
                                        {billing.subscriptionStatus || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-muted">Next billing date</p>
                                    <p className="text-sm font-medium text-foreground mt-1 tabular-nums">
                                        {formatDate(billing.subscriptionRenews || billing.premiumUntil)}
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted/70 mb-3">
                                Payment history
                            </p>
                            <PaymentHistoryTable userId={userId} />

                            <div className="mt-6 pt-5 border-t border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted/70 mb-3">
                                    Subscription status history
                                </p>
                                <SubscriptionHistory userId={userId} />
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <AdminNotesSection userId={userId} />

                        <SectionCard title="Danger zone" icon={AlertTriangle} className="border-red-100">
                            <p className="text-sm text-foreground-muted mb-4">
                                Destructive actions for this account. Use with care.
                            </p>
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-border/50 bg-surface-muted/50">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {user.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                                        </p>
                                        <p className="text-xs text-foreground-muted mt-0.5">
                                            {user.status === 'active'
                                                ? 'Block sign-in without deleting data.'
                                                : 'Restore access for this user.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={user.status === 'active' ? 'btn-danger text-sm' : 'btn-primary text-sm'}
                                        disabled={busy || isSelf}
                                        onClick={() => setConfirmStatus(true)}
                                    >
                                        {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl border border-red-100 bg-red-50/30">
                                    <div>
                                        <p className="text-sm font-medium text-red-900">Delete account</p>
                                        <p className="text-xs text-red-700/80 mt-0.5">
                                            Permanently remove this user and all their data.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-danger text-sm"
                                        disabled={busy || isSelf}
                                        onClick={() => setConfirmDelete(true)}
                                    >
                                        <Trash2 size={14} aria-hidden />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </>
    );
}
