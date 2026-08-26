import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    Search,
    Shield,
    ShieldOff,
    Crown,
    Ban,
    CheckCircle,
    Trash2,
    Unlock,
    MoreHorizontal,
    RotateCcw,
    Users,
    FileText,
    ExternalLink,
    Download,
} from 'lucide-react';
import { apiFetch, downloadExport } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FREE_MONTHLY_INVOICE_LIMIT } from '../utils/invoiceLimits';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import AdaptiveStatValue from '../components/AdaptiveStatValue';
import Spinner from '../components/Spinner';
import { TableBodySkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import CustomSelect from '../components/CustomSelect';
import { usePagedQuery } from '../hooks/usePagedQuery';
import {
    buildListQuery,
    buildAdminUsersExportQuery,
    buildAdminUsersExportFilename,
} from '../utils/pagination';
import { StatusBadge, PlanBadge, UsageBadge } from '../components/admin/AdminBadges';

const PLAN_FILTER_OPTIONS = [
    { value: 'all', label: 'All plans' },
    { value: 'free', label: 'Free' },
    { value: 'premium', label: 'Premium' },
];

const STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
];

const ACTIVITY_FILTER_OPTIONS = [
    { value: 'all', label: 'All activity' },
    { value: 'has_invoices', label: 'Has invoices' },
    { value: 'no_invoices', label: 'No invoices yet' },
];

