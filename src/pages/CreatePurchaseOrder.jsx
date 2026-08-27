import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { PageSpinner } from '../components/Spinner';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { APP_CURRENCY, normalizeCurrency, formatCurrency } from '../utils/currency';
import { useDocumentFormHandlers } from '../hooks/useDocumentFormHandlers';
import DocumentLineItemsSection from '../components/documentForm/DocumentLineItemsSection';
import SupplierNameCombobox from '../components/documentForm/SupplierNameCombobox';
import FormSection from '../components/FormSection';
import RequiredLabel from '../components/RequiredLabel';
import FieldValidationMessage from '../components/FieldValidationMessage';
import SupplierFormModal, { EMPTY_SUPPLIER } from '../components/SupplierFormModal';
import DatePickerField from '../components/DatePickerField';
import {
    buildPurchaseOrderFieldErrors,
    getFirstPurchaseOrderFieldId,
    getPurchaseOrderFieldFocusOrder,
} from '../utils/purchaseOrderFormValidation';
import { buildPurchaseOrderPayload } from '../utils/sendPurchaseOrderFlow';
import { ensurePurchaseOrderSupplier } from '../utils/ensurePurchaseOrderSupplier';
import { focusFieldById, firstFieldError, inputClass } from '../utils/formFieldValidation';
import { calculateInvoiceTotals } from '../utils/invoiceTotals';
import { DEFAULT_INVOICE_UNIT, normalizeInvoiceUnit } from '@waraqah/shared';

const EMPTY_FORM = {
    supplierId: '',
    supplierName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    expectedDate: '',
    notes: '',
    currency: APP_CURRENCY,
    items: [{ description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT }],
};

