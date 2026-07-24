import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { publicFetch } from '../utils/publicApi';
import { getDownloadLabel } from '../utils/receiptHelpers';
import { downloadPdfBlob } from '../utils/shareInvoicePdf';
import InvoiceDocumentPreview from '../components/InvoiceDocumentPreview';
import WaraqahLogo from '../components/WaraqahLogo';
import Spinner from '../components/Spinner';

export default function PublicQuotation() {
    const { token } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [pdfError, setPdfError] = useState('');
    const [downloadBusy, setDownloadBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const result = await publicFetch(`/public/quotations/${token}`);
                if (!cancelled) setData(result);
            } catch (err) {
                if (!cancelled) setError(err.message || 'Could not load quotation.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const quotation = data?.quotation;
    const business = data?.business;
    const client = data?.client;
    const pdfMode = 'quotation';
    const docTitle = quotation?.quotationNumber || 'Quotation';
    const downloadLabel = quotation ? getDownloadLabel(quotation, pdfMode) : 'Download PDF';

    const handleDownloadPdf = useCallback(async () => {
        if (!quotation || !client || !business || downloadBusy) return;
        setDownloadBusy(true);
        setPdfError('');
        try {
            const { generateInvoicePdfBlob } = await import('../utils/pdfGenerator');
            const { blob, filename } = await generateInvoicePdfBlob(
                quotation,
                client,
                business,
                { mode: pdfMode }
            );
            downloadPdfBlob(blob, filename);
        } catch (err) {
            setPdfError(err.message || 'Failed to download PDF.');
        } finally {
            setDownloadBusy(false);
        }
    }, [quotation, client, business, downloadBusy]);

    const handlePrintPdf = useCallback(() => {
        setPdfError('');
        window.print();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Spinner label="Loading quotation…" centered />
            </div>
        );
    }

    if (error || !quotation) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full card text-center">
                    <h1 className="text-xl font-semibold text-zinc-900">Quotation unavailable</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                        {error || 'This link may have expired or been removed.'}
                    </p>
                    <Link to="/" className="btn-primary inline-flex mt-6">
                        Go to Waraqah
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 print:min-h-0 print:bg-white print:p-0">
            <div className="max-w-3xl mx-auto print:max-w-none">
                <div className="mb-4 print:hidden">
                    <p className="text-sm text-zinc-600">
                        Quotation from {business?.name || 'Business'}
                    </p>
                    <h1 className="text-lg font-semibold text-zinc-900 mt-1">{docTitle}</h1>
                </div>

                <div className="card !p-0 overflow-hidden shadow-card border border-zinc-200 print:shadow-none print:border-0 print:rounded-none">
                    <InvoiceDocumentPreview
                        invoice={quotation}
                        client={client}
                        businessInfo={business}
                        mode={pdfMode}
                    />
                </div>

                {pdfError ? (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
                        {pdfError}
                    </p>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-6 print:hidden">
                    <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={downloadBusy}
                        className="btn-primary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        {downloadBusy ? <Spinner size="sm" inline /> : <Download className="h-4 w-4" aria-hidden />}
                        {downloadLabel}
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintPdf}
                        disabled={downloadBusy}
                        className="btn-secondary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        <Printer className="h-4 w-4" aria-hidden />
                        Print
                    </button>
                </div>

                <footer className="mt-8 text-center text-xs text-zinc-500 print:hidden">
                    <Link to="/" className="inline-flex items-center gap-2 hover:text-brand transition-colors">
                        <WaraqahLogo className="h-5 w-auto" />
                        <span>Powered by Waraqah</span>
                    </Link>
                </footer>
            </div>
        </div>
    );
}
