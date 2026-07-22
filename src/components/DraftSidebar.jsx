import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';
import { getDraftLabel } from '../utils/invoiceHelpers';
import { formatCurrency } from '../utils/currency';

export default function DraftSidebar({
    drafts,
    clients,
    currentDraftId,
    onDelete,
    limit = 5,
    compact = false,
}) {
    const navigate = useNavigate();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const visibleDrafts = drafts.filter((d) => d.id !== currentDraftId).slice(0, limit);

    const getClient = (clientId) => clients.find((c) => c.id === clientId);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    if (drafts.length === 0 && !compact) {
        return (
            <div className="card">
                <h3 className="text-sm font-semibold text-zinc-900 mb-2">Your drafts</h3>
                <p className="text-sm text-zinc-500">
                    Save a draft anytime with the button below, or pick up an existing draft.
                </p>
            </div>
        );
    }

    return (
        <>
            <ConfirmModal
                open={Boolean(deleteTarget)}
                title="Delete draft?"
                description="This draft will be permanently removed."
                confirmLabel="Delete draft"
                cancelLabel="Keep draft"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            <div className="card space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900">Your drafts</h3>
                    {drafts.length > 0 ? (
                        <Link to="/invoices/drafts" className="text-xs font-medium text-brand hover:underline">
                            View all
                        </Link>
                    ) : null}
                </div>
                {visibleDrafts.length === 0 ? (
                    <p className="text-sm text-zinc-500">No other drafts saved yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {visibleDrafts.map((draft) => {
                            const client = getClient(draft.clientId);
                            const label = getDraftLabel(draft, client);
                            const updated = draft.updatedAt || draft.createdAt;
                            return (
                                <li
                                    key={draft.id}
                                    className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 space-y-2"
                                >
                                    <div>
                                        <p className="font-medium text-zinc-900 text-sm truncate">{label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {updated
                                                ? `Edited ${formatDistanceToNow(new Date(updated), { addSuffix: true })}`
                                                : 'Draft'}
                                            {draft.total > 0 ? ` · ${formatCurrency(draft.total, draft.currency)}` : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/invoices/edit/${draft.id}`)}
                                            className="btn-primary text-xs py-2 px-2"
                                        >
                                            Complete invoice
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(draft.id)}
                                            className="btn-secondary text-xs py-2 px-2 text-red-700 border-red-200 hover:bg-red-50"
                                        >
                                            Delete draft
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </>
    );
}
