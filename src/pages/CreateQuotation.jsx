import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Save,
    ArrowLeft,
    ClipboardList,
    PenLine,
    Users,
    List,
    StickyNote,
    X,
    Package,
    ScrollText,
} from 'lucide-react';
import Spinner from '../components/Spinner';
import { format } from 'date-fns';
import { useQuotation } from '../context/QuotationContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import {
    APP_CURRENCY,
    formatCurrency,
    getCurrencySelectOptions,
    normalizeCurrency,
} from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import FormSection from '../components/FormSection';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import { canCreateInvoice, formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import FieldValidationMessage from '../components/FieldValidationMessage';
import RequiredLabel from '../components/RequiredLabel';
import {
    inputClass,
    focusFieldById,
    clearFieldError,
    firstFieldError,
} from '../utils/formFieldValidation';
import {
    buildQuotationFieldErrors,
    buildQuotationDraftFieldErrors,
    getFirstQuotationFieldId,
    getQuotationFieldFocusOrder,
} from '../utils/quotationFormValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import { buildQuotationPayload, prepareQuotationPdf } from '../utils/sendQuotationFlow';
import { ensureInvoiceClient } from '../utils/ensureInvoiceClient';
import { shareInvoicePdf, getShareFallbackHint } from '../utils/shareInvoicePdf';
import ShareDocumentModal from '../components/ShareDocumentModal';
import { getDisplayNumber } from '../utils/receiptHelpers';
import { DEFAULT_QUOTATION_TERMS } from '../utils/documentHelpers';
import CustomSelect from '../components/CustomSelect';
import DatePickerField from '../components/DatePickerField';
import CustomUnitModal from '../components/CustomUnitModal';
import {
    CUSTOM_UNIT_OPTION,
    DEFAULT_INVOICE_UNIT,
    buildUnitSelectOptions,
    normalizeInvoiceUnit,
} from '@waraqah/shared';

function hasDraftContent(data) {
    if (String(data.clientName || '').trim()) return true;
    if (data.clientId) return true;
    if (String(data.notes || '').trim()) return true;
    if (String(data.terms || '').trim() && data.terms !== DEFAULT_QUOTATION_TERMS) return true;
    if (Number(data.discountValue) > 0) return true;
    return (data.items || []).some((item) => String(item.description || '').trim());
}

const CreateQuotation = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addQuotation, updateQuotation, quotations, loading: quotationsLoading, refreshQuotations, sendQuotationEmailToClient } =
        useQuotation();
    const { clients, products, addClient, updateClient, fetchProducts } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useQuotationCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [sharePdfReady, setSharePdfReady] = useState(false);
    const [shareModal, setShareModal] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [customUnitModal, setCustomUnitModal] = useState(null);

    const draftIdRef = useRef(null);
    const saveInFlightRef = useRef(false);
    const isDirtyRef = useRef(false);
    const formDataRef = useRef(null);
    const sharePdfRef = useRef(null);
    const [resolvedStatus, setResolvedStatus] = useState(id ? null : 'draft');

    const existingQuotation = id ? quotations.find((q) => q.id === id) : null;
    const status = resolvedStatus || existingQuotation?.status || (!id ? 'draft' : null);
    const isDraftEdit = Boolean(id && status === 'draft');
    const isDraftFlow = !id || status === 'draft';

    const [formData, setFormData] = useState({
        quotationNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hasValidUntil: true,
        validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{ description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT }],
        notes: '',
        terms: DEFAULT_QUOTATION_TERMS,
        status: 'draft',
        currency: APP_CURRENCY,
        taxRate: 0,
        discountType: 'percent',
        discountValue: '',
    });

    formDataRef.current = formData;

    const markDirty = () => {
        isDirtyRef.current = true;
    };

    useEffect(() => {
        if (id) draftIdRef.current = id;
    }, [id]);

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (!id) return undefined;

        let cancelled = false;

        const applyQuotationToForm = (quotation) => {
            if (['converted', 'expired'].includes(quotation.status)) {
                navigate(`/quotations/${id}`, { replace: true });
                return;
            }
            const client = quotation.clientId
                ? clients.find((c) => c.id === quotation.clientId)
                : null;
            setResolvedStatus(quotation.status || 'draft');
            setFormData({
                ...quotation,
                clientName: client?.name || '',
                clientEmail: client?.email || '',
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
        };

        const loadQuotation = async () => {
            let quotation = quotations.find((q) => q.id === id);

            if (!quotation) {
                if (quotationsLoading) return;
                try {
                    const data = await apiFetch(`/quotations/${id}`);
                    quotation = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) navigate('/quotations', { replace: true });
                    return;
                }
            } else if (!Array.isArray(quotation.items)) {
                try {
                    const data = await apiFetch(`/quotations/${id}`);
                    quotation = { ...data, id: data._id || data.id };
                } catch {
                    if (!cancelled) navigate('/quotations', { replace: true });
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
        }));
        const next = new URLSearchParams(searchParams);
        next.delete('clientId');
        setSearchParams(next, { replace: true });
    }, [clients, searchParams, setSearchParams]);

    const resolveClientId = useCallback(
        async (data) => ensureInvoiceClient(data, clients, { addClient, updateClient }),
        [clients, addClient, updateClient]
    );

    const handleClientNameChange = (e) => {
        markDirty();
        const { value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, clientName: value };
            if (prev.clientId) {
                const linked = clients.find((c) => c.id === prev.clientId);
                if (linked && linked.name !== value) next.clientId = '';
            }
            return next;
        });
        clearFieldError(setFieldErrors, 'clientName');
        clearFieldError(setFieldErrors, 'clientId');
    };

    const handleClientEmailChange = (e) => {
        markDirty();
        setFormData((prev) => ({ ...prev, clientEmail: e.target.value }));
        clearFieldError(setFieldErrors, 'clientEmail');
    };

    const handleSelectSavedClient = (clientId) => {
        if (!clientId) return;
        const client = clients.find((c) => c.id === clientId);
        if (!client) return;
        markDirty();
        setFormData((prev) => ({
            ...prev,
            clientId,
            clientName: client.name || '',
            clientEmail: client.email || '',
        }));
        clearFieldError(setFieldErrors, 'clientName');
        clearFieldError(setFieldErrors, 'clientId');
        clearFieldError(setFieldErrors, 'clientEmail');
    };

    const handleChange = (e) => {
        markDirty();
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

    const handleItemChange = (index, field, value) => {
        markDirty();
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
        clearFieldError(setFieldErrors, `item-${index}-${field}`);
    };

    const handleUnitChange = (index, value) => {
        if (value === CUSTOM_UNIT_OPTION) {
            setCustomUnitModal({ index });
            return;
        }
        handleItemChange(index, 'unit', value);
    };

    const handleCurrencyChange = (currency) => {
        markDirty();
        setFormData((prev) => ({
            ...prev,
            currency: normalizeCurrency(currency),
        }));
    };

    const handleCustomUnitSave = (unitName) => {
        if (customUnitModal == null) return;
        handleItemChange(customUnitModal.index, 'unit', unitName.trim());
        setCustomUnitModal(null);
    };

    const addItem = () => {
        markDirty();
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                { description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT },
            ],
        });
    };

    const isEmptyItem = (item) => !String(item.description || '').trim();

    const addProductItem = (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        markDirty();
        const description = product.description
            ? `${product.name} — ${product.description}`
            : product.name;
        const newLine = {
            description,
            quantity: 1,
            rate: product.unitPrice || 0,
            unit: DEFAULT_INVOICE_UNIT,
        };
        const emptyIndex = formData.items.findIndex(isEmptyItem);

        setFormData((prev) => {
            const targetIndex = prev.items.findIndex(isEmptyItem);
            if (targetIndex === -1) return { ...prev, items: [...prev.items, newLine] };
            const items = [...prev.items];
            items[targetIndex] = newLine;
            return { ...prev, items };
        });

        if (emptyIndex !== -1) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[`item-${emptyIndex}-description`];
                delete next[`item-${emptyIndex}-quantity`];
                delete next[`item-${emptyIndex}-rate`];
                return next;
            });
        }
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            markDirty();
            setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
        }
    };

    const persistDraft = useCallback(
        async ({ silent = true, redirectAfterCreate = true } = {}) => {
            if (!isDraftFlow) return null;

            const current = formDataRef.current;
            if (!hasDraftContent(current)) return null;

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

            if (saveInFlightRef.current) return null;
            saveInFlightRef.current = true;
            if (!silent) setSaving(true);

            try {
                const clientId = String(current.clientName || '').trim()
                    ? await resolveClientId(current)
                    : current.clientId || null;
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
        [isDraftFlow, id, addQuotation, updateQuotation, navigate, showToast, resolveClientId]
    );

    useEffect(() => {
        return () => {
            if (!isDraftFlow) return;
            if (!isDirtyRef.current) return;
            if (!hasDraftContent(formDataRef.current)) return;
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

        setSending(true);
        try {
            const clientId = await resolveClientId(formData);
            const payload = buildQuotationPayload({ ...formData, clientId }, 'sent');
            const draftId = id || draftIdRef.current;
            let saved;

            if (draftId) {
                saved = await updateQuotation(draftId, payload);
            } else {
                saved = await addQuotation(payload, { skipRefresh: true });
            }

            isDirtyRef.current = false;
            setResolvedStatus(saved.status || 'sent');
            draftIdRef.current = saved.id;
            const savedClient = clients.find((c) => c.id === saved.clientId);
            const client = {
                id: saved.clientId,
                name: formData.clientName.trim(),
                email: formData.clientEmail.trim(),
                ...(savedClient || {}),
            };
            const clientAlreadyEmailed = Boolean(saved.clientQuotationEmailedAt);

            setSending(false);
            sharePdfRef.current = null;
            setSharePdfReady(false);
            setShareModal({
                quotation: saved,
                client,
                clientAlreadyEmailed,
            });

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
                if (!cancelled) {
                    showToast(err.message || 'Failed to prepare PDF', 'error');
                }
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

    const handleSkipShare = () => {
        finishAfterShare();
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
            const clientId = await resolveClientId(formData);
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

    const handleValidUntilToggle = () => {
        markDirty();
        setFormData((prev) => ({ ...prev, hasValidUntil: !prev.hasValidUntil }));
        clearFieldError(setFieldErrors, 'validUntil');
    };

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const backHref = id ? `/quotations/${id}` : '/quotations';
    const totals = getTotals();
    const discountLabel =
        Number(formData.discountValue) > 0
            ? `Discount (${formData.discountValue}%)`
            : 'Discount';

    const handleLeavePage = async () => {
        if (isDraftFlow && isDirtyRef.current && hasDraftContent(formDataRef.current)) {
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

    const actionButtons = (variant = 'mobile') => {
        const actionBtn = 'w-full text-sm py-2.5 px-4 gap-2 whitespace-nowrap min-h-[44px]';
        const layoutClass =
            variant === 'desktop'
                ? 'flex flex-col gap-2 w-full'
                : 'grid grid-cols-2 gap-2 sm:gap-3 w-full';

        if (isDraftFlow) {
            return (
                <div className={layoutClass}>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className={`btn-secondary ${actionBtn} disabled:opacity-60`}
                        disabled={saving || sending}
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" inline />
                                Saving…
                            </>
                        ) : (
                            <>
                                <PenLine size={16} className="shrink-0" aria-hidden />
                                Save as draft
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleSendQuotation}
                        className={`btn-primary ${actionBtn} disabled:opacity-60`}
                        disabled={!sendReady || sending || saving}
                    >
                        {sending ? (
                            <>
                                <Spinner size="sm" inline />
                                Saving…
                            </>
                        ) : (
                            <>
                                <ClipboardList size={16} className="shrink-0" aria-hidden />
                                Create quotation
                            </>
                        )}
                    </button>
                </div>
            );
        }

        return (
            <button
                type="submit"
                form="quotation-form"
                className={`btn-primary ${actionBtn} disabled:opacity-60`}
                disabled={saving}
            >
                {saving ? (
                    <>
                        <Spinner size="sm" inline />
                        Saving…
                    </>
                ) : (
                    <>
                        <Save size={16} className="shrink-0" aria-hidden />
                        Save changes
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 xl:pb-8">
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />

            <ShareDocumentModal
                open={Boolean(shareModal)}
                docLabel="quotation"
                docNumber={shareModal ? getDisplayNumber(shareModal.quotation) : ''}
                clientName={shareModal?.client?.name}
                clientEmail={shareModal?.client?.email}
                shareReady={sharePdfReady}
                emailSending={emailSending}
                clientAlreadyEmailed={Boolean(shareModal?.clientAlreadyEmailed)}
                onShare={handleShareFromModal}
                onEmailClient={handleEmailFromModal}
                onSkip={handleSkipShare}
            />

            <CustomUnitModal
                open={customUnitModal != null}
                onClose={() => setCustomUnitModal(null)}
                onSave={handleCustomUnitSave}
            />

            <button
                type="button"
                onClick={handleLeavePage}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
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
                            usageLabel +
                            (invoiceUsage.remaining > 0
                                ? ` — ${invoiceUsage.remaining} remaining this month`
                                : ' — upgrade for unlimited documents')
                        }
                    />
                ) : null}
            </div>

            <form id="quotation-form" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <FormSection
                            icon={ClipboardList}
                            title="Quotation details"
                            description="Number, dates, tax, and discount"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Quotation number</label>
                                    <input
                                        type="text"
                                        value={quotationNumberDisplay}
                                        className="input-field bg-zinc-50 text-zinc-500 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor="quotation-tax-rate">Tax rate (%)</RequiredLabel>
                                    <input
                                        id="quotation-tax-rate"
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        className={inputClass(Boolean(fieldErrors.taxRate))}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        aria-invalid={Boolean(fieldErrors.taxRate)}
                                    />
                                    <FieldValidationMessage message={fieldErrors.taxRate} />
                                </div>
                                <div>
                                    <label className="label" htmlFor="quotation-discount-value">
                                        Discount (%)
                                    </label>
                                    <input
                                        id="quotation-discount-value"
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className={inputClass(Boolean(fieldErrors.discountValue))}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="0"
                                        aria-invalid={Boolean(fieldErrors.discountValue)}
                                    />
                                    <FieldValidationMessage message={fieldErrors.discountValue} />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor="quotation-date">Issue date</RequiredLabel>
                                    <DatePickerField
                                        id="quotation-date"
                                        value={formData.date}
                                        onChange={(val) => {
                                            markDirty();
                                            setFormData((prev) => ({ ...prev, date: val }));
                                            clearFieldError(setFieldErrors, 'date');
                                        }}
                                        error={Boolean(fieldErrors.date)}
                                        allowClear={false}
                                        placeholder="Issue date"
                                    />
                                    <FieldValidationMessage message={fieldErrors.date} />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <label className="label mb-0" htmlFor="quotation-valid-until-toggle">
                                            Valid until
                                        </label>
                                        <button
                                            id="quotation-valid-until-toggle"
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.hasValidUntil}
                                            aria-controls="quotation-valid-until"
                                            onClick={handleValidUntilToggle}
                                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                                                formData.hasValidUntil ? 'bg-brand' : 'bg-zinc-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                                                    formData.hasValidUntil
                                                        ? 'translate-x-5'
                                                        : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    {formData.hasValidUntil ? (
                                        <>
                                            <DatePickerField
                                                id="quotation-valid-until"
                                                value={formData.validUntil}
                                                onChange={(val) => {
                                                    markDirty();
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        validUntil: val,
                                                    }));
                                                    clearFieldError(setFieldErrors, 'validUntil');
                                                }}
                                                min={formData.date || undefined}
                                                error={Boolean(fieldErrors.validUntil)}
                                                allowClear={false}
                                                placeholder="Valid until"
                                            />
                                            <FieldValidationMessage message={fieldErrors.validUntil} />
                                        </>
                                    ) : (
                                        <p className="text-xs text-zinc-500">
                                            No expiry date will appear on this quotation.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </FormSection>

                        <FormSection icon={Users} title="Client" description="Who this quotation is for">
                            <div className="space-y-4">
                                <div>
                                    <RequiredLabel htmlFor="quotation-client-name">Client name</RequiredLabel>
                                    <input
                                        id="quotation-client-name"
                                        type="text"
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleClientNameChange}
                                        className={inputClass(
                                            Boolean(fieldErrors.clientName || fieldErrors.clientId)
                                        )}
                                        placeholder="John Doe"
                                        aria-invalid={Boolean(
                                            fieldErrors.clientName || fieldErrors.clientId
                                        )}
                                    />
                                    <FieldValidationMessage
                                        message={fieldErrors.clientName || fieldErrors.clientId}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="quotation-client-email" className="label">
                                        Email{' '}
                                        <span className="text-zinc-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        id="quotation-client-email"
                                        type="email"
                                        name="clientEmail"
                                        value={formData.clientEmail}
                                        onChange={handleClientEmailChange}
                                        className={inputClass(Boolean(fieldErrors.clientEmail))}
                                        placeholder="client@example.com"
                                        aria-invalid={Boolean(fieldErrors.clientEmail)}
                                    />
                                    <FieldValidationMessage message={fieldErrors.clientEmail} />
                                    <p className="mt-1.5 text-xs text-zinc-500">
                                        Add an email to send this quotation directly to your client.
                                    </p>
                                </div>
                                {clients.length > 0 && (
                                    <div>
                                        <label htmlFor="quotation-saved-client" className="label">
                                            Fill from saved client
                                        </label>
                                        <CustomSelect
                                            id="quotation-saved-client"
                                            value={formData.clientId}
                                            onChange={handleSelectSavedClient}
                                            options={clients.map((client) => ({
                                                value: client.id,
                                                label: `${client.name}${getClientBusiness(client) ? ` — ${getClientBusiness(client)}` : ''}`,
                                            }))}
                                            placeholder="Choose a saved client"
                                        />
                                    </div>
                                )}
                            </div>
                        </FormSection>

                        <FormSection
                            icon={List}
                            title="Items"
                            description="Products or services on this quotation"
                            actions={
                                <button type="button" onClick={addItem} className="btn-secondary text-sm py-2 px-3">
                                    <Plus size={16} aria-hidden />
                                    Add item
                                </button>
                            }
                        >
                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Item {index + 1}
                                            </span>
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                    aria-label={`Remove item ${index + 1}`}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <RequiredLabel htmlFor={`quotation-item-${index}-description`}>
                                                    Description
                                                </RequiredLabel>
                                                <input
                                                    id={`quotation-item-${index}-description`}
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        handleItemChange(index, 'description', e.target.value)
                                                    }
                                                    className={inputClass(
                                                        Boolean(fieldErrors[`item-${index}-description`])
                                                    )}
                                                    placeholder="Service or product"
                                                    aria-invalid={Boolean(
                                                        fieldErrors[`item-${index}-description`]
                                                    )}
                                                />
                                                <FieldValidationMessage
                                                    message={fieldErrors[`item-${index}-description`]}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <RequiredLabel htmlFor={`quotation-item-${index}-unit`}>
                                                        Unit
                                                    </RequiredLabel>
                                                    <div className="flex gap-2">
                                                        <CustomSelect
                                                            id={`quotation-item-${index}-unit`}
                                                            value={normalizeInvoiceUnit(item.unit)}
                                                            onChange={(value) => handleUnitChange(index, value)}
                                                            options={buildUnitSelectOptions(item.unit)}
                                                            aria-label={`Unit for item ${index + 1}`}
                                                            className="min-w-0 flex-1"
                                                        />
                                                        <input
                                                            id={`quotation-item-${index}-quantity`}
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    'quantity',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass(
                                                                Boolean(fieldErrors[`item-${index}-quantity`])
                                                            )} w-[4.75rem] shrink-0`}
                                                            min="1"
                                                            aria-label={`${normalizeInvoiceUnit(item.unit)} for item ${index + 1}`}
                                                            aria-invalid={Boolean(
                                                                fieldErrors[`item-${index}-quantity`]
                                                            )}
                                                        />
                                                    </div>
                                                    <FieldValidationMessage
                                                        message={fieldErrors[`item-${index}-quantity`]}
                                                    />
                                                </div>
                                                <div>
                                                    <RequiredLabel htmlFor={`quotation-item-${index}-rate`}>
                                                        Rate
                                                    </RequiredLabel>
                                                    <div className="flex gap-2">
                                                        <CustomSelect
                                                            id={`quotation-item-${index}-currency`}
                                                            value={normalizeCurrency(
                                                                formData.currency || APP_CURRENCY
                                                            )}
                                                            onChange={handleCurrencyChange}
                                                            options={getCurrencySelectOptions()}
                                                            aria-label={`Currency for rate on item ${index + 1}`}
                                                            className="w-[5.75rem] shrink-0"
                                                        />
                                                        <input
                                                            id={`quotation-item-${index}-rate`}
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'rate', e.target.value)
                                                            }
                                                            className={`${inputClass(
                                                                Boolean(fieldErrors[`item-${index}-rate`])
                                                            )} min-w-0 flex-1`}
                                                            min="0"
                                                            step="0.01"
                                                            aria-invalid={Boolean(
                                                                fieldErrors[`item-${index}-rate`]
                                                            )}
                                                        />
                                                    </div>
                                                    <FieldValidationMessage
                                                        message={fieldErrors[`item-${index}-rate`]}
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end min-w-0">
                                                    <span className="label">Amount</span>
                                                    <p className="text-base font-semibold text-zinc-900 py-2.5 tabular-nums break-all">
                                                        {formatCurrency(
                                                            item.quantity * item.rate,
                                                            formData.currency
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {products.length > 0 ? (
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl border border-brand/20 bg-brand-subtle/30">
                                    <div className="flex-1 min-w-0">
                                        <label htmlFor="quotation-product-pick" className="label">
                                            Add from product
                                        </label>
                                        <CustomSelect
                                            id="quotation-product-pick"
                                            value=""
                                            onChange={(productId) => {
                                                if (productId) addProductItem(productId);
                                            }}
                                            options={products.map((product) => ({
                                                value: product.id,
                                                label: `${product.name} — ${formatCurrency(product.unitPrice || 0, formData.currency)}`,
                                            }))}
                                            placeholder="Select a saved product…"
                                            leadingIcon={<Package size={18} aria-hidden />}
                                            aria-label="Add line item from saved product"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                                    Save products in{' '}
                                    <Link to="/products" className="text-brand font-medium hover:underline">
                                        Products
                                    </Link>{' '}
                                    to add line items in one click.
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            icon={ScrollText}
                            title="Terms & Conditions"
                            description="Shown with this quotation"
                        >
                            <textarea
                                name="terms"
                                value={formData.terms}
                                onChange={handleChange}
                                className={inputClass(false, 'resize-none min-h-[140px]')}
                                rows={6}
                                placeholder="Quotation terms…"
                            />
                        </FormSection>

                        <FormSection icon={StickyNote} title="Notes" description="Extra info for the client">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className={inputClass(false, 'resize-none min-h-[100px]')}
                                rows={4}
                                placeholder="Optional note…"
                            />
                        </FormSection>
                    </div>

                    <div className="xl:col-span-1 space-y-4 xl:sticky xl:top-24">
                        <div className="card space-y-5">
                            <h3 className="text-sm font-semibold text-zinc-900">Summary</h3>

                            {formData.clientName.trim() && (
                                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1.5">
                                        Bill to
                                    </p>
                                    <p className="font-semibold text-zinc-900">{formData.clientName}</p>
                                    {selectedClient && getClientBusiness(selectedClient) && (
                                        <p className="text-sm text-zinc-600 mt-0.5">
                                            {getClientBusiness(selectedClient)}
                                        </p>
                                    )}
                                    {formData.clientEmail.trim() && (
                                        <p className="text-sm text-zinc-500 mt-0.5">
                                            {formData.clientEmail}
                                        </p>
                                    )}
                                </div>
                            )}

                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-zinc-500">Subtotal</dt>
                                    <dd className="font-medium text-zinc-900">
                                        {formatCurrency(totals.subtotal, formData.currency)}
                                    </dd>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-zinc-500">{discountLabel}</dt>
                                        <dd className="font-medium text-red-600">
                                            −{formatCurrency(totals.discount, formData.currency)}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-zinc-500">Tax ({formData.taxRate}%)</dt>
                                    <dd className="font-medium text-zinc-900">
                                        {formatCurrency(totals.tax, formData.currency)}
                                    </dd>
                                </div>
                                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                                    <dt className="font-semibold text-zinc-900">Estimated total</dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(totals.total, formData.currency)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="hidden xl:block card p-4">{actionButtons('desktop')}</div>
                    </div>
                </div>
            </form>

            <div className="fixed bottom-0 left-0 right-0 md:left-[15.5rem] z-30 xl:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="max-w-6xl mx-auto w-full">{actionButtons()}</div>
            </div>
        </div>
    );
};

export default CreateQuotation;
