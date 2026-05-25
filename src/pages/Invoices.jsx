import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Plus, FileText, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { getDisplayNumber, isReceipt, getPaymentMethodLabel } from '../utils/receiptHelpers';
import { filterInvoicesBySearch, sortInvoices } from '../utils/invoiceHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import CustomSelect from '../components/CustomSelect';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'dueDate', label: 'Due date' },
    { value: 'amountHigh', label: 'Amount (high to low)' },
    { value: 'amountLow', label: 'Amount (low to high)' },
];

const Invoices = () => {
    const navigate = useNavigate();
    const { invoices, clients, loading } = useInvoice();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } = useInvoiceCreateGuard();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const getClientName = (clientId) => {
        const client = clients.find((c) => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            paid: 'bg-green-100 text-green-800 border-green-200',
            overdue: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[status] || colors.pending;
    };

    const displayedInvoices = useMemo(() => {
        let list = filter === 'all' ? invoices : invoices.filter((inv) => inv.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, sortBy);
    }, [invoices, clients, filter, search, sortBy]);

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
                        <Plus size={20} />
                        Create invoice
                    </button>
                </PageHeader>

                {!premium && usageLabel ? (
                    <p className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                        {usageLabel}
                    </p>
                ) : null}

                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by invoice #, client, or amount..."
                            className="input-field pl-10"
                            aria-label="Search invoices"
                        />
                    </div>
                    <div className="sm:w-52">
                        <CustomSelect
                            value={sortBy}
                            onChange={setSortBy}
                            options={SORT_OPTIONS}
                            placeholder="Sort by"
                            leadingIcon={<ArrowUpDown size={16} />}
                            aria-label="Sort invoices"
                        />
                    </div>
                </div>

                <div className="mb-8 overflow-x-auto scroll-x-touch">
                    <div className="inline-flex min-w-min gap-1 bg-slate-100 rounded-xl p-1">
                        {['all', 'pending', 'paid', 'overdue', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFilter(status)}
                                className={`filter-pill ${filter === status ? 'filter-pill-active' : 'filter-pill-inactive'}`}
                            >
                                {status}
                                {status === 'all' && ` (${invoices.length})`}
                                {status !== 'all' &&
                                    ` (${invoices.filter((inv) => inv.status === status).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex justify-center items-center">
                        <Spinner />
                    </div>
                ) : displayedInvoices.length === 0 ? (
                    <div className="card text-center py-16 px-4">
                        <FileText className="mx-auto h-14 w-14 text-gray-300" />
                        <h3 className="mt-5 text-xl font-bold text-gray-900">
                            {search
                                ? 'No matching invoices'
                                : filter === 'all'
                                  ? 'No invoices yet'
                                  : `No ${filter} invoices`}
                        </h3>
                        <p className="mt-2 text-gray-500 text-base">
                            {search
                                ? 'Try a different search term'
                                : filter === 'all'
                                  ? 'Create your first invoice to get started'
                                  : `You don't have any ${filter} invoices`}
                        </p>
                        {filter === 'all' && !search && (
                            <button
                                type="button"
                                onClick={tryNavigateToCreate}
                                className="btn-primary mt-8 mx-auto"
                            >
                                <Plus size={20} />
                                Create Your First Invoice
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedInvoices.map((invoice) => {
                            const client = clients.find((c) => c.id === invoice.clientId);
                            const business = getClientBusiness(client);
                            const paid = isReceipt(invoice);
                            return (
                                <button
                                    key={invoice.id}
                                    type="button"
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                    className="card hover:shadow-card-md transition-shadow duration-200 !p-0 overflow-hidden w-full text-left cursor-pointer"
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 truncate">
                                                    {getDisplayNumber(invoice) || '—'}
                                                </h3>
                                                {paid && (
                                                    <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                                                        Paid
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {getClientName(invoice.clientId)}
                                                    {business ? ` • ${business}` : ''}
                                                </p>
                                            </div>
                                            <span
                                                className={`self-start shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)} capitalize`}
                                            >
                                                {invoice.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mt-4 text-sm">
                                            <div>
                                                <p className="text-gray-400">Issue Date</p>
                                                <p className="font-medium text-gray-900">
                                                    {format(new Date(invoice.date), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            {paid ? (
                                                <div>
                                                    <p className="text-gray-400">Payment</p>
                                                    <p className="font-medium text-gray-900">
                                                        {getPaymentMethodLabel(invoice.paymentMethod)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-gray-400">Due Date</p>
                                                    <p className="font-medium text-gray-900">
                                                        {invoice.dueDate
                                                            ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                                                            : '—'}
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-400">Amount</p>
                                                <p className="font-semibold text-brand text-lg">
                                                    {formatCurrency(invoice.total)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Items</p>
                                                <p className="font-medium text-gray-900">
                                                    {invoice.items?.length ?? 0} item
                                                    {(invoice.items?.length ?? 0) !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default Invoices;
