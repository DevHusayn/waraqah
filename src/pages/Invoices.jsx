import { useMemo, useState } from 'react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import { useSettings } from '../context/SettingsContext';
import { Plus, Edit, Trash2, Download, FileText, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { generatePDF } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import { filterInvoicesBySearch, sortInvoices } from '../utils/invoiceHelpers';
import PageHeader from '../components/PageHeader';

const Invoices = () => {
    const navigate = useNavigate();
    const { invoices, clients, deleteInvoice, loading } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, invoiceId: null });

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
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

    const handleDelete = (id) => {
        setConfirm({ open: true, invoiceId: id });
    };

    const confirmDelete = async () => {
        const id = confirm.invoiceId;
        try {
            await deleteInvoice(id);
            showToast('Invoice deleted successfully', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete invoice.', type: 'error' });
        }
        setConfirm({ open: false, invoiceId: null });
    };

    const handleDownload = async (invoice) => {
        const client = clients.find(c => c.id === invoice.clientId);
        if (!client) {
            setAlert({ open: true, message: 'Client data not found for this invoice.' });
            return;
        }
        try {
            await generatePDF(invoice, client, businessInfo);
            showToast('PDF downloaded', 'success');
        } catch (error) {
            setAlert({ open: true, message: `Failed to generate PDF: ${error.message}` });
        }
    };

    const displayedInvoices = useMemo(() => {
        let list = filter === 'all' ? invoices : invoices.filter(inv => inv.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, sortBy);
    }, [invoices, clients, filter, search, sortBy]);

    return (
        <>
            <AlertModal open={alert.open} message={alert.message} type={alert.type} onClose={() => setAlert({ open: false, message: '', type: 'error' })} />
            <ConfirmModal
                open={confirm.open}
                message={"Are you sure you want to delete this invoice?"}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, invoiceId: null })}
            />
            <div>
                <PageHeader title="Invoices" subtitle="Manage and track all your invoices">
                    <button type="button" onClick={() => navigate('/invoices/create')} className="btn-primary">
                        <Plus size={20} />
                        Create invoice
                    </button>
                </PageHeader>

                {/* Search & sort */}
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
                    <div className="relative sm:w-52">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="input-field pl-9 appearance-none cursor-pointer"
                            aria-label="Sort invoices"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="dueDate">Due date</option>
                            <option value="amountHigh">Amount (high to low)</option>
                            <option value="amountLow">Amount (low to high)</option>
                        </select>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
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
                                {status !== 'all' && ` (${invoices.filter(inv => inv.status === status).length})`}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex justify-center items-center"><Spinner /></div>
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
                            <button type="button" onClick={() => navigate('/invoices/create')} className="btn-primary mt-8 mx-auto">
                                <Plus size={20} />
                                Create Your First Invoice
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {displayedInvoices.map((invoice) => {
                            const client = clients.find((c) => c.id === invoice.clientId);
                            const business = getClientBusiness(client);
                            return (
                            <div key={invoice.id} className="card hover:shadow-card-md transition-shadow duration-200 !p-0 overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {invoice.invoiceNumber}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {getClientName(invoice.clientId)}
                                                    {business ? ` • ${business}` : ''}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)} capitalize`}>
                                                {invoice.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                            <div>
                                                <p className="text-gray-400">Issue Date</p>
                                                <p className="font-medium text-gray-900">
                                                    {format(new Date(invoice.date), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Due Date</p>
                                                <p className="font-medium text-gray-900">
                                                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Amount</p>
                                                <p className="font-semibold text-brand text-lg">
                                                    {formatCurrency(invoice.total)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Items</p>
                                                <p className="font-medium text-gray-900">
                                                    {(invoice.items?.length ?? 0)} item{(invoice.items?.length ?? 0) !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex lg:flex-col gap-2 min-w-[120px]">
                                        <button
                                            onClick={() => handleDownload(invoice)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm"
                                            aria-label="Download PDF"
                                        >
                                            <Download size={16} />
                                            PDF
                                        </button>
                                        <button
                                            onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                                            className="bg-brand-light hover:bg-brand-subtle text-brand font-medium flex items-center gap-2 px-4 py-2 rounded-xl transition text-sm"
                                            aria-label="Edit invoice"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(invoice.id)}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm"
                                            aria-label="Delete invoice"
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default Invoices;
