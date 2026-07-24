import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    User,
    List,
    StickyNote,
    Mail,
    Phone,
    Building2,
    Share2,
    Send,
    Copy,
    Download,
    Printer,
    FileInput,
    ScrollText,
    CheckCircle2,
    XCircle,
    Undo2,
} from 'lucide-react';
import { useQuotation } from '../context/QuotationContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import FormSection from '../components/FormSection';
import StatusBadge from '../components/StatusBadge';
import ActionMenu from '../components/ActionMenu';
import {
    shareInvoicePdf,
    getShareFallbackHint,
    downloadPdfBlob,
    printPdfBlob,
} from '../utils/shareInvoicePdf';
import { getCachedPdf, setCachedPdf, clearCachedPdf } from '../utils/pdfCache';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { getDisplayNumber } from '../utils/receiptHelpers';
import { getPublicQuotationUrl } from '../utils/publicApi';
import { apiFetch } from '../utils/api';
import { normalizeInvoiceUnit, resolveQuantityColumnLabel } from '@waraqah/shared';

function mapQuotationRecord(quotation) {
    return { ...quotation, id: quotation._id || quotation.id };
}

function quotationHasLineItems(quotation) {
    return Boolean(quotation && Array.isArray(quotation.items) && quotation.items.length > 0);
}

async function generateQuotationPdf(quotation, client, businessInfo) {
    const { generateInvoicePdfBlob } = await import('../utils/pdfGenerator');
    return generateInvoicePdfBlob(quotation, client, businessInfo, { mode: 'quotation' });
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4 text-sm">
            <dt className="text-zinc-500 shrink-0">{label}</dt>
            <dd className="font-medium text-zinc-900 text-right">{value}</dd>
        </div>
    );
}

function QuotationActionsPanel({
    quotation,
    canEdit,
    canDelete,
    canEmailClient,
    canConvert,
    canAccept,
    canReject,
    canUndo,
    saving,
    emailing,
    converting,
    statusUpdating,
    onDelete,
    onShare,
    onEmailClient,
    onCopyPublicLink,
    onDownloadPdf,
    onPrintPdf,
    onEdit,
    onConvert,
    onAccept,
    onReject,
    onUndo,
}) {
    const actionsDisabled = saving || emailing || converting || statusUpdating;

    const menuItems = [
        {
            id: 'share-quotation',
            label: 'Share Quotation',
            icon: Share2,
            onClick: onShare,
            disabled: saving,
        },
        {
            id: 'email-quotation',
            label: emailing ? 'Sending…' : 'Email Quotation',
            icon: Send,
            onClick: onEmailClient,
            hidden: !canEmailClient,
            disabled: actionsDisabled,
        },
        {
            id: 'accept-quotation',
            label: statusUpdating ? 'Updating…' : 'Mark as Accepted',
            icon: CheckCircle2,
            onClick: onAccept,
            hidden: !canAccept,
            disabled: actionsDisabled,
        },
        {
            id: 'reject-quotation',
            label: statusUpdating ? 'Updating…' : 'Mark as Rejected',
            icon: XCircle,
            onClick: onReject,
            hidden: !canReject,
            disabled: actionsDisabled,
        },
        {
            id: 'undo-status',
            label: statusUpdating ? 'Updating…' : 'Undo status',
            icon: Undo2,
            onClick: onUndo,
            hidden: !canUndo,
            disabled: actionsDisabled,
        },
        {
            id: 'download-pdf',
            label: 'Download PDF',
            icon: Download,
            onClick: onDownloadPdf,
            disabled: saving,
        },
        {
            id: 'print-pdf',
            label: 'Print',
            icon: Printer,
            onClick: onPrintPdf,
            disabled: saving,
        },
        {
            id: 'copy-public-link',
            label: 'Copy Link',
            icon: Copy,
            onClick: onCopyPublicLink,
            hidden: !quotation?.publicToken,
            disabled: saving,
        },
        {
            id: 'edit-quotation',
            label: 'Edit Quotation',
            icon: Pencil,
            onClick: onEdit,
            hidden: !canEdit,
            disabled: saving,
        },
        {
            id: 'delete-quotation',
            label: 'Delete Quotation',
            icon: Trash2,
            onClick: onDelete,
            hidden: !canDelete,
            destructive: true,
            disabled: saving,
        },
    ];

    const primaryAction = canConvert
        ? {
              label: converting ? 'Converting…' : 'Convert to Invoice',
              icon: FileInput,
              onClick: onConvert,
          }
        : {
              label: 'Share Quotation',
              icon: Share2,
              onClick: onShare,
          };

    const PrimaryIcon = primaryAction.icon;

    return (
        <div className="card overflow-visible">
            <h3 className="text-sm font-semibold text-zinc-900 pb-3 mb-4 border-b border-zinc-200">
                Actions
            </h3>
            <div className="space-y-3">
                <div className="flex items-stretch gap-2">
                    <button
                        type="button"
                        onClick={primaryAction.onClick}
                        className="btn-primary flex-1 min-w-0 min-h-[40px]"
                        disabled={saving || converting}
                    >
                        {PrimaryIcon ? <PrimaryIcon size={18} aria-hidden /> : null}
                        {primaryAction.label}
                    </button>
                    <ActionMenu items={menuItems} disabled={saving} ariaLabel="Quotation actions" />
                </div>
            </div>
        </div>
    );
}

const QuotationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        quotations,
        deleteQuotation,
        updateQuotation,
        loading,
        upsertQuotation,
        sendQuotationEmailToClient,
        convertQuotation,
    } = useQuotation();
    const { clients, upsertInvoice } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [alert, setAlert] = useState({ open: false, message: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmConvert, setConfirmConvert] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [converting, setConverting] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [fetchedQuotation, setFetchedQuotation] = useState(null);
    const [resolving, setResolving] = useState(false);

    const quotationFromList = useMemo(
        () =>
            quotations.find(
                (q) => String(q.id) === String(id) || String(q._id) === String(id)
            ),
        [quotations, id]
    );
    const quotation = useMemo(() => {
        if (quotationHasLineItems(quotationFromList)) return quotationFromList;
        if (quotationHasLineItems(fetchedQuotation)) return fetchedQuotation;
        return fetchedQuotation || quotationFromList || null;
    }, [quotationFromList, fetchedQuotation]);
    const client = useMemo(
        () => clients.find((c) => c.id === quotation?.clientId || c._id === quotation?.clientId),
        [clients, quotation?.clientId]
    );

    const status = quotation?.status || 'draft';
    const canEdit = quotation && !['converted', 'expired'].includes(status);
    const canDelete = quotation && status !== 'converted';
    const canConvert = quotation && ['sent', 'accepted'].includes(status);
    const canAccept = quotation && status === 'sent';
    const canReject = quotation && status === 'sent';
    const canUndo = quotation && ['accepted', 'rejected'].includes(status);
    const clientHasEmail = Boolean(client?.email?.trim());
    const canEmailClient = quotation && status !== 'draft' && clientHasEmail;
    const convertedInvoiceId = quotation?.convertedInvoiceId
        ? String(quotation.convertedInvoiceId)
        : null;

    useEffect(() => {
        if (!id) return undefined;

        if (quotationHasLineItems(quotationFromList)) {
            setFetchedQuotation(null);
            setResolving(false);
            return undefined;
        }

        if (loading) return undefined;

        let cancelled = false;
        setResolving(true);

        apiFetch(`/quotations/${id}`)
            .then((data) => {
                if (!cancelled) {
                    const mapped = mapQuotationRecord(data);
                    setFetchedQuotation(mapped);
                    upsertQuotation(mapped);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    navigate('/quotations', { replace: true });
                }
            })
            .finally(() => {
                if (!cancelled) setResolving(false);
            });

        return () => {
            cancelled = true;
        };
    }, [loading, id, quotationFromList, navigate, upsertQuotation]);

    useEffect(() => {
        if (!quotation || !client || !quotationHasLineItems(quotation)) return undefined;

        clearCachedPdf(id);
        let cancelledEffect = false;

        (async () => {
            const existing = getCachedPdf(id, 'quotation');
            if (existing) return;
            try {
                const generated = await generateQuotationPdf(quotation, client, businessInfo);
                if (!cancelledEffect) setCachedPdf(id, 'quotation', generated);
            } catch (err) {
                if (!cancelledEffect) {
                    setAlert({
                        open: true,
                        message: err.message || 'Failed to prepare quotation PDF.',
                    });
                }
            }
        })();

        return () => {
            cancelledEffect = true;
        };
    }, [id, quotation, client, businessInfo]);

    const getPdf = async () => {
        if (!client) throw new Error('Client data not found for this quotation.');
        let cached = getCachedPdf(id, 'quotation');
        if (!cached) {
            cached = await generateQuotationPdf(quotation, client, businessInfo);
            setCachedPdf(id, 'quotation', cached);
        }
        return cached;
    };

    const handleShare = async () => {
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this quotation.' });
            return;
        }
        try {
            const cached = await getPdf();
            const result = await shareInvoicePdf(quotation, client, businessInfo, {
                mode: 'quotation',
                cached,
            });
            if (result.method !== 'share') {
                const hint = getShareFallbackHint();
                if (hint) showToast(hint, 'info');
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
            setAlert({ open: true, message: err.message || 'Failed to share PDF.' });
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const cached = await getPdf();
            downloadPdfBlob(cached.blob, cached.filename);
            showToast('PDF downloaded', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to download PDF.' });
        }
    };

    const handlePrintPdf = async () => {
        try {
            const cached = await getPdf();
            await printPdfBlob(cached.blob);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to print PDF.' });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteQuotation(id);
            clearCachedPdf(id);
            showToast('Quotation deleted', 'success');
            navigate('/quotations');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete quotation.' });
        }
        setConfirmDelete(false);
    };

    const handleCopyPublicLink = async () => {
        const url = getPublicQuotationUrl(quotation?.publicToken);
        if (!url) {
            setAlert({ open: true, message: 'Public link is not available for this quotation yet.' });
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            showToast('Public quotation link copied', 'success');
        } catch {
            setAlert({ open: true, message: url });
        }
    };

    const handleEmailClient = async () => {
        setEmailing(true);
        try {
            const result = await sendQuotationEmailToClient(id);
            showToast(`Quotation emailed to ${result.sentTo}`, 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to send quotation email.' });
        } finally {
            setEmailing(false);
        }
    };

    const handleConvert = async () => {
        setConverting(true);
        try {
            const { invoice } = await convertQuotation(id);
            if (upsertInvoice) upsertInvoice(invoice);
            showToast('Quotation converted to invoice', 'success');
            setConfirmConvert(false);
            navigate(`/invoices/${invoice.id}`);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to convert quotation.' });
        } finally {
            setConverting(false);
        }
    };

    const handleStatusChange = async (nextStatus) => {
        setStatusUpdating(true);
        try {
            const updated = await updateQuotation(id, { status: nextStatus });
            setFetchedQuotation(updated);
            const messages = {
                accepted: 'Quotation marked as accepted',
                rejected: 'Quotation marked as rejected',
                sent: 'Quotation status restored to sent',
            };
            showToast(messages[nextStatus] || 'Quotation status updated', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to update quotation status.' });
        } finally {
            setStatusUpdating(false);
        }
    };

    const waitingForFull =
        Boolean(quotationFromList) &&
        !quotationHasLineItems(quotationFromList) &&
        !quotationHasLineItems(fetchedQuotation);

    if (loading || resolving || waitingForFull || !quotation || !quotationHasLineItems(quotation)) {
        return <PageSpinner label="Loading quotation…" className="max-w-6xl mx-auto" />;
    }

    const displayNumber = getDisplayNumber(quotation) || '—';

    const actionPanelProps = {
        quotation,
        canEdit,
        canDelete,
        canEmailClient,
        canConvert,
        canAccept,
        canReject,
        canUndo,
        saving: false,
        emailing,
        converting,
        statusUpdating,
        onDelete: () => setConfirmDelete(true),
        onShare: handleShare,
        onAccept: () => handleStatusChange('accepted'),
        onReject: () => handleStatusChange('rejected'),
        onUndo: () => handleStatusChange('sent'),
        onEmailClient: handleEmailClient,
        onCopyPublicLink: handleCopyPublicLink,
        onDownloadPdf: handleDownloadPdf,
        onPrintPdf: handlePrintPdf,
        onEdit: () => navigate(`/quotations/edit/${id}`),
        onConvert: () => setConfirmConvert(true),
    };

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                onClose={() => setAlert({ open: false, message: '' })}
            />
            <ConfirmModal
                open={confirmDelete}
                title="Delete quotation?"
                description="This permanently removes the quotation from your records."
                confirmLabel="Delete quotation"
                cancelLabel="Keep quotation"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
            <ConfirmModal
                open={confirmConvert}
                title="Convert to invoice?"
                description="This creates a new invoice from this quotation. The quotation will be marked as converted."
                confirmLabel={converting ? 'Converting…' : 'Convert to invoice'}
                cancelLabel="Not now"
                onConfirm={handleConvert}
                onCancel={() => setConfirmConvert(false)}
                loading={converting}
            />

            <div className="max-w-6xl mx-auto pb-8">
                <Link
                    to="/quotations"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to quotations
                </Link>

                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="page-title">{displayNumber}</h1>
                            <StatusBadge status={quotation.status} />
                        </div>
                        <p className="page-subtitle mt-1">Quotation details and documents</p>
                        {convertedInvoiceId ? (
                            <p className="mt-2 text-sm text-zinc-600">
                                Converted to{' '}
                                <Link
                                    to={`/invoices/${convertedInvoiceId}`}
                                    className="font-medium text-brand hover:underline"
                                >
                                    invoice
                                </Link>
                            </p>
                        ) : null}
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
                                        {(quotation.items || []).length} line item
                                        {(quotation.items || []).length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>

                            <div className="md:hidden divide-y divide-zinc-100">
                                {(quotation.items || []).map((item, index) => (
                                    <div key={index} className="px-4 py-4">
                                        <p className="font-medium text-zinc-900">{item.description}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                                            <span className="text-zinc-500">
                                                {normalizeInvoiceUnit(item.unit)} {item.quantity} ·{' '}
                                                {formatCurrency(item.rate, quotation.currency)}
                                            </span>
                                            <span className="font-semibold text-zinc-900 shrink-0">
                                                {formatCurrency(
                                                    Number(item.quantity) * Number(item.rate),
                                                    quotation.currency
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <table className="hidden md:table w-full text-sm">
                                <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold">Description</th>
                                        <th className="text-center px-4 py-3 w-24 font-semibold">
                                            {resolveQuantityColumnLabel(quotation.items)}
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold">Rate</th>
                                        <th className="text-right px-6 py-3 font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {(quotation.items || []).map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 text-zinc-900">{item.description}</td>
                                            <td className="px-4 py-4 text-center text-zinc-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-right text-zinc-600 whitespace-nowrap">
                                                {formatCurrency(item.rate, quotation.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-zinc-900 whitespace-nowrap">
                                                {formatCurrency(
                                                    Number(item.quantity) * Number(item.rate),
                                                    quotation.currency
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {quotation.notes ? (
                            <FormSection icon={StickyNote} title="Notes" description="Additional information">
                                <p className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">
                                    {quotation.notes}
                                </p>
                            </FormSection>
                        ) : null}

                        {quotation.terms ? (
                            <FormSection
                                icon={ScrollText}
                                title="Terms & Conditions"
                                description="Quotation terms"
                            >
                                <p className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">
                                    {quotation.terms}
                                </p>
                            </FormSection>
                        ) : null}
                    </div>

                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="card xl:sticky xl:top-24">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Summary</h3>
                            <dl className="space-y-3">
                                <SummaryRow
                                    label="Issue date"
                                    value={
                                        quotation.date
                                            ? format(new Date(quotation.date), 'MMM dd, yyyy')
                                            : '—'
                                    }
                                />
                                {quotation.validUntil ? (
                                    <SummaryRow
                                        label="Valid until"
                                        value={format(new Date(quotation.validUntil), 'MMM dd, yyyy')}
                                    />
                                ) : null}
                                <SummaryRow
                                    label="Subtotal"
                                    value={formatCurrency(quotation.subtotal, quotation.currency)}
                                />
                                {Number(quotation.discount) > 0 && (
                                    <SummaryRow
                                        label={
                                            quotation.discountType === 'percent' &&
                                            quotation.discountValue
                                                ? `Discount (${quotation.discountValue}%)`
                                                : 'Discount'
                                        }
                                        value={`−${formatCurrency(quotation.discount, quotation.currency)}`}
                                    />
                                )}
                                <SummaryRow
                                    label={`Tax (${quotation.taxRate}%)`}
                                    value={formatCurrency(quotation.tax, quotation.currency)}
                                />
                                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                                    <dt className="text-base font-semibold text-zinc-900">
                                        Estimated total
                                    </dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(quotation.total, quotation.currency)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="hidden xl:block">
                            <QuotationActionsPanel {...actionPanelProps} />
                        </div>
                    </div>

                    <div className="order-3 xl:hidden">
                        <QuotationActionsPanel {...actionPanelProps} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuotationDetails;
