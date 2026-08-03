import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, List, Package } from 'lucide-react';
import FormSection from '../FormSection';
import LineItemEditor from './LineItemEditor';
import LineItemSummaryCard from './LineItemSummaryCard';
import CustomSelect from '../CustomSelect';
import { formatCurrency } from '../../utils/currency';

function firstItemErrorIndex(fieldErrors) {
    const match = Object.keys(fieldErrors).find((key) => key.startsWith('item-'));
    if (!match) return null;
    const index = Number.parseInt(match.split('-')[1], 10);
    return Number.isNaN(index) ? null : index;
}

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
    const items = formData.items || [];
    const itemsLength = items.length;
    const prevItemsLengthRef = useRef(itemsLength);

    const [activeIndex, setActiveIndex] = useState(() => Math.max(0, itemsLength - 1));

    useEffect(() => {
        if (itemsLength > prevItemsLengthRef.current) {
            setActiveIndex(itemsLength - 1);
        } else if (activeIndex >= itemsLength) {
            setActiveIndex(Math.max(0, itemsLength - 1));
        }
        prevItemsLengthRef.current = itemsLength;
    }, [itemsLength, activeIndex]);

    useEffect(() => {
        const errorIndex = firstItemErrorIndex(fieldErrors);
        if (errorIndex != null && errorIndex !== activeIndex) {
            setActiveIndex(errorIndex);
        }
    }, [fieldErrors, activeIndex]);

    const handleAddItem = useCallback(() => {
        onAddItem();
    }, [onAddItem]);

    const handleRemoveItem = useCallback(
        (index) => {
            onRemoveItem(index);
            setActiveIndex((current) => {
                const nextLength = itemsLength - 1;
                if (nextLength <= 0) return 0;
                if (index < current) return current - 1;
                if (index === current) return Math.min(current, nextLength - 1);
                return current;
            });
        },
        [onRemoveItem, itemsLength]
    );

    const handleEditItem = useCallback((index) => {
        setActiveIndex(index);
    }, []);

    const savedItemIndices = items
        .map((_, index) => index)
        .filter((index) => index !== activeIndex);

    const activeItem = items[activeIndex];
    const showSavedItems = savedItemIndices.length > 0;

    return (
        <FormSection
            icon={List}
            title="Items"
            description={`Products or services on this ${docLabel}`}
        >
            {activeItem ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                    <div className="mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Current item
                        </span>
                    </div>
                    <LineItemEditor
                        idPrefix={idPrefix}
                        index={activeIndex}
                        item={activeItem}
                        currency={formData.currency}
                        fieldErrors={fieldErrors}
                        onItemChange={onItemChange}
                        onUnitChange={onUnitChange}
                        onCurrencyChange={onCurrencyChange}
                    />
                </div>
            ) : null}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-secondary text-sm py-2 px-3 w-full sm:w-auto"
                >
                    <Plus size={16} aria-hidden />
                    Add item
                </button>
            </div>

            {products.length > 0 ? (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl border border-brand/20 bg-brand-subtle/30">
                    <div className="flex-1 min-w-0">
                        <label htmlFor={`${idPrefix}-product-pick`} className="label">
                            Add from product
                        </label>
                        <CustomSelect
                            id={`${idPrefix}-product-pick`}
                            value=""
                            onChange={(productId) => {
                                if (productId) onAddProductItem(productId, activeIndex);
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
                <p className="mt-3 text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                    Save products in{' '}
                    <Link to="/products" className="text-brand font-medium hover:underline">
                        Products
                    </Link>{' '}
                    to add line items in one click.
                </p>
            )}

            {showSavedItems ? (
                <div className="mt-6 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Added items ({savedItemIndices.length})
                    </p>
                    <div className="space-y-2">
                        {savedItemIndices.map((index) => (
                            <LineItemSummaryCard
                                key={index}
                                index={index}
                                item={items[index]}
                                currency={formData.currency}
                                onEdit={handleEditItem}
                                onRemove={handleRemoveItem}
                                canRemove={itemsLength > 1}
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </FormSection>
    );
}
