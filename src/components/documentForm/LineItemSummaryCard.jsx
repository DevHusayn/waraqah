import { Pencil, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { normalizeInvoiceUnit } from '@waraqah/shared';

export default function LineItemSummaryCard({
    index,
    item,
    currency,
    onEdit,
    onRemove,
    canRemove,
}) {
    const description = String(item.description || '').trim() || 'Untitled item';
    const unit = normalizeInvoiceUnit(item.unit);
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const lineTotal = quantity * rate;

    return (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3 hover:border-zinc-300 transition-colors">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                            {description}
                        </p>
                        <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
                            {formatCurrency(lineTotal, currency)}
                        </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-xs text-foreground-muted tabular-nums">
                            {quantity} {unit} × {formatCurrency(rate, currency)}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => onEdit(index)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-muted hover:text-brand hover:bg-brand-subtle/40 transition-colors"
                                aria-label={`Edit item ${index + 1}`}
                            >
                                <Pencil size={13} aria-hidden />
                                Edit
                            </button>
                            {canRemove ? (
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    aria-label={`Remove item ${index + 1}`}
                                >
                                    <X size={14} />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
