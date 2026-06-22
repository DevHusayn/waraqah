/**
 * Mini preview approximating the standard PDF layout.
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
        <div className="landing-invoice-preview rounded-lg overflow-hidden border border-zinc-200 bg-white shadow-2xl text-left">
            <div className="p-4 sm:p-5">
                <div className="flex justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold leading-tight" style={{ color: BRAND }}>
                            Your Business
                        </p>
                        <p className="text-[8px] text-zinc-500 mt-1">123 Asokoro, Abuja</p>
                        <p className="text-[8px] text-zinc-500">hello@example.com</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-zinc-900 leading-none">INVOICE</p>
                        <p className="text-[9px] font-bold mt-1" style={{ color: BRAND }}>
                            #INV-240519
                        </p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-md p-2" style={{ backgroundColor: `${BRAND}14` }}>
                        <p className="text-[7px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
                            From
                        </p>
                        <p className="text-[7px] text-zinc-500 mt-1">hello@example.com</p>
                    </div>
                    <div className="rounded-md p-2" style={{ backgroundColor: `${BRAND}14` }}>
                        <p className="text-[7px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>
                            Bill to
                        </p>
                        <p className="text-[8px] font-bold text-zinc-800 mt-1">Shopperpoint</p>
                    </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-md border border-zinc-100">
                    <table className="w-full text-[7px]">
                        <thead>
                            <tr style={{ backgroundColor: `${BRAND}18` }}>
                                <th className="text-left font-bold py-1.5 px-2" style={{ color: BRAND }}>
                                    Description
                                </th>
                                <th className="text-center font-bold py-1.5 px-1 w-8">Qty</th>
                                <th className="text-right font-bold py-1.5 px-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-zinc-100">
                                <td className="py-1.5 px-2 text-zinc-800">Design retainer</td>
                                <td className="py-1.5 text-center text-zinc-600">1</td>
                                <td className="py-1.5 text-right font-semibold text-zinc-800">
                                    {formatAmount(subtotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-2 flex justify-end text-[8px]">
                    <div className="w-[50%] space-y-0.5">
                        <div className="flex justify-between font-bold" style={{ color: BRAND }}>
                            <span>TOTAL DUE</span>
                            <span>{formatAmount(total)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded border border-zinc-100 p-1.5">
                        <p className="text-[6px] font-bold uppercase" style={{ color: BRAND }}>
                            Payment
                        </p>
                        <p className="text-[6px] text-zinc-500 mt-0.5">GTBank · 0123456789</p>
                    </div>
                    <div className="rounded border border-zinc-100 p-1.5">
                        <p className="text-[6px] font-bold uppercase" style={{ color: BRAND }}>
                            Notes
                        </p>
                        <p className="text-[6px] text-zinc-500 mt-0.5">Thank you!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
