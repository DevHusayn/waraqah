import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Download,
    Loader2,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
    User,
    FileText,
    StickyNote,
    Mail,
    Phone,
    Building2,
    Share2,
} from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import MarkAsPaidModal from '../components/MarkAsPaidModal';
import FormSection from '../components/FormSection';
import StatusBadge from '../components/StatusBadge';
import { generateInvoicePdfBlob } from '../utils/pdfGenerator';
import {
    shareInvoicePdf,
    downloadPdfBlob,
    getShareFallbackHint,
} from '../utils/shareInvoicePdf';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import {
    getDisplayNumber,
    getPaymentMethodLabel,
    getReceiptNumber,
    isReceipt,
} from '../utils/receiptHelpers';

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <dt className="text-slate-500 shrink-0">{label}</dt>
            <dd className="font-medium text-slate-900 text-right">{value}</dd>
        </div>
    );
}

function DocumentActions({
    documentMode,
    showDocumentToggle,
    onDocumentModeChange,
    pdfLoading,
    pdfReady,
    onShare,
    onDownload,
}) {
    const loadingShare = pdfLoading === `share-${documentMode}`;
    const loadingDownload = pdfLoading === `download-${documentMode}`;
    const busy = Boolean(pdfLoading);
    const docLabel = documentMode === 'receipt' ? 'receipt' : 'invoice';

    return (
        <div className="space-y-3">
            {showDocumentToggle && (
                <div
                    className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100"
                    role="tablist"
                    aria-label="Document type"
                >
                    {[
                        { value: 'receipt', label: 'Receipt' },
                        { value: 'invoice', label: 'Invoice' },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={documentMode === value}
                            onClick={() => onDocumentModeChange(value)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                documentMode === value
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {!pdfReady ? (
                <button
                    type="button"
                    onClick={() => onDownload(documentMode)}
                    className="btn-primary w-full"
                    disabled={busy}
                >
                    {loadingDownload ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden />
                    ) : (
                        <Download size={18} aria-hidden />
                    )}
                    Download {docLabel}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => onShare(documentMode)}
                    className="btn-primary w-full"
                    disabled={busy}
                >
                    {loadingShare ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden />
                    ) : (
                        <Share2 size={18} aria-hidden />
                    )}
                    Share PDF
                </button>
            )}
        </div>
    );
}

function InvoiceActionsPanel({
    invoice,
    paid,
    cancelled,
    canMarkPaid,
    canCancel,
    canEdit,
    saving,
    pdfLoading,
    onMarkPaid,
    onCancel,
    onDelete,
    onDownload,
    onShare,
    pdfCache,
    editId,
}) {
    const [documentMode, setDocumentMode] = useState(paid ? 'receipt' : 'invoice');

    useEffect(() => {
        setDocumentMode(paid ? 'receipt' : 'invoice');
    }, [paid]);

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-200">
                Actions
            </h3>

            <div className="space-y-3">
            {cancelled && (
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    Cancelled — kept for your records
                </p>
            )}

            {canMarkPaid && (
                <button type="button" onClick={onMarkPaid} className="btn-primary w-full" disabled={saving}>
                    <CheckCircle size={18} aria-hidden />
                    Mark as paid
                </button>
            )}

            {!cancelled && (
                <DocumentActions
                    documentMode={documentMode}
                    showDocumentToggle={paid}
                    onDocumentModeChange={setDocumentMode}
                    pdfLoading={pdfLoading}
                    pdfReady={Boolean(pdfCache[documentMode]?.blob)}
                    onShare={onShare}
                    onDownload={onDownload}
                />
            )}

            {canCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
                    disabled={saving}
                >
                    <XCircle size={18} aria-hidden />
                    Cancel invoice
                </button>
            )}

            {canEdit && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to={`/invoices/edit/${editId}`} className="btn-secondary w-full text-sm py-2">
                        <Pencil size={16} aria-hidden />
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={16} aria-hidden />
                        Delete
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}

const InvoiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { invoices, clients, updateInvoice, deleteInvoice, loading } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(null);
    const [pdfCache, setPdfCache] = useState({});
    const [alert, setAlert] = useState({ open: false, message: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const invoice = useMemo(() => invoices.find((inv) => inv.id === id), [invoices, id]);
    const client = useMemo(
        () => clients.find((c) => c.id === invoice?.clientId),
        [clients, invoice?.clientId]
    );

    const paid = invoice ? isReceipt(invoice) : false;
    const cancelled = invoice?.status === 'cancelled';
    const canMarkPaid = invoice && ['pending', 'overdue'].includes(invoice.status);
    const canCancel = invoice && ['pending', 'overdue'].includes(invoice.status);
    const canEdit = invoice && !paid && !cancelled;

    useEffect(() => {
        if (!loading && !invoice && id) {
            navigate('/invoices', { replace: true });
        }
    }, [loading, invoice, id, navigate]);

    useEffect(() => {
        setPdfCache({});
    }, [id]);

    const handleDownload = async (mode) => {
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this invoice.' });
            return;
        }
        setPdfLoading(`download-${mode}`);
        try {
            const cached = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
            downloadPdfBlob(cached.blob, cached.filename);
            setPdfCache((prev) => ({ ...prev, [mode]: cached }));
            showToast(mode === 'receipt' ? 'Receipt downloaded' : 'Invoice downloaded', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to generate PDF.' });
        } finally {
            setPdfLoading(null);
        }
    };

    const handleShare = async (mode) => {
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this invoice.' });
            return;
        }
        const cached = pdfCache[mode];
        if (!cached?.blob) {
            setAlert({ open: true, message: 'Download the PDF first.' });
            return;
        }
        setPdfLoading(`share-${mode}`);
        try {
            const result = await shareInvoicePdf(invoice, client, businessInfo, { mode, cached });
            if (result.method !== 'share') {
                const hint = getShareFallbackHint();
                if (hint) showToast(hint, 'info');
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
            setAlert({ open: true, message: err.message || 'Failed to share PDF.' });
        } finally {
            setPdfLoading(null);
        }
    };

    const handleMarkPaid = async ({ paymentMethod, datePaid }) => {
        setSaving(true);
        try {
            await updateInvoice(id, { ...invoice, status: 'paid', paymentMethod, datePaid });
            showToast('Invoice marked as paid', 'success');
            setMarkPaidOpen(false);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to update invoice.' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelInvoice = async () => {
        setSaving(true);
        try {
            await updateInvoice(id, { ...invoice, status: 'cancelled' });
            showToast('Invoice cancelled', 'success');
            setConfirmCancel(false);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to cancel invoice.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteInvoice(id);
            showToast('Invoice deleted', 'success');
            navigate('/invoices');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete invoice.' });
        }
        setConfirmDelete(false);
    };

    if (loading || !invoice) {
        return (
            <div className="py-24 flex justify-center">
                <Spinner />
            </div>
        );
    }

    const displayNumber = getDisplayNumber(invoice) || '—';
    const receiptNumber = getReceiptNumber(invoice);

    const actionPanelProps = {
        invoice,
        paid,
        cancelled,
        canMarkPaid,
        canCancel,
        canEdit,
        saving,
        pdfLoading,
        onMarkPaid: () => setMarkPaidOpen(true),
        onCancel: () => setConfirmCancel(true),
        onDelete: () => setConfirmDelete(true),
        onDownload: handleDownload,
        onShare: handleShare,
        pdfCache,
        editId: id,
    };

    return (
        <>
            <AlertModal open={alert.open} message={alert.message} onClose={() => setAlert({ open: false, message: '' })} />
            <ConfirmModal
                open={confirmDelete}
                title="Delete invoice?"
                description="This permanently removes the invoice from your records."
                confirmLabel="Delete invoice"
                cancelLabel="Keep invoice"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
            <ConfirmModal
                open={confirmCancel}
                title="Cancel invoice?"
                description="The invoice will stay on record but can no longer be edited or marked as paid."
                confirmLabel="Cancel invoice"
                cancelLabel="Go back"
                onConfirm={handleCancelInvoice}
                onCancel={() => setConfirmCancel(false)}
                loading={saving}
            />
            <MarkAsPaidModal
                open={markPaidOpen}
                onConfirm={handleMarkPaid}
                onCancel={() => setMarkPaidOpen(false)}
                saving={saving}
            />

            <div className="max-w-6xl mx-auto pb-8">
                <Link
                    to="/invoices"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand mb-6 transition-colors"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to invoices
                </Link>

                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="page-title">{displayNumber}</h1>
                            <StatusBadge status={invoice.status} />
                        </div>
                        <p className="page-subtitle mt-1">
                            {paid && receiptNumber
                                ? `Receipt ${receiptNumber}`
                                : 'Invoice details and documents'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6 order-2 xl:order-1">
                        <FormSection icon={User} title="Client" description="Bill-to contact">
                            {client ? (
                                <div className="space-y-2">
                                    <p className="font-semibold text-slate-900 text-lg">{client.name}</p>
                                    {getClientBusiness(client) && (
                                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                            <Building2 size={14} className="text-slate-400" aria-hidden />
                                            {getClientBusiness(client)}
                                        </p>
                                    )}
                                    {client.email && (
                                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                            <Mail size={14} className="text-slate-400" aria-hidden />
                                            {client.email}
                                        </p>
                                    )}
                                    {client.phone && (
                                        <p className="text-sm text-slate-600 flex items-center gap-1.5">
                                            <Phone size={14} className="text-slate-400" aria-hidden />
                                            {client.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">Client not found</p>
                            )}
                        </FormSection>

                        <div className="card !p-0 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brand-subtle">
                                    <FileText className="h-4 w-4 text-brand" aria-hidden />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                                    <p className="text-xs text-slate-500">
                                        {(invoice.items || []).length} line item
                                        {(invoice.items || []).length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>

                            <div className="md:hidden divide-y divide-slate-100">
                                {(invoice.items || []).map((item, index) => (
                                    <div key={index} className="px-4 py-4">
                                        <p className="font-medium text-slate-900">{item.description}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                            <span className="text-slate-500">
                                                Qty {item.quantity} · {formatCurrency(item.rate)}
                                            </span>
                                            <span className="font-semibold text-slate-900 shrink-0">
                                                {formatCurrency(Number(item.quantity) * Number(item.rate))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Description</th>
                                        <th className="text-center px-4 py-3 w-20 font-semibold">Qty</th>
                                        <th className="text-right px-4 py-3 font-semibold">Rate</th>
                                        <th className="text-right px-6 py-3 font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(invoice.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-slate-900">{item.description}</td>
                                            <td className="px-4 py-4 text-center text-slate-600">{item.quantity}</td>
                                            <td className="px-4 py-4 text-right text-slate-600 whitespace-nowrap">
                                                {formatCurrency(item.rate)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900 whitespace-nowrap">
                                                {formatCurrency(Number(item.quantity) * Number(item.rate))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoice.notes && (
                            <FormSection icon={StickyNote} title="Notes" description="Additional information">
                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">
                                    {invoice.notes}
                                </p>
                            </FormSection>
                        )}
                    </div>

                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="card xl:sticky xl:top-24">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Summary</h3>
                            <dl className="space-y-3">
                                <SummaryRow
                                    label="Issue date"
                                    value={
                                        invoice.date
                                            ? format(new Date(invoice.date), 'MMM dd, yyyy')
                                            : '—'
                                    }
                                />
                                {paid ? (
                                    <>
                                        <SummaryRow
                                            label="Payment date"
                                            value={
                                                invoice.datePaid
                                                    ? format(new Date(invoice.datePaid), 'MMM dd, yyyy')
                                                    : '—'
                                            }
                                        />
                                        <SummaryRow
                                            label="Payment method"
                                            value={getPaymentMethodLabel(invoice.paymentMethod)}
                                        />
                                    </>
                                ) : (
                                    <SummaryRow
                                        label="Due date"
                                        value={
                                            invoice.dueDate
                                                ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                                                : '—'
                                        }
                                    />
                                )}
                                <SummaryRow
                                    label="Subtotal"
                                    value={formatCurrency(invoice.subtotal)}
                                />
                                {Number(invoice.discount) > 0 && (
                                    <SummaryRow
                                        label={
                                            invoice.discountType === 'percent' && invoice.discountValue
                                                ? `Discount (${invoice.discountValue}%)`
                                                : 'Discount'
                                        }
                                        value={`−${formatCurrency(invoice.discount)}`}
                                    />
                                )}
                                <SummaryRow
                                    label={`Tax (${invoice.taxRate}%)`}
                                    value={formatCurrency(invoice.tax)}
                                />
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <dt className="text-base font-semibold text-slate-900">Total</dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(invoice.total)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="hidden xl:block">
                            <InvoiceActionsPanel {...actionPanelProps} />
                        </div>
                    </div>

                    <div className="order-3 xl:hidden">
                        <InvoiceActionsPanel {...actionPanelProps} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceDetails;
