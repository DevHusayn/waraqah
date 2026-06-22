import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    Loader2,
    FileText,
    Users,
    List,
    StickyNote,
    Repeat,
    X,
    Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { APP_CURRENCY, CURRENCY_INFO, formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import FormSection from '../components/FormSection';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { canCreateInvoice, formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { apiFetch } from '../utils/api';
import FieldValidationMessage from '../components/FieldValidationMessage';
import RequiredLabel from '../components/RequiredLabel';
import {
    inputClass,
    focusFieldById,
    clearFieldError,
    firstFieldError,
} from '../utils/formFieldValidation';
import {
    buildInvoiceFieldErrors,
    getFirstInvoiceFieldId,
    getInvoiceFieldFocusOrder,
} from '../utils/invoiceFormValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import CustomSelect from '../components/CustomSelect';
import DatePickerField from '../components/DatePickerField';

const RECURRING_FREQUENCY_OPTIONS = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

const DISCOUNT_TYPE_OPTIONS = [
    { value: 'fixed', label: 'Fixed amount' },
    { value: 'percent', label: 'Percentage' },
];

const CreateInvoice = () => {
    const { id } = useParams();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clients, products, addInvoice, updateInvoice, invoices } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, atLimit } = useInvoiceCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        invoiceNumber: '',
        clientId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{ description: '', quantity: 1, rate: 0 }],
        notes: '',
        status: 'pending',
        currency: APP_CURRENCY,
        taxRate: businessInfo.taxRate ?? 10,
        discountType: 'fixed',
        discountValue: '',
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
    });

    useEffect(() => {
        if (!id) {
            setFormData((prev) => ({
                ...prev,
                currency: APP_CURRENCY,
                taxRate: businessInfo.taxRate ?? prev.taxRate,
            }));
        }
    }, [id, businessInfo.taxRate]);

    useEffect(() => {
        if (id) return;
        let cancelled = false;
        (async () => {
            try {
                const { invoiceNumber } = await apiFetch('/invoices/next-number');
                if (!cancelled && invoiceNumber) {
                    setFormData((prev) => ({ ...prev, invoiceNumber }));
                }
            } catch {
                if (!cancelled) {
                    setFormData((prev) => ({
                        ...prev,
                        invoiceNumber: prev.invoiceNumber || 'INV-0001',
                    }));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const invoice = invoices.find((inv) => inv.id === id);
        if (!invoice) return;
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            navigate(`/invoices/${id}`, { replace: true });
            return;
        }
        setFormData({
            ...invoice,
            discountType: invoice.discountType || 'fixed',
            discountValue: invoice.discountValue ?? '',
        });
    }, [id, invoices, navigate]);

    const getTotals = () =>
        calculateInvoiceTotals(formData.items, {
            taxRate: formData.taxRate,
            discountType: formData.discountType || 'fixed',
            discountValue: formData.discountValue || 0,
        });

    useEffect(() => {
        const clientId = searchParams.get('clientId');
        if (!clientId || clients.length === 0) return;
        if (!clients.some((c) => c.id === clientId)) return;
        setFormData((prev) => ({ ...prev, clientId }));
        const next = new URLSearchParams(searchParams);
        next.delete('clientId');
        setSearchParams(next, { replace: true });
    }, [clients, searchParams, setSearchParams]);

    useEffect(() => {
        if (!id && atLimit) {
            setLimitModalOpen(true);
        }
    }, [id, atLimit, setLimitModalOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
        clearFieldError(setFieldErrors, `item-${index}-${field}`);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, rate: 0 }],
        });
    };

    const addProductItem = (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        const description = product.description
            ? `${product.name} — ${product.description}`
            : product.name;
        setFormData({
            ...formData,
            items: [...formData.items, { description, quantity: 1, rate: product.unitPrice || 0 }],
        });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = buildInvoiceFieldErrors(formData);
        const order = getInvoiceFieldFocusOrder(formData.items.length);
        const firstInvalid = firstFieldError(errors, order);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(getFirstInvoiceFieldId(firstInvalid));
            return;
        }
        setFieldErrors({});

        if (!id && !canCreateInvoice(invoiceUsage)) {
            setLimitModalOpen(true);
            return;
        }

        const totals = getTotals();

        const invoiceData = {
            ...formData,
            status: id ? formData.status : 'pending',
            currency: APP_CURRENCY,
            discountType: formData.discountType || 'fixed',
            discountValue: Number(formData.discountValue) || 0,
            subtotal: totals.subtotal,
            discount: totals.discount,
            tax: totals.tax,
            total: totals.total,
            balance: totals.total,
        };

        if (!id) {
            delete invoiceData.invoiceNumber;
            delete invoiceData.receiptNumber;
            delete invoiceData.paymentMethod;
            delete invoiceData.datePaid;
        }

        setSaving(true);
        try {
            if (id) {
                await updateInvoice(id, invoiceData);
                showToast('Invoice updated successfully', 'success');
                navigate(`/invoices/${id}`);
            } else {
                await addInvoice(invoiceData);
                showToast('Invoice created successfully', 'success');
                navigate('/invoices');
            }
        } catch (err) {
            if (err.code === 'INVOICE_LIMIT_REACHED') {
                setLimitModalOpen(true);
            } else {
                showToast(err.message || 'Failed to save invoice', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const backHref = id ? `/invoices/${id}` : '/invoices';
    const totals = getTotals();
    const discountLabel =
        formData.discountType === 'percent' && Number(formData.discountValue) > 0
            ? `Discount (${formData.discountValue}%)`
            : 'Discount';

    const saveButton = (fullWidth = false) => (
        <button
            type="submit"
            form="invoice-form"
            className={`btn-primary ${fullWidth ? 'w-full' : ''} disabled:opacity-60`}
            disabled={saving || (!id && atLimit)}
        >
            {saving ? (
                <>
                    <Loader2 size={18} className="animate-spin" aria-hidden />
                    Saving…
                </>
            ) : (
                <>
                    <Save size={18} aria-hidden />
                    {id ? 'Save changes' : 'Create invoice'}
                </>
            )}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto pb-24 lg:pb-8">
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />

            <Link
                to={backHref}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand mb-6 transition-colors"
            >
                <ArrowLeft size={16} aria-hidden />
                {id ? 'Back to invoice' : 'Back to invoices'}
            </Link>

            <div className="mb-8">
                <h1 className="page-title">{id ? 'Edit invoice' : 'Create invoice'}</h1>
                <p className="page-subtitle">
                    {id ? 'Update details before sending to your client' : 'Fill in the details below'}
                </p>
                {!id && usageLabel ? (
                    <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 inline-block">
                        {usageLabel}
                        {invoiceUsage.remaining > 0
                            ? ` — ${invoiceUsage.remaining} remaining this month`
                            : ' — upgrade for unlimited invoices'}
                    </p>
                ) : null}
            </div>

            <form id="invoice-form" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <FormSection
                            icon={FileText}
                            title="Invoice details"
                            description="Number, dates, tax, and discount"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Invoice number</label>
                                    <input
                                        type="text"
                                        value={formData.invoiceNumber || (id ? '—' : 'Loading…')}
                                        className="input-field bg-slate-50 text-slate-500 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor="invoice-tax-rate">Tax rate (%)</RequiredLabel>
                                    <input
                                        id="invoice-tax-rate"
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
                                    <label className="label" htmlFor="invoice-discount-type">
                                        Discount type
                                    </label>
                                    <CustomSelect
                                        id="invoice-discount-type"
                                        value={formData.discountType || 'fixed'}
                                        onChange={(val) => {
                                            setFormData((prev) => ({ ...prev, discountType: val }));
                                        }}
                                        options={DISCOUNT_TYPE_OPTIONS}
                                        placeholder="Discount type"
                                    />
                                </div>
                                <div>
                                    <label className="label" htmlFor="invoice-discount-value">
                                        Discount{' '}
                                        {formData.discountType === 'percent'
                                            ? '(%)'
                                            : `(${CURRENCY_INFO.symbol})`}
                                    </label>
                                    <input
                                        id="invoice-discount-value"
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleChange}
                                        className={inputClass(Boolean(fieldErrors.discountValue))}
                                        min="0"
                                        max={formData.discountType === 'percent' ? '100' : undefined}
                                        step={formData.discountType === 'percent' ? '0.01' : '0.01'}
                                        placeholder="0"
                                        aria-invalid={Boolean(fieldErrors.discountValue)}
                                    />
                                    <FieldValidationMessage message={fieldErrors.discountValue} />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor="invoice-date">Issue date</RequiredLabel>
                                    <DatePickerField
                                        id="invoice-date"
                                        value={formData.date}
                                        onChange={(val) => {
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
                                    <RequiredLabel htmlFor="invoice-due-date">Due date</RequiredLabel>
                                    <DatePickerField
                                        id="invoice-due-date"
                                        value={formData.dueDate}
                                        onChange={(val) => {
                                            setFormData((prev) => ({ ...prev, dueDate: val }));
                                            clearFieldError(setFieldErrors, 'dueDate');
                                        }}
                                        min={formData.date || undefined}
                                        error={Boolean(fieldErrors.dueDate)}
                                        allowClear={false}
                                        placeholder="Due date"
                                    />
                                    <FieldValidationMessage message={fieldErrors.dueDate} />
                                </div>
                            </div>
                        </FormSection>

                        <FormSection
                            icon={Users}
                            title="Client"
                            description="Who this invoice is for"
                            actions={
                                <Link
                                    to={`/clients?returnTo=${encodeURIComponent(location.pathname)}&add=1`}
                                    className="text-sm font-medium text-brand hover:underline whitespace-nowrap"
                                >
                                    + Add client
                                </Link>
                            }
                        >
                            <RequiredLabel htmlFor="invoice-client">Select client</RequiredLabel>
                            <CustomSelect
                                id="invoice-client"
                                value={formData.clientId}
                                onChange={(val) => {
                                    setFormData((prev) => ({ ...prev, clientId: val }));
                                    clearFieldError(setFieldErrors, 'clientId');
                                }}
                                options={clients.map((client) => ({
                                    value: client.id,
                                    label: `${client.name}${
                                        getClientBusiness(client) ? ` — ${getClientBusiness(client)}` : ''
                                    }`,
                                }))}
                                placeholder="Choose a client"
                                error={Boolean(fieldErrors.clientId)}
                            />
                            <FieldValidationMessage message={fieldErrors.clientId} />
                            {clients.length === 0 && (
                                <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    No clients yet.{' '}
                                    <Link to="/clients?add=1" className="font-medium underline">
                                        Add one first
                                    </Link>
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            icon={List}
                            title="Items"
                            description="Products or services on this invoice"
                            actions={
                                <button type="button" onClick={addItem} className="btn-secondary text-sm py-2 px-3">
                                    <Plus size={16} aria-hidden />
                                    Add item
                                </button>
                            }
                        >
                            {products.length > 0 ? (
                                <div className="mb-4 flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl border border-brand/20 bg-brand-subtle/30">
                                    <div className="flex-1 min-w-0">
                                        <label htmlFor="invoice-product-pick" className="label">
                                            Add from product
                                        </label>
                                        <CustomSelect
                                            id="invoice-product-pick"
                                            value=""
                                            onChange={(productId) => {
                                                if (productId) addProductItem(productId);
                                            }}
                                            options={products.map((product) => ({
                                                value: product.id,
                                                label: `${product.name} — ${formatCurrency(product.unitPrice || 0)}`,
                                            }))}
                                            placeholder="Select a saved product…"
                                            leadingIcon={<Package size={18} aria-hidden />}
                                            aria-label="Add line item from saved product"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-4 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    Save products in{' '}
                                    <Link to="/products" className="text-brand font-medium hover:underline">
                                        Products
                                    </Link>{' '}
                                    to add line items in one click.
                                </p>
                            )}
                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                            <div className="sm:col-span-12 md:col-span-5">
                                                <RequiredLabel htmlFor={`invoice-item-${index}-description`}>
                                                    Description
                                                </RequiredLabel>
                                                <input
                                                    id={`invoice-item-${index}-description`}
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
                                            <div className="sm:col-span-4 md:col-span-2">
                                                <RequiredLabel htmlFor={`invoice-item-${index}-quantity`}>
                                                    Qty
                                                </RequiredLabel>
                                                <input
                                                    id={`invoice-item-${index}-quantity`}
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleItemChange(index, 'quantity', e.target.value)
                                                    }
                                                    className={inputClass(
                                                        Boolean(fieldErrors[`item-${index}-quantity`])
                                                    )}
                                                    min="1"
                                                    aria-invalid={Boolean(fieldErrors[`item-${index}-quantity`])}
                                                />
                                                <FieldValidationMessage
                                                    message={fieldErrors[`item-${index}-quantity`]}
                                                />
                                            </div>
                                            <div className="sm:col-span-4 md:col-span-3">
                                                <RequiredLabel htmlFor={`invoice-item-${index}-rate`}>
                                                    Rate ({CURRENCY_INFO.symbol})
                                                </RequiredLabel>
                                                <input
                                                    id={`invoice-item-${index}-rate`}
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) =>
                                                        handleItemChange(index, 'rate', e.target.value)
                                                    }
                                                    className={inputClass(
                                                        Boolean(fieldErrors[`item-${index}-rate`])
                                                    )}
                                                    min="0"
                                                    step="0.01"
                                                    aria-invalid={Boolean(fieldErrors[`item-${index}-rate`])}
                                                />
                                                <FieldValidationMessage
                                                    message={fieldErrors[`item-${index}-rate`]}
                                                />
                                            </div>
                                            <div className="sm:col-span-4 md:col-span-2 flex flex-col justify-end">
                                                <span className="label">Amount</span>
                                                <p className="text-base font-semibold text-slate-900 py-2.5">
                                                    {formatCurrency(item.quantity * item.rate)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FormSection>

                        <FormSection
                            icon={Repeat}
                            title="Recurring"
                            description="Optional automatic billing schedule"
                        >
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isRecurring: e.target.checked })
                                    }
                                    className="h-5 w-5 rounded border-slate-300 text-brand focus:ring-brand/30"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Make this a recurring invoice
                                </span>
                            </label>
                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="label">Frequency</label>
                                        <CustomSelect
                                            id="invoice-recurring-frequency"
                                            value={formData.recurringFrequency}
                                            onChange={(val) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    recurringFrequency: val,
                                                }))
                                            }
                                            options={RECURRING_FREQUENCY_OPTIONS}
                                            placeholder="Frequency"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">End date (optional)</label>
                                        <DatePickerField
                                            id="invoice-recurring-end"
                                            value={formData.recurringEndDate}
                                            onChange={(val) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    recurringEndDate: val,
                                                }))
                                            }
                                            min={formData.date || undefined}
                                            placeholder="No end date"
                                        />
                                    </div>
                                </div>
                            )}
                        </FormSection>

                        <FormSection icon={StickyNote} title="Notes" description="Payment terms or extra info">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className={inputClass(false, 'resize-none min-h-[100px]')}
                                rows={4}
                                placeholder="Payment terms, bank details, thank-you message…"
                            />
                        </FormSection>
                    </div>

                    <div className="xl:col-span-1">
                        <div className="card xl:sticky xl:top-24 space-y-5">
                            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>

                            {selectedClient && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                        Bill to
                                    </p>
                                    <p className="font-semibold text-slate-900">{selectedClient.name}</p>
                                    {getClientBusiness(selectedClient) && (
                                        <p className="text-sm text-slate-600 mt-0.5">
                                            {getClientBusiness(selectedClient)}
                                        </p>
                                    )}
                                    {selectedClient.email && (
                                        <p className="text-sm text-slate-500 mt-0.5">{selectedClient.email}</p>
                                    )}
                                </div>
                            )}

                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="font-medium text-slate-900">
                                        {formatCurrency(totals.subtotal)}
                                    </dd>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">{discountLabel}</dt>
                                        <dd className="font-medium text-red-600">
                                            −{formatCurrency(totals.discount)}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Tax ({formData.taxRate}%)</dt>
                                    <dd className="font-medium text-slate-900">
                                        {formatCurrency(totals.tax)}
                                    </dd>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                    <dt className="font-semibold text-slate-900">Total</dt>
                                    <dd className="text-2xl font-bold text-brand">
                                        {formatCurrency(totals.total)}
                                    </dd>
                                </div>
                            </dl>

                            <div className="hidden lg:block pt-1">{saveButton(true)}</div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)] p-4">
                {saveButton(true)}
            </div>
        </div>
    );
};

export default CreateInvoice;
