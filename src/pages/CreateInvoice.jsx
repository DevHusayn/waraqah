import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import { format } from 'date-fns';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { APP_CURRENCY, normalizeCurrency } from '../utils/currency';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { useDocumentFormHandlers } from '../hooks/useDocumentFormHandlers';
import { canCreateInvoice, formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { focusFieldById, firstFieldError } from '../utils/formFieldValidation';
import {
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    getFirstInvoiceFieldId,
    getInvoiceFieldFocusOrder,
} from '../utils/invoiceFormValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import { buildInvoicePayload, prepareInvoicePdf } from '../utils/sendInvoiceFlow';
import { notifyStockWarnings } from '../utils/stockWarnings';
import { clientDetailsFromRecord } from '../utils/ensureInvoiceClient';
import ClientDetailsModal from '../components/ClientDetailsModal';
import { shareInvoicePdf, getShareFallbackHint } from '../utils/shareInvoicePdf';
import DocumentFormModals from '../components/documentForm/DocumentFormModals';
import DocumentDetailsSection from '../components/documentForm/DocumentDetailsSection';
import DocumentClientSection from '../components/documentForm/DocumentClientSection';
import DocumentLineItemsSection from '../components/documentForm/DocumentLineItemsSection';
import DocumentSummaryCard from '../components/documentForm/DocumentSummaryCard';
import DocumentActionButtons from '../components/documentForm/DocumentActionButtons';
import DocumentPreviewOverlay from '../components/documentForm/DocumentPreviewOverlay';
import { DocumentNotesSection } from '../components/documentForm/DocumentNotesSection';
import { buildDocumentPreviewFromForm } from '../utils/buildDocumentPreviewData';
import { hasDraftContent, hasAutoSaveDraftContent, resolvePersistClientId } from '../utils/documentFormHelpers';
import { DEFAULT_INVOICE_UNIT, normalizeInvoiceUnit } from '@waraqah/shared';

const CreateInvoice = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        clients,
        products,
        addClient,
        updateClient,
        addInvoice,
        updateInvoice,
        invoices,
        draftInvoices,
        loading: invoicesLoading,
        refreshInvoices,
        fetchProducts,
        sendInvoiceEmailToClient,
    } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useInvoiceCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [sharePdfReady, setSharePdfReady] = useState(false);
    const [shareModal, setShareModal] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [customUnitModal, setCustomUnitModal] = useState(null);
    const [clientDetailsModalOpen, setClientDetailsModalOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const draftIdRef = useRef(null);
    const saveInFlightRef = useRef(false);
    const isDirtyRef = useRef(false);
    const formDataRef = useRef(null);
    const sharePdfRef = useRef(null);
    const loadedInvoiceIdRef = useRef(null);
    const [resolvedStatus, setResolvedStatus] = useState(id ? null : 'draft');
    const [invoiceLoading, setInvoiceLoading] = useState(Boolean(id));

    useLayoutEffect(() => {
        if (!id) {
            loadedInvoiceIdRef.current = null;
            setResolvedStatus('draft');
            setInvoiceLoading(false);
            return;
        }
        if (loadedInvoiceIdRef.current !== id) {
            loadedInvoiceIdRef.current = null;
            setResolvedStatus(null);
            setInvoiceLoading(true);
        }
    }, [id]);

    const status = resolvedStatus ?? (id ? null : 'draft');
    const isDraftEdit = Boolean(id && status === 'draft');
    const isDraftFlow = status === 'draft';
    const invoiceNotReady = Boolean(id && (invoiceLoading || resolvedStatus == null));

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientBusiness: '',
        clientPhone: '',
        clientAddress: '',
        clientAdditionalInfo: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hasDueDate: true,
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{ description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT }],
        notes: '',
        status: 'draft',
        currency: APP_CURRENCY,
        taxRate: 0,
        discountType: 'percent',
        discountValue: '',
    });

    formDataRef.current = formData;

    const markDirty = useCallback(() => {
        isDirtyRef.current = true;
    }, []);

    const handlers = useDocumentFormHandlers({
        formData,
        setFormData,
        setFieldErrors,
        clients,
        products,
        addClient,
        updateClient,
        setCustomUnitModal,
        customUnitModal,
        markDirty,
    });

    const handleDueDateToggle = handlers.createExpiryToggleHandler('hasDueDate', 'dueDate');
    const handleIssueDateChange = handlers.createIssueDateChangeHandler();
    const handleDueDateChange = handlers.createExpiryDateChangeHandler('dueDate');

    useEffect(() => {
        if (id) draftIdRef.current = id;
    }, [id]);

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (!id) return undefined;
        if (loadedInvoiceIdRef.current === id) return undefined;

        let cancelled = false;

        const applyInvoiceToForm = (invoice) => {
            if (
                invoice.status === 'paid' ||
                invoice.status === 'cancelled' ||
                Number(invoice.amountPaid) > 0
            ) {
                setInvoiceLoading(false);
                navigate(`/invoices/${id}`, { replace: true });
                return;
            }
            const client = invoice.clientId
                ? clients.find((c) => c.id === invoice.clientId)
                : null;
            loadedInvoiceIdRef.current = id;
            setResolvedStatus(invoice.status || 'draft');
            setFormData({
                ...invoice,
                clientName: client?.name || '',
                clientEmail: client?.email || '',
                ...clientDetailsFromRecord(client),
                clientAdditionalInfo: invoice.clientAdditionalInfo || '',
                hasDueDate: Boolean(invoice.dueDate),
                discountType: invoice.discountType || 'percent',
                discountValue: invoice.discountValue ?? '',
                currency: normalizeCurrency(invoice.currency || APP_CURRENCY),
                items: (invoice.items || []).map((item) => ({
                    ...item,
                    unit: normalizeInvoiceUnit(item.unit),
                })),
            });
            isDirtyRef.current = false;
            setInvoiceLoading(false);
        };

        const loadInvoice = async () => {
            setInvoiceLoading(true);
            let invoice =
                invoices.find((inv) => inv.id === id) ||
                draftInvoices.find((inv) => inv.id === id) ||
                null;

            if (!invoice) {
                if (invoicesLoading) return;
                try {
                    const data = await apiFetch(`/invoices/${id}`);
                    invoice = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) {
                        setInvoiceLoading(false);
                        navigate('/drafts', { replace: true });
                    }
                    return;
                }
            } else if (!Array.isArray(invoice.items)) {
                try {
                    const data = await apiFetch(`/invoices/${id}`);
                    invoice = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) {
                        setInvoiceLoading(false);
                        navigate('/drafts', { replace: true });
                    }
                    return;
                }
            }

            if (!cancelled) applyInvoiceToForm(invoice);
        };

        loadInvoice();
        return () => {
            cancelled = true;
        };
    }, [id, invoices, draftInvoices, clients, navigate, invoicesLoading]);

    const getTotals = () =>
        calculateInvoiceTotals(formData.items, {
            taxRate: formData.taxRate,
            discountType: 'percent',
            discountValue: formData.discountValue || 0,
        });

    useEffect(() => {
        const clientId = searchParams.get('clientId');
        if (!clientId || clients.length === 0) return;
        const client = clients.find((c) => c.id === clientId);
        if (!client) return;
        setFormData((prev) => ({
            ...prev,
            clientId,
            clientName: client.name || '',
            clientEmail: client.email || '',
            ...clientDetailsFromRecord(client),
            clientAdditionalInfo: '',
        }));
        const next = new URLSearchParams(searchParams);
        next.delete('clientId');
        setSearchParams(next, { replace: true });
    }, [clients, searchParams, setSearchParams]);

    const persistDraft = useCallback(
        async ({ silent = true, redirectAfterCreate = true } = {}) => {
            if (!isDraftFlow) return null;
            if (saveInFlightRef.current) return null;

            const current = formDataRef.current;
            if (!hasDraftContent(current)) return null;

            const draftErrors = buildDraftFieldErrors(current);
            const order = getInvoiceFieldFocusOrder(current.items.length, current);
            const firstInvalid = firstFieldError(draftErrors, order);
            if (firstInvalid) {
                if (!silent) {
                    setFieldErrors(draftErrors);
                    focusFieldById(getFirstInvoiceFieldId(firstInvalid));
                }
                return null;
            }

            saveInFlightRef.current = true;
            if (!silent) setSaving(true);

            try {
                const clientId = await resolvePersistClientId(current, handlers, {
                    createIfMissing: false,
                });
                const payload = buildInvoicePayload({ ...current, clientId }, 'draft');
                const draftId = id || draftIdRef.current;
                let saved;

                if (draftId) {
                    saved = await updateInvoice(draftId, payload);
                } else {
                    saved = await addInvoice(payload);
                    draftIdRef.current = saved.id;
                    if (redirectAfterCreate) navigate('/drafts');
                }

                isDirtyRef.current = false;
                if (!silent) showToast('Draft saved', 'success');
                return saved;
            } catch (err) {
                if (!silent) showToast(err.message || 'Failed to save draft', 'error');
                throw err;
            } finally {
                saveInFlightRef.current = false;
                if (!silent) setSaving(false);
            }
        },
        [isDraftFlow, id, addInvoice, updateInvoice, navigate, showToast, handlers]
    );

    useEffect(() => {
        return () => {
            if (!isDraftFlow) return;
            if (!isDirtyRef.current) return;
            if (!hasAutoSaveDraftContent(formDataRef.current)) return;
            persistDraft({ silent: true, redirectAfterCreate: false });
        };
    }, [isDraftFlow, persistDraft]);

    const handleSaveDraft = async () => {
        try {
            await persistDraft({ silent: false, redirectAfterCreate: true });
        } catch {
            /* toast shown in persistDraft */
        }
    };

    const handleSendInvoice = async () => {
        const errors = buildInvoiceFieldErrors(formData);
        const order = getInvoiceFieldFocusOrder(formData.items.length, formData);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstInvoiceFieldId(firstInvalid));
            return;
        }
        setFieldErrors({});

        if (!canCreateInvoice(invoiceUsage)) {
            setLimitModalOpen(true);
            return;
        }

        if (saveInFlightRef.current) return;

        setPreviewOpen(false);
        saveInFlightRef.current = true;
        isDirtyRef.current = false;
        setSending(true);
        try {
            const clientId = await handlers.resolveClientId(formData);
            const payload = buildInvoicePayload({ ...formData, clientId }, 'pending');
            const draftId = id || draftIdRef.current;
            let saved;

            if (draftId) {
                saved = await updateInvoice(draftId, payload);
            } else {
                saved = await addInvoice(payload, { skipRefresh: true });
            }

            notifyStockWarnings(showToast, saved);
            if (saved?.stockWarnings?.length) {
                fetchProducts({ force: true }).catch(() => {});
            }

            const nextStatus = saved.status || 'pending';
            setResolvedStatus(nextStatus);
            draftIdRef.current = saved.id;
            setFormData((prev) => ({
                ...prev,
                status: nextStatus,
                invoiceNumber: saved.invoiceNumber || prev.invoiceNumber,
            }));
            const savedClient = clients.find((c) => c.id === saved.clientId);
            const client = {
                id: saved.clientId,
                name: formData.clientName.trim(),
                email: formData.clientEmail.trim(),
                ...(savedClient || {}),
            };
            const clientAlreadyEmailed = Boolean(saved.clientInvoiceEmailedAt);

            sharePdfRef.current = null;
            setSharePdfReady(false);
            setShareModal({ invoice: saved, client, clientAlreadyEmailed });

            if (clientAlreadyEmailed && client?.email) {
                showToast(`Invoice emailed to ${client.email}`, 'success');
            }
        } catch (err) {
            if (err.code === 'INVOICE_LIMIT_REACHED') {
                setLimitModalOpen(true);
            } else {
                showToast(err.message || 'Failed to send invoice', 'error');
            }
            setShareModal(null);
            sharePdfRef.current = null;
        } finally {
            saveInFlightRef.current = false;
            setSending(false);
        }
    };

    useEffect(() => {
        if (!shareModal?.invoice) return undefined;

        const { invoice, client } = shareModal;
        let cancelled = false;

        (async () => {
            try {
                const generated = await prepareInvoicePdf(invoice, client, businessInfo, invoice.id);
                if (cancelled) return;
                sharePdfRef.current = generated;
                setSharePdfReady(true);
            } catch (err) {
                if (!cancelled) showToast(err.message || 'Failed to prepare PDF', 'error');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [shareModal?.invoice?.id, businessInfo, showToast]);

    const finishAfterShare = () => {
        setShareModal(null);
        sharePdfRef.current = null;
        setSharePdfReady(false);
        refreshInvoices().catch(() => {});
        navigate('/invoices');
    };

    const handleShareFromModal = async () => {
        if (!shareModal?.invoice || !sharePdfRef.current) return;

        try {
            const shareResult = await shareInvoicePdf(
                shareModal.invoice,
                shareModal.client,
                businessInfo,
                { mode: 'invoice', cached: sharePdfRef.current }
            );
            if (shareResult?.method !== 'share') {
                const hint = getShareFallbackHint();
                if (hint) showToast(hint, 'info');
            }
            finishAfterShare();
        } catch (shareErr) {
            if (shareErr?.name === 'AbortError') return;
            showToast(shareErr.message || 'Could not share PDF', 'error');
        }
    };

    const handleEmailFromModal = async () => {
        if (!shareModal?.invoice?.id || shareModal.clientAlreadyEmailed) return;

        setEmailSending(true);
        try {
            const result = await sendInvoiceEmailToClient(shareModal.invoice.id);
            showToast(`Invoice emailed to ${result.sentTo}`, 'success');
            finishAfterShare();
        } catch (err) {
            showToast(err.message || 'Failed to email invoice', 'error');
        } finally {
            setEmailSending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isDraftFlow) return;

        const errors = buildInvoiceFieldErrors(formData);
        const order = getInvoiceFieldFocusOrder(formData.items.length, formData);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstInvoiceFieldId(firstInvalid));
            return;
        }
        setFieldErrors({});

        const totals = getTotals();
        setSaving(true);
        try {
            const clientId = await handlers.resolveClientId(formData);
            const invoiceData = {
                ...formData,
                clientId,
                dueDate: formData.hasDueDate ? formData.dueDate : null,
                status: formData.status,
                currency: normalizeCurrency(formData.currency || APP_CURRENCY),
                discountType: 'percent',
                discountValue: Number(formData.discountValue) || 0,
                subtotal: totals.subtotal,
                discount: totals.discount,
                tax: totals.tax,
                total: totals.total,
                balance: totals.total,
            };
            delete invoiceData.clientName;
            delete invoiceData.clientEmail;
            delete invoiceData.hasDueDate;

            const saved = await updateInvoice(id, invoiceData);
            notifyStockWarnings(showToast, saved);
            if (saved?.stockWarnings?.length) {
                fetchProducts({ force: true }).catch(() => {});
            }
            showToast('Invoice updated successfully', 'success');
            navigate(`/invoices/${id}`);
        } catch (err) {
            showToast(err.message || 'Failed to save invoice', 'error');
        } finally {
            setSaving(false);
        }
    };

    const sendReady = useMemo(
        () => Object.keys(buildInvoiceFieldErrors(formData)).length === 0,
        [formData]
    );

    const previewData = useMemo(
        () => buildDocumentPreviewFromForm(formData, { type: 'invoice' }),
        [formData]
    );

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const backHref = isDraftEdit ? '/drafts' : id ? `/invoices/${id}` : '/invoices';
    const totals = getTotals();
    const discountLabel =
        Number(formData.discountValue) > 0
            ? `Discount (${formData.discountValue}%)`
            : 'Discount';

    const handleLeavePage = async () => {
        if (isDraftFlow && isDirtyRef.current && hasAutoSaveDraftContent(formDataRef.current)) {
            try {
                await persistDraft({ silent: true, redirectAfterCreate: false });
            } catch {
                /* best-effort save when leaving */
            }
        }
        navigate(backHref);
    };

    const invoiceNumberDisplay = isDraftFlow
        ? formData.invoiceNumber || 'Assigned when sent'
        : formData.invoiceNumber || (id ? '—' : 'Loading…');

    const pageTitle = isDraftEdit ? 'Complete invoice' : id ? 'Edit invoice' : 'Create invoice';

    if (invoiceNotReady) {
        return <PageSpinner label="Loading invoice…" centered className="min-h-[40vh]" />;
    }

    const actionButtons = (variant = 'mobile') => (
        <DocumentActionButtons
            variant={variant}
            isDraftFlow={isDraftFlow}
            saving={saving}
            sending={sending}
            sendReady={sendReady}
            formId="invoice-form"
            sendIcon={FileText}
            sendLabel="Create invoice"
            onSaveDraft={handleSaveDraft}
            onPreview={() => setPreviewOpen(true)}
            onSend={handleSendInvoice}
        />
    );

    return (
        <div className="max-w-6xl mx-auto pb-24 xl:pb-8">
            <DocumentFormModals
                limitModalOpen={limitModalOpen}
                onCloseLimitModal={() => setLimitModalOpen(false)}
                invoiceUsage={invoiceUsage}
                shareModal={shareModal}
                docLabel="invoice"
                shareDocKey="invoice"
                sharePdfReady={sharePdfReady}
                emailSending={emailSending}
                onShare={handleShareFromModal}
                onEmailClient={handleEmailFromModal}
                onSkipShare={finishAfterShare}
                customUnitModalOpen={customUnitModal != null}
                onCloseCustomUnitModal={() => setCustomUnitModal(null)}
                onCustomUnitSave={handlers.handleCustomUnitSave}
            />

            <DocumentPreviewOverlay
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onSend={handleSendInvoice}
                sendLabel="Create invoice"
                sendReady={sendReady}
                sending={sending}
                invoice={previewData.invoice}
                client={previewData.client}
                businessInfo={businessInfo}
                mode="invoice"
            />

            <button
                type="button"
                onClick={handleLeavePage}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
            >
                <ArrowLeft size={16} aria-hidden />
                {isDraftEdit ? 'Back to drafts' : id ? 'Back to invoice' : 'Back to invoices'}
            </button>

            <div className="mb-8">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">
                        {isDraftFlow
                            ? 'Save as draft to keep your progress, or send when you are ready'
                            : id
                              ? 'Update details before sending to your client'
                              : 'Fill in the details below'}
                    </p>
                </div>
                {isDraftFlow && usageLabel ? (
                    <InvoiceUsageBanner
                        className="mt-3 inline-block"
                        label={
                            invoiceUsage.remaining > 0
                                ? `${usageLabel} — ${invoiceUsage.remaining} remaining this month`
                                : usageLabel
                        }
                    />
                ) : null}
            </div>

            <form id="invoice-form" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <DocumentDetailsSection
                            icon={FileText}
                            title="Invoice details"
                            description="Number, dates, tax, and discount"
                            idPrefix="invoice"
                            numberLabel="Invoice number"
                            numberDisplay={invoiceNumberDisplay}
                            formData={formData}
                            fieldErrors={fieldErrors}
                            onChange={handlers.handleChange}
                            onIssueDateChange={handleIssueDateChange}
                            expiry={{
                                label: 'Due date',
                                hasFieldKey: 'hasDueDate',
                                dateFieldKey: 'dueDate',
                                emptyHint: 'No payment deadline will appear on this invoice.',
                                onToggle: handleDueDateToggle,
                                onDateChange: handleDueDateChange,
                            }}
                        />

                        <DocumentClientSection
                            idPrefix="invoice"
                            docLabel="invoice"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            clients={clients}
                            onNameChange={handlers.handleClientNameChange}
                            onEmailChange={handlers.handleClientEmailChange}
                            onSelectClient={handlers.handleSelectClient}
                            onOpenDetailsModal={() => setClientDetailsModalOpen(true)}
                        />

                        <DocumentLineItemsSection
                            idPrefix="invoice"
                            docLabel="invoice"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                            products={products}
                            onItemChange={handlers.handleItemChange}
                            onUnitChange={handlers.handleUnitChange}
                            onCurrencyChange={handlers.handleCurrencyChange}
                            onAddItem={handlers.addItem}
                            onRemoveItem={handlers.removeItem}
                            onAddProductItem={handlers.addProductItem}
                        />

                        <DocumentNotesSection
                            description="Payment terms or extra info"
                            placeholder="Thank-you message…"
                            formData={formData}
                            onChange={handlers.handleChange}
                        />
                    </div>

                    <div className="xl:col-span-1 space-y-4 xl:sticky xl:top-24">
                        <DocumentSummaryCard
                            formData={formData}
                            selectedClient={selectedClient}
                            totals={totals}
                            discountLabel={discountLabel}
                            totalLabel="Total"
                        />

                        <div className="hidden xl:block card p-4">{actionButtons('desktop')}</div>
                    </div>
                </div>
            </form>

            <ClientDetailsModal
                open={clientDetailsModalOpen}
                onClose={() => setClientDetailsModalOpen(false)}
                initialData={{
                    business: formData.clientBusiness,
                    phone: formData.clientPhone,
                    address: formData.clientAddress,
                    additionalInfo: formData.clientAdditionalInfo,
                }}
                onSave={handlers.handleSaveClientDetails}
            />

            <div className="fixed bottom-0 left-0 right-0 md:left-[15.5rem] z-30 xl:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="max-w-6xl mx-auto w-full">{actionButtons()}</div>
            </div>
        </div>
    );
};

export default CreateInvoice;
