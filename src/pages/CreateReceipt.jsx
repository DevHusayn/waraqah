import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import { format } from 'date-fns';
import { useReceipt } from '../context/ReceiptContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { APP_CURRENCY, normalizeCurrency, formatCurrency } from '../utils/currency';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import { useReceiptCreateGuard } from '../hooks/useReceiptCreateGuard';
import { useDocumentFormHandlers } from '../hooks/useDocumentFormHandlers';
import { canCreateInvoice, formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { focusFieldById, firstFieldError } from '../utils/formFieldValidation';
import {
    buildReceiptFieldErrors,
    buildReceiptDraftFieldErrors,
    getFirstReceiptFieldId,
    getReceiptFieldFocusOrder,
} from '../utils/receiptFormValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import { buildReceiptPayload } from '../utils/sendReceiptFlow';
import { clientDetailsFromRecord } from '../utils/ensureInvoiceClient';
import ClientDetailsModal from '../components/ClientDetailsModal';
import DocumentFormModals from '../components/documentForm/DocumentFormModals';
import DocumentDetailsSection from '../components/documentForm/DocumentDetailsSection';
import DocumentClientSection from '../components/documentForm/DocumentClientSection';
import DocumentLineItemsSection from '../components/documentForm/DocumentLineItemsSection';
import DocumentSummaryCard from '../components/documentForm/DocumentSummaryCard';
import DocumentActionButtons from '../components/documentForm/DocumentActionButtons';
import DocumentPreviewOverlay from '../components/documentForm/DocumentPreviewOverlay';
import { DocumentNotesSection } from '../components/documentForm/DocumentNotesSection';
import { buildDocumentPreviewFromForm } from '../utils/buildDocumentPreviewData';
import { hasDraftContent } from '../utils/documentFormHelpers';
import { DEFAULT_INVOICE_UNIT, normalizeInvoiceUnit } from '@waraqah/shared';
import FormSection from '../components/FormSection';
import RequiredLabel from '../components/RequiredLabel';
import FieldValidationMessage from '../components/FieldValidationMessage';
import CustomSelect from '../components/CustomSelect';
import DatePickerField from '../components/DatePickerField';
import { MARK_PAID_METHODS } from '../utils/receiptHelpers';
import { inputClass } from '../utils/formFieldValidation';

const MONEY_EPS = 0.009;

function parsePaymentAmount(value) {
    const n = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : NaN;
}

function amountsMatch(a, b) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < MONEY_EPS;
}

