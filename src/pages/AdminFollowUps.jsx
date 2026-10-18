import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { BellOff, Clock, Eye, Mail, MoreHorizontal, RefreshCw, Send, SkipForward } from 'lucide-react';
import {
    LIFECYCLE_SEND_CAP,
    LIFECYCLE_SNOOZE_DAYS,
    LIFECYCLE_TEMPLATES,
} from '@waraqah/shared';
import { apiFetch } from '../utils/api';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { TableBodySkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import CustomSelect from '../components/CustomSelect';
import ModalShell from '../components/ModalShell';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { buildListQuery } from '../utils/pagination';

const TEMPLATE_FILTER_OPTIONS = [
    { value: 'all', label: 'All templates' },
    ...Object.values(LIFECYCLE_TEMPLATES).map((item) => ({
        value: item.id,
        label: item.label,
    })),
];

function formatDateTime(value) {
    if (!value) return '—';
    return format(new Date(value), 'MMM d, yyyy · h:mm a');
}

function FollowUpCheckbox({ checked, onChange, label }) {
    return (
        <label className="inline-flex h-8 w-8 items-center justify-center rounded-md cursor-pointer hover:bg-surface-muted">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="input-checkbox"
                aria-label={label}
            />
        </label>
    );
}

function FollowUpMenuItem({ icon: Icon, label, onClick, disabled, tone = 'default' }) {
    const tones = {
        default: 'text-foreground hover:bg-surface-muted',
        danger: 'text-red-700 hover:bg-red-50',
    };
    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tones[tone]}`}
        >
            <Icon size={16} className="shrink-0" aria-hidden />
            {label}
        </button>
    );
}

function FollowUpRowActions({ busy, onPreview, onSend, onSnooze, onSkip, onMute }) {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const updateMenuPosition = () => {
        const button = buttonRef.current;
        if (!button) return;
        const rect = button.getBoundingClientRect();
        const menuWidth = 188;
        const gap = 8;
        const menuHeight = menuRef.current?.offsetHeight ?? 160;
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const openUp = spaceBelow < menuHeight && rect.top - gap > spaceBelow;
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
            if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
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
                    <FollowUpMenuItem
                        icon={Clock}
                        label={`Snooze ${LIFECYCLE_SNOOZE_DAYS} days`}
                        disabled={busy}
                        onClick={() => closeAnd(onSnooze)}
                    />
                    <FollowUpMenuItem
                        icon={SkipForward}
                        label="Skip"
                        disabled={busy}
                        onClick={() => closeAnd(onSkip)}
                    />
                    <FollowUpMenuItem
                        icon={BellOff}
                        label="Mute user"
                        tone="danger"
                        disabled={busy}
                        onClick={() => closeAnd(onMute)}
                    />
                </div>,
                document.body
            )
            : null;

    return (
        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
                type="button"
                className="btn-secondary h-8 !py-1.5 !px-2.5 text-xs"
                disabled={busy}
                onClick={onPreview}
            >
                <Eye size={14} aria-hidden />
                Preview
            </button>
            <button
                type="button"
                className="btn-primary h-8 !py-1.5 !px-2.5 text-xs"
                disabled={busy}
                onClick={onSend}
            >
                <Send size={14} aria-hidden />
                Send
            </button>
            <button
                ref={buttonRef}
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/80 bg-surface text-foreground-muted hover:bg-surface-muted transition-colors disabled:opacity-50"
                disabled={busy}
                onClick={() => setOpen((value) => !value)}
                aria-label="More actions"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <MoreHorizontal size={16} aria-hidden />
            </button>
            {menu}
        </div>
    );
}

export default function AdminFollowUps() {
    const [template, setTemplate] = useState('all');
    const [stats, setStats] = useState({ pending: 0, snoozed: 0, templates: {} });
    const [forbidden, setForbidden] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [selected, setSelected] = useState(() => new Set());
    const [actionLoading, setActionLoading] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, type: '', ids: [] });

    const fetcher = useCallback(
        async ({ page, limit, search, template: templateFilter }) => {
            try {
                return await apiFetch(
                    `/auth/admin/follow-ups?${buildListQuery({
                        page,
                        limit,
                        search,
                        template: templateFilter,
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
        page,
        setPage,
        search,
        setSearch,
        data: items,
        pagination,
        loading,
        fetching,
        error,
        refresh,
    } = usePagedQuery({
        queryKeyBase: 'adminFollowUps',
        fetcher,
        extraParams: { template },
    });

    const loadStats = useCallback(async () => {
        try {
            const data = await apiFetch('/auth/admin/follow-ups/stats', { cache: 'no-store' });
            setStats({
                pending: data.pending || 0,
                snoozed: data.snoozed || 0,
                templates: data.templates || {},
            });
        } catch {
            /* list error is enough */
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats, items]);

    const selectedIds = useMemo(() => [...selected], [selected]);
    const allVisibleSelected = items.length > 0 && items.every((item) => selected.has(item.id));

    const toggleAll = () => {
        if (allVisibleSelected) {
            setSelected(new Set());
            return;
        }
        setSelected(new Set(items.map((item) => item.id)));
    };

    const toggleOne = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const afterChange = async (message, type = 'success') => {
        setSelected(new Set());
        setPreview(null);
        await refresh();
        await loadStats();
        if (message) setAlert({ open: true, message, type });
    };

    const openPreview = async (item) => {
        setPreview({ item, html: '', meta: null, error: '' });
        setPreviewLoading(true);
        try {
            const data = await apiFetch(`/auth/admin/follow-ups/${item.id}/preview`, {
                method: 'GET',
            });
            setPreview({
                item,
                html: data.html || '',
                meta: data,
                error: '',
            });
        } catch (e) {
            setPreview({ item, html: '', meta: null, error: e.message || 'Could not load preview.' });
        }
        setPreviewLoading(false);
    };

    const runAction = async (type, ids) => {
        const list = ids?.length ? ids : selectedIds;
        if (!list.length) return;
        setActionLoading(type);
        try {
            if (type === 'send' && list.length === 1) {
                const result = await apiFetch(`/auth/admin/follow-ups/${list[0]}/send`, { method: 'POST' });
                await afterChange(result.message);
            } else if (type === 'send') {
                const result = await apiFetch('/auth/admin/follow-ups/send-bulk', {
                    method: 'POST',
                    body: JSON.stringify({ ids: list.slice(0, LIFECYCLE_SEND_CAP) }),
                });
                const failedNote = result.failed?.length
                    ? ` ${result.failed.length} could not be sent.`
                    : '';
                await afterChange(`${result.message}${failedNote}`);
            } else if (type === 'skip') {
                for (const id of list) {
                    await apiFetch(`/auth/admin/follow-ups/${id}/skip`, { method: 'POST' });
                }
                await afterChange(list.length === 1 ? 'Follow-up skipped.' : `Skipped ${list.length} follow-ups.`);
            } else if (type === 'snooze') {
                for (const id of list) {
                    await apiFetch(`/auth/admin/follow-ups/${id}/snooze`, { method: 'POST' });
                }
                await afterChange(
                    list.length === 1
                        ? `Snoozed for ${LIFECYCLE_SNOOZE_DAYS} days.`
                        : `Snoozed ${list.length} follow-ups.`
                );
            } else if (type === 'mute') {
                await apiFetch(`/auth/admin/follow-ups/${list[0]}/mute`, { method: 'POST' });
                await afterChange('This user will not be queued for follow-ups.');
            }
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
        setConfirm({ open: false, type: '', ids: [] });
    };

    const handleRefreshQueue = async () => {
        setRefreshing(true);
        try {
            const result = await apiFetch('/auth/admin/follow-ups/refresh', {
                method: 'POST',
                timeoutMs: 45000,
            });
            await refresh();
            await loadStats();
            setAlert({
                open: true,
                message: `Queue updated. ${result.enqueued || 0} new, ${result.cancelled || 0} no longer eligible.`,
                type: 'success',
            });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setRefreshing(false);
    };

    if (forbidden) {
        return <Navigate to="/" replace />;
    }

    const tableLoading = loading && items.length === 0;
    const busy = Boolean(actionLoading) || refreshing;

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
                title={
                    confirm.type === 'send'
                        ? 'Send follow-up emails?'
                        : confirm.type === 'mute'
                            ? 'Stop follow-ups for this user?'
                            : 'Skip these follow-ups?'
                }
                description={
                    confirm.type === 'send'
                        ? `Send from Waraqah support, not as a personal name. ${confirm.ids.length} email${confirm.ids.length === 1 ? '' : 's'} (max ${LIFECYCLE_SEND_CAP} at a time).`
                        : confirm.type === 'mute'
                            ? 'They will be skipped now and will not appear in this queue again unless you turn follow-ups back on from their profile.'
                            : 'Skipped templates are not queued again for this period.'
                }
                confirmLabel={
                    confirm.type === 'send' ? 'Send email' : confirm.type === 'mute' ? 'Stop follow-ups' : 'Skip'
                }
                variant={confirm.type === 'mute' ? 'danger' : 'default'}
                loading={Boolean(actionLoading)}
                onConfirm={() => runAction(confirm.type, confirm.ids)}
                onCancel={() => setConfirm({ open: false, type: '', ids: [] })}
            />

            <ModalShell
                open={Boolean(preview)}
                onClose={busy ? undefined : () => setPreview(null)}
                size="2xl"
                showClose
                ariaLabelledby="follow-up-preview-title"
                panelClassName="sm:max-h-[90vh]"
            >
                {preview ? (
                    <div className="px-6 pt-6 pb-4 border-b border-border/50">
                        <h2 id="follow-up-preview-title" className="text-lg font-semibold text-foreground">
                            {preview.item.templateLabel}
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5 truncate">
                            To {preview.item.user?.displayName || preview.item.user?.email} · {preview.item.user?.email}
                        </p>
                    </div>
                ) : null}
                <div className="p-6 space-y-4">
                    {previewLoading && !preview?.html ? (
                        <div className="flex justify-center py-16">
                            <Spinner />
                        </div>
                    ) : preview?.error && !preview?.html ? (
                        <p className="text-sm text-red-600">{preview.error}</p>
                    ) : (
                        <div className="rounded-xl border border-border bg-surface-muted/40 overflow-hidden min-h-[280px]">
                            {preview?.meta ? (
                                <div className="px-3 py-2 border-b border-border/60 text-[11px] text-foreground-muted space-y-0.5">
                                    <p className="truncate">From {preview.meta.from}</p>
                                    <p className="truncate">{preview.meta.subject}</p>
                                </div>
                            ) : null}
                            {preview?.html ? (
                                <iframe
                                    title="Email preview"
                                    sandbox=""
                                    srcDoc={preview.html}
                                    className="w-full h-[420px] bg-white [color-scheme:light]"
                                />
                            ) : null}
                        </div>
                    )}
                    {preview?.item?.lastEmailAt ? (
                        <p className="text-xs text-amber-800">
                            Last emailed {formatDateTime(preview.item.lastEmailAt)}. Sending too soon will be blocked.
                        </p>
                    ) : null}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                        <button
                            type="button"
                            className="btn-secondary flex-1"
                            disabled={busy}
                            onClick={() => setPreview(null)}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn-secondary flex-1"
                            disabled={busy}
                            onClick={() => setConfirm({ open: true, type: 'skip', ids: [preview.item.id] })}
                        >
                            Skip
                        </button>
                        <button
                            type="button"
                            className="btn-primary flex-1"
                            disabled={busy || previewLoading}
                            onClick={() => setConfirm({ open: true, type: 'send', ids: [preview.item.id] })}
                        >
                            {actionLoading === 'send' ? 'Sending…' : 'Send email'}
                        </button>
                    </div>
                </div>
            </ModalShell>

            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Follow-ups"
                    subtitle="Review queued emails before anything is sent. WhatsApp stays manual."
                >
                    <button
                        type="button"
                        className="btn-secondary text-sm"
                        disabled={busy}
                        onClick={handleRefreshQueue}
                    >
                        {refreshing ? <Spinner size="sm" inline /> : <RefreshCw size={14} aria-hidden />}
                        Refresh queue
                    </button>
                </PageHeader>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Ready to send', value: stats.pending },
                        { label: 'Finish setup', value: stats.templates?.['finish-setup'] || 0 },
                        { label: 'We miss you', value: stats.templates?.['we-miss-you'] || 0 },
                        { label: 'Quota reached', value: stats.templates?.['quota-reached'] || 0 },
                    ].map((card) => (
                        <div key={card.label} className="stat-card stat-card-compact">
                            <p className="text-xs text-foreground-muted font-medium leading-snug truncate">
                                {card.label}
                            </p>
                            <p className="text-lg font-semibold tabular-nums mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>
                {stats.snoozed ? (
                    <p className="text-xs text-foreground-muted mb-4">
                        {stats.snoozed} snoozed follow-up{stats.snoozed === 1 ? '' : 's'} will return later.
                    </p>
                ) : null}

                {error ? (
                    <div className="mb-4 card border-red-200 bg-red-50 text-red-800 text-sm">
                        {error}
                    </div>
                ) : null}

                <div className="card !p-0 overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-border/50 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or email"
                                className="input-field sm:max-w-xs"
                                aria-label="Search follow-ups"
                            />
                            <CustomSelect
                                value={template}
                                onChange={(value) => {
                                    setTemplate(value);
                                    setPage(1);
                                }}
                                options={TEMPLATE_FILTER_OPTIONS}
                                aria-label="Filter by template"
                                className="min-w-0 w-full sm:w-[180px]"
                            />
                            {selectedIds.length > 0 ? (
                                <div className="flex flex-wrap gap-2 sm:ml-auto">
                                    <button
                                        type="button"
                                        className="btn-primary text-sm"
                                        disabled={busy}
                                        onClick={() => setConfirm({ open: true, type: 'send', ids: selectedIds })}
                                    >
                                        <Send size={14} aria-hidden />
                                        Send {selectedIds.length}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary text-sm"
                                        disabled={busy}
                                        onClick={() => runAction('snooze', selectedIds)}
                                    >
                                        Snooze {LIFECYCLE_SNOOZE_DAYS}d
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary text-sm"
                                        disabled={busy}
                                        onClick={() => setConfirm({ open: true, type: 'skip', ids: selectedIds })}
                                    >
                                        Skip
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px] text-sm">
                            <thead>
                                <tr className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                                    <th className="px-3 sm:px-4 py-3 w-12">
                                        <FollowUpCheckbox
                                            checked={allVisibleSelected}
                                            onChange={toggleAll}
                                            label="Select all on this page"
                                        />
                                    </th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Template</th>
                                    <th className="px-4 py-3">Why</th>
                                    <th className="px-4 py-3">Last email</th>
                                    <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {tableLoading ? (
                                    <TableBodySkeleton rows={6} columns={6} />
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState
                                                icon={Mail}
                                                title="No follow-ups waiting"
                                                description="The daily job only queues Finish setup, We miss you, and Quota reached. Nothing is sent until you review it here."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-surface-muted/80 transition-colors">
                                            <td className="px-3 sm:px-4 py-3">
                                                <FollowUpCheckbox
                                                    checked={selected.has(item.id)}
                                                    onChange={() => toggleOne(item.id)}
                                                    label={`Select ${item.user?.email || 'user'}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    to={`/admin/users/${item.user?.id}`}
                                                    className="font-semibold text-foreground hover:text-brand"
                                                >
                                                    {item.user?.displayName || item.user?.email || '—'}
                                                </Link>
                                                <p className="text-xs text-foreground-muted truncate">
                                                    {item.user?.email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 font-medium">{item.templateLabel}</td>
                                            <td className="px-4 py-4 text-foreground-muted max-w-xs">
                                                {item.reason}
                                            </td>
                                            <td className="px-4 py-4 text-foreground-muted whitespace-nowrap">
                                                {formatDateTime(item.lastEmailAt)}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 text-right">
                                                <FollowUpRowActions
                                                    busy={busy}
                                                    onPreview={() => openPreview(item)}
                                                    onSend={() => setConfirm({ open: true, type: 'send', ids: [item.id] })}
                                                    onSnooze={() => runAction('snooze', [item.id])}
                                                    onSkip={() => setConfirm({ open: true, type: 'skip', ids: [item.id] })}
                                                    onMute={() => setConfirm({ open: true, type: 'mute', ids: [item.id] })}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.totalPages > 1 ? (
                        <div className="px-4 sm:px-6 py-3 border-t border-border/50">
                            <PaginationBar
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                limit={pagination.limit}
                                onPageChange={setPage}
                                disabled={loading || fetching}
                                className="pt-0"
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
