import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { publicFetch } from '../utils/publicApi';
import { getDownloadLabel } from '../utils/receiptHelpers';
import {
    downloadPublicInvoicePdf,
    printPublicInvoicePdf,
} from '../utils/publicInvoicePdf';
import InvoiceDocumentPreview from '../components/InvoiceDocumentPreview';
import WaraqahLogo from '../components/WaraqahLogo';
import Spinner from '../components/Spinner';

export default function PublicInvoice() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const preferReceipt = searchParams.get('view') === 'receipt';

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [pdfError, setPdfError] = useState('');
    const [actionBusy, setActionBusy] = useState(false);

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
    const pdfMode = showReceipt ? 'receipt' : 'invoice';
    const docTitle = showReceipt
        ? invoice?.receiptNumber || 'Receipt'
        : invoice?.invoiceNumber || 'Invoice';

    const downloadLabel = invoice ? getDownloadLabel(invoice, pdfMode) : 'Download PDF';

    const handleDownloadPdf = useCallback(async () => {
        if (!invoice || !client || !business || actionBusy) return;
        setActionBusy(true);
        setPdfError('');
        try {
            await downloadPublicInvoicePdf(invoice, client, business, showReceipt);
        } catch (err) {
            setPdfError(err.message || 'Failed to download PDF.');
        } finally {
            setActionBusy(false);
        }
    }, [invoice, client, business, showReceipt, actionBusy]);

    const handlePrintPdf = useCallback(async () => {
        if (!invoice || !client || !business || actionBusy) return;
        setActionBusy(true);
        setPdfError('');
        try {
            await printPublicInvoicePdf(invoice, client, business, showReceipt);
        } catch (err) {
            setPdfError(err.message || 'Failed to print PDF.');
        } finally {
            setActionBusy(false);
        }
    }, [invoice, client, business, showReceipt, actionBusy]);

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
                <div className="mb-4">
                    <p className="text-sm text-zinc-600">
                        {showReceipt ? 'Receipt' : 'Invoice'} from {business?.name || 'Business'}
                    </p>
                    <h1 className="text-lg font-semibold text-zinc-900 mt-1">{docTitle}</h1>
                </div>

                <div className="card !p-0 overflow-hidden shadow-card border border-zinc-200">
                    <InvoiceDocumentPreview
                        invoice={invoice}
                        client={client}
                        businessInfo={business}
                        mode={pdfMode}
                    />
                </div>

                {pdfError ? (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {pdfError}
                    </p>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-6">
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={actionBusy}
                        className="btn-primary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        {actionBusy ? <Spinner size="sm" inline /> : <Download className="h-4 w-4" aria-hidden />}
                        {downloadLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintPdf}
                        disabled={actionBusy}
                        className="btn-secondary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        <Printer className="h-4 w-4" aria-hidden />
                        Print
                    </button>
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
