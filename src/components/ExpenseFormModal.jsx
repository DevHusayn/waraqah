import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Wallet, Pencil, Tag } from 'lucide-react';
import {
    EXPENSE_CATEGORIES,
    isPresetExpenseCategory,
    REPLAY_MASK,
} from '@waraqah/shared';
import Spinner from './Spinner';
import ModalShell from './ModalShell';
import DatePickerField from './DatePickerField';
import CustomSelect from './CustomSelect';
import FieldValidationMessage from './FieldValidationMessage';
import RequiredLabel from './RequiredLabel';
import AmountInput from './AmountInput';
import { parseAmountInput } from '../utils/numberInput';
import {
    validateRequired,
    firstFieldError,
    inputClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';

const EXPENSE_FIELD_ORDER = ['date', 'amount', 'category'];
export const CUSTOM_CATEGORY_VALUE = '__custom__';

export const EMPTY_EXPENSE = {
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: 'rent',
    vendor: '',
    description: '',
};

function resolveCategorySelectValue(category) {
    return isPresetExpenseCategory(category) ? category : CUSTOM_CATEGORY_VALUE;
}

function buildExpenseFieldErrors(formData) {
    const amount = parseAmountInput(formData.amount);
    return {
        date: validateRequired(formData.date, 'Please enter the expense date.'),
        amount:
            !Number.isFinite(amount) || amount <= 0
                ? 'Please enter an amount greater than zero.'
                : '',
        category: validateRequired(formData.category?.trim(), 'Please select or enter a category.'),
    };
}

export function buildDuplicateExpenseInitialData(
    expense,
    { summaryYear, summaryMonth, isCurrentPeriod }
) {
    const date = isCurrentPeriod
        ? format(new Date(), 'yyyy-MM-dd')
        : `${summaryYear}-${String(summaryMonth).padStart(2, '0')}-01`;

    return {
        date,
        amount: expense.amount ?? '',
        category: expense.category || EMPTY_EXPENSE.category,
        vendor: expense.vendor || '',
        description: expense.description || '',
    };
}

export default function ExpenseFormModal({
    open,
    onClose,
    onSubmit,
    editingExpense,
    initialData = EMPTY_EXPENSE,
}) {
    const [formData, setFormData] = useState(EMPTY_EXPENSE);
    const [categorySelectValue, setCategorySelectValue] = useState('rent');
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [customCategoryOpen, setCustomCategoryOpen] = useState(false);
    const [customCategoryInput, setCustomCategoryInput] = useState('');
    const [customCategoryError, setCustomCategoryError] = useState('');

    const categoryOptions = useMemo(() => {
        const presets = EXPENSE_CATEGORIES.map((category) => ({
            value: category.id,
            label: category.label,
        }));
        const customLabel =
            formData.category && !isPresetExpenseCategory(formData.category)
                ? formData.category
                : 'Custom';

        return [...presets, { value: CUSTOM_CATEGORY_VALUE, label: customLabel }];
    }, [formData.category]);

    useEffect(() => {
        if (open) {
            setFormData(initialData);
            setCategorySelectValue(resolveCategorySelectValue(initialData.category));
            setFieldErrors({});
            setSaving(false);
            setCustomCategoryOpen(false);
            setCustomCategoryInput('');
            setCustomCategoryError('');
        }
    }, [open, initialData]);

    const handleAmountChange = (value) => {
        setFormData((prev) => ({ ...prev, amount: value }));
        clearFieldError(setFieldErrors, 'amount');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    };

    const handleDateChange = (date) => {
        setFormData((prev) => ({ ...prev, date }));
        clearFieldError(setFieldErrors, 'date');
    };

    const handleCategoryChange = (category) => {
        if (category === CUSTOM_CATEGORY_VALUE) {
            setCustomCategoryInput(
                formData.category && !isPresetExpenseCategory(formData.category)
                    ? formData.category
                    : ''
            );
            setCustomCategoryError('');
            setCategorySelectValue(CUSTOM_CATEGORY_VALUE);
            setCustomCategoryOpen(true);
            return;
        }

        setCategorySelectValue(category);
        setFormData((prev) => ({ ...prev, category }));
        clearFieldError(setFieldErrors, 'category');
    };

    const closeCustomCategoryModal = () => {
        setCustomCategoryOpen(false);
        setCustomCategoryError('');
        setCategorySelectValue(resolveCategorySelectValue(formData.category));
    };

    const saveCustomCategory = () => {
        const text = customCategoryInput.trim();
        if (!text) {
            setCustomCategoryError('Please enter a category name.');
            focusFieldById('expense-custom-category');
            return;
        }

        setFormData((prev) => ({ ...prev, category: text }));
        setCategorySelectValue(CUSTOM_CATEGORY_VALUE);
        clearFieldError(setFieldErrors, 'category');
        setCustomCategoryOpen(false);
        setCustomCategoryError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = buildExpenseFieldErrors(formData);
        setFieldErrors(errors);
        const firstError = firstFieldError(errors, EXPENSE_FIELD_ORDER);
        if (firstError) {
            if (firstError === 'category' && categorySelectValue === CUSTOM_CATEGORY_VALUE) {
                setCustomCategoryInput(
                    formData.category && !isPresetExpenseCategory(formData.category)
                        ? formData.category
                        : ''
                );
                setCustomCategoryOpen(true);
            }
            focusFieldById(firstError);
            return;
        }

        setSaving(true);
        try {
            await onSubmit(
                {
                    date: formData.date,
                    amount: parseAmountInput(formData.amount),
                    category: formData.category.trim(),
                    vendor: formData.vendor.trim(),
                    description: formData.description.trim(),
                },
                editingExpense
            );
        } finally {
            setSaving(false);
        }
    };

    const isEdit = Boolean(editingExpense);

    return (
        <>
            <ModalShell
                open={open}
                onClose={saving ? undefined : onClose}
                size="md"
                showClose
                scrollable={false}
                ariaLabelledby="expense-modal-title"
            >
                <div className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-start gap-3 pr-8">
                        <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                            {isEdit ? (
                                <Pencil className="h-5 w-5 text-brand" aria-hidden />
                            ) : (
                                <Wallet className="h-5 w-5 text-brand" aria-hidden />
                            )}
                        </div>
                        <div>
                            <h2 id="expense-modal-title" className="text-lg font-semibold text-foreground">
                                {isEdit ? 'Edit expense' : 'Add expense'}
                            </h2>
                            <p className="text-sm text-foreground-muted mt-0.5">
                                Operating costs like rent, salaries, and utilities
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className={`p-6 space-y-4 ${REPLAY_MASK.NO_CAPTURE}`}>
                    <div>
                        <RequiredLabel htmlFor="expense-date">Date</RequiredLabel>
                        <DatePickerField
                            id="expense-date"
                            value={formData.date}
                            onChange={handleDateChange}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            allowClear={false}
                            placeholder="Expense date"
                            error={Boolean(fieldErrors.date)}
                        />
                        <FieldValidationMessage message={fieldErrors.date} />
                    </div>

                    <div>
                        <RequiredLabel htmlFor="expense-amount">Amount</RequiredLabel>
                        <AmountInput
                            id="expense-amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleAmountChange}
                            error={Boolean(fieldErrors.amount)}
                            placeholder="0.00"
                        />
                        <FieldValidationMessage message={fieldErrors.amount} />
                    </div>

                    <div>
                        <RequiredLabel htmlFor="expense-category">Category</RequiredLabel>
                        <CustomSelect
                            id="expense-category"
                            value={categorySelectValue}
                            onChange={handleCategoryChange}
                            options={categoryOptions}
                            placeholder="Select category"
                            error={Boolean(fieldErrors.category)}
                            leadingIcon={<Tag size={18} />}
                        />
                        <FieldValidationMessage message={fieldErrors.category} />
                    </div>

                    <div>
                        <label htmlFor="expense-vendor" className="label">
                            Paid to <span className="text-foreground-muted/70 font-normal">(optional)</span>
                        </label>
                        <input
                            id="expense-vendor"
                            name="vendor"
                            type="text"
                            value={formData.vendor}
                            onChange={handleChange}
                            className={inputClass(false)}
                            placeholder="Who was paid?"
                        />
                    </div>

                    <div>
                        <label htmlFor="expense-description" className="label">
                            Description <span className="text-foreground-muted/70 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="expense-description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className={inputClass(false, 'resize-none min-h-[88px]')}
                            placeholder="Optional notes about this expense"
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
                                'Add expense'
                            )}
                        </button>
                    </div>
                </form>
            </ModalShell>

            <ModalShell
                open={customCategoryOpen}
                onClose={closeCustomCategoryModal}
                size="sm"
                scrollable={false}
                className="z-[10000]"
                ariaLabelledby="expense-custom-category-title"
            >
                <div className="px-6 pt-6 pb-4 border-b border-border/50">
                    <h2 id="expense-custom-category-title" className="text-lg font-semibold text-foreground">
                        Custom category
                    </h2>
                    <p className="text-sm text-foreground-muted mt-0.5">
                        Enter a category that is not in the list
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveCustomCategory();
                    }}
                    className={`p-6 space-y-4 ${REPLAY_MASK.NO_CAPTURE}`}
                >
                    <div>
                        <RequiredLabel htmlFor="expense-custom-category">Category name</RequiredLabel>
                        <input
                            id="expense-custom-category"
                            type="text"
                            value={customCategoryInput}
                            onChange={(e) => {
                                setCustomCategoryInput(e.target.value);
                                if (customCategoryError) setCustomCategoryError('');
                            }}
                            className={inputClass(Boolean(customCategoryError))}
                            placeholder="e.g. Insurance, Repairs"
                            autoFocus
                            aria-invalid={Boolean(customCategoryError)}
                        />
                        <FieldValidationMessage message={customCategoryError} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                        <button type="button" onClick={closeCustomCategoryModal} className="btn-secondary flex-1">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex-1">
                            Save category
                        </button>
                    </div>
                </form>
            </ModalShell>
        </>
    );
}