function AdminActionItem({
    icon: Icon,
    label,
    onClick,
    disabled,
    tone = 'default',
}) {
    const tones = {
        default: 'text-foreground-muted hover:bg-surface-muted',
        premium: 'text-amber-800 hover:bg-amber-50',
        success: 'text-green-800 hover:bg-green-50',
        danger: 'text-red-700 hover:bg-red-50',
    };
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]}`}
        >
            <Icon size={16} className="shrink-0" aria-hidden />
            {label}
        </button>
    );
}

function AdminActionsMenu({
    user,
    currentUserId,
    actionLoading,
    onView,
    onPlan,
    onStatus,
    onAdmin,
    onUnlock,
    onResetQuota,
    onDelete,
}) {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const isSelf = user._id === currentUserId;
    const isPremium = user.businessInfo?.plan === 'premium';
    const isLocked =
        user.lockUntil ||
        (user.failedLoginAttempts && user.failedLoginAttempts >= 5);
    const loadingKey = actionLoading?.startsWith(user._id) ? actionLoading : '';
    const busy = Boolean(loadingKey);

    const updateMenuPosition = () => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuWidth = 224;
        const gap = 8;
        const menuHeight = menuRef.current?.offsetHeight ?? 320;
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const spaceAbove = rect.top - gap;
        const openUp = spaceBelow < menuHeight && spaceAbove >= spaceBelow;

        setMenuStyle({
            position: 'fixed',
            top: openUp ? rect.top - gap : rect.bottom + gap,
            left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
            transform: openUp ? 'translateY(-100%)' : undefined,
            width: menuWidth,
            zIndex: 50,
        });
    };

    useLayoutEffect(() => {
        if (!open) {
            setMenuStyle(null);
            return undefined;
        }

        updateMenuPosition();
        const raf = requestAnimationFrame(updateMenuPosition);

        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (e) => {
            if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
                return;
            }
            setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    const closeAnd = (fn) => {
        setOpen(false);
        fn();
    };

    const menu =
        open && menuStyle
            ? createPortal(
                  <div
                      ref={menuRef}
                      style={menuStyle}
                      className="rounded-xl border border-border bg-surface shadow-card p-1.5"
                      role="menu"
                  >
                      <AdminActionItem
                          icon={ExternalLink}
                          label="View profile"
                          disabled={busy}
                          onClick={() => closeAnd(() => onView(user._id))}
                      />
                      <div className="my-1 border-t border-border/50" />
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted/70">
                          Plan & billing
                      </p>
                      <AdminActionItem
                          icon={Crown}
                          label={isPremium ? 'Revoke Premium' : 'Grant Premium'}
                          tone="premium"
                          disabled={busy}
                          onClick={() =>
                              closeAnd(() =>
                                  onPlan(user._id, user.businessInfo?.plan || 'free')
                              )
                          }
                      />
                      {!isPremium && (
                          <AdminActionItem
                              icon={RotateCcw}
                              label={`Reset free quota (${FREE_MONTHLY_INVOICE_LIMIT})`}
                              tone="success"
                              disabled={busy}
                              onClick={() => closeAnd(() => onResetQuota(user._id))}
                          />
                      )}

                      <div className="my-1 border-t border-border/50" />
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted/70">
                          Account
                      </p>
                      <AdminActionItem
                          icon={user.status === 'active' ? Ban : CheckCircle}
                          label={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                          disabled={busy || isSelf}
                          onClick={() => closeAnd(() => onStatus(user._id))}
                      />
                      <AdminActionItem
                          icon={user.isAdmin ? ShieldOff : Shield}
                          label={user.isAdmin ? 'Remove admin' : 'Make admin'}
                          disabled={busy || isSelf}
                          onClick={() => closeAnd(() => onAdmin(user._id))}
                      />
                      <AdminActionItem
                          icon={Unlock}
                          label="Unlock login"
                          tone="success"
                          disabled={busy || isSelf || !isLocked}
                          onClick={() => closeAnd(() => onUnlock(user._id))}
                      />

                      <div className="my-1 border-t border-border/50" />
                      <AdminActionItem
                          icon={Trash2}
                          label="Delete user"
                          tone="danger"
                          disabled={busy || isSelf}
                          onClick={() => closeAnd(() => onDelete(user._id))}
                      />
                  </div>,
                  document.body
              )
            : null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors disabled:opacity-50 min-w-[108px]"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {busy ? (
                    <Spinner size="sm" inline />
                ) : (
                    <MoreHorizontal size={16} aria-hidden />
                )}
                Actions
            </button>
            {menu}
        </>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activityFilter, setActivityFilter] = useState('all');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, userId: null });
    const [forbidden, setForbidden] = useState(false);

    const { user } = useAuth();
    const currentUserId = user?.id ? String(user.id) : '';

    const fetcher = useCallback(
        async ({ page, limit, search, plan, status, activity }) => {
            try {
                return await apiFetch(
                    `/auth/admin/users?${buildListQuery({
                        page,
                        limit,
                        search,
                        plan,
                        status,
                        activity,
                    })}`
                );
            } catch (e) {
                if (e.status === 403) {
                    setForbidden(true);
                    return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
                }
                throw e;
            }
        },
        []
    );

    const {
        setPage,
        search,
        setSearch,
        debouncedSearch,
        data: users,
        pagination,
        summary,
        loading,
        fetching,
        error,
        refresh,
        setData: setUsers,
        invalidateList,
    } = usePagedQuery({
        queryKeyBase: 'adminUsers',
        fetcher,
        enabled: !forbidden,
        extraParams: {
            plan: planFilter,
            status: statusFilter,
            activity: activityFilter,
        },
    });

    useEffect(() => {
        setPage(1);
    }, [planFilter, statusFilter, activityFilter, setPage]);

    const stats = summary ?? { total: 0, premium: 0, suspended: 0 };
    const tableLoading = loading && users.length === 0;

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const query = buildAdminUsersExportQuery({
                search: debouncedSearch,
                plan: planFilter,
                status: statusFilter,
                activity: activityFilter,
            });
            const filename = buildAdminUsersExportFilename({
                search: debouncedSearch,
                plan: planFilter,
                status: statusFilter,
                activity: activityFilter,
            });
            await downloadExport(`/auth/admin/users/export?${query}`, { filename });
            setAlert({ open: true, message: 'Users exported successfully.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setExportLoading(false);
    };

    const hasActiveFilters =
        planFilter !== 'all' ||
        statusFilter !== 'all' ||
        activityFilter !== 'all' ||
        Boolean(debouncedSearch.trim());

    const handleStatus = async (userId) => {
        setActionLoading(`${userId}-status`);
        try {
            await apiFetch(`/auth/admin/users/${userId}/status`, { method: 'PATCH' });
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
                        : u
                )
            );
            await refresh();
            invalidateList();
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleDelete = (userId) => setConfirm({ open: true, userId });

    const confirmDelete = async () => {
        const userId = confirm.userId;
        setActionLoading(`${userId}-delete`);
        try {
            await apiFetch(`/auth/admin/users/${userId}`, { method: 'DELETE' });
            setConfirm({ open: false, userId: null });
            await refresh();
            invalidateList();
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
        setConfirm({ open: false, userId: null });
    };

    const handleAdmin = async (userId) => {
        setActionLoading(`${userId}-admin`);
        try {
            await apiFetch(`/auth/admin/users/${userId}/admin`, { method: 'PATCH' });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u))
            );
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handlePlan = async (userId, currentPlan) => {
        setActionLoading(`${userId}-plan`);
        const nextPlan = currentPlan === 'premium' ? 'free' : 'premium';
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/plan`, {
                method: 'PATCH',
                body: JSON.stringify({ plan: nextPlan }),
            });
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? {
                              ...u,
                              businessInfo: data.businessInfo || {
                                  ...(u.businessInfo || {}),
                                  plan: nextPlan,
                              },
                              invoiceUsage:
                                  nextPlan === 'premium'
                                      ? {
                                            unlimited: true,
                                            limit: null,
                                            used: 0,
                                            remaining: null,
                                            canCreate: true,
                                        }
                                      : u.invoiceUsage,
                          }
                        : u
                )
            );
            await refresh();
            invalidateList();
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleUnlock = async (userId) => {
        setActionLoading(`${userId}-unlock`);
        try {
            await apiFetch(`/auth/admin/users/${userId}/unlock`, { method: 'PATCH' });
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? { ...u, failedLoginAttempts: 0, lockUntil: undefined }
                        : u
                )
            );
            setAlert({ open: true, message: 'User account unlocked.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleResetQuota = async (userId) => {
        setActionLoading(`${userId}-reset-quota`);
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/invoice-usage/reset`, {
                method: 'PATCH',
            });
            setUsers((prev) =>
                prev.map((u) =>
                    u._id === userId
                        ? { ...u, invoiceUsage: data.invoiceUsage || u.invoiceUsage }
                        : u
                )
            );
            setAlert({ open: true, message: data.message || 'Free invoice quota reset.', type: 'success' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    if (forbidden) {
        return <Navigate to="/" replace />;
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
                open={confirm.open}
                title="Delete user?"
                description="This permanently removes the user and their data. This cannot be undone."
                confirmLabel="Delete user"
                cancelLabel="Cancel"
                variant="danger"
                loading={Boolean(confirm.userId && actionLoading === `${confirm.userId}-delete`)}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, userId: null })}
            />

            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Admin"
                    subtitle="Manage users, plans, and account access"
                />

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="stat-card">
                        <p className="text-xs text-foreground-muted font-medium leading-snug truncate">
                            Total users
                        </p>
                        <AdaptiveStatValue value={stats.total} />
                    </div>
                    <div className="stat-card">
                        <p className="text-xs text-foreground-muted font-medium leading-snug truncate">
                            Premium
                        </p>
                        <AdaptiveStatValue value={stats.premium} />
                    </div>
                    <div className="stat-card">
                        <p className="text-xs text-foreground-muted font-medium leading-snug truncate">
                            Suspended
                        </p>
                        <AdaptiveStatValue value={stats.suspended} />
                    </div>
                </div>

                {error ? (
                    <div className="mb-4 card border-red-200 bg-red-50 text-red-800 text-sm">
                        {error}
                    </div>
                ) : null}

                <div className="card !p-0 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-border/50 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                                <FileText size={16} aria-hidden />
                                <span>
                                    {pagination.total} user{pagination.total === 1 ? '' : 's'}
                                    {hasActiveFilters ? (
                                        <span className="text-foreground-muted/70"> (filtered)</span>
                                    ) : null}
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
                                <div className="relative flex-1 sm:w-72">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/70"
                                        aria-hidden
                                    />
                                    <input
                                        type="search"
                                        className="input-field pl-9"
                                        placeholder="Search name, email, business…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExport}
                                    disabled={exportLoading || tableLoading || pagination.total === 0}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors disabled:opacity-50 min-w-[108px]"
                                >
                                    {exportLoading ? (
                                        <Spinner size="sm" inline />
                                    ) : (
                                        <Download size={16} aria-hidden />
                                    )}
                                    Export
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <CustomSelect
                                value={planFilter}
                                onChange={setPlanFilter}
                                options={PLAN_FILTER_OPTIONS}
                                aria-label="Filter by plan"
                                className="w-full sm:w-[140px]"
                            />
                            <CustomSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={STATUS_FILTER_OPTIONS}
                                aria-label="Filter by status"
                                className="w-full sm:w-[150px]"
                            />
                            <CustomSelect
                                value={activityFilter}
                                onChange={setActivityFilter}
                                options={ACTIVITY_FILTER_OPTIONS}
                                aria-label="Filter by activity"
                                className="w-full sm:w-[160px]"
                            />
                            {hasActiveFilters ? (
                                <button
                                    type="button"
                                    className="inline-flex items-center px-3 py-2 rounded-xl border border-border bg-surface-muted text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors"
                                    onClick={() => {
                                        setPlanFilter('all');
                                        setStatusFilter('all');
                                        setActivityFilter('all');
                                        setSearch('');
                                    }}
                                >
                                    Clear filters
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto scroll-x-touch">
                        <table className="w-full min-w-[960px] text-sm">
                            <thead>
                                <tr className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                                    <th className="px-4 sm:px-6 py-3">User</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Plan</th>
                                    <th className="px-4 py-3">Free quota</th>
                                    <th className="px-4 py-3">Activity</th>
                                    <th className="px-4 py-3">Business</th>
                                    <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {tableLoading ? (
                                    <TableBodySkeleton rows={8} columns={7} />
                                ) : (
                                users.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="hover:bg-surface-muted/80 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/admin/users/${user._id}`)}
                                    >
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="min-w-[180px]">
                                                <p className="font-semibold text-foreground flex items-center gap-2">
                                                    {user.name || '—'}
                                                    {user.isAdmin ? (
                                                        <Shield
                                                            size={14}
                                                            className="text-brand shrink-0"
                                                            aria-label="Admin"
                                                        />
                                                    ) : null}
                                                </p>
                                                <p className="text-foreground-muted text-xs mt-0.5 truncate max-w-[220px]">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <PlanBadge plan={user.businessInfo?.plan || 'free'} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <UsageBadge usage={user.invoiceUsage} />
                                        </td>
                                        <td className="px-4 py-4 text-foreground-muted whitespace-nowrap">
                                            <p>{user.invoiceCount ?? 0} inv · {user.clientCount ?? 0} clients</p>
                                            <p className="text-xs text-foreground-muted/70 mt-0.5">
                                                Joined{' '}
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString('en-NG', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {user.businessInfo?.name ? (
                                                <div className="min-w-[120px]">
                                                    <p className="font-medium text-foreground truncate max-w-[160px]">
                                                        {user.businessInfo.name}
                                                    </p>
                                                    <p className="text-xs text-foreground-muted/70 truncate max-w-[160px]">
                                                        {user.businessInfo.phone || user.businessInfo.email || '—'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-red-600">Missing</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <AdminActionsMenu
                                                user={user}
                                                currentUserId={currentUserId}
                                                actionLoading={actionLoading}
                                                onView={(id) => navigate(`/admin/users/${id}`)}
                                                onPlan={handlePlan}
                                                onStatus={handleStatus}
                                                onAdmin={handleAdmin}
                                                onUnlock={handleUnlock}
                                                onResetQuota={handleResetQuota}
                                                onDelete={handleDelete}
                                            />
                                        </td>
                                    </tr>
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && !tableLoading && (
                        <EmptyState
                            icon={Users}
                            title={search || hasActiveFilters ? 'No users match your filters' : 'No users yet'}
                            description={
                                search || hasActiveFilters
                                    ? 'Try adjusting your search or filters.'
                                    : 'Registered accounts will appear here.'
                            }
                            action={
                                search || hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPlanFilter('all');
                                            setStatusFilter('all');
                                            setActivityFilter('all');
                                            setSearch('');
                                        }}
                                        className="btn-secondary"
                                    >
                                        Clear filters
                                    </button>
                                ) : null
                            }
                        />
                    )}
                    <div className="px-4 sm:px-6 pb-4">
                        <PaginationBar
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                            disabled={loading || fetching}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
