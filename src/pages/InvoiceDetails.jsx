import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    CheckCircle,
    XCircle,
    User,
    List,
    StickyNote,
    Mail,
    Phone,
    Building2,
    Share2,
    Send,
    Bell,
    Copy,
    Download,
    Printer,
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
import ActionMenu from '../components/ActionMenu';
import { generateInvoicePdfBlob } from '../utils/pdfGenerator';
import { shareInvoicePdf, getShareFallbackHint, downloadPdfBlob } from '../utils/shareInvoicePdf';
import { getCachedPdf, setCachedPdf, clearCachedPdf } from '../utils/pdfCache';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import {
    getDisplayNumber,
    getPaymentMethodLabel,
    getReceiptNumber,
    isReceipt,
} from '../utils/receiptHelpers';
import { getPublicInvoiceUrl } from '../utils/publicApi';
import { apiFetch } from '../utils/api';

function mapInvoiceRecord(invoice) {
    return { ...invoice, id: invoice._id || invoice.id };
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <dt className="text-zinc-500 shrink-0">{label}</dt>
            <dd className="font-medium text-zinc-900 text-right">{value}</dd>
        </div>
    );
}

function DocumentTypeToggle({ documentMode, onDocumentModeChange }) {
    return (
        <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100"
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
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                    {label}
                </button>
            ))}
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
    canEmailClient,
    canSendReminder,
    canResendReceipt,
    saving,
    emailing,
    onMarkPaid,
    onCancel,
    onDelete,
    onShare,
    onEmailClient,
    onSendReminder,
    onResendReceipt,
    onCopyPublicLink,
    onDownloadPdf,
    onPrintPdf,
    onEdit,
    initialView,
}) {
    const resolveDocumentMode = (paidState) => {
        if (!paidState) return 'invoice';
        if (initialView === 'invoice') return 'invoice';
        if (initialView === 'receipt') return 'receipt';
        return 'receipt';
    };

    const [documentMode, setDocumentMode] = useState(() => resolveDocumentMode(paid));
    const isReceiptView = documentMode === 'receipt';
    const actionsDisabled = saving || emailing;

    useEffect(() => {
        setDocumentMode(resolveDocumentMode(paid));
    }, [paid, initialView]);

    const menuItems = cancelled
        ? []
        : isReceiptView
          ? [
                {
                    id: 'email-receipt',
                    label: emailing ? 'Sending…' : 'Email Receipt',
                    icon: Send,
                    onClick: onResendReceipt,
                    hidden: !canResendReceipt,
                    disabled: actionsDisabled,
                },
                {
                    id: 'download-receipt',
                    label: 'Download PDF',
                    icon: Download,
                    onClick: () => onDownloadPdf('receipt'),
                    disabled: saving,
                },
                {
                    id: 'print-receipt',
                    label: 'Print Receipt',
                    icon: Printer,
                    onClick: () => onPrintPdf('receipt'),
                    disabled: saving,
                },
                {
                    id: 'copy-link',
                    label: 'Copy Link',
                    icon: Copy,
                    onClick: onCopyPublicLink,
                    hidden: !invoice?.publicToken,
                    disabled: saving,
                },
            ]
          : [
                {
                    id: 'share-invoice',
                    label: 'Share Invoice',
                    icon: Share2,
                    onClick: () => onShare('invoice'),
                    hidden: !canMarkPaid,
                    disabled: saving,
                },
                {
                    id: 'email-invoice',
                    label: emailing ? 'Sending…' : 'Email Invoice',
                    icon: Send,
                    onClick: onEmailClient,
                    hidden: !canEmailClient,
                    disabled: actionsDisabled,
                },
                {
                    id: 'payment-reminder',
                    label: 'Send Payment Reminder',
                    icon: Bell,
                    onClick: onSendReminder,
                    hidden: !canSendReminder,
                    disabled: actionsDisabled,
                },
                {
                    id: 'copy-public-link',
                    label: 'Copy Link',
                    icon: Copy,
                    onClick: onCopyPublicLink,
                    hidden: !invoice?.publicToken,
                    disabled: saving,
                },
                {
                    id: 'edit-invoice',
                    label: 'Edit Invoice',
                    icon: Pencil,
                    onClick: onEdit,
                    hidden: !canEdit,
                    disabled: saving,
                },
                {
                    id: 'cancel-invoice',
                    label: 'Cancel Invoice',
                    icon: XCircle,
                    onClick: onCancel,
                    hidden: !canCancel,
                    disabled: saving,
                },
                {
                    id: 'delete-invoice',
                    label: 'Delete Invoice',
                    icon: Trash2,
                    onClick: onDelete,
                    hidden: !canEdit,
                    destructive: true,
                    disabled: saving,
                },
            ];

    const primaryAction = cancelled
        ? null
        : isReceiptView
          ? {
                label: 'Share Receipt',
                icon: Share2,
                onClick: () => onShare('receipt'),
            }
          : canMarkPaid
            ? {
                  label: 'Mark as Paid',
                  icon: CheckCircle,
                  onClick: onMarkPaid,
              }
            : {
                  label: 'Share Invoice',
                  icon: Share2,
                  onClick: () => onShare('invoice'),
              };

    const PrimaryIcon = primaryAction?.icon;

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-zinc-900 pb-3 mb-4 border-b border-zinc-200">
                Actions
            </h3>

            <div className="space-y-3">
                {cancelled && (
                    <p className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5">
                        Cancelled — kept for your records
                    </p>
                )}

                {!cancelled && paid ? (
                    <DocumentTypeToggle
                        documentMode={documentMode}
                        onDocumentModeChange={setDocumentMode}
                    />
                ) : null}

                {primaryAction ? (
                    <div className="flex items-stretch gap-2">
                        <button
                            type="button"
                            onClick={primaryAction.onClick}
                            className="btn-primary flex-1 min-w-0 min-h-[40px]"
                            disabled={saving}
                        >
                            {PrimaryIcon ? <PrimaryIcon size={18} aria-hidden /> : null}
                            {primaryAction.label}
                        </button>
                        <ActionMenu
                            items={menuItems}
                            disabled={saving}
                            ariaLabel={isReceiptView ? 'Receipt actions' : 'Invoice actions'}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

const InvoiceDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view');
    const navigate = useNavigate();
    const { invoices, clients, updateInvoice, deleteInvoice, loading, sendInvoiceEmailToClient, sendPaymentReminderToClient, sendReceiptEmailToClient } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [fetchedInvoice, setFetchedInvoice] = useState(null);
    const [resolving, setResolving] = useState(false);

    const invoiceFromList = useMemo(
        () => invoices.find((inv) => String(inv.id) === String(id) || String(inv._id) === String(id)),
        [invoices, id]
    );
    const invoice = invoiceFromList || fetchedInvoice;
    const client = useMemo(
        () => clients.find((c) => c.id === invoice?.clientId || c._id === invoice?.clientId),
        [clients, invoice?.clientId]
    );

    const paid = invoice ? isReceipt(invoice) : false;
    const cancelled = invoice?.status === 'cancelled';
    const canMarkPaid = invoice && ['pending', 'overdue'].includes(invoice.status);
    const canCancel = invoice && ['pending', 'overdue'].includes(invoice.status);
    const canEdit = invoice && !paid && !cancelled;
    const clientHasEmail = Boolean(client?.email?.trim());
    const canEmailClient = invoice && !cancelled && invoice.status !== 'draft' && clientHasEmail;
    const canSendReminder = invoice && ['pending', 'overdue'].includes(invoice.status) && clientHasEmail;
    const canResendReceipt = paid && clientHasEmail;

    useEffect(() => {
        if (!id) {
            return undefined;
        }

        if (invoiceFromList) {
            setFetchedInvoice(null);
            setResolving(false);
            return undefined;
        }

        if (loading) {
            return undefined;
        }

        let cancelled = false;
        setResolving(true);

        apiFetch(`/invoices/${id}`)
            .then((data) => {
                if (!cancelled) {
                    setFetchedInvoice(mapInvoiceRecord(data));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    navigate('/invoices', { replace: true });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setResolving(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [loading, id, invoiceFromList, navigate]);

    useEffect(() => {
        if (!invoice || !client || cancelled) return undefined;

        clearCachedPdf(id);

        const modes = paid ? ['receipt', 'invoice'] : ['invoice'];
        let cancelledEffect = false;

        (async () => {
            for (const mode of modes) {
                if (cancelledEffect) return;

                const existing = getCachedPdf(id, mode);
                if (existing) continue;

                try {
                    const generated = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
                    if (cancelledEffect) return;
                    setCachedPdf(id, mode, generated);
                } catch (err) {
                    if (!cancelledEffect) {
                        setAlert({
                            open: true,
                            message: err.message || `Failed to prepare ${mode} PDF.`,
                        });
                    }
                }
            }
        })();

        return () => {
            cancelledEffect = true;
        };
    }, [id, invoice, client, businessInfo, paid, cancelled]);

    const handleShare = async (mode) => {
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this invoice.' });
            return;
        }

        try {
            let cached = getCachedPdf(id, mode);
            if (!cached) {
                cached = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
                setCachedPdf(id, mode, cached);
            }

            const result = await shareInvoicePdf(invoice, client, businessInfo, { mode, cached });
            if (result.method !== 'share') {
                const hint = getShareFallbackHint();
                if (hint) showToast(hint, 'info');
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
            setAlert({ open: true, message: err.message || 'Failed to share PDF.' });
        }
    };

    const getPdfForMode = async (mode) => {
        if (!client) {
            throw new Error('Client data not found for this invoice.');
        }

        let cached = getCachedPdf(id, mode);
        if (!cached) {
            cached = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
            setCachedPdf(id, mode, cached);
        }

        return cached;
    };

    const handleDownloadPdf = async (mode) => {
        try {
            const cached = await getPdfForMode(mode);
            downloadPdfBlob(cached.blob, cached.filename);
            showToast('PDF downloaded', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to download PDF.' });
        }
    };

    const handlePrintPdf = async (mode) => {
        try {
            const cached = await getPdfForMode(mode);
            const url = URL.createObjectURL(cached.blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                window.setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 1000);
            };
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to print PDF.' });
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
            clearCachedPdf(id);
            showToast('Invoice deleted', 'success');
            navigate('/invoices');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete invoice.' });
        }
        setConfirmDelete(false);
    };

    const handleCopyPublicLink = async () => {
        const url = getPublicInvoiceUrl(invoice?.publicToken);
        if (!url) {
            setAlert({ open: true, message: 'Public link is not available for this invoice yet.' });
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            showToast('Public invoice link copied', 'success');
        } catch {
            setAlert({ open: true, message: url });
        }
    };

    const handleEmailClient = async () => {
        setEmailing(true);
        try {
            const result = await sendInvoiceEmailToClient(id);
            showToast(`Invoice emailed to ${result.sentTo}`, 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to send invoice email.' });
        } finally {
            setEmailing(false);
        }
    };

    const handleSendReminder = async () => {
        setEmailing(true);
        try {
            const result = await sendPaymentReminderToClient(id);
            showToast(`Payment reminder sent to ${result.sentTo}`, 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to send payment reminder.' });
        } finally {
            setEmailing(false);
        }
    };

    const handleResendReceipt = async () => {
        setEmailing(true);
        try {
            const result = await sendReceiptEmailToClient(id);
            showToast(`Receipt emailed to ${result.sentTo}`, 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to send receipt email.' });
        } finally {
            setEmailing(false);
        }
    };

    if (loading || resolving || !invoice) {
        return (
            <div className="max-w-6xl mx-auto py-20 text-center text-sm text-zinc-500">
                Loading invoice…
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
        canEmailClient,
        canSendReminder,
        canResendReceipt,
        saving,
        emailing,
        onMarkPaid: () => setMarkPaidOpen(true),
        onCancel: () => setConfirmCancel(true),
        onDelete: () => setConfirmDelete(true),
        onShare: handleShare,
        onEmailClient: handleEmailClient,
        onSendReminder: handleSendReminder,
        onResendReceipt: handleResendReceipt,
        onCopyPublicLink: handleCopyPublicLink,
        onDownloadPdf: handleDownloadPdf,
        onPrintPdf: handlePrintPdf,
        onEdit: () => navigate(`/invoices/edit/${id}`),
        initialView,
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
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
                                    <p className="font-semibold text-zinc-900 text-lg">{client.name}</p>
                                    {getClientBusiness(client) && (
                                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                                            <Building2 size={14} className="text-zinc-400" aria-hidden />
                                            {getClientBusiness(client)}
                                        </p>
                                    )}
                                    {client.email && (
                                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                                            <Mail size={14} className="text-zinc-400" aria-hidden />
                                            {client.email}
                                        </p>
                                    )}
                                    {client.phone && (
                                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                                            <Phone size={14} className="text-zinc-400" aria-hidden />
                                            {client.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">Client not found</p>
                            )}
                        </FormSection>

                        <div className="card !p-0 overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
                                <div className="p-2 rounded-md bg-zinc-50 border border-zinc-200/50 shrink-0">
                                    <List className="h-4 w-4 text-zinc-500" strokeWidth={1.75} aria-hidden />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-zinc-900">Items</h2>
                                    <p className="text-xs text-zinc-500">
                                        {(invoice.items || []).length} line item
                                        {(invoice.items || []).length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>

                            <div className="md:hidden divide-y divide-zinc-100">
                                {(invoice.items || []).map((item, index) => (
                                    <div key={index} className="px-4 py-4">
                                        <p className="font-medium text-zinc-900">{item.description}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                            <span className="text-zinc-500">
                                                Qty {item.quantity} · {formatCurrency(item.rate)}
                                            </span>
                                            <span className="font-semibold text-zinc-900 shrink-0">
                                                {formatCurrency(Number(item.quantity) * Number(item.rate))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Description</th>
                                        <th className="text-center px-4 py-3 w-20 font-semibold">Qty</th>
                                        <th className="text-right px-4 py-3 font-semibold">Rate</th>
                                        <th className="text-right px-6 py-3 font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {(invoice.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-zinc-900">{item.description}</td>
                                            <td className="px-4 py-4 text-center text-zinc-600">{item.quantity}</td>
                                            <td className="px-4 py-4 text-right text-zinc-600 whitespace-nowrap">
                                                {formatCurrency(item.rate)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-zinc-900 whitespace-nowrap">
                                                {formatCurrency(Number(item.quantity) * Number(item.rate))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoice.notes && (
                            <FormSection icon={StickyNote} title="Notes" description="Additional information">
                                <p className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">
                                    {invoice.notes}
                                </p>
                            </FormSection>
                        )}
                    </div>

                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="card xl:sticky xl:top-24">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Summary</h3>
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
                                ) : invoice.dueDate ? (
                                    <SummaryRow
                                        label="Due date"
                                        value={format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                    />
                                ) : null}
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
                                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                                    <dt className="text-base font-semibold text-zinc-900">Total</dt>
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
