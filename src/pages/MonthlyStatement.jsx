import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Download, Printer, FileBarChart } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import Spinner, { PageLoader } from '../components/Spinner';
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

const STATUS_COLS = ['paid', 'pending', 'overdue', 'cancelled'];

export default function MonthlyStatement() {
    const { invoices, clients, loading } = useInvoice();
    const { businessInfo, loading: settingsLoading } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const [monthValue, setMonthValue] = useState(getDefaultStatementMonth);
    const [exporting, setExporting] = useState(false);

    const { year, month } = parseStatementMonth(monthValue);

    const statement = useMemo(
        () => buildMonthlyStatement({ invoices, clients, year, month }),
        [invoices, clients, year, month]
    );

    const handlePdf = async (print = false) => {
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

    if (loading || settingsLoading) {
        return (
            <PageLoader />
        );
    }

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
            >
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        type="button"
                        onClick={() => handlePdf(false)}
                        disabled={exporting}
                        className="btn-primary"
                    >
                        <Download className="h-4 w-4" />
                        {exporting ? 'Preparing…' : 'Download PDF'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePdf(true)}
                        disabled={exporting}
                        className="btn-secondary"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                </div>
            </PageHeader>

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
                        Based on invoice issue dates in {statement.periodLabel}.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                    <FileBarChart className="h-5 w-5 text-brand shrink-0" />
                    <span>
                        <strong className="text-zinc-900">{statement.totals.invoiceCount}</strong>{' '}
                        invoice{statement.totals.invoiceCount === 1 ? '' : 's'} this month
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
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
                <div className="card !p-4 min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1 border-2 border-amber-300/80 bg-amber-50">
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
                        <p className="mt-3 font-medium text-zinc-900">No invoices this month</p>
                        <p className="text-sm text-zinc-500 mt-1">
                            Create invoices with an issue date in {statement.periodLabel} to see them
                            here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto scroll-x-touch">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-white text-left">
                                    <th className="px-6 py-3 font-semibold text-zinc-700">Client</th>
                                    <th className="px-4 py-3 font-semibold text-zinc-700 text-center">
                                        Paid
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-zinc-700 text-center">
                                        Pending
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-zinc-700 text-center">
                                        Overdue
                                    </th>
                                    <th className="px-4 py-3 font-semibold text-zinc-700 text-center">
                                        Cancelled
                                    </th>
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
                                        <td key={status} className="px-4 py-3 text-center tabular-nums">
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
    );
}
