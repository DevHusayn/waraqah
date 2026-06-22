import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Plus, FileText, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { getDisplayNumber } from '../utils/receiptHelpers';
import { filterInvoicesBySearch, sortInvoices, filterNonDraftInvoices } from '../utils/invoiceHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import CustomSelect from '../components/CustomSelect';
import Spinner, { PageLoader } from '../components/Spinner';
import FilterTabs from '../components/FilterTabs';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import StatusBadge from '../components/StatusBadge';

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

const Invoices = () => {
    const navigate = useNavigate();
    const { invoices, clients, loading } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } = useInvoiceCreateGuard();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const activeInvoices = useMemo(() => filterNonDraftInvoices(invoices), [invoices]);

    const getClientName = (clientId) => {
        const client = clients.find((c) => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    };

    const displayedInvoices = useMemo(() => {
        let list = activeInvoices;
        list = filter === 'all' ? list : list.filter((inv) => inv.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, sortBy);
    }, [activeInvoices, clients, filter, search, sortBy]);

    const filterTabs = useMemo(() => {
        const statuses = ['all', 'pending', 'paid', 'overdue', 'cancelled'];
        return statuses.map((status) => ({
            value: status,
            label: status,
            count:
                status === 'all'
                    ? activeInvoices.length
                    : activeInvoices.filter((inv) => inv.status === status).length,
        }));
    }, [activeInvoices]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

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
                    <p className="mb-4 text-sm text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-md px-3 py-2">
                        {usageLabel}
                    </p>
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

                {loading ? (
                    <PageLoader />
                ) : displayedInvoices.length === 0 ? (
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
                    <DataTable columns={TABLE_COLUMNS}>
                        {displayedInvoices.map((invoice) => {
                            const client = clients.find((c) => c.id === invoice.clientId);
                            const business = getClientBusiness(client);
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
                                                {getClientName(invoice.clientId)}
                                            </p>
                                            {business ? (
                                                <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                                    {business}
                                                </p>
                                            ) : null}
                                        </div>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {format(new Date(invoice.date), 'MMM d, yyyy')}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {invoice.dueDate
                                            ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                                            : '—'}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <span className="font-medium text-zinc-950 tabular-nums">
                                            {formatCurrency(invoice.total)}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge status={invoice.status} />
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>
                )}
            </div>
        </>
    );
};

export default Invoices;