const mapSupplier = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function CreatePurchaseOrder() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { products, fetchProducts } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [suppliers, setSuppliers] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(Boolean(id));
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);

    const fetchSuppliers = useCallback(async () => {
        try {
            const payload = await apiFetch('/suppliers?limit=100&page=1');
            setSuppliers((payload.data || []).map(mapSupplier));
        } catch {
            setSuppliers([]);
        }
    }, []);

    const handlers = useDocumentFormHandlers({
        formData,
        setFormData,
        products,
        markDirty: () => {},
        productPriceField: 'unitCost',
    });

    const totals = useMemo(
        () =>
            calculateInvoiceTotals(formData.items, {
                taxRate: 0,
                discountType: 'fixed',
                discountValue: 0,
            }),
        [formData.items]
    );

    useEffect(() => {
        fetchProducts({ force: true }).catch(() => {});
        fetchSuppliers();
    }, [fetchProducts, fetchSuppliers]);

    useEffect(() => {
        const supplierId = searchParams.get('supplierId');
        if (!supplierId || id || suppliers.length === 0) return;
        const supplier = suppliers.find((entry) => String(entry.id) === supplierId);
        if (!supplier) return;
        setFormData((prev) => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name || '',
        }));
    }, [searchParams, id, suppliers]);

    useEffect(() => {
        if (!formData.supplierId || formData.supplierName || suppliers.length === 0) return;
        const supplier = suppliers.find((entry) => String(entry.id) === String(formData.supplierId));
        if (supplier) {
            setFormData((prev) => ({ ...prev, supplierName: supplier.name || '' }));
        }
    }, [formData.supplierId, formData.supplierName, suppliers]);

    useEffect(() => {
        if (!id) return undefined;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const order = await apiFetch(`/purchase-orders/${id}`);
                if (cancelled) return;
                if (order.status !== 'draft') {
                    navigate(`/purchase-orders/${id}`, { replace: true });
                    return;
                }
                setFormData({
                    supplierId: order.supplierId ? String(order.supplierId) : '',
                    supplierName: '',
                    date: order.date || format(new Date(), 'yyyy-MM-dd'),
                    expectedDate: order.expectedDate || '',
                    notes: order.notes || '',
                    currency: normalizeCurrency(order.currency || APP_CURRENCY),
                    items: (order.items || []).map((item) => ({
                        ...item,
                        unit: normalizeInvoiceUnit(item.unit),
                    })),
                });
            } catch {
                if (!cancelled) navigate('/purchase-orders', { replace: true });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, navigate]);

    const handleSupplierNameChange = (event) => {
        const { value } = event.target;
        setFormData((prev) => {
            const next = { ...prev, supplierName: value };
            if (prev.supplierId) {
                const linked = suppliers.find((supplier) => supplier.id === prev.supplierId);
                if (linked && linked.name !== value) {
                    next.supplierId = '';
                }
            }
            return next;
        });
        setFieldErrors((prev) => ({ ...prev, supplierId: undefined }));
    };

    const handleSelectSupplier = (supplier) => {
        if (!supplier) return;
        setFormData((prev) => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name || '',
        }));
        setFieldErrors((prev) => ({ ...prev, supplierId: undefined }));
    };

    const validate = useCallback(
        (requireSupplier = true) => {
            const errors = buildPurchaseOrderFieldErrors(formData, { requireSupplier });
            const order = getPurchaseOrderFieldFocusOrder(formData.items.length);
            const firstInvalid = firstFieldError(errors, order);
            if (firstInvalid) {
                setFieldErrors(errors);
                const fieldId = getFirstPurchaseOrderFieldId(firstInvalid);
                if (fieldId) focusFieldById(fieldId);
                return false;
            }
            setFieldErrors({});
            return true;
        },
        [formData]
    );

    const persist = async () => {
        if (!validate(true)) return;

        setSaving(true);
        try {
            const supplierId = await ensurePurchaseOrderSupplier(formData, suppliers, {
                createSupplier: async (name) => {
                    const created = await apiFetch('/suppliers', {
                        method: 'POST',
                        body: JSON.stringify({ name }),
                    });
                    const mapped = mapSupplier(created);
                    setSuppliers((prev) => [...prev, mapped]);
                    return mapped;
                },
            });

            if (!supplierId) {
                setFieldErrors({ supplierId: 'Enter a supplier name.' });
                focusFieldById('po-supplier');
                return;
            }

            const payload = buildPurchaseOrderPayload({ ...formData, supplierId }, 'sent');
            let saved;
            if (id) {
                saved = await apiFetch(`/purchase-orders/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                saved = await apiFetch('/purchase-orders', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            const savedId = saved._id || saved.id;
            showToast('Purchase order placed', 'success');
            navigate(`/purchase-orders/${savedId}`, { replace: true });
        } catch (err) {
            showToast(err.message || 'Failed to save purchase order', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSupplier = async (formData, editing) => {
        if (editing) return;
        const payload = {
            name: formData.name,
            company: formData.business,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
        };
        try {
            const created = await apiFetch('/suppliers', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            const supplierId = String(created._id || created.id);
            await fetchSuppliers();
            setFormData((prev) => ({
                ...prev,
                supplierId,
                supplierName: formData.name,
            }));
            setFieldErrors((prev) => ({ ...prev, supplierId: undefined }));
            setSupplierModalOpen(false);
            showToast('Supplier added successfully', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to add supplier', 'error');
            throw err;
        }
    };

    if (loading) {
        return <PageSpinner label="Loading purchase order…" />;
    }

    return (
        <div className="max-w-3xl mx-auto pb-16">
            <SupplierFormModal
                open={supplierModalOpen}
                onClose={() => setSupplierModalOpen(false)}
                onSubmit={handleAddSupplier}
                initialData={EMPTY_SUPPLIER}
            />
            <div className="mb-6">
                <Link
                    to="/purchase-orders"
                    className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to purchase orders
                </Link>
            </div>

            <div className="flex items-start gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-brand-subtle">
                    <ShoppingCart className="h-6 w-6 text-brand" aria-hidden />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {id ? 'Edit purchase order' : 'New purchase order'}
                    </h1>
                    <p className="text-sm text-foreground-muted mt-1">
                        Order stock from a supplier and receive it into inventory later.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <FormSection title="Order details" description="Supplier and dates">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <RequiredLabel htmlFor="po-supplier">Supplier</RequiredLabel>
                            <SupplierNameCombobox
                                id="po-supplier"
                                value={formData.supplierName}
                                suppliers={suppliers}
                                selectedSupplierId={formData.supplierId}
                                onNameChange={handleSupplierNameChange}
                                onSelectSupplier={handleSelectSupplier}
                                error={Boolean(fieldErrors.supplierId)}
                                placeholder="Start typing supplier name…"
                            />
                            <FieldValidationMessage message={fieldErrors.supplierId} />
                            <p className="mt-1.5 text-xs text-foreground-muted">
                                Pick a saved supplier or type a new name — new suppliers are saved when
                                you place the order.{' '}
                                <button
                                    type="button"
                                    onClick={() => setSupplierModalOpen(true)}
                                    className="text-brand font-medium hover:underline"
                                >
                                    Add full details
                                </button>
                            </p>
                        </div>
                        <div>
                            <RequiredLabel htmlFor="po-date">Order date</RequiredLabel>
                            <DatePickerField
                                id="po-date"
                                value={formData.date}
                                onChange={(date) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        date,
                                        expectedDate:
                                            prev.expectedDate && date && prev.expectedDate < date
                                                ? date
                                                : prev.expectedDate,
                                    }))
                                }
                                error={Boolean(fieldErrors.date)}
                                allowClear={false}
                                placeholder="Order date"
                            />
                            <FieldValidationMessage message={fieldErrors.date} />
                        </div>
                        <div>
                            <label htmlFor="po-expected-date" className="label">
                                Expected delivery <span className="text-foreground-muted/70 font-normal">(optional)</span>
                            </label>
                            <DatePickerField
                                id="po-expected-date"
                                value={formData.expectedDate}
                                onChange={(expectedDate) =>
                                    setFormData((prev) => ({ ...prev, expectedDate }))
                                }
                                min={formData.date || undefined}
                                allowClear
                                placeholder="Select expected delivery"
                            />
                        </div>
                    </div>
                </FormSection>

                <DocumentLineItemsSection
                    idPrefix="po"
                    docLabel="purchase order"
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
                    showStockWarnings={false}
                    productPriceField="unitCost"
                    rateLabel="Unit cost"
                />

                <FormSection title="Notes" description="Optional instructions for your records">
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        className={inputClass(false, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Delivery notes, reference numbers, etc."
                    />
                </FormSection>

                <div className="card flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-foreground-muted">Estimated total</p>
                        <p className="text-xl font-bold text-foreground">
                            {formatCurrency(totals.subtotal, formData.currency)}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-primary"
                        disabled={saving}
                        onClick={persist}
                    >
                        Place order
                    </button>
                </div>
            </div>
        </div>
    );
}
