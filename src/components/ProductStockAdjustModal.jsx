import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import Spinner from './Spinner';
import ModalShell from './ModalShell';
import FieldValidationMessage from './FieldValidationMessage';
import RequiredLabel from './RequiredLabel';
import { inputClass, focusFieldById } from '../utils/formFieldValidation';

export default function ProductStockAdjustModal({
    open,
    onClose,
    product,
    allowOverselling = false,
    onSubmit,
}) {
    const [delta, setDelta] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setDelta('');
            setError('');
            setSaving(false);
        }
    }, [open, product?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parsed = Number(delta);
        if (!Number.isFinite(parsed) || parsed === 0) {
            setError('Enter a non-zero adjustment amount.');
            focusFieldById('product-stock-delta');
            return;
        }
        if (!allowOverselling && parsed < 0) {
            const nextQty = Number(product.quantityOnHand ?? 0) + parsed;
            if (nextQty < 0) {
                setError(`Cannot remove more than ${product.quantityOnHand ?? 0} units.`);
                focusFieldById('product-stock-delta');
                return;
            }
        }
        setError('');
        setSaving(true);
        try {
            await onSubmit(parsed);
        } finally {
            setSaving(false);
        }
    };

    if (!product) return null;

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            size="sm"
            showClose
            ariaLabelledby="product-stock-modal-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <PackagePlus className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <div>
                        <h2 id="product-stock-modal-title" className="text-lg font-semibold text-zinc-900">
                            Adjust stock
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            {product.name} · currently {product.quantityOnHand ?? 0} in stock
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div>
                    <RequiredLabel htmlFor="product-stock-delta">Adjustment</RequiredLabel>
                    <input
                        id="product-stock-delta"
                        type="number"
                        step="1"
                        value={delta}
                        onChange={(e) => {
                            setDelta(e.target.value);
                            setError('');
                        }}
                        className={inputClass(Boolean(error))}
                        placeholder="e.g. 10 or -3"
                        aria-invalid={Boolean(error)}
                    />
                    <p className="text-xs text-zinc-500 mt-1.5">
                        {allowOverselling
                            ? 'Use positive numbers to add stock and negative numbers to remove stock.'
                            : 'Use positive numbers to add stock. Removals cannot exceed the current quantity.'}
                    </p>
                    <FieldValidationMessage message={error} />
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
                        ) : (
                            'Apply adjustment'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
