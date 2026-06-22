import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PenLine, Plus } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { getDraftLabel } from '../utils/invoiceHelpers';
import { formatCurrency } from '../utils/currency';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import Spinner from '../components/Spinner';

const Drafts = () => {
    const navigate = useNavigate();
    const { draftInvoices, clients, deleteInvoice, loading } = useInvoice();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const getClient = (clientId) => clients.find((c) => c.id === clientId);

    const sortedDrafts = useMemo(() => draftInvoices, [draftInvoices]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteInvoice(deleteTarget);
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
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

            <PageHeader
                title="Drafts"
                subtitle="Pick up where you left off or finish an invoice"
                action={
                    <button type="button" onClick={() => navigate('/invoices/create')} className="btn-primary">
                        <Plus size={18} aria-hidden />
                        New invoice
                    </button>
                }
            />

            {sortedDrafts.length === 0 ? (
                <div className="card text-center py-16 px-6">
                    <PenLine className="mx-auto h-12 w-12 text-slate-300 mb-4" aria-hidden />
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">No drafts yet</h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                        Start an invoice and save it as a draft when you want to finish later.
                    </p>
                    <button type="button" onClick={() => navigate('/invoices/create')} className="btn-primary">
                        Create invoice
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedDrafts.map((draft) => {
                        const client = getClient(draft.clientId);
                        const label = getDraftLabel(draft, client);
                        const updated = draft.updatedAt || draft.createdAt;
                        return (
                            <div key={draft.id} className="card flex flex-col gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900">{label}</p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {updated
                                            ? `Last edited ${formatDistanceToNow(new Date(updated), { addSuffix: true })}`
                                            : 'Draft'}
                                    </p>
                                    {draft.total > 0 ? (
                                        <p className="text-sm font-medium text-brand mt-2">
                                            {formatCurrency(draft.total)}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/invoices/edit/${draft.id}`)}
                                        className="btn-primary text-sm py-2"
                                    >
                                        Complete invoice
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(draft.id)}
                                        className="btn-secondary text-sm py-2 text-red-700 border-red-200 hover:bg-red-50"
                                    >
                                        Delete draft
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Drafts;
