import { Link } from 'react-router-dom';
import { Plus, X, List, Package } from 'lucide-react';
import FormSection from '../FormSection';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import CustomSelect from '../CustomSelect';
import { inputClass } from '../../utils/formFieldValidation';
import {
    APP_CURRENCY,
    formatCurrency,
    getCurrencySelectOptions,
    normalizeCurrency,
} from '../../utils/currency';
import {
    buildUnitSelectOptions,
    normalizeInvoiceUnit,
} from '@waraqah/shared';

export default function DocumentLineItemsSection({
    idPrefix,
    docLabel,
    formData,
    fieldErrors,
    products,
    onItemChange,
    onUnitChange,
    onCurrencyChange,
    onAddItem,
    onRemoveItem,
    onAddProductItem,
}) {
    return (
        <FormSection
            icon={List}
            title="Items"
            description={`Products or services on this ${docLabel}`}
            actions={
                <button type="button" onClick={onAddItem} className="btn-secondary text-sm py-2 px-3">
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
                                    onClick={() => onRemoveItem(index)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label={`Remove item ${index + 1}`}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <RequiredLabel htmlFor={`${idPrefix}-item-${index}-description`}>
                                    Description
                                </RequiredLabel>
                                <textarea
                                    id={`${idPrefix}-item-${index}-description`}
                                    value={item.description}
                                    onChange={(e) =>
                                        onItemChange(index, 'description', e.target.value)
                                    }
                                    className={inputClass(
                                        Boolean(fieldErrors[`item-${index}-description`]),
                                        'resize-none min-h-[72px]'
                                    )}
                                    rows={2}
                                    placeholder="Service or product"
                                    aria-invalid={Boolean(fieldErrors[`item-${index}-description`])}
                                />
                                <FieldValidationMessage
                                    message={fieldErrors[`item-${index}-description`]}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <RequiredLabel htmlFor={`${idPrefix}-item-${index}-unit`}>
                                        Unit
                                    </RequiredLabel>
                                    <div className="flex gap-2">
                                        <CustomSelect
                                            id={`${idPrefix}-item-${index}-unit`}
                                            value={normalizeInvoiceUnit(item.unit)}
                                            onChange={(value) => onUnitChange(index, value)}
                                            options={buildUnitSelectOptions(item.unit)}
                                            aria-label={`Unit for item ${index + 1}`}
                                            className="min-w-0 flex-1"
                                        />
                                        <input
                                            id={`${idPrefix}-item-${index}-quantity`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                onItemChange(index, 'quantity', e.target.value)
                                            }
                                            className={`${inputClass(
                                                Boolean(fieldErrors[`item-${index}-quantity`])
                                            )} w-[4.75rem] shrink-0`}
                                            min="1"
                                            aria-label={`${normalizeInvoiceUnit(item.unit)} for item ${index + 1}`}
                                            aria-invalid={Boolean(fieldErrors[`item-${index}-quantity`])}
                                        />
                                    </div>
                                    <FieldValidationMessage
                                        message={fieldErrors[`item-${index}-quantity`]}
                                    />
                                </div>
                                <div>
                                    <RequiredLabel htmlFor={`${idPrefix}-item-${index}-rate`}>
                                        Rate
                                    </RequiredLabel>
                                    <div className="flex gap-2">
                                        <CustomSelect
                                            id={`${idPrefix}-item-${index}-currency`}
                                            value={normalizeCurrency(formData.currency || APP_CURRENCY)}
                                            onChange={onCurrencyChange}
                                            options={getCurrencySelectOptions()}
                                            aria-label={`Currency for rate on item ${index + 1}`}
                                            className="w-[5.75rem] shrink-0"
                                        />
                                        <input
                                            id={`${idPrefix}-item-${index}-rate`}
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) =>
                                                onItemChange(index, 'rate', e.target.value)
                                            }
                                            className={`${inputClass(
                                                Boolean(fieldErrors[`item-${index}-rate`])
                                            )} min-w-0 flex-1`}
                                            min="0"
                                            step="0.01"
                                            aria-invalid={Boolean(fieldErrors[`item-${index}-rate`])}
                                        />
                                    </div>
                                    <FieldValidationMessage
                                        message={fieldErrors[`item-${index}-rate`]}
                                    />
                                </div>
                                <div className="flex flex-col justify-end min-w-0">
                                    <span className="label">Amount</span>
                                    <p className="text-base font-semibold text-zinc-900 py-2.5 tabular-nums break-all">
                                        {formatCurrency(item.quantity * item.rate, formData.currency)}
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
                        <label htmlFor={`${idPrefix}-product-pick`} className="label">
                            Add from product
                        </label>
                        <CustomSelect
                            id={`${idPrefix}-product-pick`}
                            value=""
                            onChange={(productId) => {
                                if (productId) onAddProductItem(productId);
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
    );
}
