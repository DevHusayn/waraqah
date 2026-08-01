import { formatCurrency } from '../../utils/currency';
import { getClientBusiness } from '../../utils/clientHelpers';

export default function DocumentSummaryCard({
    formData,
    selectedClient,
    totals,
    discountLabel,
    totalLabel,
}) {
    return (
        <div className="card space-y-5">
            <h3 className="text-sm font-semibold text-zinc-900">Summary</h3>

            {formData.clientName.trim() && (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1.5">
                        Bill to
                    </p>
                    <p className="font-semibold text-zinc-900">{formData.clientName}</p>
                    {selectedClient && getClientBusiness(selectedClient) && (
                        <p className="text-sm text-zinc-600 mt-0.5">
                            {getClientBusiness(selectedClient)}
                        </p>
                    )}
                    {formData.clientEmail.trim() && (
                        <p className="text-sm text-zinc-500 mt-0.5">{formData.clientEmail}</p>
                    )}
                </div>
            )}

            <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <dt className="text-zinc-500">Subtotal</dt>
                    <dd className="font-medium text-zinc-900">
                        {formatCurrency(totals.subtotal, formData.currency)}
                    </dd>
                </div>
                {totals.discount > 0 && (
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">{discountLabel}</dt>
                        <dd className="font-medium text-red-600">
                            −{formatCurrency(totals.discount, formData.currency)}
                        </dd>
                    </div>
                )}
                <div className="flex justify-between">
                    <dt className="text-zinc-500">Tax ({formData.taxRate}%)</dt>
                    <dd className="font-medium text-zinc-900">
                        {formatCurrency(totals.tax, formData.currency)}
                    </dd>
                </div>
                <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                    <dt className="font-semibold text-zinc-900">{totalLabel}</dt>
                    <dd className="text-2xl font-bold text-brand">
                        {formatCurrency(totals.total, formData.currency)}
                    </dd>
                </div>
            </dl>
        </div>
    );
}
