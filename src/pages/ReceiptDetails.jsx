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
import ActionMenu from '../components/ActionMenu';
import {
    shareInvoicePdf,
    getShareFallbackHint,
    downloadPdfBlob,
    printPdfBlob,
} from '../utils/shareInvoicePdf';
import { getCachedPdf, setCachedPdf, clearCachedPdf } from '../utils/pdfCache';
import { formatCurrency } from '../utils/currency';
import {
    getReceiptNumber,
    getPaymentMethodLabel,
    getReceiptStatusBadge,
} from '../utils/receiptHelpers';
import { getPublicInvoiceUrl } from '../utils/publicApi';
import { apiFetch } from '../utils/api';
import { getInvoicePayments, getInvoiceAmountPaid, getInvoiceBalanceDue } from '@waraqah/shared';
import StatusBadge from '../components/StatusBadge';
import SummaryRow from '../components/documentDetails/SummaryRow';
import DocumentClientDisplay from '../components/documentDetails/DocumentClientDisplay';
import DocumentLineItemsTable from '../components/documentDetails/DocumentLineItemsTable';
import { DocumentNotesDisplay } from '../components/documentDetails/DocumentTextSections';

function mapReceiptRecord(receipt) {
    return { ...receipt, id: receipt._id || receipt.id, documentType: 'receipt' };
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
    saving,
    emailing,
    onRecordPayment,
    onShare,
    onEmailClient,
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
            hidden: !canEmailClient,
            disabled: actionsDisabled,
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
            <h3 className="text-sm font-semibold text-zinc-900 pb-3 mb-4 border-b border-zinc-200">
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
        </div>
    );
}

const ReceiptDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { receipts, sendReceiptEmailToClient, upsertReceipt, recordReceiptPayment } = useReceipt();
    const { clients } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [fetchedReceipt, setFetchedReceipt] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [recordingPayment, setRecordingPayment] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '' });

    const receiptFromList = useMemo(
        () => receipts.find((r) => r.id === id) || null,
        [receipts, id]
    );

    const receipt = fetchedReceipt || receiptFromList;
    const client = useMemo(() => {
        if (!receipt?.clientId) return null;
        return clients.find((c) => c.id === receipt.clientId) || null;
    }, [receipt, clients]);

    const receiptNumber = getReceiptNumber(receipt);
    const amountPaid = getInvoiceAmountPaid(receipt);
    const balanceDue = getInvoiceBalanceDue(receipt);
    const isPartialReceipt = amountPaid > 0 && balanceDue > 0.009;
    const paymentHistory = getInvoicePayments(receipt);
    const clientHasEmail = Boolean(client?.email?.trim());

    useEffect(() => {
        if (!id) return undefined;

        if (receiptHasLineItems(receiptFromList)) {
            setFetchedReceipt(null);
            setResolving(false);
            return undefined;
        }

        let cancelled = false;
        setResolving(true);

        apiFetch(`/receipts/${id}`)
            .then((data) => {
                if (!cancelled) {
                    const mapped = mapReceiptRecord(data);
                    setFetchedReceipt(mapped);
                    upsertReceipt(mapped);
                }
            })
            .catch(() => {
                if (!cancelled) navigate('/receipts', { replace: true });
            })
            .finally(() => {
                if (!cancelled) setResolving(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, receiptFromList, navigate, upsertReceipt]);

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
            downloadPdfBlob(cached.blob, cached.filename);
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

    const actionPanelProps = {
        receipt,
        canRecordPayment,
        canEmailClient: clientHasEmail,
        saving: recordingPayment,
        emailing,
        onRecordPayment: () => setMarkPaidOpen(true),
        onShare: handleShare,
        onEmailClient: handleEmail,
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

            <div className="max-w-6xl mx-auto pb-8">
                <Link
                    to="/receipts"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
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
                            additionalInfo={receipt.clientAdditionalInfo}
                        />
                        <DocumentLineItemsTable items={receipt.items} currency={receipt.currency} />
                        <DocumentNotesDisplay notes={receipt.notes} />
                    </div>

                    <div className="space-y-6 order-1 xl:order-2">
                        <div className="card xl:sticky xl:top-24">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Summary</h3>
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
                                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                                    <dt className="text-base font-semibold text-zinc-900">Total</dt>
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
                                <h3 className="text-sm font-semibold text-zinc-900 mb-4">
                                    Payment history
                                </h3>
                                <ul className="space-y-3">
                                    {paymentHistory.map((payment, index) => (
                                        <li
                                            key={`${payment.date || 'p'}-${index}`}
                                            className="flex items-start justify-between gap-3 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-zinc-900">
                                                    {formatCurrency(payment.amount, receipt.currency)}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
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
