import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Plus, ClipboardList, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { getDisplayNumber } from '../utils/receiptHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import CustomSelect from '../components/CustomSelect';
import FilterTabs from '../components/FilterTabs';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import StatusBadge from '../components/StatusBadge';
import { ListPageSkeleton } from '../components/Skeleton';
import PaginationBar from '../components/PaginationBar';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'validUntil', label: 'Valid until' },
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
];

const TABLE_COLUMNS = [
    { key: 'number', label: 'Quotation' },
    { key: 'client', label: 'Client' },
    { key: 'issueDate', label: 'Issue date' },
    { key: 'validUntil', label: 'Valid until' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

const mapQuotation = (q) => ({ ...q, id: q._id || q.id });

const Quotations = () => {
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } =
        useQuotationCreateGuard();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(
                `/quotations?${buildListQuery({
                    page,
                    limit,
                    search,
                    status: filter,
                    sort: sortBy,
                })}`
            ),
        [filter, sortBy]
    );

    const {
        page,
        setPage,
        search,
        setSearch,
        data,
        pagination,
        statusCounts,
        loading,
    } = usePagedList({
        fetcher,
        extraDeps: [filter, sortBy],
    });

    const quotations = useMemo(() => data.map(mapQuotation), [data]);

    useEffect(() => {
        setPage(1);
    }, [filter, sortBy, setPage]);

    const filterTabs = useMemo(() => {
        const counts = statusCounts || {};
        return ['all', 'sent', 'accepted', 'rejected', 'expired', 'converted'].map((status) => ({
            value: status,
            label: status,
            count: counts[status] ?? 0,
        }));
    }, [statusCounts]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const clientLabel = (quotation) => quotation.clientName || 'Unknown Client';

    return (
        <>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />
            <div>
                <PageHeader title="Quotations" subtitle="Manage estimates and proposals">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                        <Plus size={16} />
                        New Quotation
                    </button>
                </PageHeader>

                {!premium && usageLabel ? (
                    <InvoiceUsageBanner label={usageLabel} className="mb-4" />
                ) : null}

                <Toolbar className="mb-4">
                    <ToolbarSearch
                        icon={Search}
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search quotations..."
                        aria-label="Search quotations"
                    />
                    <ToolbarActions>
                        <div className="w-full sm:w-44">
                            <CustomSelect
                                value={sortBy}
                                onChange={setSortBy}
                                options={SORT_OPTIONS}
                                placeholder="Sort by"
                                leadingIcon={<ArrowUpDown size={14} />}
                                aria-label="Sort quotations"
                            />
                        </div>
                    </ToolbarActions>
                </Toolbar>

                <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} className="mb-4" />

                {loading && quotations.length === 0 ? (
                    <ListPageSkeleton rows={8} columns={6} withAction={false} />
                ) : quotations.length === 0 ? (
                    <div className="data-table-wrap">
                        <EmptyState
                            icon={ClipboardList}
                            title={
                                search
                                    ? 'No matching quotations'
                                    : filter === 'all'
                                      ? 'No quotations yet'
                                      : `No ${filter} quotations`
                            }
                            description={
                                search
                                    ? 'Try a different search term'
                                    : filter === 'all'
                                      ? 'Create your first quotation to get started'
                                      : `You don't have any ${filter} quotations`
                            }
                            action={
                                filter === 'all' && !search ? (
                                    <button
                                        type="button"
                                        onClick={tryNavigateToCreate}
                                        className="btn-primary"
                                    >
                                        <Plus size={16} />
                                        New Quotation
                                    </button>
                                ) : null
                            }
                        />
                    </div>
                ) : (
                    <>
                        <DataTable columns={TABLE_COLUMNS}>
                            {quotations.map((quotation) => {
                                const business =
                                    quotation.clientCompany ||
                                    getClientBusiness({
                                        company: quotation.clientCompany,
                                        name: quotation.clientName,
                                    });
                                return (
                                    <DataTableRow
                                        key={quotation.id}
                                        onClick={() => navigate(`/quotations/${quotation.id}`)}
                                    >
                                        <DataTableCell>
                                            <span className="font-medium text-zinc-950">
                                                {getDisplayNumber(quotation) || '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <div className="min-w-0">
                                                <p className="text-zinc-950 truncate max-w-[200px]">
                                                    {clientLabel(quotation)}
                                                </p>
                                                {business ? (
                                                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                        {business}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            {quotation.date
                                                ? format(new Date(quotation.date), 'MMM d, yyyy')
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {quotation.validUntil
                                                ? format(new Date(quotation.validUntil), 'MMM d, yyyy')
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="font-medium text-zinc-950 tabular-nums">
                                                {formatCurrency(quotation.total, quotation.currency)}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusBadge status={quotation.status} />
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

export default Quotations;
