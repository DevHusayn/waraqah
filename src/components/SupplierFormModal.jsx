import { useEffect, useState } from 'react';
import { Truck, Pencil } from 'lucide-react';
import Spinner from './Spinner';
import ModalShell from './ModalShell';
import FieldValidationMessage from './FieldValidationMessage';
import RequiredLabel from './RequiredLabel';
import {
    validateRequired,
    validateOptionalEmail,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';
import { REPLAY_MASK } from '@waraqah/shared';

const SUPPLIER_FIELD_ORDER = ['name', 'email'];

const EMPTY_SUPPLIER = {
    name: '',
    business: '',
    email: '',
    phone: '',
    address: '',
};

function buildSupplierFieldErrors(formData) {
    return {
        name: validateRequired(formData.name, "Please enter the supplier's name."),
        email: validateOptionalEmail(formData.email, 'Please enter a valid email address.'),
    };
}

export default function SupplierFormModal({
    open,
    onClose,
    onSubmit,
    editingSupplier,
    initialData = EMPTY_SUPPLIER,
}) {
    const [formData, setFormData] = useState(EMPTY_SUPPLIER);
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
        const errors = buildSupplierFieldErrors(formData);
        const firstInvalid = firstFieldError(errors, SUPPLIER_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(firstInvalid === 'name' ? 'supplier-name' : 'supplier-email');
            return;
        }
        setFieldErrors({});
        setSaving(true);
        try {
            await onSubmit(formData, editingSupplier);
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(editingSupplier);

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            size="md"
            showClose
            ariaLabelledby="supplier-modal-title"
            panelClassName="sm:max-h-[85vh]"
        >
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        {isEdit ? (
                            <Pencil className="h-5 w-5 text-brand" aria-hidden />
                        ) : (
                            <Truck className="h-5 w-5 text-brand" aria-hidden />
                        )}
                    </div>
                    <div>
                        <h2 id="supplier-modal-title" className="text-lg font-semibold text-zinc-900">
                            {isEdit ? 'Edit supplier' : 'Add supplier'}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Vendors you buy stock or materials from
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className={`p-6 space-y-4 ${REPLAY_MASK.NO_CAPTURE}`}>
                <div>
                    <RequiredLabel htmlFor="supplier-name">Supplier name</RequiredLabel>
                    <input
                        id="supplier-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass(Boolean(fieldErrors.name))}
                        placeholder="Wholesale Foods Ltd"
                        aria-invalid={Boolean(fieldErrors.name)}
                    />
                    <FieldValidationMessage message={fieldErrors.name} />
                </div>

                <div>
                    <label htmlFor="supplier-business" className="label">
                        Company name{' '}
                        <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                        id="supplier-business"
                        type="text"
                        name="business"
                        value={formData.business}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Registered company name"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="supplier-email" className="label">
                            Email <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="supplier-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputClass(Boolean(fieldErrors.email))}
                            placeholder="orders@supplier.com"
                            aria-invalid={Boolean(fieldErrors.email)}
                        />
                        <FieldValidationMessage message={fieldErrors.email} />
                    </div>
                    <div>
                        <label htmlFor="supplier-phone" className="label">
                            Phone <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="supplier-phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="+234 800 000 0000"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="supplier-address" className="label">
                        Address <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="supplier-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={inputClass(false, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Street, city, state"
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
                            'Add supplier'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export { EMPTY_SUPPLIER };
