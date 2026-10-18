import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { adminDisplayName } from '../utils/adminDisplayName';

const AUDIENCE_OPTIONS = [
    { value: 'all', label: 'Everyone' },
    { value: 'premium', label: 'Premium' },
    { value: 'free', label: 'Free plan' },
    { value: 'active', label: 'Active this week' },
    { value: 'inactive', label: 'Inactive 30+ days' },
    { value: 'individual', label: 'One person' },
];

const AUDIENCE_LABELS = Object.fromEntries(AUDIENCE_OPTIONS.map((option) => [option.value, option.label]));

const PUSH_TEMPLATES = [
    {
        id: 'new',
        label: 'New feature',
        title: 'New in Waraqah',
        body: 'A new update is ready in your workspace.',
        url: '/',
    },
    {
        id: 'premium',
        label: 'Premium',
        title: 'Waraqah Premium',
        body: 'See what Premium adds to your workspace.',
        url: '/upgrade',
    },
    {
        id: 'statements',
        label: 'Statements',
        title: 'Monthly statements',
        body: 'Your monthly statement is ready to download.',
        url: '/statements',
    },
];

function formatWhen(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function AdminPush({ embedded = false }) {
    const { showToast } = useToast();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('/');
    const [audience, setAudience] = useState('all');
    const [recipientQuery, setRecipientQuery] = useState('');
    const [recipientResults, setRecipientResults] = useState([]);
    const [recipient, setRecipient] = useState(null);
    const [searching, setSearching] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const loadStatus = useCallback(async (nextAudience = audience, nextUserId = recipient?._id || '') => {
        const params = new URLSearchParams({ audience: nextAudience });
        if (nextAudience === 'individual' && nextUserId) params.set('userId', nextUserId);
        const data = await apiFetch(`/admin/push?${params.toString()}`);
        setStatus(data);
    }, [audience, recipient?._id]);

    useEffect(() => {
        let cancelled = false;
        loadStatus()
            .catch((err) => {
                if (!cancelled) showToast(err.message || 'Could not load push status.', 'error');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [loadStatus, showToast]);

    useEffect(() => {
        if (audience !== 'individual') return undefined;
        const query = recipientQuery.trim();
        if (query.length < 2) {
            setRecipientResults([]);
            return undefined;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await apiFetch(`/auth/admin/users?search=${encodeURIComponent(query)}&limit=8`);
                if (!cancelled) setRecipientResults(Array.isArray(data?.data) ? data.data : []);
            } catch {
                if (!cancelled) setRecipientResults([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [audience, recipientQuery]);

    const weekBlocked = Boolean(status?.nextAllowedAt);
    const needsPerson = audience === 'individual' && !recipient?._id;
    const canSend = status?.configured && !weekBlocked && !sending && !needsPerson;

    const handleSend = async () => {
        setSending(true);
        try {
            const result = await apiFetch('/admin/push', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body,
                    url,
                    audience,
                    userId: recipient?._id || '',
                }),
            });
            showToast(
                result.sent
                    ? `Sent to ${result.sent} ${result.sent === 1 ? 'device' : 'devices'}.`
                    : 'Nothing was delivered.',
                result.sent ? 'success' : 'error',
            );
            setConfirmOpen(false);
            setTitle('');
            setBody('');
            setUrl('/');
            setAudience('all');
            setRecipient(null);
            setRecipientQuery('');
            await loadStatus('all', '');
        } catch (err) {
            showToast(err.message || 'Could not send the update.', 'error');
            setConfirmOpen(false);
            await loadStatus().catch(() => {});
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={embedded ? 'max-w-xl' : 'max-w-xl mx-auto'}>
            {embedded ? (
                <p className="mb-6 text-sm text-foreground-muted">
                    One note to people who allowed notifications. At most once a week.
                </p>
            ) : (
                <PageHeader
                    title="Product updates"
                    subtitle="One note to everyone who allowed notifications. At most once a week."
                />
            )}

            {loading ? (
                <div className="card flex justify-center py-10">
                    <Spinner />
                </div>
            ) : (
                <form
                    className="card space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (canSend) setConfirmOpen(true);
                    }}
                >
                    {!status?.configured ? (
                        <p className="text-sm text-foreground-muted">Push is not configured on the server yet.</p>
                    ) : null}
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground">Recipients</span>
                        <CustomSelect
                            value={audience}
                            onChange={(next) => {
                                setAudience(next);
                                if (next !== 'individual') {
                                    setRecipient(null);
                                    setRecipientQuery('');
                                }
                            }}
                            options={AUDIENCE_OPTIONS}
                            aria-label="Who receives this update"
                        />
                    </label>
                    {audience === 'individual' ? (
                        <div className="space-y-2">
                            {recipient ? (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {adminDisplayName(recipient) || recipient.email}
                                        </p>
                                        <p className="text-xs text-foreground-muted truncate">{recipient.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-sm text-foreground-muted"
                                        onClick={() => setRecipient(null)}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        className="input-field"
                                        value={recipientQuery}
                                        onChange={(event) => setRecipientQuery(event.target.value)}
                                        placeholder="Search by name or email"
                                    />
                                    {searching ? <p className="text-xs text-foreground-muted">Searching…</p> : null}
                                    {recipientResults.length > 0 ? (
                                        <ul className="rounded-xl border border-border divide-y divide-border">
                                            {recipientResults.map((user) => (
                                                <li key={user._id}>
                                                    <button
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left hover:bg-surface-muted"
                                                        onClick={() => {
                                                            setRecipient(user);
                                                            setRecipientResults([]);
                                                            setRecipientQuery('');
                                                        }}
                                                    >
                                                        <span className="block text-sm text-foreground">
                                                            {adminDisplayName(user) || user.email}
                                                        </span>
                                                        <span className="block text-xs text-foreground-muted">{user.email}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </>
                            )}
                        </div>
                    ) : null}
                    <p className="text-sm text-foreground-muted">
                        {status?.subscriberCount || 0} {status?.subscriberCount === 1 ? 'device' : 'devices'} in this group.
                        {status?.last?.sentAt
                            ? ` Last sent ${formatWhen(status.last.sentAt)} to ${status.last.sentCount}.`
                            : ''}
                        {weekBlocked ? ` You can send again ${formatWhen(status.nextAllowedAt)}.` : ''}
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Templates</p>
                        <div className="flex flex-wrap gap-2">
                            {PUSH_TEMPLATES.map((template) => {
                                const selected = title === template.title
                                    && body === template.body
                                    && url === template.url;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        className={`rounded-full border px-3 py-1.5 text-sm ${
                                            selected
                                                ? 'border-brand bg-brand/10 text-foreground'
                                                : 'border-border text-foreground-muted'
                                        }`}
                                        onClick={() => {
                                            setTitle(template.title);
                                            setBody(template.body);
                                            setUrl(template.url);
                                        }}
                                    >
                                        {template.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground">Title</span>
                        <input
                            className="input-field"
                            value={title}
                            maxLength={80}
                            required
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="New in Waraqah"
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground">Message</span>
                        <textarea
                            className="input-field resize-none min-h-[88px]"
                            value={body}
                            maxLength={140}
                            required
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="One sentence about the update or offer."
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-foreground">Link</span>
                        <input
                            className="input-field"
                            value={url}
                            maxLength={500}
                            required
                            onChange={(event) => setUrl(event.target.value)}
                            placeholder="/upgrade or https://..."
                        />
                    </label>
                    <button type="submit" className="btn-primary text-sm" disabled={!canSend || !title.trim() || !body.trim()}>
                        Send update
                    </button>
                </form>
            )}

            <ConfirmModal
                open={confirmOpen}
                title="Send this update?"
                description={`${title.trim()} — ${body.trim()} Recipients: ${
                    audience === 'individual'
                        ? (adminDisplayName(recipient) || recipient?.email || 'one person')
                        : (AUDIENCE_LABELS[audience] || 'Everyone')
                }.`}
                confirmLabel="Send"
                loading={sending}
                onCancel={() => {
                    if (!sending) setConfirmOpen(false);
                }}
                onConfirm={handleSend}
            />
        </div>
    );
}
