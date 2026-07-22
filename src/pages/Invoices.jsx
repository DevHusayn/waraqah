import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Plus, FileText, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
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
import { ListPageSkeleton } from '../components/Skeleton';
import PaginationBar from '../components/PaginationBar';
import { usePagedList } from '../hooks/usePagedList';
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
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(
                `/invoices?${buildListQuery({
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

    const invoices = useMemo(() => data.map(mapInvoice), [data]);

    useEffect(() => {
        setPage(1);
    }, [filter, sortBy, setPage]);

    const filterTabs = useMemo(() => {
        const counts = statusCounts || {};
        return ['all', 'pending', 'paid', 'overdue', 'cancelled'].map((status) => ({
            value: status,
            label: status,
            count: counts[status] ?? 0,
        }));
    }, [statusCounts]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

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

                <Toolbar className="mb-4">
                    <ToolbarSearch
                        icon={Search}
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search invoices..."
                        aria-label="Search invoices"
                    />
                    <ToolbarActions>
                        <div className="w-full sm:w-44">
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

                <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} className="mb-4" />

                {loading && invoices.length === 0 ? (
                    <ListPageSkeleton rows={8} columns={6} withAction={false} />
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
                                            <span className="font-medium text-zinc-950">
                                                {getDisplayNumber(invoice) || '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <div className="min-w-0">
                                                <p className="text-zinc-950 truncate max-w-[200px]">
                                                    {clientLabel(invoice)}
                                                </p>
                                                {business ? (
                                                    <p className="text-xs text-zinc-500 truncate max-w-[200px]">
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
                                            <span className="font-medium text-zinc-950 tabular-nums">
                                                {formatCurrency(invoice.total, invoice.currency)}
                                            </span>
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
