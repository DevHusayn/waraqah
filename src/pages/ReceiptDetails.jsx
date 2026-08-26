import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Send,
    Copy,
    Download,
    Printer,
    Share2,
    CheckCircle,
} from 'lucide-react';
import { useReceipt } from '../context/ReceiptContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import MarkAsPaidModal from '../components/MarkAsPaidModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import ActionMenu from '../components/ActionMenu';
import {
    shareInvoicePdf,
    getShareFallbackHint,
    downloadPdfBlob,
    printPdfBlob,
} from '../utils/shareInvoicePdf';
import { PDF_DOCUMENT_TYPES } from '@waraqah/shared';
import { getCachedPdf, setCachedPdf, clearCachedPdf } from '../utils/pdfCache';
import { formatCurrency } from '../utils/currency';
import {
    getReceiptNumber,
    getPaymentMethodLabel,
    getReceiptStatusBadge,
} from '../utils/receiptHelpers';
import { getPublicInvoiceUrl } from '../utils/publicApi';
import { getClientBusiness } from '../utils/clientHelpers';
import { apiFetch } from '../utils/api';
import { getInvoicePayments, getInvoiceAmountPaid, getInvoiceBalanceDue } from '@waraqah/shared';
import StatusBadge from '../components/StatusBadge';
import SummaryRow from '../components/documentDetails/SummaryRow';
import DocumentClientDisplay from '../components/documentDetails/DocumentClientDisplay';
import DocumentLineItemsTable from '../components/documentDetails/DocumentLineItemsTable';
import { DocumentNotesDisplay } from '../components/documentDetails/DocumentTextSections';

function normalizeDocumentClientId(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'object') {
        const id = value._id || value.id;
        return id ? String(id) : null;
    }
    return String(value);
}

function pickClientEmail(...candidates) {
    for (const candidate of candidates) {
        const email = String(candidate ?? '').trim();
        if (email) return email;
    }
    return '';
}

function mapReceiptRecord(receipt) {
    const embeddedClient = receipt?.client
        ? {
              ...receipt.client,
              id: receipt.client.id || receipt.client._id,
          }
        : null;
    const { client: _client, ...rest } = receipt || {};
    return {
        ...rest,
        id: receipt._id || receipt.id,
        documentType: 'receipt',
        ...(embeddedClient ? { client: embeddedClient } : {}),
    };
}

function mapClientRecord(client) {
    if (!client) return null;
    return {
        ...client,
        id: client.id || client._id,
        email: String(client.email ?? '').trim(),
    };
}

async function fetchReceiptWithLinkedClient(receiptId) {
    const data = await apiFetch(`/receipts/${receiptId}`);
    let mapped = mapReceiptRecord(data);
    const clientId = normalizeDocumentClientId(mapped.clientId);
    let linkedClient = null;

    if (clientId) {
        try {
            const linked = await apiFetch(`/clients/${clientId}`);
            linkedClient = mapClientRecord(linked);
            mapped = {
                ...mapped,
                client: {
                    ...(mapped.client || {}),
                    ...linkedClient,
                    id: linkedClient.id,
                    email: pickClientEmail(linkedClient.email, mapped.client?.email),
                },
            };
        } catch {
            // Receipt may still render using embedded or cached client data.
        }
    }

    return { mapped, linkedClient };
}

