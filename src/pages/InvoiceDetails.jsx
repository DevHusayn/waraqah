import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    Repeat,
} from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ListBackLink from '../components/ListBackLink';
import { useListBackTo } from '../hooks/useOpenListItem';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import MarkAsPaidModal from '../components/MarkAsPaidModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import FormSection from '../components/FormSection';
import StatusBadge from '../components/StatusBadge';
import ActionMenu from '../components/ActionMenu';
import {
    shareInvoicePdf,
    getShareFallbackHint,
    downloadPdfBlob,
    printPdfFromSource,
    isShareAbortError,
    getPdfActionErrorMessage,
} from '../utils/shareInvoicePdf';
import { formatDocumentAdditionalInfo, getRecurringFrequencyLabel, PDF_DOCUMENT_TYPES } from '@waraqah/shared';
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
import {
    canRecordInvoicePayment,
    canSendPaymentReminderNow,
    getInvoiceAmountPaid,
    getInvoiceBalanceDue,
    getInvoicePayments,
    getNextPaymentReminderDate,
    hasRecordedPayments,
    isAutoPaymentRemindersEnabled,
    PAYMENT_REMINDER_DUE_WINDOW_DAYS,
    PAYMENT_REMINDER_MIN_DAYS_BETWEEN,
} from '@waraqah/shared';
import SummaryRow from '../components/documentDetails/SummaryRow';
import DocumentClientDisplay from '../components/documentDetails/DocumentClientDisplay';
import DocumentLineItemsTable from '../components/documentDetails/DocumentLineItemsTable';
import { DocumentNotesDisplay } from '../components/documentDetails/DocumentTextSections';
import {
    fetchClientById,
    normalizeDocumentClientId,
    resolveDisplayClient,
} from '../utils/documentClient';

function mapInvoiceRecord(invoice) {
    return { ...invoice, id: invoice._id || invoice.id };
}

function invoiceHasLineItems(invoice) {
    return Boolean(invoice && Array.isArray(invoice.items) && invoice.items.length > 0);
}

async function generateInvoicePdf(invoice, client, businessInfo, options) {
    const { generateInvoicePdfBlob } = await import('../utils/pdfGenerator');
    return generateInvoicePdfBlob(invoice, client, businessInfo, options);
}

