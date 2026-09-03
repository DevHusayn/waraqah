import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Plus, FileText, Search, ArrowUpDown, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getInvoiceAmountPaid, hasRecordedPayments } from '@waraqah/shared';
import { getClientBusiness } from '../utils/clientHelpers';
import { getDisplayNumber } from '../utils/receiptHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import CustomSelect from '../components/CustomSelect';
import FilterTabs from '../components/FilterTabs';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import StatusBadge from '../components/StatusBadge';
import { ListPageSkeleton, ListSummaryStatsSkeleton } from '../components/Skeleton';
import PaginationBar from '../components/PaginationBar';
import ListSummaryStats from '../components/ListSummaryStats';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useListSummaryQuery } from '../hooks/useListSummaryQuery';
import { useListMonthFilter } from '../hooks/useListMonthFilter';
import ListMonthToolbarFilter from '../components/ListMonthToolbarFilter';
import ListExportButton from '../components/ListExportButton';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'dueDate', label: 'Due date' },
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
];

const TABLE_COLUMNS = [
    { key: 'number', label: 'Invoice' },
    { key: 'client', label: 'Client' },
    { key: 'issueDate', label: 'Issue date' },
    { key: 'dueDate', label: 'Due date' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

const mapInvoice = (i) => ({ ...i, id: i._id || i.id });

const Invoices = () => {
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } = useInvoiceCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [recurringOnly, setRecurringOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const {
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        isCurrentPeriod,
        listQueryParams,
        listPeriodMode,
        setListPeriodMode,
        listPeriodLabel,
        listCustomDraftStartDate,
        listCustomDraftEndDate,
        setListCustomDraftRange,
        applyListCustomRange,
        listMaxDate,
    } = useListMonthFilter();

    const fetcher = useCallback(
        ({ page, limit, search, status, sort, period, startDate, endDate, recurring }) =>
            apiFetch(
                `/invoices?${buildListQuery({
                    page,
                    limit,
                    search,
                    status,
                    sort,
                    period,
                    startDate,
                    endDate,
                    recurring,
                })}`
            ),
        []
    );

    const { summary, summaryLoading } = useListSummaryQuery('invoices', summaryYear, summaryMonth);

    const {
        page,
        setPage,
        search,
        setSearch,
        debouncedSearch,
        data,
        pagination,
        statusCounts,
        loading,
    } = usePagedQuery({
        queryKeyBase: 'invoices',
        fetcher,
        extraParams: {
            status: filter,
            sort: sortBy,
            recurring: recurringOnly || undefined,
            ...listQueryParams,
        },
    });

    const invoices = useMemo(() => data.map(mapInvoice), [data]);

    useEffect(() => {
        setPage(1);
    }, [filter, sortBy, recurringOnly, listQueryParams, setPage]);

    const handleFilterChange = useCallback(
        (next) => {
            setFilter(next);
            setPage(1);
        },
        [setPage]
    );

    const filterTabs = useMemo(() => {
        const counts = statusCounts || {};
        return ['all', 'pending', 'partial', 'paid', 'overdue', 'cancelled'].map((status) => ({
            value: status,
            label: status,
            count: counts[status] ?? 0,
        }));
    }, [statusCounts]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);
    const showStats = !(loading && invoices.length === 0 && !search && !summary);

    const clientLabel = (invoice) =>
        invoice.clientName || 'Unknown Client';

    return (
        <>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />
            <div>
                <PageHeader title="Invoices" subtitle="Manage and track all your invoices">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                        <Plus size={16} />
                        Create invoice
                    </button>
                </PageHeader>

                {!premium && usageLabel ? (
                    <InvoiceUsageBanner label={usageLabel} className="mb-4" />
                ) : null}

                {showStats ? (
                    <ListSummaryStats
                        visible
                        totalLabel="Total invoices"
                        total={summary?.totalInvoices}
                        newInPeriod={summary?.newInPeriod ?? summary?.newThisMonth}
                        newComparison={summary?.comparison?.newInPeriod}
                        comparisonLabel={isCurrentPeriod ? 'vs last month' : 'vs previous month'}
                        periodLabel={periodLabel}
                        monthInputValue={monthInputValue}
                        onPeriodChange={setMonthInputValue}
                        summaryLoading={summaryLoading}
                    />
                ) : loading && invoices.length === 0 && !search ? (
                    <ListSummaryStatsSkeleton />
                ) : null}

                <Toolbar className="mb-4">
                    <ToolbarSearch
                        icon={Search}
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search invoices..."
                        aria-label="Search invoices"
                        action={
                            <ListExportButton
                                path="/invoices/export"
                                resource="invoices"
                                companyName={businessInfo?.name}
                                filters={{
                                    search: debouncedSearch,
                                    status: filter,
                                    sort: sortBy,
                                    ...listQueryParams,
                                }}
                                disabled={pagination.total === 0}
                                onExported={() => showToast('Invoices exported successfully.', 'success')}
                                onError={(err) => showToast(err.message || 'Export failed.', 'error')}
                            />
                        }
                    />
                    <ToolbarActions>
                        <ListMonthToolbarFilter
                            periodMode={listPeriodMode}
                            onPeriodModeChange={setListPeriodMode}
                            periodLabel={listPeriodLabel}
                            customDraftStartDate={listCustomDraftStartDate}
                            customDraftEndDate={listCustomDraftEndDate}
                            onCustomDraftRangeChange={setListCustomDraftRange}
                            onCustomApply={applyListCustomRange}
                            maxDate={listMaxDate}
                        />
                        <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                            <CustomSelect
                                value={sortBy}
                                onChange={setSortBy}
                                options={SORT_OPTIONS}
                                placeholder="Sort by"
                                leadingIcon={<ArrowUpDown size={14} />}
                                aria-label="Sort invoices"
                            />
                        </div>
                    </ToolbarActions>
                </Toolbar>

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <FilterTabs tabs={filterTabs} value={filter} onChange={handleFilterChange} className="mb-0 flex-1" />
                    <button
                        type="button"
                        onClick={() => setRecurringOnly((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            recurringOnly
                                ? 'border-brand bg-brand-subtle text-brand'
                                : 'border-border text-foreground-muted hover:bg-surface-muted'
                        }`}
                        aria-pressed={recurringOnly}
                    >
                        <Repeat size={12} aria-hidden />
                        Recurring
                    </button>
                </div>

                {loading && invoices.length === 0 ? (
                    <ListPageSkeleton
                        rows={8}
                        columns={6}
                        withHeader={false}
                        withToolbar={false}
                        withAction={false}
                    />
                ) : invoices.length === 0 ? (
                    <div className="data-table-wrap">
                        <EmptyState
                            icon={FileText}
                            title={
                                search
                                    ? 'No matching invoices'
                                    : filter === 'all'
                                      ? 'No invoices yet'
                                      : `No ${filter} invoices`
                            }
                            description={
                                search
                                    ? 'Try a different search term'
                                    : filter === 'all'
                                      ? 'Create your first invoice to get started'
                                      : `You don't have any ${filter} invoices`
                            }
                            action={
                                filter === 'all' && !search ? (
                                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                                        <Plus size={16} />
                                        Create invoice
                                    </button>
                                ) : null
                            }
                        />
                    </div>
                ) : (
                    <>
                        <DataTable columns={TABLE_COLUMNS}>
                            {invoices.map((invoice) => {
                                const business =
                                    invoice.clientCompany ||
                                    getClientBusiness({
                                        company: invoice.clientCompany,
                                        name: invoice.clientName,
                                    });
                                return (
                                    <DataTableRow
                                        key={invoice.id}
                                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    >
                                        <DataTableCell>
                                            <span className="font-medium text-foreground">
                                                {getDisplayNumber(invoice) || '—'}
                                            </span>
                                            {invoice.isRecurring ? (
                                                <span className="ml-2 inline-flex align-middle text-brand" title="Recurring">
                                                    <Repeat size={12} aria-hidden />
                                                </span>
                                            ) : null}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate max-w-[200px]">
                                                    {clientLabel(invoice)}
                                                </p>
                                                {business ? (
                                                    <p className="text-xs text-foreground-muted truncate max-w-[200px]">
                                                        {business}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            {invoice.date
                                                ? format(new Date(invoice.date), 'MMM d, yyyy')
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {invoice.dueDate
                                                ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="font-medium text-foreground tabular-nums">
                                                {formatCurrency(invoice.total, invoice.currency)}
                                            </span>
                                            {hasRecordedPayments(invoice) &&
                                            invoice.status !== 'paid' ? (
                                                <p className="text-xs text-foreground-muted mt-0.5 tabular-nums">
                                                    Paid{' '}
                                                    {formatCurrency(
                                                        getInvoiceAmountPaid(invoice),
                                                        invoice.currency
                                                    )}
                                                </p>
                                            ) : null}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusBadge status={invoice.status} />
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                        <PaginationBar
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                            disabled={loading}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default Invoices;
