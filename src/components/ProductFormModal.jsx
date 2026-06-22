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

const PRODUCT_FIELD_ORDER = ['name'];

export const EMPTY_PRODUCT = {
    name: '',
    description: '',
    unitPrice: '',
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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

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
                    unitPrice: Number(formData.unitPrice) || 0,
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
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        {isEdit ? (
                            <Pencil className="h-5 w-5 text-brand" aria-hidden />
                        ) : (
                            <Package className="h-5 w-5 text-brand" aria-hidden />
                        )}
                    </div>
                    <div>
                        <h2 id="product-modal-title" className="text-lg font-semibold text-zinc-900">
                            {isEdit ? 'Edit product' : 'Add product'}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Saved to your catalog for quick invoice line items
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
                        Description <span className="text-zinc-400 font-normal">(optional)</span>
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
                <div>
                    <label htmlFor="product-unitPrice" className="label">
                        Unit price (NGN)
                    </label>
                    <input
                        id="product-unitPrice"
                        type="number"
                        name="unitPrice"
                        min="0"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="0.00"
                    />
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
