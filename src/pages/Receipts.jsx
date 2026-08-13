import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Plus, Receipt, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { getReceiptNumber, getPaymentMethodLabel, getReceiptStatusBadge } from '../utils/receiptHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useReceiptCreateGuard } from '../hooks/useReceiptCreateGuard';
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
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
];

const TABLE_COLUMNS = [
    { key: 'number', label: 'Receipt' },
    { key: 'client', label: 'Client' },
    { key: 'issueDate', label: 'Issue date' },
    { key: 'paymentDate', label: 'Payment date' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'method', label: 'Payment method' },
    { key: 'status', label: 'Status' },
];

const RECEIPT_FILTER_TABS = [
    { value: 'all', label: 'All' },
    { value: 'partial', label: 'Part received' },
    { value: 'full', label: 'Fully received' },
];

const mapReceipt = (r) => ({ ...r, id: r._id || r.id });

const Receipts = () => {
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } =
        useReceiptCreateGuard();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const {
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        isCurrentPeriod,
        listYear,
        listMonth,
        allTime,
        setAllTime,
        listMonthInputValue,
        setListMonthInputValue,
    } = useListMonthFilter();

    const fetcher = useCallback(
        ({ page, limit, search, status, sort, year, month }) =>
            apiFetch(
                `/receipts?${buildListQuery({
                    page,
                    limit,
                    search,
                    status,
                    sort,
                    year,
                    month,
                })}`
            ),
        []
    );

    const { summary, summaryLoading } = useListSummaryQuery('receipts', summaryYear, summaryMonth);

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
        queryKeyBase: 'receipts',
        fetcher,
        extraParams: {
            status: filter,
            sort: sortBy,
            year: listYear,
            month: listMonth,
        },
    });

    const receipts = useMemo(() => data.map(mapReceipt), [data]);

    useEffect(() => {
        setPage(1);
    }, [filter, sortBy, listYear, listMonth, setPage]);

    const handleFilterChange = useCallback(
        (next) => {
            setFilter(next);
            setPage(1);
        },
        [setPage]
    );

    const filterTabs = useMemo(() => {
        const counts = statusCounts || {};
        return RECEIPT_FILTER_TABS.map((tab) => ({
            ...tab,
            count: counts[tab.value] ?? 0,
        }));
    }, [statusCounts]);

    const filterEmptyLabel = useMemo(() => {
        if (filter === 'partial') return 'Part received';
        if (filter === 'full') return 'Fully received';
        return null;
    }, [filter]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);
    const showStats = !(loading && receipts.length === 0 && !search && !summary);

    return (
        <>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />
            <div>
                <PageHeader title="Receipts" subtitle="Payment records issued without an invoice">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                        <Plus size={18} aria-hidden />
                        New receipt
                    </button>
                </PageHeader>

                {!premium && usageLabel ? (
                    <InvoiceUsageBanner label={usageLabel} className="mb-4" />
                ) : null}

                {showStats ? (
                    <ListSummaryStats
                        visible
                        totalLabel="Total receipts"
                        total={summary?.totalReceipts}
                        newInPeriod={summary?.newInPeriod ?? summary?.newThisMonth}
                        newComparison={summary?.comparison?.newInPeriod}
                        comparisonLabel={isCurrentPeriod ? 'vs last month' : 'vs previous month'}
                        periodLabel={periodLabel}
                        monthInputValue={monthInputValue}
                        onPeriodChange={setMonthInputValue}
                        summaryLoading={summaryLoading}
                    />
                ) : loading && receipts.length === 0 && !search ? (
                    <ListSummaryStatsSkeleton />
                ) : null}

                <Toolbar className="mb-4">
                    <ToolbarSearch
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by receipt number or client…"
                        icon={Search}
                        type="search"
                        aria-label="Search receipts"
                    />
                    <ToolbarActions>
                        <ListMonthToolbarFilter
                            monthInputValue={listMonthInputValue}
                            onMonthChange={setListMonthInputValue}
                            allTime={allTime}
                            onShowAllTime={setAllTime}
                        />
                        <ListExportButton
                            path="/receipts/export"
                            resource="receipts"
                            companyName={businessInfo?.name}
                            filters={{
                                search: debouncedSearch,
                                status: filter,
                                sort: sortBy,
                                year: listYear,
                                month: listMonth,
                            }}
                            disabled={pagination.total === 0}
                            onExported={() => showToast('Receipts exported successfully.', 'success')}
                            onError={(err) => showToast(err.message || 'Export failed.', 'error')}
                        />
                        <CustomSelect
                            value={sortBy}
                            onChange={setSortBy}
                            options={SORT_OPTIONS}
                            icon={ArrowUpDown}
                            ariaLabel="Sort receipts"
                        />
                    </ToolbarActions>
                </Toolbar>

                <FilterTabs tabs={filterTabs} value={filter} onChange={handleFilterChange} className="mb-4" />

                {loading && receipts.length === 0 ? (
                    <ListPageSkeleton
                        rows={8}
                        columns={6}
                        withHeader={false}
                        withToolbar={false}
                        withAction={false}
                    />
                ) : receipts.length === 0 ? (
                    <div className="data-table-wrap">
                        <EmptyState
                            icon={Receipt}
                            title={
                                search
                                    ? 'No matching receipts'
                                    : filter === 'all'
                                      ? 'No receipts yet'
                                      : `No ${filterEmptyLabel?.toLowerCase()} receipts`
                            }
                            description={
                                search
                                    ? 'Try a different search term'
                                    : filter === 'all'
                                      ? 'Issue a receipt when you\'ve received payment and don\'t need an invoice.'
                                      : `You don't have any ${filterEmptyLabel?.toLowerCase()} receipts yet.`
                            }
                            actionLabel={filter === 'all' && !search ? 'Create receipt' : undefined}
                            onAction={filter === 'all' && !search ? tryNavigateToCreate : undefined}
                        />
                    </div>
                ) : (
                    <>
                        <DataTable columns={TABLE_COLUMNS}>
                            {receipts.map((receipt) => {
                                const business =
                                    receipt.clientCompany ||
                                    getClientBusiness({
                                        company: receipt.clientCompany,
                                        name: receipt.clientName,
                                    });
                                return (
                                <DataTableRow
                                    key={receipt.id}
                                    onClick={() => navigate(`/receipts/${receipt.id}`)}
                                    className="cursor-pointer"
                                >
                                    <DataTableCell>
                                        <span className="font-medium text-zinc-900">
                                            {getReceiptNumber(receipt) || '—'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <div>
                                            <p className="font-medium text-zinc-900">
                                                {receipt.clientName || 'Unknown Client'}
                                            </p>
                                            {business ? (
                                                <p className="text-xs text-zinc-500">{business}</p>
                                            ) : null}
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {receipt.date
                                            ? format(new Date(receipt.date), 'MMM dd, yyyy')
                                            : '—'}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {receipt.datePaid
                                            ? format(new Date(receipt.datePaid), 'MMM dd, yyyy')
                                            : '—'}
                                    </DataTableCell>
                                    <DataTableCell className="text-right font-medium">
                                        {formatCurrency(receipt.total, receipt.currency)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {getPaymentMethodLabel(receipt.paymentMethod)}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge {...getReceiptStatusBadge(receipt)} />
                                    </DataTableCell>
                                </DataTableRow>
                                );
                            })}
                        </DataTable>
                        <PaginationBar
                            page={page}
                            totalPages={pagination?.totalPages || 1}
                            total={pagination?.total || 0}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default Receipts;