const CreateReceipt = () => {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addReceipt, updateReceipt, refreshReceipts } = useReceipt();
    const { clients, products, addClient, updateClient, fetchProducts } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useReceiptCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [customUnitModal, setCustomUnitModal] = useState(null);
    const [clientDetailsModalOpen, setClientDetailsModalOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [nextReceiptNumber, setNextReceiptNumber] = useState('');

    const draftIdRef = useRef(null);
    const saveInFlightRef = useRef(false);
    const isDirtyRef = useRef(false);
    const formDataRef = useRef(null);
    const loadedReceiptIdRef = useRef(null);
    const [resolvedStatus, setResolvedStatus] = useState(id ? null : 'draft');
    const [receiptLoading, setReceiptLoading] = useState(Boolean(id));

    useLayoutEffect(() => {
        if (!id) {
            loadedReceiptIdRef.current = null;
            setResolvedStatus('draft');
            setReceiptLoading(false);
            return;
        }
        if (loadedReceiptIdRef.current !== id) {
            loadedReceiptIdRef.current = null;
            setResolvedStatus(null);
            setReceiptLoading(true);
        }
    }, [id]);

    const status = resolvedStatus ?? (id ? null : 'draft');
    const isDraftEdit = Boolean(id && status === 'draft');
    const isDraftFlow = status === 'draft';
    const receiptNotReady = Boolean(id && (receiptLoading || resolvedStatus == null));

    const [formData, setFormData] = useState({
        receiptNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientBusiness: '',
        clientPhone: '',
        clientAddress: '',
        clientAdditionalInfo: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        datePaid: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: '',
        paidInFull: true,
        paymentAmount: '',
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

    useEffect(() => {
        if (id) draftIdRef.current = id;
    }, [id]);

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (id) return;
        apiFetch('/receipts/next-number')
            .then((data) => setNextReceiptNumber(data.receiptNumber || ''))
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        if (!id) return undefined;
        if (loadedReceiptIdRef.current === id) return undefined;

        let cancelled = false;

        const applyReceiptToForm = (receipt) => {
            if (receipt.status === 'paid') {
                setReceiptLoading(false);
                navigate(`/receipts/${id}`, { replace: true });
                return;
            }
            const client = receipt.clientId
                ? clients.find((c) => c.id === receipt.clientId)
                : null;
            loadedReceiptIdRef.current = id;
            setResolvedStatus(receipt.status || 'draft');
            setFormData({
                ...receipt,
                clientName: client?.name || '',
                clientEmail: client?.email || '',
                ...clientDetailsFromRecord(client),
                clientAdditionalInfo: receipt.clientAdditionalInfo || '',
                discountType: receipt.discountType || 'percent',
                discountValue: receipt.discountValue ?? '',
                currency: normalizeCurrency(receipt.currency || APP_CURRENCY),
                paymentMethod: receipt.paymentMethod || '',
                datePaid: receipt.datePaid || format(new Date(), 'yyyy-MM-dd'),
                items: (receipt.items || []).map((item) => ({
                    ...item,
                    unit: normalizeInvoiceUnit(item.unit),
                })),
            });
            isDirtyRef.current = false;
            setReceiptLoading(false);
        };

        const loadReceipt = async () => {
            setReceiptLoading(true);
            try {
                const data = await apiFetch(`/receipts/${id}`);
                if (!cancelled) applyReceiptToForm({ ...data, id: data._id || data.id });
            } catch {
                if (!cancelled) {
                    setReceiptLoading(false);
                    navigate('/invoices/drafts', { replace: true });
                }
            }
        };

        loadReceipt();
        return () => {
            cancelled = true;
        };
    }, [id, clients, navigate]);

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

    const getTotals = () =>
        calculateInvoiceTotals(formData.items, {
            taxRate: formData.taxRate,
            discountType: 'percent',
            discountValue: formData.discountValue || 0,
        });

    const totals = getTotals();
    const paymentAmountNumber = formData.paidInFull
        ? totals.total
        : parsePaymentAmount(formData.paymentAmount);
    const balanceAfterPayment =
        Number.isFinite(paymentAmountNumber) && paymentAmountNumber > 0
            ? Math.max(0, Math.round((totals.total - paymentAmountNumber) * 100) / 100)
            : totals.total;

    useEffect(() => {
        if (!formData.paidInFull) return;
        setFormData((prev) => ({
            ...prev,
            paymentAmount: totals.total > 0 ? String(totals.total) : '',
        }));
    }, [formData.paidInFull, totals.total]);

    const persistDraft = useCallback(
        async ({ silent = true, redirectAfterCreate = true } = {}) => {
            if (!isDraftFlow) return null;
            if (saveInFlightRef.current) return null;

            const current = formDataRef.current;
            if (!hasDraftContent(current)) return null;

            const draftErrors = buildReceiptDraftFieldErrors(current);
            const order = getReceiptFieldFocusOrder(current.items.length, current);
            const firstInvalid = firstFieldError(draftErrors, order);
            if (firstInvalid) {
                if (!silent) {
                    setFieldErrors(draftErrors);
                    focusFieldById(getFirstReceiptFieldId(firstInvalid));
                }
                return null;
            }

            saveInFlightRef.current = true;
            if (!silent) setSaving(true);

            try {
                const clientId = String(current.clientName || '').trim()
                    ? await handlers.resolveClientId(current)
                    : current.clientId || null;
                const payload = buildReceiptPayload({ ...current, clientId }, 'draft');
                const draftId = id || draftIdRef.current;
                let saved;

                if (draftId) {
                    saved = await updateReceipt(draftId, payload);
                } else {
                    saved = await addReceipt(payload);
                    draftIdRef.current = saved.id;
                    if (redirectAfterCreate) navigate('/invoices/drafts');
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
        [isDraftFlow, id, addReceipt, updateReceipt, navigate, showToast, handlers]
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

    const handleIssueReceipt = async () => {
        const errors = buildReceiptFieldErrors(formData);
        const order = getReceiptFieldFocusOrder(formData.items.length, formData);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstReceiptFieldId(firstInvalid));
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
        setIssuing(true);
        try {
            const clientId = await handlers.resolveClientId(formData);
            const payload = buildReceiptPayload({ ...formData, clientId }, 'paid');
            const draftId = id || draftIdRef.current;
            let saved;

            if (draftId) {
                saved = await updateReceipt(draftId, payload);
            } else {
                saved = await addReceipt(payload, { skipRefresh: true });
            }

            showToast(`Receipt ${saved.receiptNumber || ''} issued`.trim(), 'success');
            refreshReceipts().catch(() => {});
            navigate(`/receipts/${saved.id}`);
        } catch (err) {
            if (err.code === 'INVOICE_LIMIT_REACHED') {
                setLimitModalOpen(true);
            } else {
                showToast(err.message || 'Failed to issue receipt', 'error');
            }
        } finally {
            saveInFlightRef.current = false;
            setIssuing(false);
        }
    };

    const handlePaymentAmountChange = (value) => {
        markDirty();
        const parsed = parsePaymentAmount(value);
        setFormData((prev) => ({
            ...prev,
            paymentAmount: value,
            paidInFull: amountsMatch(parsed, totals.total),
        }));
        setFieldErrors((prev) => ({ ...prev, paymentAmount: undefined }));
    };

    const handlePaidInFullChange = (checked) => {
        markDirty();
        setFormData((prev) => ({
            ...prev,
            paidInFull: checked,
            paymentAmount: checked && totals.total > 0 ? String(totals.total) : prev.paymentAmount,
        }));
        setFieldErrors((prev) => ({ ...prev, paymentAmount: undefined }));
    };

    const handlePaymentMethodChange = (value) => {
        markDirty();
        setFormData((prev) => ({ ...prev, paymentMethod: value }));
        setFieldErrors((prev) => ({ ...prev, paymentMethod: undefined }));
    };

    const handleDatePaidChange = (value) => {
        markDirty();
        setFormData((prev) => ({ ...prev, datePaid: value }));
        setFieldErrors((prev) => ({ ...prev, datePaid: undefined }));
    };

    const issueReady = useMemo(
        () => Object.keys(buildReceiptFieldErrors(formData)).length === 0,
        [formData]
    );

    const previewData = useMemo(() => {
        const amountPaid = formData.paidInFull
            ? totals.total
            : parsePaymentAmount(formData.paymentAmount) || totals.total;
        return buildDocumentPreviewFromForm(
            {
                ...formData,
                receiptNumber: formData.receiptNumber || nextReceiptNumber,
                status: 'paid',
                amountPaid: Number.isFinite(amountPaid) ? amountPaid : totals.total,
            },
            { type: 'receipt' }
        );
    }, [formData, nextReceiptNumber, totals.total]);

    const selectedClient = clients.find((c) => c.id === formData.clientId);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const backHref = isDraftEdit ? '/invoices/drafts' : id ? `/receipts/${id}` : '/receipts';
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

    const receiptNumberDisplay = isDraftFlow
        ? formData.receiptNumber || nextReceiptNumber || 'Assigned when issued'
        : formData.receiptNumber || (id ? '—' : 'Loading…');

    const pageTitle = isDraftEdit ? 'Complete receipt' : id ? 'Edit receipt draft' : 'Create receipt';

    if (receiptNotReady) {
        return <PageSpinner label="Loading receipt…" centered className="min-h-[40vh]" />;
    }

    const actionButtons = (variant = 'mobile') => (
        <DocumentActionButtons
            variant={variant}
            isDraftFlow={isDraftFlow}
            saving={saving}
            sending={issuing}
            sendReady={issueReady}
            formId="receipt-form"
            sendIcon={Receipt}
            sendLabel="Issue receipt"
            onSaveDraft={handleSaveDraft}
            onPreview={() => setPreviewOpen(true)}
            onSend={handleIssueReceipt}
        />
    );

    return (
        <div className="max-w-6xl mx-auto pb-24 xl:pb-8">
            <DocumentFormModals
                limitModalOpen={limitModalOpen}
                onCloseLimitModal={() => setLimitModalOpen(false)}
                invoiceUsage={invoiceUsage}
                customUnitModalOpen={customUnitModal != null}
                onCloseCustomUnitModal={() => setCustomUnitModal(null)}
                onCustomUnitSave={handlers.handleCustomUnitSave}
            />

            <DocumentPreviewOverlay
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onSend={handleIssueReceipt}
                sendLabel="Issue receipt"
                sendReady={issueReady}
                sending={issuing}
                invoice={previewData.invoice}
                client={previewData.client}
                businessInfo={businessInfo}
                mode="receipt"
            />

            <button
                type="button"
                onClick={handleLeavePage}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-brand mb-6 transition-colors"
            >
                <ArrowLeft size={16} aria-hidden />
                {isDraftEdit ? 'Back to drafts' : id ? 'Back to receipt' : 'Back to receipts'}
            </button>

            <div className="mb-8">
                <div>
                    <h1 className="page-title">{pageTitle}</h1>
                    <p className="page-subtitle">
                        Record payment received without creating an invoice
                    </p>
                </div>
                {isDraftFlow && usageLabel ? (
                    <InvoiceUsageBanner
                        className="mt-3 inline-block"
                        label={
                            usageLabel +
                            (invoiceUsage?.remaining > 0
                                ? ` — ${invoiceUsage.remaining} remaining this month`
                                : ' — upgrade for unlimited documents')
                        }
                    />
                ) : null}
            </div>

            <form id="receipt-form" noValidate onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <DocumentDetailsSection
                            icon={Receipt}
                            title="Receipt details"
                            description="Number, dates, tax, and discount"
                            idPrefix="receipt"
                            numberLabel="Receipt number"
                            numberDisplay={receiptNumberDisplay}
                            formData={formData}
                            fieldErrors={fieldErrors}
                            onChange={handlers.handleChange}
                            onIssueDateChange={handlers.createIssueDateChangeHandler()}
                        />

                        <DocumentClientSection
                            idPrefix="receipt"
                            docLabel="receipt"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            clients={clients}
                            onNameChange={handlers.handleClientNameChange}
                            onEmailChange={handlers.handleClientEmailChange}
                            onSelectSavedClient={handlers.handleSelectSavedClient}
                            onOpenDetailsModal={() => setClientDetailsModalOpen(true)}
                        />

                        <DocumentLineItemsSection
                            idPrefix="receipt"
                            docLabel="receipt"
                            formData={formData}
                            fieldErrors={fieldErrors}
                            products={products}
                            onItemChange={handlers.handleItemChange}
                            onUnitChange={handlers.handleUnitChange}
                            onCurrencyChange={handlers.handleCurrencyChange}
                            onAddItem={handlers.addItem}
                            onRemoveItem={handlers.removeItem}
                            onAddProductItem={handlers.addProductItem}
                        />

                        <FormSection
                            icon={Receipt}
                            title="Payment"
                            description="How much was received and when"
                        >
                            <div className="space-y-4">
                                <div>
                                    <RequiredLabel htmlFor="receipt-payment-amount">
                                        Amount received
                                    </RequiredLabel>
                                    <input
                                        id="receipt-payment-amount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        max={totals.total || undefined}
                                        value={
                                            formData.paidInFull
                                                ? totals.total > 0
                                                    ? String(totals.total)
                                                    : ''
                                                : formData.paymentAmount
                                        }
                                        onChange={(e) => handlePaymentAmountChange(e.target.value)}
                                        className={inputClass(
                                            Boolean(fieldErrors.paymentAmount),
                                            'disabled:bg-zinc-50 disabled:text-zinc-600'
                                        )}
                                        disabled={formData.paidInFull}
                                        aria-invalid={Boolean(fieldErrors.paymentAmount)}
                                    />
                                    <label
                                        htmlFor="receipt-paid-in-full"
                                        className="mt-2.5 flex items-center gap-2 cursor-pointer select-none w-fit"
                                    >
                                        <input
                                            id="receipt-paid-in-full"
                                            type="checkbox"
                                            checked={formData.paidInFull}
                                            disabled={totals.total <= 0}
                                            onChange={(e) => handlePaidInFullChange(e.target.checked)}
                                            className="h-4 w-4 rounded border-zinc-300 accent-brand focus:ring-brand/30"
                                        />
                                        <span className="text-sm text-zinc-700">Received in full</span>
                                    </label>
                                    <FieldValidationMessage message={fieldErrors.paymentAmount} />
                                    {totals.total > 0 ? (
                                        <p className="text-xs text-zinc-500 mt-2">
                                            Balance after this payment:{' '}
                                            <span className="font-medium text-zinc-700">
                                                {formatCurrency(balanceAfterPayment, formData.currency)}
                                            </span>
                                        </p>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <RequiredLabel htmlFor="receipt-payment-method">
                                        Payment method
                                    </RequiredLabel>
                                    <CustomSelect
                                        id="receipt-payment-method"
                                        value={formData.paymentMethod}
                                        onChange={handlePaymentMethodChange}
                                        options={MARK_PAID_METHODS}
                                        placeholder="Select method"
                                        error={Boolean(fieldErrors.paymentMethod)}
                                    />
                                    <FieldValidationMessage message={fieldErrors.paymentMethod} />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor="receipt-date-paid">
                                        Payment date
                                    </RequiredLabel>
                                    <DatePickerField
                                        id="receipt-date-paid"
                                        value={formData.datePaid}
                                        onChange={handleDatePaidChange}
                                        error={Boolean(fieldErrors.datePaid)}
                                        allowClear={false}
                                        placeholder="Payment date"
                                    />
                                    <FieldValidationMessage message={fieldErrors.datePaid} />
                                </div>
                                </div>
                            </div>
                        </FormSection>

                        <DocumentNotesSection
                            formData={formData}
                            onChange={handlers.handleChange}
                            description="Optional notes on this receipt"
                            placeholder="Thank you for your payment…"
                        />
                    </div>

                    <div className="space-y-6">
                        <DocumentSummaryCard
                            formData={formData}
                            selectedClient={selectedClient}
                            totals={totals}
                            discountLabel={discountLabel}
                            totalLabel="Total paid"
                            amountReceived={
                                Number.isFinite(paymentAmountNumber) && paymentAmountNumber > 0
                                    ? paymentAmountNumber
                                    : null
                            }
                        />
                        <div className="hidden xl:block">{actionButtons('desktop')}</div>
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

            <div className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur p-4 xl:hidden">
                {actionButtons('mobile')}
            </div>
        </div>
    );
};

export default CreateReceipt;
