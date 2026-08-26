import { useEffect, useState } from 'react';
import { Package, Pencil } from 'lucide-react';
import Spinner from './Spinner';
import ModalShell from './ModalShell';
import FieldValidationMessage from './FieldValidationMessage';
import RequiredLabel from './RequiredLabel';
import {
    validateRequired,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';
import { parseAmountInput } from '../utils/numberInput';
import AmountInput from './AmountInput';
import { computeCatalogMargin, formatMarginPercent } from '../utils/margin';

const PRODUCT_FIELD_ORDER = ['name'];

export const EMPTY_PRODUCT = {
    name: '',
    description: '',
    unitPrice: '',
    unitCost: '',
    trackInventory: false,
    quantityOnHand: '',
    lowStockThreshold: '',
};

function buildProductFieldErrors(formData) {
    return {
        name: validateRequired(formData.name, 'Please enter a product name.'),
    };
}

export default function ProductFormModal({
    open,
    onClose,
    onSubmit,
    editingProduct,
    initialData = EMPTY_PRODUCT,
}) {
    const [formData, setFormData] = useState(EMPTY_PRODUCT);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData(initialData);
            setFieldErrors({});
            setSaving(false);
        }
    }, [open, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        clearFieldError(setFieldErrors, name);
    };

    const handleUnitPriceChange = (value) => {
        setFormData((prev) => ({ ...prev, unitPrice: value }));
        clearFieldError(setFieldErrors, 'unitPrice');
    };

    const handleUnitCostChange = (value) => {
        setFormData((prev) => ({ ...prev, unitCost: value }));
        clearFieldError(setFieldErrors, 'unitCost');
    };

    const marginPreview = computeCatalogMargin(
        parseAmountInput(formData.unitPrice),
        parseAmountInput(formData.unitCost)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = buildProductFieldErrors(formData);
        const firstInvalid = firstFieldError(errors, PRODUCT_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById('product-name');
            return;
        }
        setFieldErrors({});
        setSaving(true);
        try {
            await onSubmit(
                {
                    ...formData,
                    unitPrice: parseAmountInput(formData.unitPrice),
                    unitCost: parseAmountInput(formData.unitCost),
                    trackInventory: Boolean(formData.trackInventory),
                    quantityOnHand: formData.trackInventory
                        ? Number(formData.quantityOnHand) || 0
                        : 0,
                    lowStockThreshold:
                        formData.trackInventory && formData.lowStockThreshold !== ''
                            ? Number(formData.lowStockThreshold)
                            : null,
                },
                editingProduct
            );
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(editingProduct);

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            size="md"
            showClose
            ariaLabelledby="product-modal-title"
            panelClassName="sm:max-h-[85vh]"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        {isEdit ? (
                            <Pencil className="h-5 w-5 text-brand" aria-hidden />
                        ) : (
                            <Package className="h-5 w-5 text-brand" aria-hidden />
                        )}
                    </div>
                    <div>
                        <h2 id="product-modal-title" className="text-lg font-semibold text-foreground">
                            {isEdit ? 'Edit product' : 'Add product'}
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            Saved to your catalog for quick line items on any document
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div>
                    <RequiredLabel htmlFor="product-name">Product name</RequiredLabel>
                    <input
                        id="product-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass(Boolean(fieldErrors.name))}
                        placeholder="e.g. Website design"
                        aria-invalid={Boolean(fieldErrors.name)}
                    />
                    <FieldValidationMessage message={fieldErrors.name} />
                </div>
                <div>
                    <label htmlFor="product-description" className="label">
                        Description <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="product-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field resize-none min-h-[72px]"
                        rows={2}
                        placeholder="Short description for your reference"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="product-unitPrice" className="label">
                            Price (NGN)
                        </label>
                        <AmountInput
                            id="product-unitPrice"
                            name="unitPrice"
                            value={formData.unitPrice}
                            onChange={handleUnitPriceChange}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label htmlFor="product-unitCost" className="label">
                            Cost (NGN) <span className="text-foreground-muted/70 font-normal">(optional)</span>
                        </label>
                        <AmountInput
                            id="product-unitCost"
                            name="unitCost"
                            value={formData.unitCost}
                            onChange={handleUnitCostChange}
                            placeholder="0.00"
                        />
                    </div>
                </div>
                {marginPreview.marginPercent != null ? (
                    <p className="text-xs text-foreground-muted -mt-1">
                        Margin {formatMarginPercent(marginPreview.marginPercent)}
                        {' · '}
                        Markup {formatMarginPercent(marginPreview.markupPercent)}
                    </p>
                ) : null}

                <div className="rounded-xl border border-border bg-surface-muted/70 p-4 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="trackInventory"
                            checked={Boolean(formData.trackInventory)}
                            onChange={handleChange}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 text-brand focus:ring-brand"
                        />
                        <span>
                            <span className="block text-sm font-medium text-foreground">Track inventory</span>
                            <span className="block text-sm text-foreground-muted mt-0.5">
                                Reduce stock automatically when linked items are issued on invoices or receipts.
                            </span>
                        </span>
                    </label>

                    {formData.trackInventory ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="product-quantityOnHand" className="label">
                                    Quantity on hand
                                </label>
                                <input
                                    id="product-quantityOnHand"
                                    type="number"
                                    name="quantityOnHand"
                                    min="0"
                                    step="1"
                                    value={formData.quantityOnHand}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="product-lowStockThreshold" className="label">
                                    Low stock alert <span className="text-foreground-muted/70 font-normal">(optional)</span>
                                </label>
                                <input
                                    id="product-lowStockThreshold"
                                    type="number"
                                    name="lowStockThreshold"
                                    min="0"
                                    step="1"
                                    value={formData.lowStockThreshold}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. 5"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={saving} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                        {saving ? (
                            <>
                                <Spinner size="sm" inline />
                                Saving…
                            </>
                        ) : isEdit ? (
                            'Save changes'
                        ) : (
                            'Add product'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
