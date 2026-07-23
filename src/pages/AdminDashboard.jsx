import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
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
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FREE_MONTHLY_INVOICE_LIMIT } from '../utils/invoiceLimits';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { AdminPageSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import { usePagedList } from '../hooks/usePagedList';
import { buildListQuery } from '../utils/pagination';

function StatusBadge({ status }) {
    const active = status === 'active';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}
        >
            {active ? <CheckCircle size={12} aria-hidden /> : <Ban size={12} aria-hidden />}
            {status || 'unknown'}
        </span>
    );
}

function PlanBadge({ plan }) {
    const premium = plan === 'premium';
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                premium ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
            }`}
        >
            {premium ? <Crown size={12} aria-hidden /> : null}
            {plan || 'free'}
        </span>
    );
}

function UsageBadge({ usage }) {
    if (!usage || usage.unlimited) {
        return (
            <span className="text-xs font-medium text-zinc-500">Unlimited</span>
        );
    }
    const atLimit = !usage.canCreate;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums ${
                atLimit
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
            }`}
        >
            {usage.used}/{usage.limit} this month
        </span>
    );
}

function AdminActionItem({
    icon: Icon,
    label,
    onClick,
    disabled,
    tone = 'default',
}) {
    const tones = {
        default: 'text-zinc-700 hover:bg-zinc-50',
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
                      className="rounded-xl border border-zinc-200 bg-white shadow-card p-1.5"
                      role="menu"
                  >
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
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

                      <div className="my-1 border-t border-zinc-100" />
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
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

                      <div className="my-1 border-t border-zinc-100" />
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 min-w-[108px]"
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
    const [actionLoading, setActionLoading] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, userId: null });
    const [forbidden, setForbidden] = useState(false);
    const [summary, setSummary] = useState({ total: 0, premium: 0, suspended: 0 });

    const { user } = useAuth();
    const currentUserId = user?.id ? String(user.id) : '';

    const fetcher = useCallback(async ({ page, limit, search }) => {
        try {
            const payload = await apiFetch(
                `/auth/admin/users?${buildListQuery({ page, limit, search })}`
            );
            if (payload?.summary) setSummary(payload.summary);
            return payload;
        } catch (e) {
            if (e.status === 403) {
                setForbidden(true);
                return { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
            }
            throw e;
        }
    }, []);

    const {
        setPage,
        search,
        setSearch,
        data: users,
        pagination,
        loading,
        error,
        refresh,
        setData: setUsers,
    } = usePagedList({ fetcher, enabled: !forbidden });

    const stats = summary;

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

    if (loading && users.length === 0) {
        return <AdminPageSkeleton />;
    }

    if (forbidden) {
        return <Navigate to="/" replace />;
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto card border-red-200 bg-red-50 text-red-800">
                {error}
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
                open={confirm.open}
                title="Delete user?"
                description="This permanently removes the user and their data. This cannot be undone."
                confirmLabel="Delete user"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, userId: null })}
            />

            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Admin"
                    subtitle="Manage users, plans, and account access"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-card-icon bg-brand-light">
                            <Users className="h-6 w-6 text-brand" aria-hidden />
                        </div>
                        <div className="stat-card-body">
                            <p className="text-sm text-zinc-500">Total users</p>
                            <p className="stat-card-value">{stats.total}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon bg-amber-50">
                            <Crown className="h-6 w-6 text-amber-600" aria-hidden />
                        </div>
                        <div className="stat-card-body">
                            <p className="text-sm text-zinc-500">Premium</p>
                            <p className="stat-card-value">{stats.premium}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon bg-red-50">
                            <Ban className="h-6 w-6 text-red-600" aria-hidden />
                        </div>
                        <div className="stat-card-body">
                            <p className="text-sm text-zinc-500">Suspended</p>
                            <p className="stat-card-value">{stats.suspended}</p>
                        </div>
                    </div>
                </div>

                <div className="card !p-0 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-zinc-600">
                            <FileText size={16} aria-hidden />
                            <span>
                                {pagination.total} user{pagination.total === 1 ? '' : 's'}
                            </span>
                        </div>
                        <div className="relative max-w-xs w-full sm:w-72">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
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
                    </div>

                    <div className="overflow-x-auto scroll-x-touch">
                        <table className="w-full min-w-[960px] text-sm">
                            <thead>
                                <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
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
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-zinc-50/80 transition-colors">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="min-w-[180px]">
                                                <p className="font-semibold text-zinc-900 flex items-center gap-2">
                                                    {user.name || '—'}
                                                    {user.isAdmin ? (
                                                        <Shield
                                                            size={14}
                                                            className="text-brand shrink-0"
                                                            aria-label="Admin"
                                                        />
                                                    ) : null}
                                                </p>
                                                <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[220px]">
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
                                        <td className="px-4 py-4 text-zinc-600 whitespace-nowrap">
                                            <p>{user.invoiceCount ?? 0} inv · {user.clientCount ?? 0} clients</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">
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
                                                    <p className="font-medium text-zinc-800 truncate max-w-[160px]">
                                                        {user.businessInfo.name}
                                                    </p>
                                                    <p className="text-xs text-zinc-400 truncate max-w-[160px]">
                                                        {user.businessInfo.phone || user.businessInfo.email || '—'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-red-600">Missing</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                            <AdminActionsMenu
                                                user={user}
                                                currentUserId={currentUserId}
                                                actionLoading={actionLoading}
                                                onPlan={handlePlan}
                                                onStatus={handleStatus}
                                                onAdmin={handleAdmin}
                                                onUnlock={handleUnlock}
                                                onResetQuota={handleResetQuota}
                                                onDelete={handleDelete}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <EmptyState
                            icon={Users}
                            title={search ? 'No users match your search' : 'No users yet'}
                            description={
                                search
                                    ? 'Try a different search term.'
                                    : 'Registered accounts will appear here.'
                            }
                            action={
                                search ? (
                                    <button type="button" onClick={() => setSearch('')} className="btn-secondary">
                                        Clear search
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
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
