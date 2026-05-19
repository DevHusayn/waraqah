import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';

const Dashboard = () => {
    const { invoices, clients } = useInvoice();
    const { businessInfo } = useSettings();
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } = useInvoiceCreateGuard();

    const totalRevenue = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    const pendingRevenue = invoices
        .filter((inv) => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.total, 0);

    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');

    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const stats = [
        { name: 'Total Invoices', value: invoices.length, icon: FileText, iconBg: 'bg-brand-light', iconColor: 'text-brand' },
        { name: 'Total Clients', value: clients.length, icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { name: 'Revenue (Paid)', value: formatCurrency(totalRevenue), icon: DollarSign, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
        { name: 'Pending Revenue', value: formatCurrency(pendingRevenue), icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    ];

    const getClientName = (clientId) => {
        const client = clients.find((c) => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-800',
            paid: 'bg-emerald-100 text-emerald-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-slate-100 text-slate-600',
        };
        return colors[status] || colors.pending;
    };

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    return (
        <div>
            <InvoiceLimitModal
                open={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                usage={invoiceUsage}
            />
            <PageHeader title="Dashboard" subtitle="Welcome back — here's your invoicing overview" />
            {!premium && usageLabel ? (
                <p className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    {usageLabel}
                </p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="stat-card">
                            <div className={`${stat.iconBg} p-3 rounded-xl flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">{stat.name}</p>
                                <p className="text-xl font-semibold text-slate-900 mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary justify-start py-3">
                        <FileText size={18} />
                        Create invoice
                    </button>
                    <button type="button" onClick={() => navigate('/clients')} className="btn-secondary justify-start py-3 bg-brand-light border-brand/20 text-brand hover:bg-brand-subtle">
                        <Users size={18} />
                        Manage clients
                    </button>
                    <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary justify-start py-3">
                        <TrendingUp size={18} />
                        View all invoices
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent invoices</h2>
                    {recentInvoices.length === 0 ? (
                        <div className="text-center py-10">
                            <FileText className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-3 text-slate-500">No invoices yet</p>
                            <button type="button" onClick={tryNavigateToCreate} className="btn-primary mt-6 mx-auto">
                                Create your first invoice
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentInvoices.map((invoice) => (
                                <button
                                    type="button"
                                    key={invoice.id}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left border border-slate-100"
                                    onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-slate-500 truncate">{getClientName(invoice.clientId)}</p>
                                    </div>
                                    <div className="text-right ml-3 flex-shrink-0">
                                        <p className="font-semibold text-brand">{formatCurrency(invoice.total)}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(invoice.status)} capitalize mt-1`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Alerts</h2>
                    {overdueInvoices.length === 0 ? (
                        <div className="text-center py-10">
                            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                            <p className="mt-3 font-medium text-slate-900">All caught up</p>
                            <p className="text-slate-500 text-sm">No overdue invoices</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {overdueInvoices.map((invoice) => (
                                <div key={invoice.id} className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                                            <p className="text-sm text-slate-500">{getClientName(invoice.clientId)}</p>
                                            <p className="text-xs text-red-600 mt-1">
                                                Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-red-600 flex-shrink-0">{formatCurrency(invoice.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
