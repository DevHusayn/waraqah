import { useMemo } from 'react';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { FileText, Users, Wallet, Clock, TrendingUp, CheckCircle, FileBarChart, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { getDisplayNumber } from '../utils/receiptHelpers';
import { filterNonDraftInvoices } from '../utils/invoiceHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';

const RECENT_COLUMNS = [
    { key: 'number', label: 'Invoice' },
    { key: 'client', label: 'Client' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

const Dashboard = () => {
    const { invoices, clients } = useInvoice();
    const { businessInfo } = useSettings();
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } = useInvoiceCreateGuard();

    const activeInvoices = useMemo(() => filterNonDraftInvoices(invoices), [invoices]);

    const totalRevenue = activeInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    const pendingRevenue = activeInvoices
        .filter((inv) => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.total, 0);

    const overdueInvoices = activeInvoices.filter((inv) => inv.status === 'overdue');

    const recentInvoices = [...activeInvoices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const stats = [
        { name: 'Total Invoices', value: activeInvoices.length, icon: FileText, iconBg: 'bg-brand-light', iconColor: 'text-brand' },
        { name: 'Total Clients', value: clients.length, icon: Users, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { name: 'Revenue (Paid)', value: formatCurrency(totalRevenue), icon: Wallet, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
        { name: 'Pending Revenue', value: formatCurrency(pendingRevenue), icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    ];

    const getClientName = (clientId) => {
        const client = clients.find((c) => c.id === clientId);
        return client ? client.name : 'Unknown Client';
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
            <PageHeader title="Dashboard" subtitle="Your invoicing overview" />
            {!premium && usageLabel ? (
                <InvoiceUsageBanner label={usageLabel} className="mb-4" />
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3 mb-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="stat-card">
                            <div className={`stat-card-icon ${stat.iconBg}`}>
                                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                            </div>
                            <div className="stat-card-body">
                                <p className="text-xs text-zinc-500 font-medium">{stat.name}</p>
                                <p className="stat-card-value">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card mb-6">
                <h2 className="text-sm font-semibold text-zinc-950 mb-3">Quick actions</h2>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                        <FileText size={16} />
                        Create invoice
                    </button>
                    <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">
                        <Users size={16} />
                        Clients
                    </button>
                    <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary">
                        <TrendingUp size={16} />
                        All invoices
                    </button>
                    <button type="button" onClick={() => navigate('/statements')} className="btn-secondary">
                        <FileBarChart size={16} />
                        Statements
                        {!premium ? <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden /> : null}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-950 mb-3">Recent invoices</h2>
                    {recentInvoices.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                icon={FileText}
                                title="No invoices yet"
                                action={
                                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                                        Create invoice
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <DataTable columns={RECENT_COLUMNS}>
                            {recentInvoices.map((invoice) => (
                                <DataTableRow
                                    key={invoice.id}
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                >
                                    <DataTableCell>
                                        <span className="font-medium text-zinc-950">
                                            {getDisplayNumber(invoice)}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="truncate max-w-[160px] block">
                                            {getClientName(invoice.clientId)}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <span className="font-medium tabular-nums">
                                            {formatCurrency(invoice.total)}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge status={invoice.status} />
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTable>
                    )}
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-zinc-950 mb-3">Alerts</h2>
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
                                            key={invoice.id}
                                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                                        >
                                            <DataTableCell>
                                                <p className="font-medium text-zinc-950">
                                                    {getDisplayNumber(invoice)}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {getClientName(invoice.clientId)}
                                                </p>
                                            </DataTableCell>
                                            <DataTableCell>
                                                <span className="text-red-600 text-xs">
                                                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                                </span>
                                            </DataTableCell>
                                            <DataTableCell className="text-right">
                                                <span className="font-medium text-red-600 tabular-nums">
                                                    {formatCurrency(invoice.total)}
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
        </div>
    );
};

export default Dashboard;