function DocumentTypeToggle({ documentMode, onDocumentModeChange }) {
    return (
        <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-black/30"
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
                            ? 'bg-surface text-foreground shadow-sm dark:bg-surface-elevated'
                            : 'text-foreground-muted hover:text-foreground'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

function PaymentReminderInfo({ reminderContext }) {
    if (!reminderContext) return null;

    return (
        <div className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 space-y-1.5 text-sm text-foreground-muted">
            <p className="font-medium text-foreground flex items-center gap-1.5">
                <Bell size={14} aria-hidden />
                Payment reminders
            </p>
            {reminderContext.lastSentLabel ? (
                <p>Last reminder sent: {reminderContext.lastSentLabel}</p>
            ) : (
                <p>No reminder sent yet for this invoice.</p>
            )}
            {reminderContext.nextAvailableLabel ? (
                <p>{reminderContext.nextAvailableLabel}</p>
            ) : null}
            {reminderContext.autoRemindersOn ? (
                <p className="text-xs text-foreground-muted leading-relaxed">
                    Automatic reminders are on. Waraqah may email your client when payment is due within{' '}
                    {PAYMENT_REMINDER_DUE_WINDOW_DAYS} days or overdue, at most once every{' '}
                    {PAYMENT_REMINDER_MIN_DAYS_BETWEEN} days.
                </p>
            ) : (
                <p className="text-xs text-foreground-muted leading-relaxed">
                    Turn on automatic reminders in Settings → Notifications if you want Waraqah to follow up for you.
                </p>
            )}
        </div>
    );
}

function formatDetailDate(value) {
    if (!value) return '—';
    const raw = String(value).trim();
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = iso
        ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
        : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'MMM dd, yyyy');
}

function recurringScheduleCopy(invoice) {
    const frequency = String(getRecurringFrequencyLabel(invoice.recurringFrequency) || '').toLowerCase();
    const until = invoice.recurringEndDate
        ? `until ${formatDetailDate(invoice.recurringEndDate)}`
        : 'until you stop it';
    const next = invoice.recurringNextDate
        ? ` Next invoice ${formatDetailDate(invoice.recurringNextDate)}.`
        : '';
    return `Repeats ${frequency} ${until}.${next}`;
}

function RecurringSchedulePanel({ invoice, stopping, onStop }) {
    const frequency = String(getRecurringFrequencyLabel(invoice.recurringFrequency) || 'on a schedule').toLowerCase();
    const until = invoice.recurringEndDate
        ? `Until ${formatDetailDate(invoice.recurringEndDate)}`
        : 'Until you stop it';
    const next = invoice.recurringNextDate ? formatDetailDate(invoice.recurringNextDate) : null;

    return (
        <div className="rounded-lg bg-surface-muted px-3 py-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Repeat size={14} className="shrink-0 text-brand" aria-hidden />
                Repeats {frequency}
            </p>
            <p className="mt-1 pl-5 text-xs text-foreground-muted">{until}</p>
            {next ? (
                <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border/70 pt-2.5 text-sm">
                    <span className="text-foreground-muted">Next invoice</span>
                    <span className="whitespace-nowrap font-medium tabular-nums text-foreground">{next}</span>
                </div>
            ) : null}
            <button
                type="button"
                className="btn-secondary mt-3 w-full text-sm"
                onClick={onStop}
                disabled={stopping}
            >
                {stopping ? 'Stopping…' : 'Stop repeating'}
            </button>
        </div>
    );
}

function sourceSchedule(source) {
    if (!source?.isRecurring) return { frequency: '', next: null };
    const frequency = source.recurringFrequency
        ? String(getRecurringFrequencyLabel(source.recurringFrequency) || '').toLowerCase()
        : '';
    const next = source.recurringNextDate ? formatDetailDate(source.recurringNextDate) : null;
    return { frequency, next };
}

function CreatedFromRecurringNotice({ source, layout = 'panel', stopping = false, onStop }) {
    const { frequency, next } = sourceSchedule(source);

    if (layout === 'strip') {
        return (
            <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-surface-muted/70 px-6 py-3">
                <p className="flex min-w-0 items-start gap-2 text-sm text-foreground">
                    <Repeat size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                    <span>
                        Created from a recurring invoice
                        {frequency ? ` · Repeats ${frequency}` : ''}
                    </span>
                </p>
                <div className="flex shrink-0 items-center gap-4">
                    {next ? (
                        <p className="text-sm">
                            <span className="text-foreground-muted">Next invoice </span>
                            <span className="whitespace-nowrap font-medium tabular-nums text-foreground">{next}</span>
                        </p>
                    ) : null}
                    {onStop ? (
                        <button
                            type="button"
                            className="btn-secondary shrink-0 text-sm"
                            onClick={onStop}
                            disabled={stopping}
                        >
                            {stopping ? 'Stopping…' : 'Stop repeating'}
                        </button>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-surface-muted px-3 py-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Repeat size={14} className="shrink-0 text-brand" aria-hidden />
                Created from a recurring invoice
            </p>
            {frequency ? (
                <p className="mt-1 pl-5 text-xs text-foreground-muted">Repeats {frequency}</p>
            ) : null}
            {next ? (
                <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border/70 pt-2.5 text-sm">
                    <span className="text-foreground-muted">Next invoice</span>
                    <span className="whitespace-nowrap font-medium tabular-nums text-foreground">{next}</span>
                </div>
            ) : null}
            {onStop ? (
                <button
                    type="button"
                    className="btn-secondary mt-3 w-full text-sm"
                    onClick={onStop}
                    disabled={stopping}
                >
                    {stopping ? 'Stopping…' : 'Stop repeating'}
                </button>
            ) : null}
        </div>
    );
}

function InvoiceBillTo({ client, additionalInfo, onEditClient, contactResolved }) {
    const emailOnFile = String(client?.email ?? '').trim();
    const missingEmail = Boolean(contactResolved && onEditClient && client && !emailOnFile);
    const business = client ? getClientBusiness(client) : '';

    if (!client) {
        return <p className="text-sm text-foreground-muted">Client not found</p>;
    }

    return (
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-muted">Bill to</p>
            {client.id ? (
                <Link
                    to={`/clients/${client.id}`}
                    className="mt-1 inline-block text-lg font-semibold tracking-[-0.01em] text-foreground hover:text-brand"
                >
                    {client.name}
                </Link>
            ) : (
                <p className="mt-1 text-lg font-semibold tracking-[-0.01em] text-foreground">{client.name}</p>
            )}
            <div className="mt-2 space-y-1 text-sm text-foreground-muted">
                {business ? (
                    <p className="flex items-center gap-1.5">
                        <Building2 size={14} className="shrink-0 text-foreground-muted/70" aria-hidden />
                        {business}
                    </p>
                ) : null}
                {emailOnFile ? (
                    <p className="flex items-center gap-1.5">
                        <Mail size={14} className="shrink-0 text-foreground-muted/70" aria-hidden />
                        <span className="truncate">{emailOnFile}</span>
                    </p>
                ) : null}
                {client.phone ? (
                    <p className="flex items-center gap-1.5">
                        <Phone size={14} className="shrink-0 text-foreground-muted/70" aria-hidden />
                        {client.phone}
                    </p>
                ) : null}
                {client.address ? <p className="whitespace-pre-wrap">{client.address}</p> : null}
                {additionalInfo ? (
                    <p className="whitespace-pre-wrap leading-relaxed">
                        {formatDocumentAdditionalInfo(additionalInfo)}
                    </p>
                ) : null}
                {missingEmail ? (
                    <p>
                        No email on file.{' '}
                        <button type="button" className="font-medium text-brand hover:underline" onClick={onEditClient}>
                            Edit client
                        </button>
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function InvoiceMetaList({ invoice, paid }) {
    const rows = [['Issue date', formatDetailDate(invoice.date)]];
    if (paid) {
        rows.push(['Payment date', formatDetailDate(invoice.datePaid)]);
        rows.push(['Payment method', getPaymentMethodLabel(invoice.paymentMethod)]);
    } else if (invoice.dueDate) {
        rows.push(['Due date', formatDetailDate(invoice.dueDate)]);
    }

    return (
        <dl className="shrink-0 space-y-2 text-sm">
            {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[7.25rem_auto] items-baseline gap-x-6">
                    <dt className="text-foreground-muted">{label}</dt>
                    <dd className="whitespace-nowrap text-right font-medium tabular-nums text-foreground">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

function InvoiceAmountRows({ invoice, paid, amountPaid, balanceDue }) {
    return (
        <>
            <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
            {Number(invoice.discount) > 0 ? (
                <SummaryRow
                    label={
                        invoice.discountType === 'percent' && invoice.discountValue
                            ? `Discount (${invoice.discountValue}%)`
                            : 'Discount'
                    }
                    value={`−${formatCurrency(invoice.discount, invoice.currency)}`}
                />
            ) : null}
            <SummaryRow
                label={`Tax (${invoice.taxRate}%)`}
                value={formatCurrency(invoice.tax, invoice.currency)}
            />
            <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-base font-semibold text-foreground">Total</dt>
                <dd className="text-2xl font-bold tabular-nums text-brand">
                    {formatCurrency(invoice.total, invoice.currency)}
                </dd>
            </div>
            {amountPaid > 0 || paid ? (
                <>
                    <SummaryRow label="Amount paid" value={formatCurrency(amountPaid, invoice.currency)} />
                    {!paid ? (
                        <SummaryRow label="Balance due" value={formatCurrency(balanceDue, invoice.currency)} />
                    ) : null}
                </>
            ) : null}
        </>
    );
}

function PaymentHistoryCard({ paymentHistory, currency }) {
    if (!paymentHistory.length) return null;

    return (
        <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Payment history</h3>
            <ul className="space-y-3">
                {paymentHistory.map((payment, index) => (
                    <li
                        key={`${payment.date || 'p'}-${index}`}
                        className="flex items-start justify-between gap-3 text-sm"
                    >
                        <div className="min-w-0">
                            <p className="font-medium text-foreground">
                                {formatCurrency(payment.amount, currency)}
                            </p>
                            <p className="mt-0.5 text-xs text-foreground-muted">
                                {payment.date ? formatDetailDate(payment.date) : '—'}
                                {' · '}
                                {getPaymentMethodLabel(payment.method)}
                            </p>
                            {payment.note ? (
                                <p className="mt-1 text-xs text-foreground-muted">{payment.note}</p>
                            ) : null}
                        </div>
                    </li>
                ))}
            </ul>
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
    canSendReminderNow,
    reminderContext,
    canResendReceipt,
    canEditClient,
    contactResolved,
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
    onEditClient,
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
                    disabled: actionsDisabled || !canSendReminderNow,
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
                  label: 'Record payment',
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
        <div className="card overflow-visible">
            <h3 className="text-sm font-semibold text-foreground pb-3 mb-4 border-b border-border">
                Actions
            </h3>

            <div className="space-y-3">
                {cancelled && (
                    <p className="text-sm text-foreground-muted bg-surface-muted border border-border rounded-xl px-3 py-2.5">
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
                        {!isReceiptView && canMarkPaid ? (
                            <button
                                type="button"
                                onClick={() => onShare('invoice')}
                                className="btn-secondary h-full min-h-[40px] px-3"
                                disabled={saving}
                                aria-label="Share Invoice"
                            >
                                <Share2 size={18} aria-hidden />
                            </button>
                        ) : null}
                        <ActionMenu
                            items={menuItems}
                            disabled={saving}
                            ariaLabel={isReceiptView ? 'Receipt actions' : 'Invoice actions'}
                        />
                    </div>
                ) : null}

                {reminderContext ? <PaymentReminderInfo reminderContext={reminderContext} /> : null}

                {contactResolved && paid && !canEmailClient && canEditClient ? (
                    <p className="text-sm text-foreground-muted">
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
        </div>
    );
}

const InvoiceDetails = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view');
    const navigate = useNavigate();
    const listBackTo = useListBackTo('/invoices');
    const {
        invoices,
        clients,
        updateInvoice,
        recordInvoicePayment,
        deleteInvoice,
        loading,
        upsertInvoice,
        sendInvoiceEmailToClient,
        sendPaymentReminderToClient,
        markInvoiceReminderSent,
        sendReceiptEmailToClient,
        updateClient,
        fetchUserData,
    } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [confirmSendReminder, setConfirmSendReminder] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [fetchedInvoice, setFetchedInvoice] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [clientEditOpen, setClientEditOpen] = useState(false);
    const [clientOverride, setClientOverride] = useState(null);
    const [fetchedClient, setFetchedClient] = useState(null);
    const [stoppingRecurring, setStoppingRecurring] = useState(false);
    const [recurringSource, setRecurringSource] = useState(null);

    const invoiceFromList = useMemo(
        () => invoices.find((inv) => String(inv.id) === String(id) || String(inv._id) === String(id)),
        [invoices, id]
    );
    const invoice = useMemo(() => {
        if (invoiceHasLineItems(invoiceFromList)) return invoiceFromList;
        if (invoiceHasLineItems(fetchedInvoice)) return fetchedInvoice;
        return fetchedInvoice || invoiceFromList || null;
    }, [invoiceFromList, fetchedInvoice]);
    const client = useMemo(
        () =>
            resolveDisplayClient({
                clients,
                clientId: invoice?.clientId,
                clientName: invoice?.clientName,
                clientCompany: invoice?.clientCompany,
                liveClient: fetchedClient,
                clientOverride,
            }),
        [clients, invoice?.clientId, invoice?.clientName, invoice?.clientCompany, fetchedClient, clientOverride]
    );

    const paid = invoice ? isReceipt(invoice) : false;
    const cancelled = invoice?.status === 'cancelled';
    const canMarkPaid = invoice && canRecordInvoicePayment(invoice);
    const canCancel = invoice && ['pending', 'partial', 'overdue'].includes(invoice.status);
    const canEdit = invoice && !paid && !cancelled && !hasRecordedPayments(invoice);
    const clientHasEmail = Boolean(client?.email?.trim());
    const canEmailClient = invoice && !cancelled && invoice.status !== 'draft' && clientHasEmail;
    const canSendReminder =
        invoice && ['pending', 'partial', 'overdue'].includes(invoice.status) && clientHasEmail;
    const amountPaid = invoice ? getInvoiceAmountPaid(invoice) : 0;
    const balanceDue = invoice ? getInvoiceBalanceDue(invoice) : 0;
    const paymentHistory = invoice ? getInvoicePayments(invoice) : [];
    const canSendReminderNow = canSendReminder && canSendPaymentReminderNow(invoice?.lastPaymentReminderAt);
    const canResendReceipt = paid && clientHasEmail;
    const clientRecordId = normalizeDocumentClientId(client?.id);
    const canEditClient = Boolean(clientRecordId);
    const contactResolved = Boolean(invoice && !loading && !resolving);
    const clientEditInitialData = client
        ? {
              name: client.name || '',
              business: getClientBusiness(client) || '',
              email: client.email || '',
              phone: client.phone || '',
              address: client.address || '',
          }
        : EMPTY_CLIENT;
    const autoRemindersOn = isAutoPaymentRemindersEnabled(businessInfo);

    const reminderContext = useMemo(() => {
        if (!canSendReminder) return null;

        const lastSent = invoice.lastPaymentReminderAt
            ? format(new Date(invoice.lastPaymentReminderAt), 'MMM d, yyyy')
            : null;
        const nextAvailable = getNextPaymentReminderDate(invoice.lastPaymentReminderAt);
        const nextAvailableLabel = !canSendReminderNow && nextAvailable
            ? `You can send another reminder after ${format(nextAvailable, 'MMM d, yyyy')}.`
            : null;

        return {
            lastSentLabel: lastSent,
            nextAvailableLabel,
            autoRemindersOn,
        };
    }, [canSendReminder, canSendReminderNow, invoice?.lastPaymentReminderAt, autoRemindersOn]);

    useEffect(() => {
        setClientOverride(null);
        setFetchedClient(null);
    }, [id]);

    const recurringSourceId =
        invoice && !invoice.isRecurring && invoice.recurringSourceId
            ? String(invoice.recurringSourceId)
            : '';

    useEffect(() => {
        if (!recurringSourceId) {
            setRecurringSource(null);
            return undefined;
        }

        let cancelled = false;
        apiFetch(`/invoices/${recurringSourceId}`)
            .then((data) => {
                if (!cancelled) setRecurringSource(mapInvoiceRecord(data));
            })
            .catch(() => {
                if (!cancelled) setRecurringSource(null);
            });

        return () => {
            cancelled = true;
        };
    }, [recurringSourceId]);

    useEffect(() => {
        const clientId = normalizeDocumentClientId(invoice?.clientId);
        if (!clientId) {
            setFetchedClient(null);
            return undefined;
        }
        let cancelled = false;
        fetchClientById(clientId).then((loaded) => {
            if (!cancelled) setFetchedClient(loaded);
        });
        return () => {
            cancelled = true;
        };
    }, [invoice?.clientId]);

    useEffect(() => {
        if (!id) {
            return undefined;
        }

        if (invoiceHasLineItems(invoiceFromList)) {
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
                    const mapped = mapInvoiceRecord(data);
                    setFetchedInvoice(mapped);
                    upsertInvoice(mapped);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    navigate(listBackTo, { replace: true });
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
    }, [loading, id, invoiceFromList, navigate, upsertInvoice, listBackTo]);

    useEffect(() => {
        if (!invoice || !client || cancelled || !invoiceHasLineItems(invoice)) return undefined;

        const modes = paid ? ['receipt', 'invoice'] : ['invoice'];
        let cancelledEffect = false;

        (async () => {
            for (const mode of modes) {
                if (cancelledEffect) return;

                try {
                    const generated = await generateInvoicePdf(invoice, client, businessInfo, { mode });
                    if (cancelledEffect) return;
                    setCachedPdf(id, mode, generated);
                } catch {
                    // Keep any existing cache. Share/download will retry on demand.
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
                cached = await generateInvoicePdf(invoice, client, businessInfo, { mode });
                setCachedPdf(id, mode, cached);
            }

            const result = await shareInvoicePdf(invoice, client, businessInfo, { mode, cached });
            if (result.method !== 'share') {
                showToast(getShareFallbackHint(), 'info');
            }
        } catch (err) {
            if (isShareAbortError(err)) return;
            setAlert({
                open: true,
                message: getPdfActionErrorMessage(
                    err,
                    'Could not share the PDF. Try downloading it from the menu instead.'
                ),
            });
        }
    };

    const getPdfForMode = async (mode) => {
        if (!client) {
            throw new Error('Client data not found for this invoice.');
        }

        let cached = getCachedPdf(id, mode);
        if (!cached) {
            cached = await generateInvoicePdf(invoice, client, businessInfo, { mode });
            setCachedPdf(id, mode, cached);
        }

        return cached;
    };

    const handleDownloadPdf = async (mode) => {
        try {
            const cached = await getPdfForMode(mode);
            downloadPdfBlob(cached.blob, cached.filename, {
                documentType: mode === 'receipt' ? PDF_DOCUMENT_TYPES.RECEIPT : PDF_DOCUMENT_TYPES.INVOICE,
            });
            showToast('PDF downloaded', 'success');
        } catch (err) {
            setAlert({ open: true, message: getPdfActionErrorMessage(err, 'Failed to download PDF.') });
        }
    };

    const handlePrintPdf = async (mode) => {
        try {
            const result = await printPdfFromSource(() => getPdfForMode(mode));
            if (result?.method === 'download') {
                showToast('PDF downloaded. Open it to print.', 'success');
            }
        } catch (err) {
            setAlert({ open: true, message: getPdfActionErrorMessage(err, 'Failed to print PDF.') });
        }
    };

    const handleMarkPaid = async ({ amount, paymentMethod, datePaid }) => {
        setSaving(true);
        try {
            const updated = await recordInvoicePayment(id, { amount, paymentMethod, datePaid });
            setFetchedInvoice(updated);
            showToast(
                updated.status === 'paid' ? 'Invoice marked as paid' : 'Payment recorded',
                'success'
            );
            setMarkPaidOpen(false);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to record payment.' });
        } finally {
            setSaving(false);
        }
    };

    const handleStopRecurring = async () => {
        const targetId = invoice?.isRecurring ? id : recurringSourceId;
        if (!targetId) return;

        setStoppingRecurring(true);
        try {
            const updated = await apiFetch(`/invoices/${targetId}/stop-recurring`, { method: 'POST' });
            const mapped = mapInvoiceRecord(updated);
            if (invoice?.isRecurring) {
                setFetchedInvoice(mapped);
            } else {
                setRecurringSource(mapped);
            }
            upsertInvoice(mapped);
            showToast('This series will no longer repeat.', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Could not stop repeating this invoice.' });
        } finally {
            setStoppingRecurring(false);
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
        setDeleting(true);
        try {
            await deleteInvoice(id);
            clearCachedPdf(id);
            showToast('Invoice deleted', 'success');
            navigate(listBackTo);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete invoice.' });
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
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

    const handleSendReminder = () => {
        if (!canSendReminderNow) return;
        setConfirmSendReminder(true);
    };

    const confirmSendReminderEmail = async () => {
        setEmailing(true);
        try {
            const result = await sendPaymentReminderToClient(id);
            const sentAt = markInvoiceReminderSent(id, result.lastPaymentReminderAt);
            setFetchedInvoice((prev) => (prev ? { ...prev, lastPaymentReminderAt: sentAt } : prev));
            setConfirmSendReminder(false);
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

    const handleEditClient = () => {
        if (!canEditClient) return;
        setClientEditOpen(true);
    };

    const handleClientSubmit = async (formData, editing) => {
        const clientId = normalizeDocumentClientId(editing?.id || clientRecordId);
        if (!clientId) {
            setAlert({ open: true, message: 'Client record not found for this invoice.' });
            return;
        }
        try {
            const updatedClient = await updateClient(clientId, formData);
            setClientOverride({
                ...updatedClient,
                id: normalizeDocumentClientId(updatedClient.id || updatedClient._id),
                email: String(updatedClient.email ?? formData.email ?? '').trim(),
            });
            await fetchUserData();
            clearCachedPdf(id);
            clearCachedPdf(id, 'receipt');
            setClientEditOpen(false);
            showToast('Client updated', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to update client.' });
        }
    };

    const waitingForFullInvoice =
        Boolean(invoiceFromList) && !invoiceHasLineItems(invoiceFromList) && !invoiceHasLineItems(fetchedInvoice);

    if (loading || resolving || waitingForFullInvoice || !invoice || !invoiceHasLineItems(invoice)) {
        return <PageSpinner label="Loading invoice…" className="max-w-6xl mx-auto" />;
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
        canSendReminderNow,
        reminderContext,
        canResendReceipt,
        canEditClient,
        contactResolved,
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
        onEditClient: handleEditClient,
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
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => !deleting && setConfirmDelete(false)}
            />
            <ConfirmModal
                open={confirmCancel}
                title="Cancel invoice?"
                description="The invoice will stay on record but can no longer be edited or receive payments."
                confirmLabel="Cancel invoice"
                cancelLabel="Go back"
                onConfirm={handleCancelInvoice}
                onCancel={() => setConfirmCancel(false)}
                loading={saving}
            />
            <ConfirmModal
                open={confirmSendReminder}
                title="Send payment reminder?"
                description={
                    client?.email
                        ? `We'll email ${client.email} a friendly reminder with the outstanding balance, due date, and a link to pay. You'll receive a copy in your inbox.`
                        : "Send a payment reminder email to your client with the outstanding balance, due date, and a link to pay. You'll receive a copy in your inbox."
                }
                confirmLabel={emailing ? 'Sending…' : 'Send reminder'}
                cancelLabel="Not now"
                onConfirm={confirmSendReminderEmail}
                onCancel={() => setConfirmSendReminder(false)}
                loading={emailing}
            />
            <MarkAsPaidModal
                open={markPaidOpen}
                invoice={invoice}
                onConfirm={handleMarkPaid}
                onCancel={() => setMarkPaidOpen(false)}
                saving={saving}
            />
            <ClientFormModal
                open={clientEditOpen}
                onClose={() => setClientEditOpen(false)}
                onSubmit={handleClientSubmit}
                editingClient={clientRecordId ? { id: clientRecordId } : null}
                initialData={clientEditInitialData}
            />

            <div className="max-w-6xl mx-auto pb-8">
                <ListBackLink
                    to="/invoices"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-brand mb-6 transition-colors"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to invoices
                </ListBackLink>

                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="page-title">{displayNumber}</h1>
                            <StatusBadge status={invoice.status} />
                            {invoice.isRecurring || recurringSource?.isRecurring ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand">
                                    <Repeat size={12} aria-hidden />
                                    Recurring
                                </span>
                            ) : null}
                        </div>
                        <p className="page-subtitle mt-1">
                            {paid && receiptNumber
                                ? `Receipt ${receiptNumber}`
                                : 'Invoice details and documents'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:hidden">
                    <div className="order-2 space-y-6">
                        <DocumentClientDisplay
                            client={client}
                            contactResolved={contactResolved}
                            additionalInfo={invoice.clientAdditionalInfo}
                            onEditClient={canEditClient ? handleEditClient : undefined}
                        />

                        <DocumentLineItemsTable items={invoice.items} currency={invoice.currency} />

                        <DocumentNotesDisplay notes={invoice.notes} />
                    </div>

                    <div className="order-1 space-y-6">
                        <div className="card">
                            <h3 className="text-sm font-semibold text-foreground mb-4">Summary</h3>
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
                                {canSendReminder && invoice.lastPaymentReminderAt ? (
                                    <SummaryRow
                                        label="Last reminder"
                                        value={format(new Date(invoice.lastPaymentReminderAt), 'MMM dd, yyyy')}
                                    />
                                ) : null}
                                {invoice.isRecurring ? (
                                    <div className="border-t border-border pt-3">
                                        <RecurringSchedulePanel
                                            invoice={invoice}
                                            stopping={stoppingRecurring}
                                            onStop={handleStopRecurring}
                                        />
                                    </div>
                                ) : invoice.recurringSourceId ? (
                                    <div className="border-t border-border pt-3">
                                        <CreatedFromRecurringNotice
                                            source={recurringSource}
                                            stopping={stoppingRecurring}
                                            onStop={recurringSource?.isRecurring ? handleStopRecurring : undefined}
                                        />
                                    </div>
                                ) : null}
                                <SummaryRow
                                    label="Subtotal"
                                    value={formatCurrency(invoice.subtotal, invoice.currency)}
                                />
                                {Number(invoice.discount) > 0 && (
                                    <SummaryRow
                                        label={
                                            invoice.discountType === 'percent' && invoice.discountValue
                                                ? `Discount (${invoice.discountValue}%)`
                                                : 'Discount'
                                        }
                                        value={`−${formatCurrency(invoice.discount, invoice.currency)}`}
                                    />
                                )}
                                <SummaryRow
                                    label={`Tax (${invoice.taxRate}%)`}
                                    value={formatCurrency(invoice.tax, invoice.currency)}
                                />
                                <div className="pt-3 border-t border-border flex justify-between items-center">
                                    <dt className="text-base font-semibold text-foreground">Total</dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(invoice.total, invoice.currency)}
                                    </dd>
                                </div>
                                {(amountPaid > 0 || paid) && (
                                    <>
                                        <SummaryRow
                                            label="Amount paid"
                                            value={formatCurrency(amountPaid, invoice.currency)}
                                        />
                                        {!paid && (
                                            <SummaryRow
                                                label="Balance due"
                                                value={formatCurrency(balanceDue, invoice.currency)}
                                            />
                                        )}
                                    </>
                                )}
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
                                                    {formatCurrency(payment.amount, invoice.currency)}
                                                </p>
                                                <p className="text-xs text-foreground-muted mt-0.5">
                                                    {payment.date
                                                        ? format(new Date(payment.date), 'MMM dd, yyyy')
                                                        : '—'}
                                                    {' · '}
                                                    {getPaymentMethodLabel(payment.method)}
                                                </p>
                                                {payment.note ? (
                                                    <p className="text-xs text-foreground-muted mt-1">
                                                        {payment.note}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>

                    <div className="order-3">
                        <InvoiceActionsPanel {...actionPanelProps} />
                    </div>
                </div>

                <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-6">
                    <div className="min-w-0 space-y-6">
                        <article className="card !p-0 overflow-hidden">
                            <div className="flex items-start justify-between gap-10 px-6 py-5">
                                <InvoiceBillTo
                                    client={client}
                                    additionalInfo={invoice.clientAdditionalInfo}
                                    contactResolved={contactResolved}
                                    onEditClient={canEditClient ? handleEditClient : undefined}
                                />
                                <InvoiceMetaList invoice={invoice} paid={paid} />
                            </div>

                            {invoice.isRecurring ? (
                                <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-surface-muted/70 px-6 py-3">
                                    <p className="flex min-w-0 items-start gap-2 text-sm text-foreground">
                                        <Repeat size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                                        <span>{recurringScheduleCopy(invoice)}</span>
                                    </p>
                                    <button
                                        type="button"
                                        className="btn-secondary shrink-0 text-sm"
                                        onClick={handleStopRecurring}
                                        disabled={stoppingRecurring}
                                    >
                                        {stoppingRecurring ? 'Stopping…' : 'Stop repeating'}
                                    </button>
                                </div>
                            ) : invoice.recurringSourceId ? (
                                <CreatedFromRecurringNotice
                                    source={recurringSource}
                                    layout="strip"
                                    stopping={stoppingRecurring}
                                    onStop={recurringSource?.isRecurring ? handleStopRecurring : undefined}
                                />
                            ) : null}

                            <div className="border-t border-border/60">
                                <DocumentLineItemsTable
                                    items={invoice.items}
                                    currency={invoice.currency}
                                    embedded
                                />
                            </div>

                            <div className="flex justify-end border-t border-border/60 bg-surface-muted/40 px-6 py-5">
                                <dl className="w-full max-w-xs space-y-2.5">
                                    <InvoiceAmountRows
                                        invoice={invoice}
                                        paid={paid}
                                        amountPaid={amountPaid}
                                        balanceDue={balanceDue}
                                    />
                                </dl>
                            </div>
                        </article>

                        <DocumentNotesDisplay notes={invoice.notes} />
                    </div>

                    <div className="space-y-6 xl:sticky xl:top-20">
                        <InvoiceActionsPanel {...actionPanelProps} />
                        <PaymentHistoryCard paymentHistory={paymentHistory} currency={invoice.currency} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceDetails;
