import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, TrendingUp } from 'lucide-react';
import ModalShell from './ModalShell';
import Spinner from './Spinner';
import AmountInput from './AmountInput';
import { formatCurrency } from '../utils/currency';
import { computeCatalogMargin, formatMarginPercent } from '../utils/margin';

function roundSellingPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return '';
    return Math.round(n * 100) / 100;
}

function buildInitialRows(prompts) {
    return (prompts || []).map((prompt) => {
        const suggested = roundSellingPrice(prompt.suggestedUnitPrice);
        return {
            productId: prompt.productId,
            productName: prompt.productName,
            previousUnitCost: prompt.previousUnitCost,
            newUnitCost: prompt.newUnitCost,
            poLineRate: prompt.poLineRate,
            previousUnitPrice: prompt.previousUnitPrice,
            suggestedUnitPrice: suggested,
            poRateDiffersFromSavedCost: prompt.poRateDiffersFromSavedCost,
            catalogCostChanged: prompt.catalogCostChanged,
            unitPrice: suggested || prompt.previousUnitPrice || '',
            selected: Boolean(suggested) || prompt.previousUnitPrice > 0,
        };
    });
}

function CostStep({ label, value, emphasize = false }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted mb-1">
                {label}
            </p>
            <p
                className={`text-sm tabular-nums truncate ${
                    emphasize ? 'font-semibold text-foreground' : 'text-foreground-muted'
                }`}
            >
                {formatCurrency(value)}
            </p>
        </div>
    );
}

