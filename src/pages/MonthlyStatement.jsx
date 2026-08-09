import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Download, Printer, FileBarChart } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useReceipt } from '../context/ReceiptContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import { StatementContentSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/currency';
import { isPremiumUser } from '../utils/premium';
import {
    buildMonthlyStatement,
    getDefaultStatementMonth,
    parseStatementMonth,
} from '../utils/monthlyStatement';
import { generateMonthlyStatementPdf, statusLabel } from '../utils/monthlyStatementPdf';
import MonthPickerField from '../components/MonthPickerField';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';

const STATUS_COLS = ['paid', 'partial', 'pending', 'overdue', 'cancelled'];

export default function MonthlyStatement() {
    const { clients, fetchInvoices } = useInvoice();
    const { fetchReceipts } = useReceipt();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const [monthValue, setMonthValue] = useState(getDefaultStatementMonth);
    const [exporting, setExporting] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetching, setFetching] = useState(true);

    const { year, month } = parseStatementMonth(monthValue);

    useEffect(() => {
        let cancelled = false;
        setFetching(true);
        (async () => {
            const [invoiceList, receiptList] = await Promise.all([
                fetchInvoices({ force: true, year, month, limit: 100 }),
                fetchReceipts({ force: true, year, month, limit: 100 }),
            ]);
            if (!cancelled) {
                setInvoices(invoiceList);
                setReceipts(receiptList);
                setFetching(false);
                setInitialLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fetchInvoices, fetchReceipts, year, month]);

    const statement = useMemo(
        () => buildMonthlyStatement({ invoices, receipts, clients, year, month }),
        [invoices, receipts, clients, year, month]
    );

    const periodLabel = useMemo(() => {
        const stub = buildMonthlyStatement({ invoices: [], clients, year, month });
        return stub.periodLabel;
    }, [clients, year, month]);

    const handlePdf = async (print = false) => {
        if (fetching) return;
        setExporting(true);
        try {
            await generateMonthlyStatementPdf(statement, businessInfo, { print });
        } catch (err) {
            console.error(err);
            window.alert('Could not create the statement. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (!premium) {
        return (
            <div>
                <PageHeader
                    title="Monthly statement"
                    subtitle="A clear picture of how your business billed each month"
                />
                <div className="premium-card max-w-lg mx-auto p-8">
                    <EmptyState
                        icon={Crown}
                        title="Keep track of your monthly billing"
                        description="Upgrade to Premium to unlock professional monthly statements with automated totals and PDF export."
                        action={
                            <Link
                                to="/upgrade"
                                className="premium-upgrade-btn text-sm py-2 px-4"
                            >
                                <Crown size={16} className="text-amber-600 shrink-0" aria-hidden />
                                Upgrade to Premium
                            </Link>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Monthly statement"
                subtitle="Billing summary by client for the selected month"
            />

            <div className="card mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1">
                    <label className="label" htmlFor="statement-month">
                        Statement period
                    </label>
                    <MonthPickerField
                        id="statement-month"
                        value={monthValue}
                        onChange={setMonthValue}
                        max={format(new Date(), 'yyyy-MM')}
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                        Based on document issue dates in {periodLabel}.
                    </p>
                </div>
                {!initialLoading ? (
                    <div
                        className={`flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 transition-opacity ${
                            fetching ? 'opacity-60' : ''
                        }`}
                    >
                        <FileBarChart className="h-5 w-5 text-brand shrink-0" />
                        <span>
                            <strong className="text-zinc-900">{statement.totals.documentCount}</strong>{' '}
                            document{statement.totals.documentCount === 1 ? '' : 's'} this month
                        </span>
                    </div>
                ) : null}
            </div>

            {initialLoading ? (
                <StatementContentSkeleton />
            ) : (
                <div className={fetching ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {STATUS_COLS.map((status) => (
                            <div key={status} className="card !p-4 min-w-0">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    {statusLabel(status)}
                                </p>
                                <p className="mt-1 text-base sm:text-lg font-semibold text-zinc-900 tabular-nums break-words">
                                    {formatCurrency(statement.totals[status])}
                                </p>
                            </div>
                        ))}
                        <div className="card !p-4 min-w-0 col-span-2 sm:col-span-3 lg:col-span-6 border-2 border-amber-300/80 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                                Total billed
                            </p>
                            <p className="mt-1 text-base sm:text-lg font-bold text-zinc-900 tabular-nums break-words">
                                {formatCurrency(statement.totals.total)}
                            </p>
                        </div>
                    </div>

                    <div className="card overflow-hidden !p-0">
                        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80">
                            <h2 className="text-lg font-semibold text-zinc-900">Client breakdown</h2>
                            <p className="text-sm text-zinc-500 mt-0.5">
                                Amounts issued to each client in {statement.periodLabel}
                            </p>
                        </div>

                        {!statement.hasData ? (
                            <div className="text-center py-16 px-6">
                                <FileBarChart className="mx-auto h-12 w-12 text-zinc-300" />
                                <p className="mt-3 font-medium text-zinc-900">No documents this month</p>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Create invoices or receipts with an issue date in {statement.periodLabel}{' '}
                                    to see them here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto scroll-x-touch">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-200 bg-white text-left">
                                            <th className="px-6 py-3 font-semibold text-zinc-700">
                                                Client
                                            </th>
                                            {STATUS_COLS.map((status) => (
                                                <th
                                                    key={status}
                                                    className="px-4 py-3 font-semibold text-zinc-700 text-center"
                                                >
                                                    {statusLabel(status)}
                                                </th>
                                            ))}
                                            <th className="px-6 py-3 font-semibold text-zinc-900 text-center">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statement.rows.map((row) => (
                                            <tr
                                                key={row.clientId}
                                                className="border-b border-zinc-100 hover:bg-zinc-50/80"
                                            >
                                                <td className="px-6 py-3">
                                                    <p className="font-medium text-zinc-900">
                                                        {row.clientName}
                                                    </p>
                                                    {row.clientSubtitle ? (
                                                        <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                            {row.clientSubtitle}
                                                        </p>
                                                    ) : null}
                                                </td>
                                                {STATUS_COLS.map((status) => (
                                                    <td
                                                        key={status}
                                                        className="px-4 py-3 text-center text-zinc-700 tabular-nums"
                                                    >
                                                        {row[status] > 0
                                                            ? formatCurrency(row[status])
                                                            : '—'}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-3 text-center font-semibold text-zinc-900 tabular-nums">
                                                    {formatCurrency(row.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-zinc-50 font-semibold text-zinc-900">
                                            <td className="px-6 py-3">Total</td>
                                            {STATUS_COLS.map((status) => (
                                                <td
                                                    key={status}
                                                    className="px-4 py-3 text-center tabular-nums"
                                                >
                                                    {formatCurrency(statement.totals[status])}
                                                </td>
                                            ))}
                                            <td className="px-6 py-3 text-center tabular-nums text-brand">
                                                {formatCurrency(statement.totals.total)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!initialLoading ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full mt-6">
                    <button
                        type="button"
                        onClick={() => handlePdf(false)}
                        disabled={exporting || fetching}
                        className="btn-primary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        <Download className="h-4 w-4" />
                        {exporting ? 'Preparing…' : 'Download PDF'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePdf(true)}
                        disabled={exporting || fetching}
                        className="btn-secondary w-full text-sm py-2.5 px-4 gap-2 min-h-[44px]"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                </div>
            ) : null}
        </div>
    );
}
