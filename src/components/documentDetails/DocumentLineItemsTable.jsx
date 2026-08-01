import { List } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { normalizeInvoiceUnit, resolveQuantityColumnLabel } from '@waraqah/shared';

export default function DocumentLineItemsTable({ items, currency }) {
    const lineItems = items || [];

    return (
        <div className="card !p-0 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
                <div className="p-2 rounded-md bg-zinc-50 border border-zinc-200/50 shrink-0">
                    <List className="h-4 w-4 text-zinc-500" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Items</h2>
                    <p className="text-xs text-zinc-500">
                        {lineItems.length} line item{lineItems.length === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            <div className="md:hidden divide-y divide-zinc-100">
                {lineItems.map((item, index) => (
                    <div key={index} className="px-4 py-4">
                        <p className="font-medium text-zinc-900">{item.description}</p>
                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                            <span className="text-zinc-500">
                                {normalizeInvoiceUnit(item.unit)} {item.quantity} ·{' '}
                                {formatCurrency(item.rate, currency)}
                            </span>
                            <span className="font-semibold text-zinc-900 shrink-0">
                                {formatCurrency(
                                    Number(item.quantity) * Number(item.rate),
                                    currency
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <table className="hidden md:table w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500 uppercase text-xs">
                    <tr>
                        <th className="text-left px-6 py-3 font-semibold">Description</th>
                        <th className="text-center px-4 py-3 w-24 font-semibold">
                            {resolveQuantityColumnLabel(lineItems)}
                        </th>
                        <th className="text-right px-4 py-3 font-semibold">Rate</th>
                        <th className="text-right px-6 py-3 font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {lineItems.map((item, index) => (
                        <tr key={index}>
                            <td className="px-6 py-4 text-zinc-900">{item.description}</td>
                            <td className="px-4 py-4 text-center text-zinc-600">{item.quantity}</td>
                            <td className="px-4 py-4 text-right text-zinc-600 whitespace-nowrap">
                                {formatCurrency(item.rate, currency)}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-zinc-900 whitespace-nowrap">
                                {formatCurrency(
                                    Number(item.quantity) * Number(item.rate),
                                    currency
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