function SelectionCheckbox({ id, checked, onChange, disabled = false }) {
    return (
        <label
            htmlFor={id}
            className={`relative mt-0.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-colors ${
                checked
                    ? 'border-brand bg-brand text-white shadow-sm'
                    : 'border-border bg-surface hover:border-brand/40'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <input
                id={id}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="peer sr-only"
            />
            <Check
                size={13}
                strokeWidth={3}
                aria-hidden
                className={`transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
            />
        </label>
    );
}

function ProductPriceRow({ row, currency, saving, onRowChange }) {
    const referenceCost = row.catalogCostChanged ? row.newUnitCost : row.poLineRate;
    const margin = computeCatalogMargin(row.unitPrice, referenceCost);
    const previousMargin = computeCatalogMargin(row.previousUnitPrice, row.previousUnitCost);
    const showSuggestedReset =
        row.selected &&
        row.suggestedUnitPrice &&
        Number(row.unitPrice) !== Number(row.suggestedUnitPrice);

    return (
        <div
            className={`rounded-xl border transition-colors ${
                row.selected
                    ? 'border-brand/30 bg-brand-subtle/20 dark:bg-[rgb(var(--brand-ring)/0.08)]'
                    : 'border-border bg-surface-muted/30 opacity-80'
            }`}
        >
            <div className="p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <SelectionCheckbox
                        id={`adjust-price-${row.productId}`}
                        checked={row.selected}
                        disabled={saving}
                        onChange={(selected) =>
                            onRowChange(row.productId, { selected })
                        }
                    />
                    <div className="flex-1 min-w-0">
                        <label
                            htmlFor={`adjust-price-${row.productId}`}
                            className="text-base font-semibold text-foreground cursor-pointer"
                        >
                            {row.productName}
                        </label>
                        {row.poRateDiffersFromSavedCost && row.catalogCostChanged ? (
                            <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                                Received at a different price — your catalog cost was recalculated
                                using stock on hand.
                            </p>
                        ) : row.catalogCostChanged ? (
                            <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                                Catalog cost updated after stock was received.
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                                PO line cost differs from what was saved on this product.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-surface/80 p-3 sm:p-4">
                    <p className="text-xs font-medium text-foreground-muted mb-3">Unit cost</p>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <CostStep label="Before" value={row.previousUnitCost} />
                        <ArrowRight
                            size={16}
                            className="shrink-0 text-foreground-muted/60 mt-4"
                            aria-hidden
                        />
                        <CostStep
                            label="After receive"
                            value={row.newUnitCost}
                            emphasize={row.catalogCostChanged}
                        />
                    </div>
                    {row.poRateDiffersFromSavedCost ? (
                        <p className="mt-3 pt-3 border-t border-border/50 text-xs text-foreground-muted">
                            PO line rate:{' '}
                            <span className="font-medium text-foreground tabular-nums">
                                {formatCurrency(row.poLineRate, currency)}
                            </span>
                        </p>
                    ) : null}
                </div>

                <div className="rounded-lg border border-border/60 bg-surface/80 p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-foreground-muted">Selling price</p>
                        {row.selected && margin.marginPercent != null ? (
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                                    margin.marginPercent >= (previousMargin.marginPercent ?? 0)
                                        ? 'bg-green-50 text-green-800 border border-green-200/70 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/50'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                                }`}
                            >
                                {formatMarginPercent(margin.marginPercent)} margin
                            </span>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                        <div>
                            <p className="text-[11px] text-foreground-muted mb-1.5">Current</p>
                            <p className="text-sm font-medium text-foreground tabular-nums">
                                {row.previousUnitPrice > 0
                                    ? formatCurrency(row.previousUnitPrice, currency)
                                    : 'Not set'}
                            </p>
                            {previousMargin.marginPercent != null ? (
                                <p className="mt-1 text-[11px] text-foreground-muted tabular-nums">
                                    Was {formatMarginPercent(previousMargin.marginPercent)} margin
                                </p>
                            ) : null}
                        </div>

                        <ArrowRight
                            size={16}
                            className="hidden sm:block text-foreground-muted/60 mb-2"
                            aria-hidden
                        />

                        <div>
                            <label
                                htmlFor={`adjust-price-input-${row.productId}`}
                                className="text-[11px] text-foreground-muted mb-1.5 block"
                            >
                                Suggested new price
                            </label>
                            <AmountInput
                                id={`adjust-price-input-${row.productId}`}
                                value={row.unitPrice}
                                onChange={(value) =>
                                    onRowChange(row.productId, { unitPrice: value })
                                }
                                numeric
                                disabled={!row.selected || saving}
                                className="w-full"
                            />
                            {showSuggestedReset ? (
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                        onRowChange(row.productId, {
                                            unitPrice: row.suggestedUnitPrice,
                                        })
                                    }
                                    className="mt-1.5 text-[11px] font-medium text-brand hover:underline disabled:opacity-50"
                                >
                                    Use suggested ({formatCurrency(row.suggestedUnitPrice, currency)})
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdjustSellingPriceModal({
    open,
    onClose,
    prompts = [],
    currency,
    onSubmit,
}) {
    const [rows, setRows] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setRows(buildInitialRows(prompts));
            setSaving(false);
        }
    }, [open, prompts]);

    const selectedCount = useMemo(() => rows.filter((row) => row.selected).length, [rows]);
    const allSelected = rows.length > 0 && selectedCount === rows.length;

    const selectedUpdates = useMemo(
        () =>
            rows
                .filter((row) => row.selected)
                .map((row) => ({
                    productId: row.productId,
                    unitPrice: Number(row.unitPrice) || 0,
                }))
                .filter((row) => row.unitPrice > 0),
        [rows]
    );

    const handleRowChange = (productId, patch) => {
        setRows((prev) =>
            prev.map((row) => (row.productId === productId ? { ...row, ...patch } : row))
        );
    };

    const handleToggleAll = () => {
        const next = !allSelected;
        setRows((prev) => prev.map((row) => ({ ...row, selected: next })));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedUpdates.length === 0) {
            onClose();
            return;
        }
        setSaving(true);
        try {
            await onSubmit(selectedUpdates);
        } finally {
            setSaving(false);
        }
    };

    if (!open || rows.length === 0) return null;

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onClose}
            size="lg"
            showClose
            ariaLabelledby="adjust-selling-price-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <TrendingUp className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <div>
                        <h2 id="adjust-selling-price-title" className="text-lg font-semibold text-foreground">
                            Review selling prices
                        </h2>
                        <p className="text-sm text-foreground-muted mt-1 leading-relaxed">
                            {rows.length === 1
                                ? '1 product had a cost change after receive.'
                                : `${rows.length} products had cost changes after receive.`}{' '}
                            Adjust selling prices to keep your margins, or skip for now.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                {rows.length > 1 ? (
                    <div className="px-6 pt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-foreground-muted">
                            {selectedCount} of {rows.length} selected
                        </p>
                        <button
                            type="button"
                            onClick={handleToggleAll}
                            disabled={saving}
                            className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
                        >
                            {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    </div>
                ) : null}

                <div className="p-6 pt-4 space-y-4 max-h-[min(32rem,62vh)] overflow-y-auto">
                    {rows.map((row) => (
                        <ProductPriceRow
                            key={row.productId}
                            row={row}
                            currency={currency}
                            saving={saving}
                            onRowChange={handleRowChange}
                        />
                    ))}
                </div>

                <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3 border-t border-border/50 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="btn-secondary flex-1"
                    >
                        Not now
                    </button>
                    <button
                        type="submit"
                        disabled={saving || selectedUpdates.length === 0}
                        className="btn-primary flex-1"
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" inline />
                                Updating…
                            </>
                        ) : selectedUpdates.length > 0 ? (
                            `Update ${selectedUpdates.length} price${selectedUpdates.length === 1 ? '' : 's'}`
                        ) : (
                            'Update prices'
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
