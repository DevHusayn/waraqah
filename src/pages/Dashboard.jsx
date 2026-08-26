import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Receipt,
    TrendingUp,
    CheckCircle,
    Package,
    ClipboardList,
    Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getDisplayNumber, getReceiptStatusBadge } from '../utils/receiptHelpers';
import { isQuotationDocument, isReceiptDocument } from '../utils/documentHelpers';
import PageHeader from '../components/PageHeader';
import MonthPickerField from '../components/MonthPickerField';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { useDashboardQuery } from '../hooks/useDashboardStats';
import { prefetchFrequentRoutes } from '../utils/prefetchRoutes';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import { useSettings } from '../context/SettingsContext';
import { getDisplayBusinessName } from '@waraqah/shared';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics';
import { TableSkeleton } from '../components/Skeleton';
import { formatDashboardDate, getTimeOfDayGreeting } from '../utils/dashboardGreeting';

const RECENT_COLUMNS = [
    { key: 'number', label: 'Document' },
    { key: 'client', label: 'Client' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

function DocumentTypeBadge({ doc }) {
    const isQuotation = isQuotationDocument(doc) || doc.documentType === 'quotation';
    const isReceipt = isReceiptDocument(doc) || doc.documentType === 'receipt';
    return (
        <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border ${isQuotation
                ? 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60'
                : isReceipt
                    ? 'bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60'
                    : 'bg-brand-subtle text-brand border-brand/20'
                }`}
        >
            {isQuotation ? 'QTN' : isReceipt ? 'RCP' : 'INV'}
        </span>
    );
}

const Dashboard = () => {
    const { businessInfo: settingsBusinessInfo } = useSettings();
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useInvoiceCreateGuard();
    const {
        periodLabel,
        mode,
        setPeriodMode,
        queryParams,
        isCurrentPeriod,
        showComparison,
        comparisonLabel,
        customDraftStartDate,
        customDraftEndDate,
        setCustomDraftRange,
        applyCustomRange,
        maxDate,
        timezone,
    } = usePeriodFilter();
    const { data, isPending, isFetching, isPlaceholderData } = useDashboardQuery(queryParams);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const businessInfo = data?.businessInfo || settingsBusinessInfo;
    const displayBusinessName = getDisplayBusinessName(businessInfo);
    const usageFromDashboard = data?.invoiceUsage;
    const effectiveUsage = usageFromDashboard || invoiceUsage;

    useEffect(() => {
        if (data) {
            prefetchFrequentRoutes();
        }
    }, [data]);

    const recentDocuments = data?.recentDocuments || data?.recentInvoices || [];
    const overdueInvoices = data?.overdueInvoices || [];

    const usageLabel = formatInvoiceUsageLabel(effectiveUsage);
    const premium = isPremiumUser(businessInfo);

    const dashboardLoading = isPending;
    const periodUpdating = Boolean(isPlaceholderData && isFetching);

    const dashboardTitle = useMemo(
        () => `${getTimeOfDayGreeting(timezone)}, ${displayBusinessName}`,
        [timezone, displayBusinessName]
    );
    const dashboardSubtitle = useMemo(() => formatDashboardDate(timezone), [timezone]);

    const resolveDocumentStatusBadge = (doc) => {
        if (isReceiptDocument(doc) || doc.documentType === 'receipt') {
            return getReceiptStatusBadge(doc);
        }
        return { status: doc.status, label: undefined };
    };

    const openDocument = useCallback(
        (doc) => {
            const id = doc.id || doc._id;
            if (isQuotationDocument(doc) || doc.documentType === 'quotation') {
                navigate(`/quotations/${id}`);
                return;
            }
            if (isReceiptDocument(doc) || doc.documentType === 'receipt') {
                navigate(`/receipts/${id}`);
                return;
            }
            navigate(`/invoices/${id}`);
        },
        [navigate]
    );

    return (
        <div>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />
            <CreateDocumentModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                navigate={navigate}
            />
            <PageHeader
                title={dashboardTitle}
                subtitle={dashboardSubtitle}
                inlineActions
            >
                <MonthPickerField
                    id="dashboard-analytics-month"
                    variant="compact"
                    portal
                    showPeriodPresets
                    periodMode={mode}
                    isThisMonth={isCurrentPeriod}
                    onPeriodModeChange={setPeriodMode}
                    displayLabel={periodLabel}
                    maxDate={maxDate}
                    customDraftStartDate={customDraftStartDate}
                    customDraftEndDate={customDraftEndDate}
                    onCustomDraftRangeChange={setCustomDraftRange}
                    onCustomApply={applyCustomRange}
                    triggerAriaLabel="Select dashboard period"
                />
            </PageHeader>
            {!premium && usageLabel ? (
                <InvoiceUsageBanner label={usageLabel} className="mb-4" />
            ) : null}

            <DashboardAnalytics
                analytics={data?.analytics}
                periodSummary={data?.periodSummary}
                loading={dashboardLoading}
                fetching={isFetching && !isPending}
                periodUpdating={periodUpdating}
                premium={premium}
                showComparison={showComparison}
                comparisonLabel={comparisonLabel}
            />

            <div className="card mb-6">
                <h2 className="text-sm font-semibold text-foreground mb-3">Quick actions</h2>
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-primary w-full"
                    >
                        <Plus size={16} />
                        Create
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/quotations')}
                            className="btn-secondary w-full justify-center"
                        >
                            <ClipboardList size={16} />
                            Quotations
                        </button>
                        <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary w-full justify-center">
                            <TrendingUp size={16} />
                            Invoices
                        </button>
                        <button type="button" onClick={() => navigate('/receipts')} className="btn-secondary w-full justify-center">
                            <Receipt size={16} />
                            Receipts
                        </button>
                        <button type="button" onClick={() => navigate('/products')} className="btn-secondary w-full justify-center">
                            <Package size={16} />
                            Products
                        </button>
                    </div>
                </div>
            </div>

            {dashboardLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground mb-3">Recent sales documents</h2>
                        <TableSkeleton rows={5} columns={4} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Alerts</h2>
                        <p className="text-xs text-foreground-muted mt-0.5 mb-3">
                            All overdue invoices
                        </p>
                        <div className="card flex flex-col items-center gap-3 py-8">
                            <div className="h-10 w-10 rounded-full skeleton-bar" aria-hidden />
                            <div className="h-4 w-28 skeleton-bar" aria-hidden />
                            <div className="h-3 w-40 skeleton-bar" aria-hidden />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground mb-3">Recent sales documents</h2>
                        {recentDocuments.length === 0 ? (
                            <div className="data-table-wrap">
                                <EmptyState
                                    icon={FileText}
                                    title="No sales documents yet"
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => setCreateModalOpen(true)}
                                            className="btn-primary"
                                        >
                                            Create
                                        </button>
                                    }
                                />
                            </div>
                        ) : (
                            <DataTable columns={RECENT_COLUMNS}>
                                {recentDocuments.map((doc) => (
                                    <DataTableRow
                                        key={`${doc.documentType || 'invoice'}-${doc.id || doc._id}`}
                                        onClick={() => openDocument(doc)}
                                    >
                                        <DataTableCell>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <DocumentTypeBadge doc={doc} />
                                                <span className="font-medium text-foreground truncate">
                                                    {doc.displayNumber || getDisplayNumber(doc)}
                                                </span>
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <span className="truncate max-w-[160px] block">
                                                {doc.clientName || 'Unknown Client'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="font-medium tabular-nums">
                                                {formatCurrency(doc.total, doc.currency)}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusBadge {...resolveDocumentStatusBadge(doc)} />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                        )}
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Alerts</h2>
                        <p className="text-xs text-foreground-muted mt-0.5 mb-3">
                            All overdue invoices
                        </p>
                        {overdueInvoices.length === 0 ? (
                            <div className="card">
                                <EmptyState
                                    icon={CheckCircle}
                                    title="All caught up"
                                    description="No overdue invoices"
                                />
                            </div>
                        ) : (
                            <div className="data-table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice</th>
                                            <th>Due</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overdueInvoices.map((invoice) => (
                                            <DataTableRow
                                                key={invoice.id || invoice._id}
                                                onClick={() =>
                                                    navigate(`/invoices/${invoice.id || invoice._id}`)
                                                }
                                            >
                                                <DataTableCell>
                                                    <p className="font-medium text-foreground">
                                                        {getDisplayNumber(invoice)}
                                                    </p>
                                                    <p className="text-xs text-foreground-muted">
                                                        {invoice.clientName || 'Unknown Client'}
                                                    </p>
                                                </DataTableCell>
                                                <DataTableCell>
                                                    <span className="text-red-600 text-xs">
                                                        {invoice.dueDate
                                                            ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                                                            : '—'}
                                                    </span>
                                                </DataTableCell>
                                                <DataTableCell className="text-right">
                                                    <span className="font-medium text-red-600 tabular-nums">
                                                        {formatCurrency(invoice.total, invoice.currency)}
                                                    </span>
                                                </DataTableCell>
                                            </DataTableRow>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
