import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PenLine, Plus, Trash2 } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useQuotation } from '../context/QuotationContext';
import { getDraftLabel } from '../utils/invoiceHelpers';
import { formatCurrency } from '../utils/currency';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import { PageSpinner } from '../components/Spinner';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

const COLUMNS = [
    { key: 'type', label: 'Type' },
    { key: 'label', label: 'Draft' },
    { key: 'updated', label: 'Last edited' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'actions', label: '', className: 'text-right w-32' },
];

const mapDraft = (d) => ({
    ...d,
    id: d._id || d.id,
    documentType: d.documentType || 'invoice',
});

function TypeBadge({ type }) {
    const isQuotation = type === 'quotation';
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${
                isQuotation
                    ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                    : 'bg-brand-subtle text-brand border-brand/20'
            }`}
        >
            {isQuotation ? 'QTN' : 'INV'}
        </span>
    );
}

const Drafts = () => {
    const navigate = useNavigate();
    const { deleteInvoice, refreshMeta } = useInvoice();
    const { deleteQuotation } = useQuotation();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/drafts?${buildListQuery({ page, limit, search })}`),
        []
    );

    const { page, setPage, data, pagination, loading, refresh } = usePagedList({ fetcher });

    const drafts = data.map(mapDraft);

    const editPath = (draft) =>
        draft.documentType === 'quotation'
            ? `/quotations/edit/${draft.id}`
            : `/invoices/edit/${draft.id}`;

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteTarget.documentType === 'quotation') {
                await deleteQuotation(deleteTarget.id);
            } else {
                await deleteInvoice(deleteTarget.id);
            }
            setDeleteTarget(null);
            await refresh();
            if (refreshMeta) await refreshMeta();
        } finally {
            setDeleting(false);
        }
    };

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
            <CreateDocumentModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                navigate={navigate}
            />

            <PageHeader title="Drafts" subtitle="Resume unfinished invoices and quotations">
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className={`btn-primary ${drafts.length === 0 ? 'hidden xl:inline-flex' : ''}`}
                >
                    <Plus size={16} aria-hidden />
                    Create
                </button>
            </PageHeader>

            {loading && drafts.length === 0 ? (
                <PageSpinner label="Loading drafts…" />
            ) : drafts.length === 0 ? (
                <div className="data-table-wrap">
                    <EmptyState
                        icon={PenLine}
                        title="No drafts yet"
                        description="Save an invoice or quotation as a draft when you want to finish later."
                        action={
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="btn-primary xl:hidden"
                            >
                                <Plus size={16} aria-hidden />
                                Create
                            </button>
                        }
                    />
                </div>
            ) : (
                <>
                    <DataTable columns={COLUMNS}>
                        {drafts.map((draft) => {
                            const client = draft.clientName
                                ? { name: draft.clientName, company: draft.clientCompany }
                                : null;
                            const label = getDraftLabel(draft, client);
                            const updated = draft.updatedAt || draft.createdAt;
                            return (
                                <DataTableRow key={`${draft.documentType}-${draft.id}`}>
                                    <DataTableCell>
                                        <TypeBadge type={draft.documentType} />
                                    </DataTableCell>
                                    <DataTableCell>
                                        <button
                                            type="button"
                                            onClick={() => navigate(editPath(draft))}
                                            className="font-medium text-zinc-950 hover:underline text-left"
                                        >
                                            {label}
                                        </button>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-zinc-500 text-xs">
                                            {updated
                                                ? formatDistanceToNow(new Date(updated), {
                                                      addSuffix: true,
                                                  })
                                                : 'Draft'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <span className="font-medium tabular-nums">
                                            {draft.total > 0
                                                ? formatCurrency(draft.total, draft.currency)
                                                : '—'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => navigate(editPath(draft))}
                                                className="btn-ghost text-xs py-1 px-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        id: draft.id,
                                                        documentType: draft.documentType,
                                                    })
                                                }
                                                className="btn-ghost text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                aria-label="Delete draft"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>
                    <PaginationBar
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={setPage}
                        disabled={loading}
                    />
                </>
            )}
        </div>
    );
};

export default Drafts;
