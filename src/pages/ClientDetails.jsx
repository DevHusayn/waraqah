import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Users,
    FileText,
    Wallet,
    Clock,
    Package,
    Plus,
} from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import StatusBadge from '../components/StatusBadge';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { REPLAY_MASK } from '@waraqah/shared';

const DOCUMENT_COLUMNS = [
    { key: 'type', label: 'Type' },
    { key: 'number', label: 'Number' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total', className: 'text-right' },
    { key: 'balance', label: 'Balance', className: 'text-right' },
];

const PRODUCT_COLUMNS = [
    { key: 'product', label: 'Product' },
    { key: 'qty', label: 'Qty sold', className: 'text-right' },
    { key: 'value', label: 'Revenue', className: 'text-right' },
    { key: 'last', label: 'Last purchase' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

function documentTypeLabel(type) {
    if (type === 'receipt') return 'Receipt';
    if (type === 'quotation') return 'Quotation';
    return 'Invoice';
}

function documentHref(type, id) {
    if (type === 'receipt') return `/receipts/${id}`;
    if (type === 'quotation') return `/quotations/${id}`;
    return `/invoices/${id}`;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, detail, className = '' }) {
    return (
        <div className={`stat-card stat-card-compact ${className}`.trim()}>
            <div className="flex items-center gap-2">
                <div className={`stat-card-icon shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden />
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-snug">{title}</p>
            </div>
            <p className="stat-card-value">{value}</p>
            {detail ? <p className="text-[11px] text-zinc-500 leading-snug">{detail}</p> : null}
        </div>
    );
}

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadActivity = useCallback(async () => {
        setLoading(true);
        try {
            const payload = await apiFetch(`/clients/${id}/activity`);
            setActivity(payload);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to load client details.',
                type: 'error',
            });
            setActivity(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadActivity();
    }, [loadActivity]);

    const client = activity?.client;
    const summary = activity?.summary;

    const modalInitialData = useMemo(() => {
        if (!client) return EMPTY_CLIENT;
        return {
            name: client.name || '',
            business: client.company || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
        };
    }, [client]);

    const handleSubmit = async (formData) => {
        const payload = {
            name: formData.name,
            company: formData.business,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
        };
        try {
            await apiFetch(`/clients/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            showToast('Client updated successfully', 'success');
            setIsModalOpen(false);
            await loadActivity();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to update client.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/clients/${id}`, { method: 'DELETE' });
            showToast('Client deleted successfully', 'success');
            navigate('/clients', { replace: true });
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete client.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
            setConfirm(false);
        }
    };

    if (loading) {
        return <PageSpinner label="Loading client…" />;
    }

    if (!client) {
        return (
            <EmptyState
                icon={Users}
                title="Client not found"
                description="This client may have been deleted."
                action={
                    <Link to="/clients" className="btn-primary">
                        Back to clients
                    </Link>
                }
            />
        );
    }

    const currency =
        activity?.documents?.find((doc) => doc.currency)?.currency || 'NGN';
    const businessName = getClientBusiness(client);

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
                title="Delete client?"
                description="This client will be removed. Existing invoices linked to them will not be deleted."
                confirmLabel="Delete client"
                cancelLabel="Keep client"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => !deleting && setConfirm(false)}
            />
            <ClientFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                editingClient={client}
                initialData={modalInitialData}
            />

            <div className="mb-4">
                <Link
                    to="/clients"
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to clients
                </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <Users className="h-6 w-6 text-brand" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className={`text-2xl font-bold text-zinc-950 truncate ${REPLAY_MASK.SENSITIVE}`}>
                            {client.name}
                        </h1>
                        {businessName ? (
                            <p className={`text-sm text-zinc-600 mt-0.5 ${REPLAY_MASK.SENSITIVE}`}>
                                {businessName}
                            </p>
                        ) : null}
                        <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 ${REPLAY_MASK.SENSITIVE}`}>
                            {client.email ? <span>{client.email}</span> : null}
                            {client.phone ? <span>{client.phone}</span> : null}
                        </div>
                        {client.address ? (
                            <p className={`mt-1 text-sm text-zinc-500 whitespace-pre-wrap ${REPLAY_MASK.SENSITIVE}`}>
                                {client.address}
                            </p>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                            navigate(`/invoices/create?clientId=${encodeURIComponent(id)}`)
                        }
                    >
                        <Plus size={16} aria-hidden />
                        New invoice
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(true)}>
                        <Edit size={16} aria-hidden />
                        Edit
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setConfirm(true)}>
                        <Trash2 size={16} aria-hidden />
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    title="Outstanding"
                    value={formatCurrency(summary?.outstanding ?? 0, currency)}
                    icon={Clock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    detail="Unpaid invoice and receipt balances"
                />
                <StatCard
                    title="Paid"
                    value={formatCurrency(summary?.totalPaid ?? 0, currency)}
                    icon={Wallet}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    detail="Payments received"
                />
                <StatCard
                    title="Total invoiced"
                    value={formatCurrency(summary?.totalInvoiced ?? 0, currency)}
                    icon={FileText}
                    iconBg="bg-sky-50"
                    iconColor="text-sky-600"
                    detail={`${summary?.totalDocuments ?? 0} documents`}
                />
                <StatCard
                    title="Products sold"
                    value={String(summary?.uniqueProducts ?? 0)}
                    icon={Package}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                    detail="Across invoices and receipts"
                />
            </div>

            <section className="card mb-6">
                <h2 className="text-sm font-semibold text-zinc-950 mb-4">Documents</h2>
                {activity.documents?.length ? (
                    <DataTable columns={DOCUMENT_COLUMNS}>
                        {activity.documents.map((doc) => (
                            <DataTableRow
                                key={`${doc.documentType}-${doc.id}`}
                                onClick={() => navigate(documentHref(doc.documentType, doc.id))}
                                className="cursor-pointer"
                            >
                                <DataTableCell className="text-zinc-600">
                                    {documentTypeLabel(doc.documentType)}
                                </DataTableCell>
                                <DataTableCell className="font-medium text-zinc-950">
                                    {doc.documentNumber}
                                </DataTableCell>
                                <DataTableCell>{formatDisplayDate(doc.date)}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={doc.status} />
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {formatCurrency(doc.total || 0, doc.currency || currency)}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {doc.documentType === 'quotation'
                                        ? '—'
                                        : formatCurrency(doc.balanceDue || 0, doc.currency || currency)}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                ) : (
                    <EmptyState
                        icon={FileText}
                        title="No documents yet"
                        description="Create an invoice, receipt, or quotation for this client to see activity here."
                        action={
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() =>
                                    navigate(`/invoices/create?clientId=${encodeURIComponent(id)}`)
                                }
                            >
                                <Plus size={16} aria-hidden />
                                New invoice
                            </button>
                        }
                    />
                )}
            </section>

            <section className="card">
                <h2 className="text-sm font-semibold text-zinc-950 mb-4">Products sold</h2>
                {activity.byProduct?.length ? (
                    <DataTable columns={PRODUCT_COLUMNS}>
                        {activity.byProduct.map((row) => (
                            <DataTableRow key={row.key}>
                                <DataTableCell>
                                    {row.productId ? (
                                        <Link
                                            to={`/products/${row.productId}`}
                                            className="font-medium text-brand hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {row.displayName}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-zinc-950">{row.displayName}</span>
                                    )}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {row.quantitySold}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {formatCurrency(row.lineTotal || 0, currency)}
                                </DataTableCell>
                                <DataTableCell>{formatDisplayDate(row.lastPurchaseDate)}</DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                ) : (
                    <p className="text-sm text-zinc-500 py-4 text-center">
                        Products will appear here once you invoice or receipt this client with line items.
                    </p>
                )}
            </section>
        </>
    );
}
