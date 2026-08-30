import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import { format } from 'date-fns';
import { useQuotation } from '../context/QuotationContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { APP_CURRENCY, normalizeCurrency } from '../utils/currency';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import { useDocumentFormHandlers } from '../hooks/useDocumentFormHandlers';
import { canCreateInvoice, formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { focusFieldById, firstFieldError } from '../utils/formFieldValidation';
import {
    buildQuotationFieldErrors,
    buildQuotationDraftFieldErrors,
    getFirstQuotationFieldId,
    getQuotationFieldFocusOrder,
} from '../utils/quotationFormValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import { buildQuotationPayload, prepareQuotationPdf } from '../utils/sendQuotationFlow';
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
import { DocumentNotesSection, DocumentTermsSection } from '../components/documentForm/DocumentNotesSection';
import { DocumentFooterSection } from '../components/documentForm/DocumentFooterSection';
import { useDocumentFooterPrefill, resolveFormDocumentFooter } from '../hooks/useDocumentFooterPrefill';
import { useUnmountDraftAutosave } from '../hooks/useUnmountDraftAutosave';
import { buildDocumentPreviewFromForm } from '../utils/buildDocumentPreviewData';
import { hasDraftContent, hasAutoSaveDraftContent, resolvePersistClientId } from '../utils/documentFormHelpers';
import { DEFAULT_QUOTATION_TERMS } from '../utils/documentHelpers';
import { applyAiDraftToForm, DEFAULT_INVOICE_UNIT, isAiDraftsEnabled, normalizeInvoiceUnit } from '@waraqah/shared';
import { isPremiumUser } from '../utils/premium';
import AiDraftComposer from '../components/documentForm/AiDraftComposer';

const quotationDraftContentCheck = (data) =>
    String(data.terms || '').trim() && data.terms !== DEFAULT_QUOTATION_TERMS;

const CreateQuotation = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        addQuotation,
        updateQuotation,
        quotations,
        loading: quotationsLoading,
        refreshQuotations,
        sendQuotationEmailToClient,
    } = useQuotation();
    const { clients, products, addClient, updateClient, fetchProducts } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useQuotationCreateGuard();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
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
    const loadedQuotationIdRef = useRef(null);
    const [resolvedStatus, setResolvedStatus] = useState(id ? null : 'draft');
    const [quotationLoading, setQuotationLoading] = useState(Boolean(id));

    useLayoutEffect(() => {
        if (!id) {
            loadedQuotationIdRef.current = null;
            setResolvedStatus('draft');
            setQuotationLoading(false);
            return;
        }
        if (loadedQuotationIdRef.current !== id) {
            loadedQuotationIdRef.current = null;
            setResolvedStatus(null);
            setQuotationLoading(true);
        }
    }, [id]);

    const status = resolvedStatus ?? (id ? null : 'draft');
    const isDraftEdit = Boolean(id && status === 'draft');
    const isDraftFlow = status === 'draft';
    const quotationNotReady = Boolean(id && (quotationLoading || resolvedStatus == null));

    const [formData, setFormData] = useState({
        quotationNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientBusiness: '',
        clientPhone: '',
        clientAddress: '',
        clientAdditionalInfo: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hasValidUntil: true,
        validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{ description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT }],
        notes: '',
        documentFooter: '',
        terms: DEFAULT_QUOTATION_TERMS,
        status: 'draft',
        currency: APP_CURRENCY,
        taxRate: 0,
        discountType: 'percent',
        discountValue: '',
    });

    formDataRef.current = formData;

    useDocumentFooterPrefill({ id, businessInfo, mode: 'quotation', setFormData });

    const markDirty = useCallback(() => {
        isDirtyRef.current = true;
    }, []);

    const handleApplyAiDraft = useCallback((draft) => {
        setFormData((prev) => applyAiDraftToForm(prev, draft));
        markDirty();
        setFieldErrors({});
        showToast('Draft filled in. Review it before saving.', 'success');
    }, [markDirty, showToast]);

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

    const handleValidUntilToggle = handlers.createExpiryToggleHandler('hasValidUntil', 'validUntil');
    const handleIssueDateChange = handlers.createIssueDateChangeHandler();
    const handleValidUntilChange = handlers.createExpiryDateChangeHandler('validUntil');

    useEffect(() => {
        if (id) draftIdRef.current = id;
    }, [id]);

    useEffect(() => {
        fetchProducts({ force: true }).catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (!id) return undefined;
        if (loadedQuotationIdRef.current === id) return undefined;

        let cancelled = false;

        const applyQuotationToForm = (quotation) => {
            if (['converted', 'expired'].includes(quotation.status)) {
                setQuotationLoading(false);
                navigate(`/quotations/${id}`, { replace: true });
                return;
            }
            const client = quotation.clientId
                ? clients.find((c) => c.id === quotation.clientId)
                : null;
            loadedQuotationIdRef.current = id;
            setResolvedStatus(quotation.status || 'draft');
            setFormData({
                ...quotation,
                clientName: client?.name || '',
                clientEmail: client?.email || '',
                ...clientDetailsFromRecord(client),
                clientAdditionalInfo: quotation.clientAdditionalInfo || '',
                documentFooter: resolveFormDocumentFooter(
                    quotation.documentFooter,
                    businessInfo,
                    'quotation'
                ),
                hasValidUntil: Boolean(quotation.validUntil),
                terms: quotation.terms || DEFAULT_QUOTATION_TERMS,
                discountType: quotation.discountType || 'percent',
                discountValue: quotation.discountValue ?? '',
                currency: normalizeCurrency(quotation.currency || APP_CURRENCY),
                items: (quotation.items || []).map((item) => ({
                    ...item,
                    unit: normalizeInvoiceUnit(item.unit),
                })),
            });
            isDirtyRef.current = false;
            setQuotationLoading(false);
        };

        const loadQuotation = async () => {
            setQuotationLoading(true);
            let quotation = quotations.find((q) => q.id === id);

            if (!quotation) {
                if (quotationsLoading) return;
                try {
                    const data = await apiFetch(`/quotations/${id}`);
                    quotation = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) {
                        setQuotationLoading(false);
                        navigate('/quotations', { replace: true });
                    }
                    return;
                }
            } else if (!Array.isArray(quotation.items)) {
                try {
                    const data = await apiFetch(`/quotations/${id}`);
                    quotation = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) {
                        setQuotationLoading(false);
                        navigate('/quotations', { replace: true });
                    }
                    return;
                }
            }

            if (!cancelled) applyQuotationToForm(quotation);
        };

        loadQuotation();
        return () => {
            cancelled = true;
        };
    }, [id, quotations, clients, navigate, quotationsLoading]);

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
            if (!hasDraftContent(current, { extraCheck: quotationDraftContentCheck })) return null;

            const draftErrors = buildQuotationDraftFieldErrors(current);
            const order = getQuotationFieldFocusOrder(current.items.length, current);
            const firstInvalid = firstFieldError(draftErrors, order);
            if (firstInvalid) {
                if (!silent) {
                    setFieldErrors(draftErrors);
                    focusFieldById(getFirstQuotationFieldId(firstInvalid));
                }
                return null;
            }

            saveInFlightRef.current = true;
            if (!silent) setSaving(true);

            try {
                const clientId = await resolvePersistClientId(current, handlers, {
                    createIfMissing: false,
                });
                const payload = buildQuotationPayload({ ...current, clientId }, 'draft');
                const draftId = id || draftIdRef.current;
                let saved;

                if (draftId) {
                    saved = await updateQuotation(draftId, payload);
                } else {
                    saved = await addQuotation(payload);
                    draftIdRef.current = saved.id;
                    if (redirectAfterCreate) {
                        navigate(`/quotations/edit/${saved.id}`, { replace: true });
                    }
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
        [isDraftFlow, id, addQuotation, updateQuotation, navigate, showToast, handlers]
    );

    useUnmountDraftAutosave({
        persistDraft,
        isDraftFlow,
        isDirtyRef,
        formDataRef,
        extraCheck: quotationDraftContentCheck,
    });

    const handleSaveDraft = async () => {
        try {
            await persistDraft({ silent: false, redirectAfterCreate: true });
        } catch {
            /* toast shown in persistDraft */
        }
    };

    const handleSendQuotation = async () => {
        const errors = buildQuotationFieldErrors(formData);
        const order = getQuotationFieldFocusOrder(formData.items.length, formData);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstQuotationFieldId(firstInvalid));
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
            const payload = buildQuotationPayload({ ...formData, clientId }, 'sent');
            const draftId = id || draftIdRef.current;
            let saved;

            if (draftId) {
                saved = await updateQuotation(draftId, payload);
            } else {
                saved = await addQuotation(payload, { skipRefresh: true });
            }

            const nextStatus = saved.status || 'sent';
            setResolvedStatus(nextStatus);
            draftIdRef.current = saved.id;
            setFormData((prev) => ({
                ...prev,
                status: nextStatus,
                quotationNumber: saved.quotationNumber || prev.quotationNumber,
            }));
            const savedClient = clients.find((c) => c.id === saved.clientId);
            const client = {
                id: saved.clientId,
                name: formData.clientName.trim(),
                email: formData.clientEmail.trim(),
                ...(savedClient || {}),
            };
            const clientAlreadyEmailed = Boolean(saved.clientQuotationEmailedAt);

            sharePdfRef.current = null;
            setSharePdfReady(false);
            setShareModal({ quotation: saved, client, clientAlreadyEmailed });

            if (clientAlreadyEmailed && client?.email) {
                showToast(`Quotation emailed to ${client.email}`, 'success');
            }
        } catch (err) {
            if (err.code === 'INVOICE_LIMIT_REACHED') {
                setLimitModalOpen(true);
            } else {
                showToast(err.message || 'Failed to send quotation', 'error');
            }
            setShareModal(null);
            sharePdfRef.current = null;
        } finally {
            saveInFlightRef.current = false;
            setSending(false);
        }
    };

    useEffect(() => {
        if (!shareModal?.quotation) return undefined;

        const { quotation, client } = shareModal;
        let cancelled = false;

        (async () => {
            try {
                const generated = await prepareQuotationPdf(
                    quotation,
                    client,
                    businessInfo,
                    quotation.id
                );
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
    }, [shareModal?.quotation?.id, businessInfo, showToast]);

    const finishAfterShare = () => {
        setShareModal(null);
        sharePdfRef.current = null;
        setSharePdfReady(false);
        refreshQuotations().catch(() => {});
        navigate('/quotations');
    };

    const handleShareFromModal = async () => {
        if (!shareModal?.quotation || !sharePdfRef.current) return;

        try {
            const shareResult = await shareInvoicePdf(
                shareModal.quotation,
                shareModal.client,
                businessInfo,
                { mode: 'quotation', cached: sharePdfRef.current }
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
        if (!shareModal?.quotation?.id || shareModal.clientAlreadyEmailed) return;

        setEmailSending(true);
        try {
            const result = await sendQuotationEmailToClient(shareModal.quotation.id);
            showToast(`Quotation emailed to ${result.sentTo}`, 'success');
            finishAfterShare();
        } catch (err) {
            showToast(err.message || 'Failed to email quotation', 'error');
        } finally {
            setEmailSending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isDraftFlow) return;

        const errors = buildQuotationFieldErrors(formData);
        const order = getQuotationFieldFocusOrder(formData.items.length, formData);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstQuotationFieldId(firstInvalid));
            return;
        }
        setFieldErrors({});

        setSaving(true);
        try {
            const clientId = await handlers.resolveClientId(formData);
            const totals = getTotals();
            const quotationData = {
                ...formData,
                clientId,
                validUntil: formData.hasValidUntil ? formData.validUntil : null,
                status: formData.status === 'draft' ? 'sent' : formData.status,
                currency: normalizeCurrency(formData.currency || APP_CURRENCY),
                discountType: 'percent',
                discountValue: Number(formData.discountValue) || 0,
                subtotal: totals.subtotal,
                discount: totals.discount,
                tax: totals.tax,
                total: totals.total,
            };
            delete quotationData.clientName;
            delete quotationData.clientEmail;
            delete quotationData.hasValidUntil;

            await updateQuotation(id, quotationData);
            showToast('Quotation updated successfully', 'success');
            navigate(`/quotations/${id}`);
        } catch (err) {
            showToast(err.message || 'Failed to save quotation', 'error');
        } finally {
            setSaving(false);
        }
    };

    const sendReady = useMemo(
        () => Object.keys(buildQuotationFieldErrors(formData)).length === 0,
        [formData]
    );

    const previewData = useMemo(
        () => buildDocumentPreviewFromForm(formData, { type: 'quotation' }),
        [formData]
    );

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const backHref = id ? `/quotations/${id}` : '/quotations';
    const totals = getTotals();
    const discountLabel =
        Number(formData.discountValue) > 0
            ? `Discount (${formData.discountValue}%)`
            : 'Discount';

    const handleLeavePage = async () => {
        if (
            isDraftFlow &&
            isDirtyRef.current &&
            hasAutoSaveDraftContent(formDataRef.current, { extraCheck: quotationDraftContentCheck })
        ) {
            try {
                await persistDraft({ silent: true, redirectAfterCreate: false });
            } catch {
                /* best-effort */
            }
        }
        navigate(backHref);
    };

    const quotationNumberDisplay = isDraftFlow
        ? formData.quotationNumber || 'Assigned when sent'
        : formData.quotationNumber || (id ? '—' : 'Loading…');

    const pageTitle = isDraftEdit ? 'Complete quotation' : id ? 'Edit quotation' : 'Create quotation';

    if (quotationNotReady) {
        return <PageSpinner label="Loading quotation…" centered className="min-h-[40vh]" />;
    }

    const actionButtons = (variant = 'mobile') => (
        <DocumentActionButtons
            variant={variant}
            isDraftFlow={isDraftFlow}
            saving={saving}
            sending={sending}
            sendReady={sendReady}
            formId="quotation-form"
            sendIcon={ClipboardList}
            sendLabel="Create quotation"
            onSaveDraft={handleSaveDraft}
            onPreview={() => setPreviewOpen(true)}
            onSend={handleSendQuotation}
        />
    );

    return (
        <div className="max-w-6xl mx-auto pb-24 xl:pb-8">
            <DocumentFormModals
                limitModalOpen={limitModalOpen}
                onCloseLimitModal={() => setLimitModalOpen(false)}
                invoiceUsage={invoiceUsage}
                shareModal={shareModal}
                docLabel="quotation"
                shareDocKey="quotation"
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
                onSend={handleSendQuotation}
                sendLabel="Create quotation"
                sendReady={sendReady}
                sending={sending}
                invoice={previewData.invoice}
                client={previewData.client}
                businessInfo={businessInfo}
                mode="quotation"
            />

            <button
                type="button"
                onClick={handleLeavePage}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-brand mb-6 transition-colors"
            >
                <ArrowLeft size={16} aria-hidden />
                {id ? 'Back to quotation' : 'Back to quotations'}
            </button>

            <div className="mb-8">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">
                        {isDraftFlow
                            ? 'Save as draft to keep your progress, or send when you are ready'
                            : 'Update details before sharing with your client'}
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

            <form id="quotation-form" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        {isAiDraftsEnabled() && isDraftFlow ? (
                            <AiDraftComposer
                                documentType="quotation"
                                premium={premium}
                                disabled={saving || sending}
                                onApply={handleApplyAiDraft}
                            />
                        ) : null}
                        <DocumentDetailsSection
                            icon={ClipboardList}
                            title="Quotation details"
                            description="Number, dates, tax, and discount"
                            idPrefix="quotation"
                            numberLabel="Quotation number"
                            numberDisplay={quotationNumberDisplay}
                            formData={formData}
                            fieldErrors={fieldErrors}
                            onChange={handlers.handleChange}
                            onIssueDateChange={handleIssueDateChange}
                            expiry={{
                                label: 'Valid until',
                                hasFieldKey: 'hasValidUntil',
                                dateFieldKey: 'validUntil',
                                emptyHint: 'No expiry date will appear on this quotation.',
                                onToggle: handleValidUntilToggle,
                                onDateChange: handleValidUntilChange,
                            }}
                        />

                        <DocumentClientSection
                            idPrefix="quotation"
                            docLabel="quotation"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            clients={clients}
                            onNameChange={handlers.handleClientNameChange}
                            onEmailChange={handlers.handleClientEmailChange}
                            onSelectClient={handlers.handleSelectClient}
                            onOpenDetailsModal={() => setClientDetailsModalOpen(true)}
                        />

                        <DocumentLineItemsSection
                            idPrefix="quotation"
                            docLabel="quotation"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            setFieldErrors={setFieldErrors}
                            products={products}
                            businessInfo={businessInfo}
                            onItemChange={handlers.handleItemChange}
                            onUnitChange={handlers.handleUnitChange}
                            onCurrencyChange={handlers.handleCurrencyChange}
                            onAddItem={handlers.addItem}
                            onRemoveItem={handlers.removeItem}
                            onApplyProductToLine={handlers.applyProductToLine}
                        />

                        <DocumentTermsSection formData={formData} onChange={handlers.handleChange} />

                        <DocumentNotesSection
                            description="Extra info for the client"
                            placeholder="Optional note…"
                            formData={formData}
                            onChange={handlers.handleChange}
                        />

                        <DocumentFooterSection
                            businessInfo={businessInfo}
                            mode="quotation"
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
                            totalLabel="Estimated total"
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

            <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] z-30 xl:hidden border-t border-border bg-surface/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:transition-[left] duration-200 ease-smooth motion-reduce:transition-none">
                <div className="max-w-6xl mx-auto w-full">{actionButtons()}</div>
            </div>
        </div>
    );
};

export default CreateQuotation;
