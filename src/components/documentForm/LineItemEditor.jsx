import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import CustomSelect from '../CustomSelect';
import LineItemDescriptionCombobox from './LineItemDescriptionCombobox';
import { inputClass } from '../../utils/formFieldValidation';
import AmountInput from '../AmountInput';
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
import { getLineItemStockWarning } from '../../utils/stockWarnings';
import { isOversellingAllowed } from '@waraqah/shared';

export default function LineItemEditor({
    idPrefix,
    index,
    item,
    currency,
    fieldErrors,
    errorPulse = 0,
    products = [],
    businessInfo,
    onItemChange,
    onUnitChange,
    onCurrencyChange,
    onApplyProduct,
    showStockWarnings = true,
    productPriceField = 'unitPrice',
    rateLabel = 'Rate',
}) {
    const normalizedCurrency = normalizeCurrency(currency || APP_CURRENCY);
    const [shake, setShake] = useState(false);
    const productSuggestionsEnabled = products.length > 0 && Boolean(onApplyProduct);

    const descError = Boolean(fieldErrors[`item-${index}-description`]);
    const qtyError = Boolean(fieldErrors[`item-${index}-quantity`]);
    const rateError = Boolean(fieldErrors[`item-${index}-rate`]);
    const hasItemError = descError || qtyError || rateError;
    const stockWarning = showStockWarnings
        ? getLineItemStockWarning(item, products, businessInfo)
        : null;
    const stockBlocksIssue = stockWarning && !isOversellingAllowed(businessInfo);

    useEffect(() => {
        if (!errorPulse || !hasItemError) return undefined;
        setShake(true);
        const timer = setTimeout(() => setShake(false), 450);
        return () => clearTimeout(timer);
    }, [errorPulse, hasItemError]);

    return (
        <div className="space-y-4">
            <div>
                <RequiredLabel htmlFor={`${idPrefix}-item-${index}-description`}>
                    Description
                </RequiredLabel>
                {productSuggestionsEnabled ? (
                    <LineItemDescriptionCombobox
                        id={`${idPrefix}-item-${index}-description`}
                        value={item.description}
                        products={products}
                        productPriceField={productPriceField}
                        currency={normalizedCurrency}
                        onDescriptionChange={(value) => {
                            onItemChange(index, 'description', value);
                            if (item.productId) {
                                onItemChange(index, 'productId', '');
                            }
                        }}
                        onSelectProduct={onApplyProduct}
                        error={descError}
                        shake={shake && descError}
                    />
                ) : (
                    <textarea
                        id={`${idPrefix}-item-${index}-description`}
                        value={item.description}
                        onChange={(e) => onItemChange(index, 'description', e.target.value)}
                        className={inputClass(descError, 'resize-none min-h-[72px]', {
                            shake: shake && descError,
                        })}
                        rows={2}
                        placeholder="Service or product"
                        aria-invalid={descError}
                    />
                )}
                <FieldValidationMessage message={fieldErrors[`item-${index}-description`]} />
                {productSuggestionsEnabled ? (
                    <p className="mt-1.5 text-xs text-foreground-muted">
                        Start typing to pick from saved products, or enter a custom description.
                    </p>
                ) : (
                    <p className="mt-1.5 text-xs text-foreground-muted">
                        Save products in{' '}
                        <Link to="/products" className="text-brand font-medium hover:underline">
                            Products
                        </Link>{' '}
                        to fill line items faster.
                    </p>
                )}
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
                            onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                            className={inputClass(qtyError, 'w-[4.75rem] shrink-0', {
                                shake: shake && qtyError,
                            })}
                            min="1"
                            aria-label={`${normalizeInvoiceUnit(item.unit)} for item ${index + 1}`}
                            aria-invalid={qtyError}
                        />
                    </div>
                    <FieldValidationMessage message={fieldErrors[`item-${index}-quantity`]} />
                    {stockWarning ? (
                        <p className={`mt-1.5 text-xs ${stockBlocksIssue ? 'text-red-700' : 'text-amber-700'}`}>
                            {stockWarning}
                        </p>
                    ) : null}
                </div>
                <div>
                    <RequiredLabel htmlFor={`${idPrefix}-item-${index}-rate`}>
                        {rateLabel}
                    </RequiredLabel>
                    <div className="flex gap-2">
                        <CustomSelect
                            id={`${idPrefix}-item-${index}-currency`}
                            value={normalizedCurrency}
                            onChange={onCurrencyChange}
                            options={getCurrencySelectOptions()}
                            aria-label={`Currency for rate on item ${index + 1}`}
                            className="w-[5.75rem] shrink-0"
                        />
                        <AmountInput
                            id={`${idPrefix}-item-${index}-rate`}
                            value={item.rate}
                            onChange={(value) => onItemChange(index, 'rate', value)}
                            numeric
                            error={rateError}
                            shake={shake}
                            className="min-w-0 flex-1"
                        />
                    </div>
                    <FieldValidationMessage message={fieldErrors[`item-${index}-rate`]} />
                </div>
                <div className="flex flex-col justify-end min-w-0">
                    <span className="label">Amount</span>
                    <p className="text-base font-semibold text-foreground py-2.5 tabular-nums break-all">
                        {formatCurrency(item.quantity * item.rate, normalizedCurrency)}
                    </p>
                </div>
            </div>
        </div>
    );
}
