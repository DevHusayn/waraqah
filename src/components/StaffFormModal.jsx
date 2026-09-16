import { useEffect, useState } from 'react';
import { Pencil, Users } from 'lucide-react';
import { REPLAY_MASK } from '@waraqah/shared';
import ModalShell from './ModalShell';
import Spinner from './Spinner';
import RequiredLabel from './RequiredLabel';
import AmountInput from './AmountInput';
import FieldValidationMessage from './FieldValidationMessage';
import { parseAmountInput } from '../utils/numberInput';
import {
    validateRequired,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';

const STAFF_FIELD_ORDER = ['name', 'role', 'salary'];

export const EMPTY_STAFF = {
    name: '',
    role: '',
    salary: '',
    isActive: true,
};

function buildStaffFieldErrors(formData) {
    const salary = parseAmountInput(formData.salary);
    return {
        name: validateRequired(formData.name?.trim(), 'Please enter a name.'),
        role: validateRequired(formData.role?.trim(), 'Please enter a role.'),
        salary:
            !Number.isFinite(salary) || salary <= 0
                ? 'Please enter a salary greater than zero.'
                : '',
    };
}

export default function StaffFormModal({
    open,
    onClose,
    onSubmit,
    onDelete,
    deleting = false,
    editingStaff,
    initialData = EMPTY_STAFF,
}) {
    const [formData, setFormData] = useState(EMPTY_STAFF);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData(initialData);
            setFieldErrors({});
            setSaving(false);
        }
    }, [open, initialData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

    const handleSalaryChange = (value) => {
        setFormData((prev) => ({ ...prev, salary: value }));
        clearFieldError(setFieldErrors, 'salary');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = buildStaffFieldErrors(formData);
        setFieldErrors(errors);
        const firstError = firstFieldError(errors, STAFF_FIELD_ORDER);
        if (firstError) {
            focusFieldById(`staff-${firstError}`);
            return;
        }

        setSaving(true);
        try {
            await onSubmit({
                name: formData.name.trim(),
                role: formData.role.trim(),
                salary: parseAmountInput(formData.salary),
                isActive: formData.isActive !== false,
            });
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(editingStaff);
    const busy = saving || deleting;

    return (
        <ModalShell
            open={open}
            onClose={busy ? undefined : onClose}
            size="md"
            showClose
            scrollable
            ariaLabelledby="staff-modal-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        {isEdit ? (
                            <Pencil className="h-5 w-5 text-brand" aria-hidden />
                        ) : (
                            <Users className="h-5 w-5 text-brand" aria-hidden />
                        )}
                    </div>
                    <div>
                        <h2 id="staff-modal-title" className="text-lg font-semibold text-foreground">
                            {isEdit ? 'Edit staff' : 'Add staff'}
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            Name, role, and monthly salary
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className={`p-6 space-y-4 ${REPLAY_MASK.NO_CAPTURE}`}>
                <div>
                    <RequiredLabel htmlFor="staff-name">Name</RequiredLabel>
                    <input
                        id="staff-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputClass(Boolean(fieldErrors.name))}
                        placeholder="e.g. Ade Okunola "
                        autoComplete="off"
                        aria-invalid={Boolean(fieldErrors.name)}
                    />
                    <FieldValidationMessage message={fieldErrors.name} />
                </div>

                <div>
                    <RequiredLabel htmlFor="staff-role">Role</RequiredLabel>
                    <input
                        id="staff-role"
                        name="role"
                        type="text"
                        value={formData.role}
                        onChange={handleChange}
                        className={inputClass(Boolean(fieldErrors.role))}
                        placeholder="e.g. Designer, Driver"
                        autoComplete="off"
                        aria-invalid={Boolean(fieldErrors.role)}
                    />
                    <FieldValidationMessage message={fieldErrors.role} />
                </div>

                <div>
                    <RequiredLabel htmlFor="staff-salary">Monthly salary</RequiredLabel>
                    <AmountInput
                        id="staff-salary"
                        name="salary"
                        value={formData.salary}
                        onChange={handleSalaryChange}
                        error={Boolean(fieldErrors.salary)}
                        placeholder="0.00"
                    />
                    <FieldValidationMessage message={fieldErrors.salary} />
                </div>

                {isEdit ? (
                    <div className="flex items-center justify-between gap-3">
                        <label className="label mb-0" htmlFor="staff-active">
                            Active
                        </label>
                        <button
                            id="staff-active"
                            type="button"
                            role="switch"
                            aria-checked={formData.isActive !== false}
                            onClick={() =>
                                setFormData((prev) => ({ ...prev, isActive: prev.isActive === false }))
                            }
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${formData.isActive !== false ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-600'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-surface shadow ring-0 transition ${formData.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                ) : null}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    {isEdit && onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={busy}
                            className="btn-secondary flex-1 text-red-600 hover:text-red-700"
                        >
                            {deleting ? (
                                <>
                                    <Spinner size="sm" inline />
                                    Deleting…
                                </>
                            ) : (
                                'Delete'
                            )}
                        </button>
                    ) : (
                        <button type="button" onClick={onClose} disabled={busy} className="btn-secondary flex-1">
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={busy} className="btn-primary flex-1">
                        {saving ? (
                            <>
                                <Spinner size="sm" inline />
                                Saving…
                            </>
                        ) : isEdit ? (
                            'Save changes'
                        ) : (
                            'Add staff'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
