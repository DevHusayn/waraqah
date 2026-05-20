/**
 * Mini preview matching the layout produced by pdfGenerator.js (not a simplified card).
 */
const BRAND = '#0284c7';

function formatAmount(value) {
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function LandingInvoicePreview() {
    const subtotal = 150000;
    const tax = 15000;
    const total = subtotal + tax;

    return (
        <div className="landing-invoice-preview rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xl text-left">
            <div className="h-1" style={{ backgroundColor: BRAND }} aria-hidden />

            <div className="p-4 sm:p-5">
                {/* Header row */}
                <div className="flex gap-3">
                    <div className="w-1 shrink-0 rounded-full" style={{ backgroundColor: BRAND }} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">Waraqah Invoice</p>
                        <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">
                            123 Asokoro, Abuja
                        </p>
                        <p className="text-[8px] text-slate-500">hello@waraqah.invoice</p>
                        <p className="text-[8px] text-slate-500">+234 818 121 0108</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p
                            className="text-xl font-bold leading-none tracking-tight"
                            style={{ color: BRAND }}
                        >
                            INVOICE
                        </p>
                        <div
                            className="mt-1.5 inline-block rounded px-2 py-0.5 text-[9px] font-bold"
                            style={{ backgroundColor: `${BRAND}22`, color: BRAND }}
                        >
                            #INV-240519
                        </div>
                    </div>
                </div>

                {/* Info cards */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-slate-100/90 p-2">
                        <p className="text-[7px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
                            BILLED TO
                        </p>
                        <p className="text-[9px] font-bold text-slate-800 mt-1">Shopperpoint</p>
                        <p className="text-[7px] text-slate-500">logistics@shopperpoint.com</p>
                    </div>
                    <div className="rounded-md bg-slate-100/90 p-2 relative">
                        <span className="absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[6px] font-bold uppercase bg-amber-400 text-amber-950">
                            Pending
                        </span>
                        <p className="text-[7px] font-bold text-slate-500 mt-3">Issue</p>
                        <p className="text-[8px] text-slate-700">May 01, 2026</p>
                        <p className="text-[7px] font-bold text-slate-500 mt-1">Due</p>
                        <p className="text-[8px] text-slate-700">May 31, 2026</p>
                    </div>
                </div>

                {/* Items table */}
                <div className="mt-3 overflow-hidden rounded-md">
                    <table className="w-full text-[7px]">
                        <thead>
                            <tr style={{ backgroundColor: BRAND }} className="text-white">
                                <th className="text-left font-bold py-1.5 px-2">Description</th>
                                <th className="text-center font-bold py-1.5 px-1 w-8">Qty</th>
                                <th className="text-center font-bold py-1.5 px-1">Rate</th>
                                <th className="text-center font-bold py-1.5 px-1">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <td className="py-1.5 px-2 text-slate-800">Design retainer</td>
                                <td className="py-1.5 text-center text-slate-600">1</td>
                                <td className="py-1.5 text-center text-slate-600 whitespace-nowrap">
                                    {formatAmount(subtotal)}
                                </td>
                                <td className="py-1.5 text-center font-semibold text-slate-800 whitespace-nowrap">
                                    {formatAmount(subtotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-3 flex justify-end">
                    <div className="w-[55%] space-y-1 text-[8px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span className="text-slate-800">{formatAmount(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (10%)</span>
                            <span className="text-slate-800">{formatAmount(tax)}</span>
                        </div>
                        <div className="border-t pt-1 flex justify-between font-bold text-slate-900">
                            <span>Total</span>
                            <span>{formatAmount(total)}</span>
                        </div>
                        <div
                            className="border-t pt-1 flex justify-between font-bold"
                            style={{ color: BRAND }}
                        >
                            <span className="uppercase text-[7px]">Total due</span>
                            <span>{formatAmount(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

