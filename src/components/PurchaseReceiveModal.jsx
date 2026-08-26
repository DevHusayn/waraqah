import { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import Spinner from './Spinner';
import RequiredLabel from './RequiredLabel';
import { inputClass } from '../utils/formFieldValidation';
import { formatCurrency } from '../utils/currency';

export default function PurchaseReceiveModal({ open, onClose, lines, currency, onSubmit }) {
    const [quantities, setQuantities] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setQuantities(
                lines.map((line) => ({
                    lineIndex: line.lineIndex,
                    quantity: line.remaining > 0 ? String(line.remaining) : '',
                }))
            );
            setSaving(false);
        }
    }, [open, lines]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const receiveLines = quantities
            .map((entry) => ({
                lineIndex: entry.lineIndex,
                quantity: Number(entry.quantity) || 0,
            }))
            .filter((entry) => entry.quantity > 0);

        if (receiveLines.length === 0) return;

        setSaving(true);
        try {
            await onSubmit(receiveLines);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell open={open} onClose={saving ? undefined : onClose} size="md" showClose ariaLabelledby="receive-po-title">
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <h2 id="receive-po-title" className="text-lg font-semibold text-foreground">
                    Receive stock
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                    Enter quantities received now. New items are added to your product catalog automatically.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {lines.map((line, index) => (
                    <div key={line.lineIndex} className="rounded-xl border border-border p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-medium text-foreground">{line.description || 'Line item'}</p>
                                <p className="text-xs text-foreground-muted mt-0.5">
                                    Ordered {line.ordered} · Received {line.received} · Remaining {line.remaining}
                                </p>
                            </div>
                            <p className="text-sm text-foreground-muted tabular-nums shrink-0">
                                {formatCurrency(line.rate || 0, currency)}
                            </p>
                        </div>
                        <div>
                            <RequiredLabel htmlFor={`receive-qty-${line.lineIndex}`}>
                                Receive now
                            </RequiredLabel>
                            <input
                                id={`receive-qty-${line.lineIndex}`}
                                type="number"
                                min="0"
                                max={line.remaining}
                                step="1"
                                value={quantities[index]?.quantity ?? ''}
                                onChange={(e) =>
                                    setQuantities((prev) =>
                                        prev.map((entry, i) =>
                                            i === index ? { ...entry, quantity: e.target.value } : entry
                                        )
                                    )
                                }
                                className={inputClass(false)}
                                placeholder="0"
                            />
                        </div>
                    </div>
                ))}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={saving} className="btn-secondary flex-1">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                        {saving ? (
                            <>
                                <Spinner size="sm" inline />
                                Receiving…
                            </>
                        ) : (
                            'Receive stock'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