function resolveReceiptClient(receipt, clients, clientOverride = null, linkedClient = null) {
    const clientId = normalizeDocumentClientId(receipt?.clientId);
    const fromList = clientId
        ? clients.find(
              (c) =>
                  String(c.id) === clientId
                  || String(c._id) === clientId
          ) || null
        : null;
    const embedded =
        receipt?.client && (receipt.client.name || receipt.client.email)
            ? receipt.client
            : null;
    const linked = linkedClient ? mapClientRecord(linkedClient) : null;

    const email = pickClientEmail(
        clientOverride?.email,
        linked?.email,
        fromList?.email,
        embedded?.email
    );

    if (!fromList && !embedded && !linked && !clientOverride && !email) {
        return null;
    }

    return {
        id: normalizeDocumentClientId(
            clientOverride?.id || linked?.id || fromList?.id || embedded?.id || embedded?._id || clientId
        ),
        name: clientOverride?.name || linked?.name || fromList?.name || embedded?.name || '',
        email,
        phone: clientOverride?.phone || linked?.phone || fromList?.phone || embedded?.phone || '',
        address: clientOverride?.address || linked?.address || fromList?.address || embedded?.address || '',
        company: clientOverride?.company || linked?.company || fromList?.company || embedded?.company || '',
    };
}

function receiptHasLineItems(receipt) {
    return Boolean(receipt && Array.isArray(receipt.items) && receipt.items.length > 0);
}

async function generateReceiptPdf(receipt, client, businessInfo) {
    const { generateInvoicePdfBlob } = await import('../utils/pdfGenerator');
    return generateInvoicePdfBlob(receipt, client, businessInfo, { mode: 'receipt' });
}

function ReceiptActionsPanel({
    receipt,
    canRecordPayment,
    canEmailClient,
    canEditClient,
    contactResolved,
    saving,
    emailing,
    onRecordPayment,
    onShare,
    onEmailClient,
    onEditClient,
    onDownloadPdf,
    onPrintPdf,
    onCopyPublicLink,
}) {
    const actionsDisabled = saving || emailing;

    const menuItems = [
        {
            id: 'share-receipt',
            label: 'Share Receipt',
            icon: Share2,
            onClick: onShare,
            disabled: saving,
        },
        {
            id: 'email-receipt',
            label: emailing ? 'Sending…' : 'Email Receipt',
            icon: Send,
            onClick: onEmailClient,
            hidden: receipt?.status !== 'paid',
            disabled: actionsDisabled || !canEmailClient,
        },
        {
            id: 'download-receipt',
            label: 'Download PDF',
            icon: Download,
            onClick: onDownloadPdf,
            disabled: saving,
        },
        {
            id: 'print-receipt',
            label: 'Print Receipt',
            icon: Printer,
            onClick: onPrintPdf,
            disabled: saving,
        },
        {
            id: 'copy-link',
            label: 'Copy Link',
            icon: Copy,
            onClick: onCopyPublicLink,
            hidden: !receipt?.publicToken,
            disabled: saving,
        },
    ];

    const primaryAction = canRecordPayment
        ? {
              label: 'Record payment',
              icon: CheckCircle,
              onClick: onRecordPayment,
          }
        : {
              label: 'Share Receipt',
              icon: Share2,
              onClick: onShare,
          };

    const PrimaryIcon = primaryAction.icon;

    return (
        <div className="card overflow-visible">
            <h3 className="text-sm font-semibold text-foreground pb-3 mb-4 border-b border-border">
                Actions
            </h3>
            <div className="flex items-stretch gap-2">
                <button
                    type="button"
                    onClick={primaryAction.onClick}
                    className="btn-primary flex-1 min-w-0 min-h-[40px]"
                    disabled={actionsDisabled}
                >
                    {PrimaryIcon ? <PrimaryIcon size={18} aria-hidden /> : null}
                    {primaryAction.label}
                </button>
                <ActionMenu items={menuItems} disabled={saving} ariaLabel="Receipt actions" />
            </div>
            {contactResolved && receipt?.status === 'paid' && !canEmailClient && canEditClient ? (
                <p className="mt-3 text-sm text-foreground-muted">
                    No email on file.{' '}
                    <button
                        type="button"
                        className="font-medium text-brand hover:underline"
                        onClick={onEditClient}
                    >
                        Edit client
                    </button>
                </p>
            ) : null}
        </div>
    );
}

const ReceiptDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { receipts, sendReceiptEmailToClient, upsertReceipt, recordReceiptPayment } = useReceipt();
    const { clients, updateClient, fetchUserData } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [fetchedReceipt, setFetchedReceipt] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [recordingPayment, setRecordingPayment] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '' });
    const [clientEditOpen, setClientEditOpen] = useState(false);
    const [clientOverride, setClientOverride] = useState(null);
    const [linkedClient, setLinkedClient] = useState(null);
    const [contactResolved, setContactResolved] = useState(false);

    const receiptFromList = useMemo(
        () => receipts.find((r) => String(r.id) === String(id)) || null,
        [receipts, id]
    );

    const receipt = fetchedReceipt || receiptFromList;
    const client = useMemo(
        () => resolveReceiptClient(receipt, clients, clientOverride, linkedClient),
        [receipt, clients, clientOverride, linkedClient]
    );

    const receiptNumber = getReceiptNumber(receipt);
    const amountPaid = getInvoiceAmountPaid(receipt);
    const balanceDue = getInvoiceBalanceDue(receipt);
    const isPartialReceipt = amountPaid > 0 && balanceDue > 0.009;
    const paymentHistory = getInvoicePayments(receipt);
    const clientRecordId = normalizeDocumentClientId(client?.id || receipt?.clientId);
    const canEditClient = Boolean(clientRecordId);
    const clientEditInitialData = client
        ? {
              name: client.name || '',
              business: getClientBusiness(client) || '',
              email: client.email || '',
              phone: client.phone || '',
              address: client.address || '',
          }
        : EMPTY_CLIENT;

    useEffect(() => {
        setClientOverride(null);
        setLinkedClient(null);
        setContactResolved(false);
    }, [id]);

    useEffect(() => {
        if (!id) return undefined;

        let cancelled = false;
        setResolving(true);
        setContactResolved(false);

        (async () => {
            try {
                const { mapped, linkedClient: linked } = await fetchReceiptWithLinkedClient(id);
                if (cancelled) return;
                if (linked) setLinkedClient(linked);
                setFetchedReceipt(mapped);
                upsertReceipt(mapped);
            } catch {
                if (!cancelled) navigate('/receipts', { replace: true });
            } finally {
                if (!cancelled) {
                    setResolving(false);
                    setContactResolved(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, navigate, upsertReceipt]);

    useEffect(() => {
        if (!receipt || !client || !receiptHasLineItems(receipt)) return undefined;

        clearCachedPdf(id, 'receipt');
        let cancelled = false;

        (async () => {
            const existing = getCachedPdf(id, 'receipt');
            if (existing) return;
            try {
                const generated = await generateReceiptPdf(receipt, client, businessInfo);
                if (!cancelled) setCachedPdf(id, 'receipt', generated);
            } catch (err) {
                if (!cancelled) {
                    setAlert({
                        open: true,
                        message: err.message || 'Failed to prepare receipt PDF.',
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, receipt, client, businessInfo]);

    const getPdf = async () => {
        if (!client) throw new Error('Client data not found for this receipt.');
        let cached = getCachedPdf(id, 'receipt');
        if (!cached) {
            cached = await generateReceiptPdf(receipt, client, businessInfo);
            setCachedPdf(id, 'receipt', cached);
        }
        return cached;
    };

    const handleShare = async () => {
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this receipt.' });
            return;
        }
        try {
            const cached = await getPdf();
            const result = await shareInvoicePdf(receipt, client, businessInfo, {
                mode: 'receipt',
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

    const handleDownload = async () => {
        try {
            const cached = await getPdf();
            downloadPdfBlob(cached.blob, cached.filename, { documentType: PDF_DOCUMENT_TYPES.RECEIPT });
            showToast('PDF downloaded', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to download PDF.' });
        }
    };

    const handlePrint = async () => {
        try {
            const cached = await getPdf();
            await printPdfBlob(cached.blob);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to print PDF.' });
        }
    };

    const handleEmail = async () => {
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

    const handleCopyLink = async () => {
        const base = getPublicInvoiceUrl(receipt?.publicToken);
        const url = base ? `${base}?view=receipt` : '';
        if (!url) {
            setAlert({ open: true, message: 'Public link is not available for this receipt yet.' });
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            showToast('Public receipt link copied', 'success');
        } catch {
            setAlert({ open: true, message: url });
        }
    };

    const handleEditClient = () => {
        if (!canEditClient) return;
        setClientEditOpen(true);
    };

    const handleClientSubmit = async (formData, editing) => {
        const clientId = normalizeDocumentClientId(editing?.id || clientRecordId);
        if (!clientId) {
            setAlert({ open: true, message: 'Client record not found for this receipt.' });
            return;
        }
        try {
            const updatedClient = await updateClient(clientId, formData);
            const normalizedClient = mapClientRecord({
                ...updatedClient,
                id: normalizeDocumentClientId(updatedClient.id || updatedClient._id),
                email: pickClientEmail(updatedClient.email, formData.email),
            });
            setClientOverride(normalizedClient);
            setLinkedClient(normalizedClient);
            await fetchUserData();
            const { mapped, linkedClient: linked } = await fetchReceiptWithLinkedClient(id);
            const mergedClient = {
                ...(mapped.client || {}),
                ...normalizedClient,
                email: pickClientEmail(normalizedClient.email, mapped.client?.email),
            };
            mapped.client = mergedClient;
            if (linked) {
                setLinkedClient({
                    ...linked,
                    ...normalizedClient,
                    email: mergedClient.email,
                });
            }
            setFetchedReceipt(mapped);
            upsertReceipt(mapped);
            setContactResolved(true);
            clearCachedPdf(id, 'receipt');
            setClientEditOpen(false);
            showToast('Client updated', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to update client.' });
        }
    };

    const handleRecordPayment = async ({ amount, paymentMethod, datePaid }) => {
        setRecordingPayment(true);
        try {
            const updated = await recordReceiptPayment(id, { amount, paymentMethod, datePaid });
            const mapped = mapReceiptRecord(updated);
            setFetchedReceipt(mapped);
            upsertReceipt(mapped);
            clearCachedPdf(id, 'receipt');
            setMarkPaidOpen(false);
            const remaining = getInvoiceBalanceDue(mapped);
            showToast(
                remaining <= 0.009 ? 'Receipt fully paid' : 'Payment recorded',
                'success'
            );
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to record payment.' });
        } finally {
            setRecordingPayment(false);
        }
    };

    if (resolving || !receipt || !receiptHasLineItems(receipt)) {
        return <PageSpinner label="Loading receipt…" className="max-w-6xl mx-auto" />;
    }

    if (receipt.status === 'draft') {
        navigate(`/receipts/edit/${id}`, { replace: true });
        return null;
    }

    const canRecordPayment = isPartialReceipt;
    const emailOnFile = String(client?.email ?? '').trim();
    const canEmailClient = Boolean(emailOnFile);

    const actionPanelProps = {
        receipt,
        canRecordPayment,
        canEmailClient,
        canEditClient,
        contactResolved,
        saving: recordingPayment,
        emailing,
        onRecordPayment: () => setMarkPaidOpen(true),
        onShare: handleShare,
        onEmailClient: handleEmail,
        onEditClient: handleEditClient,
        onDownloadPdf: handleDownload,
        onPrintPdf: handlePrint,
        onCopyPublicLink: handleCopyLink,
    };

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                onClose={() => setAlert({ open: false, message: '' })}
            />

            <MarkAsPaidModal
                open={markPaidOpen}
                invoice={receipt}
                variant="receipt"
                onConfirm={handleRecordPayment}
                onCancel={() => setMarkPaidOpen(false)}
                saving={recordingPayment}
            />

            <ClientFormModal
                open={clientEditOpen}
                onClose={() => setClientEditOpen(false)}
                onSubmit={handleClientSubmit}
                editingClient={clientRecordId ? { id: clientRecordId } : null}
                initialData={clientEditInitialData}
            />

            <div className="max-w-6xl mx-auto pb-8">
                <Link
                    to="/receipts"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-brand mb-6 transition-colors"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to receipts
                </Link>

                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="page-title">{receiptNumber || 'Receipt'}</h1>
                        <StatusBadge {...getReceiptStatusBadge(receipt)} />
                    </div>
                    <p className="page-subtitle mt-1">Payment record</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6 order-2 xl:order-1">
                        <DocumentClientDisplay
                            client={client}
                            contactResolved={contactResolved}
                            additionalInfo={receipt.clientAdditionalInfo}
                            onEditClient={canEditClient ? handleEditClient : undefined}
                        />
                        <DocumentLineItemsTable items={receipt.items} currency={receipt.currency} />
                        <DocumentNotesDisplay notes={receipt.notes} />
                    </div>

                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="card xl:sticky xl:top-24">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Summary</h3>
                            <dl className="space-y-3">
                                <SummaryRow
                                    label="Issue date"
                                    value={
                                        receipt.date
                                            ? format(new Date(receipt.date), 'MMM dd, yyyy')
                                            : '—'
                                    }
                                />
                                <SummaryRow
                                    label="Payment date"
                                    value={
                                        receipt.datePaid
                                            ? format(new Date(receipt.datePaid), 'MMM dd, yyyy')
                                            : '—'
                                    }
                                />
                                <SummaryRow
                                    label="Payment method"
                                    value={getPaymentMethodLabel(receipt.paymentMethod)}
                                />
                                <SummaryRow
                                    label="Subtotal"
                                    value={formatCurrency(receipt.subtotal, receipt.currency)}
                                />
                                {Number(receipt.discount) > 0 && (
                                    <SummaryRow
                                        label={
                                            receipt.discountType === 'percent' && receipt.discountValue
                                                ? `Discount (${receipt.discountValue}%)`
                                                : 'Discount'
                                        }
                                        value={`−${formatCurrency(receipt.discount, receipt.currency)}`}
                                    />
                                )}
                                <SummaryRow
                                    label={`Tax (${receipt.taxRate}%)`}
                                    value={formatCurrency(receipt.tax, receipt.currency)}
                                />
                                <div className="pt-3 border-t border-border flex justify-between items-center">
                                    <dt className="text-base font-semibold text-foreground">Total</dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(receipt.total, receipt.currency)}
                                    </dd>
                                </div>
                                <SummaryRow
                                    label="Amount received"
                                    value={formatCurrency(amountPaid, receipt.currency)}
                                />
                                {isPartialReceipt ? (
                                    <SummaryRow
                                        label="Balance remaining"
                                        value={formatCurrency(balanceDue, receipt.currency)}
                                    />
                                ) : null}
                            </dl>
                        </div>

                        {paymentHistory.length > 0 ? (
                            <div className="card">
                                <h3 className="text-sm font-semibold text-foreground mb-4">
                                    Payment history
                                </h3>
                                <ul className="space-y-3">
                                    {paymentHistory.map((payment, index) => (
                                        <li
                                            key={`${payment.date || 'p'}-${index}`}
                                            className="flex items-start justify-between gap-3 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground">
                                                    {formatCurrency(payment.amount, receipt.currency)}
                                                </p>
                                                <p className="text-xs text-foreground-muted mt-0.5">
                                                    {payment.date
                                                        ? format(new Date(payment.date), 'MMM dd, yyyy')
                                                        : '—'}
                                                    {' · '}
                                                    {getPaymentMethodLabel(payment.method)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        <div className="hidden xl:block">
                            <ReceiptActionsPanel {...actionPanelProps} />
                        </div>
                    </div>

                    <div className="order-3 xl:hidden">
                        <ReceiptActionsPanel {...actionPanelProps} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReceiptDetails;
