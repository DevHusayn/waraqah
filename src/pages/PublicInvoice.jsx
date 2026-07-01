import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { publicFetch } from '../utils/publicApi';
import { formatCurrency } from '../utils/currency';
import { getPaymentMethodLabel } from '../utils/receiptHelpers';
import WaraqahLogo from '../components/WaraqahLogo';
import Spinner from '../components/Spinner';

function InfoRow({ icon: Icon, children }) {
    if (!children) return null;
    return (
        <p className="text-sm text-zinc-600 flex items-start gap-2">
            {Icon ? <Icon size={15} className="text-zinc-400 shrink-0 mt-0.5" aria-hidden /> : null}
            <span>{children}</span>
        </p>
    );
}

export default function PublicInvoice() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const preferReceipt = searchParams.get('view') === 'receipt';

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const result = await publicFetch(`/public/invoices/${token}`);
                if (!cancelled) setData(result);
            } catch (err) {
                if (!cancelled) setError(err.message || 'Could not load invoice.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const invoice = data?.invoice;
    const business = data?.business;
    const client = data?.client;

    const isPaid = invoice?.status === 'paid';
    const showReceipt = isPaid && (preferReceipt || !invoice?.dueDate);
    const brandColor = business?.brandColor || '#0ea5e9';
    const docTitle = showReceipt
        ? invoice?.receiptNumber || 'Receipt'
        : invoice?.invoiceNumber || 'Invoice';

    const lineItems = useMemo(
        () => (invoice?.items || []).map((item, index) => ({
            ...item,
            amount: Number(item.quantity) * Number(item.rate),
            key: index,
        })),
        [invoice?.items]
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Spinner label="Loading invoice…" centered />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full card text-center">
                    <h1 className="text-xl font-semibold text-zinc-900">Invoice unavailable</h1>
                    <p className="mt-2 text-sm text-zinc-600">{error || 'This link may have expired or been removed.'}</p>
                    <Link to="/" className="btn-primary inline-flex mt-6">
                        Go to Waraqah
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="card !p-0 overflow-hidden shadow-lg border border-zinc-200">
                    <div
                        className="px-6 sm:px-8 py-6 border-b border-zinc-200"
                        style={{ borderTop: `4px solid ${brandColor}` }}
                    >
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                {business?.companyLogoUrl ? (
                                    <img
                                        src={business.companyLogoUrl}
                                        alt={business.name}
                                        className="h-12 max-w-[180px] object-contain mb-4"
                                    />
                                ) : (
                                    <p className="text-xl font-bold text-zinc-900 mb-2">{business?.name}</p>
                                )}
                                <InfoRow icon={MapPin}>{business?.address}</InfoRow>
                                <InfoRow icon={Mail}>{business?.email}</InfoRow>
                                <InfoRow icon={Phone}>{business?.phone}</InfoRow>
                                <InfoRow icon={Globe}>{business?.website}</InfoRow>
                            </div>

                            <div className="text-left sm:text-right">
                                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                                    {showReceipt ? 'Receipt' : 'Invoice'}
                                </p>
                                <h1 className="text-2xl font-bold text-zinc-900 mt-1">{docTitle}</h1>
                                <p className="text-sm text-zinc-500 mt-2 capitalize">{invoice.status}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-zinc-100 bg-zinc-50/60">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Bill to</p>
                            <p className="font-semibold text-zinc-900">{client?.name || 'Customer'}</p>
                            {client?.company ? (
                                <p className="text-sm text-zinc-600 flex items-center gap-1.5 mt-1">
                                    <Building2 size={14} className="text-zinc-400" aria-hidden />
                                    {client.company}
                                </p>
                            ) : null}
                            {client?.address ? <p className="text-sm text-zinc-600 mt-1">{client.address}</p> : null}
                            {client?.phone ? <p className="text-sm text-zinc-600 mt-1">{client.phone}</p> : null}
                        </div>

                        <div className="space-y-2 sm:text-right">
                            <div>
                                <p className="text-xs text-zinc-500">Issue date</p>
                                <p className="text-sm font-medium text-zinc-900">
                                    {invoice.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : '—'}
                                </p>
                            </div>
                            {isPaid ? (
                                <>
                                    <div>
                                        <p className="text-xs text-zinc-500">Payment date</p>
                                        <p className="text-sm font-medium text-zinc-900">
                                            {invoice.datePaid
                                                ? format(new Date(invoice.datePaid), 'MMM dd, yyyy')
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Payment method</p>
                                        <p className="text-sm font-medium text-zinc-900">
                                            {getPaymentMethodLabel(invoice.paymentMethod)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-xs text-zinc-500">Due date</p>
                                    <p className="text-sm font-medium text-zinc-900">
                                        {invoice.dueDate
                                            ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                                            : '—'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 sm:px-8 py-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-xs">
                                        <th className="text-left py-3 font-semibold">Description</th>
                                        <th className="text-center py-3 font-semibold w-16">Qty</th>
                                        <th className="text-right py-3 font-semibold">Rate</th>
                                        <th className="text-right py-3 font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {lineItems.map((item) => (
                                        <tr key={item.key}>
                                            <td className="py-3 text-zinc-900">{item.description}</td>
                                            <td className="py-3 text-center text-zinc-600">{item.quantity}</td>
                                            <td className="py-3 text-right text-zinc-600 whitespace-nowrap">
                                                {formatCurrency(item.rate)}
                                            </td>
                                            <td className="py-3 text-right font-medium text-zinc-900 whitespace-nowrap">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <dl className="w-full max-w-xs space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-zinc-500">Subtotal</dt>
                                    <dd className="font-medium text-zinc-900">
                                        {formatCurrency(invoice.subtotal)}
                                    </dd>
                                </div>
                                {Number(invoice.discount) > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-zinc-500">Discount</dt>
                                        <dd className="font-medium text-zinc-900">
                                            −{formatCurrency(invoice.discount)}
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between gap-4">
                                    <dt className="text-zinc-500">Tax ({invoice.taxRate}%)</dt>
                                    <dd className="font-medium text-zinc-900">
                                        {formatCurrency(invoice.tax)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4 pt-2 border-t border-zinc-200">
                                    <dt className="font-semibold text-zinc-900">Total</dt>
                                    <dd className="text-lg font-bold" style={{ color: brandColor }}>
                                        {formatCurrency(invoice.total)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {invoice.notes ? (
                            <div className="mt-8 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">Notes</p>
                                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{invoice.notes}</p>
                            </div>
                        ) : null}

                        {!isPaid && (business?.paymentAccountNumber || business?.paymentInstructions) ? (
                            <div className="mt-8 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-4">
                                <p className="text-sm font-semibold text-zinc-900 mb-2">Payment details</p>
                                {business.paymentAccountName ? (
                                    <p className="text-sm text-zinc-700">Account name: {business.paymentAccountName}</p>
                                ) : null}
                                {business.paymentBankName ? (
                                    <p className="text-sm text-zinc-700">Bank: {business.paymentBankName}</p>
                                ) : null}
                                {business.paymentAccountNumber ? (
                                    <p className="text-sm text-zinc-700">Account number: {business.paymentAccountNumber}</p>
                                ) : null}
                                {business.paymentInstructions ? (
                                    <p className="text-sm text-zinc-600 mt-2 whitespace-pre-wrap">
                                        {business.paymentInstructions}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>

                <footer className="mt-8 text-center text-xs text-zinc-500">
                    <Link to="/" className="inline-flex items-center gap-2 hover:text-brand transition-colors">
                        <WaraqahLogo className="h-5 w-auto" />
                        <span>Powered by Waraqah</span>
                    </Link>
                </footer>
            </div>
        </div>
    );
}
