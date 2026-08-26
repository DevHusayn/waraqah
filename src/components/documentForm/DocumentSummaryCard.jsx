import { formatCurrency } from '../../utils/currency';
import { getClientBusiness } from '../../utils/clientHelpers';

const MONEY_EPS = 0.009;

export default function DocumentSummaryCard({
    formData,
    selectedClient,
    totals,
    discountLabel,
    totalLabel,
    amountReceived,
}) {
    const received =
        amountReceived != null && Number.isFinite(amountReceived) ? amountReceived : null;
    const isPartial =
        received != null && totals.total > 0 && received + MONEY_EPS < totals.total;
    const balanceRemaining = isPartial
        ? Math.max(0, Math.round((totals.total - received) * 100) / 100)
        : 0;

    return (
        <div className="card space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Summary</h3>

            {formData.clientName.trim() && (
                <div className="p-4 rounded-xl bg-surface-muted border border-border/50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted/70 mb-1.5">
                        Bill to
                    </p>
                    <p className="font-semibold text-foreground">{formData.clientName}</p>
                    {selectedClient && getClientBusiness(selectedClient) && (
                        <p className="text-sm text-foreground-muted mt-0.5">
                            {getClientBusiness(selectedClient)}
                        </p>
                    )}
                    {formData.clientEmail.trim() && (
                        <p className="text-sm text-foreground-muted mt-0.5">{formData.clientEmail}</p>
                    )}
                </div>
            )}

            <dl className="space-y-2 text-sm">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline">
                    <dt className="text-foreground-muted">Subtotal</dt>
                    <dd className="font-medium text-foreground text-right whitespace-nowrap tabular-nums shrink-0">
                        {formatCurrency(totals.subtotal, formData.currency)}
                    </dd>
                </div>
                {totals.discount > 0 && (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline">
                        <dt className="text-foreground-muted">{discountLabel}</dt>
                        <dd className="font-medium text-red-600 text-right whitespace-nowrap tabular-nums shrink-0">
                            −{formatCurrency(totals.discount, formData.currency)}
                        </dd>
                    </div>
                )}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline">
                    <dt className="text-foreground-muted">Tax ({formData.taxRate}%)</dt>
                    <dd className="font-medium text-foreground text-right whitespace-nowrap tabular-nums shrink-0">
                        {formatCurrency(totals.tax, formData.currency)}
                    </dd>
                </div>
                {isPartial ? (
                    <>
                        <div className="pt-3 border-t border-border grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center">
                            <dt className="font-semibold text-foreground">Total</dt>
                            <dd className="text-lg font-bold text-foreground text-right whitespace-nowrap tabular-nums shrink-0">
                                {formatCurrency(totals.total, formData.currency)}
                            </dd>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-baseline">
                            <dt className="text-foreground-muted">Amount received</dt>
                            <dd className="font-medium text-foreground text-right whitespace-nowrap tabular-nums shrink-0">
                                {formatCurrency(received, formData.currency)}
                            </dd>
                        </div>
                        <div className="pt-2 border-t border-border/50 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center">
                            <dt className="font-semibold text-foreground">Balance remaining</dt>
                            <dd className="text-xl font-bold text-brand text-right whitespace-nowrap tabular-nums shrink-0">
                                {formatCurrency(balanceRemaining, formData.currency)}
                            </dd>
                        </div>
                    </>
                ) : (
                    <div className="pt-3 border-t border-border grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center">
                        <dt className="font-semibold text-foreground">{totalLabel}</dt>
                        <dd className="text-2xl font-bold text-brand text-right whitespace-nowrap tabular-nums shrink-0">
                            {formatCurrency(
                                received != null && received > 0 ? received : totals.total,
                                formData.currency
                            )}
                        </dd>
                    </div>
                )}
            </dl>
        </div>
    );
}
