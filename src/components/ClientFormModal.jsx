import { useEffect, useState } from 'react';
import { UserPlus, Pencil } from 'lucide-react';
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

const CLIENT_FIELD_ORDER = ['name', 'email'];

const EMPTY_CLIENT = {
    name: '',
    business: '',
    email: '',
    phone: '',
    address: '',
};

function buildClientFieldErrors(formData) {
    return {
        name: validateRequired(formData.name, "Please enter the client's full name."),
        email: validateOptionalEmail(formData.email, 'Please enter a valid email address.'),
    };
}

export default function ClientFormModal({
    open,
    onClose,
    onSubmit,
    editingClient,
    initialData = EMPTY_CLIENT,
}) {
    const [formData, setFormData] = useState(EMPTY_CLIENT);
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
        const errors = buildClientFieldErrors(formData);
        const firstInvalid = firstFieldError(errors, CLIENT_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(firstInvalid === 'name' ? 'client-name' : 'client-email');
            return;
        }
        setFieldErrors({});
        setSaving(true);
        try {
            await onSubmit(formData, editingClient);
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(editingClient);

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            size="md"
            showClose
            ariaLabelledby="client-modal-title"
            panelClassName="sm:max-h-[85vh]"
        >
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        {isEdit ? (
                            <Pencil className="h-5 w-5 text-brand" aria-hidden />
                        ) : (
                            <UserPlus className="h-5 w-5 text-brand" aria-hidden />
                        )}
                    </div>
                    <div>
                        <h2 id="client-modal-title" className="text-lg font-semibold text-zinc-900">
                            {isEdit ? 'Edit client' : 'Add client'}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Contact details used on invoices and receipts
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div>
                    <RequiredLabel htmlFor="client-name">Full name</RequiredLabel>
                    <input
                        id="client-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass(Boolean(fieldErrors.name))}
                        placeholder="John Doe"
                        aria-invalid={Boolean(fieldErrors.name)}
                    />
                    <FieldValidationMessage message={fieldErrors.name} />
                </div>

                <div>
                    <label htmlFor="client-business" className="label">
                        Business name{' '}
                        <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <input
                        id="client-business"
                        type="text"
                        name="business"
                        value={formData.business}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Company or trading name"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="client-email" className="label">
                            Email{' '}
                            <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="client-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputClass(Boolean(fieldErrors.email))}
                            placeholder="client@example.com"
                            aria-invalid={Boolean(fieldErrors.email)}
                        />
                        <FieldValidationMessage message={fieldErrors.email} />
                    </div>
                    <div>
                        <label htmlFor="client-phone" className="label">
                            Phone{' '}
                            <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="client-phone"
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
                    <label htmlFor="client-address" className="label">
                        Address <span className="text-zinc-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="client-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={inputClass(false, 'resize-none min-h-[88px]')}
                        rows={3}
                        placeholder="Street, city, state"
                    />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="btn-secondary flex-1"
                    >
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
                            'Add client'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

export { EMPTY_CLIENT };
