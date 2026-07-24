import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Users,
    Wallet,
    Clock,
    TrendingUp,
    CheckCircle,
    FileBarChart,
    Crown,
    ClipboardList,
    Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { getDisplayNumber } from '../utils/receiptHelpers';
import { isQuotationDocument } from '../utils/documentHelpers';
import PageHeader from '../components/PageHeader';
import InvoiceLimitModal from '../components/InvoiceLimitModal';
import CreateDocumentModal from '../components/CreateDocumentModal';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatInvoiceUsageLabel } from '../utils/invoiceLimits';
import { isPremiumUser } from '../utils/premium';
import { useSettings } from '../context/SettingsContext';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import { DashboardSkeleton } from '../components/Skeleton';

const RECENT_COLUMNS = [
    { key: 'number', label: 'Document' },
    { key: 'client', label: 'Client' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

function DocumentTypeBadge({ doc }) {
    const isQuotation = isQuotationDocument(doc) || doc.documentType === 'quotation';
    return (
        <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                isQuotation
                    ? 'bg-sky-50 text-sky-700 border-sky-200/70'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200/70'
            }`}
        >
            {isQuotation ? 'QTN' : 'INV'}
        </span>
    );
}

const Dashboard = () => {
    const { businessInfo } = useSettings();
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen } = useInvoiceCreateGuard();
    const { data, loading } = useDashboardStats();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const stats = data?.stats;
    const recentDocuments = data?.recentDocuments || data?.recentInvoices || [];
    const overdueInvoices = data?.overdueInvoices || [];

    const statCards = stats
        ? [
              {
                  name: 'Total Invoices',
                  value: stats.totalInvoices,
                  icon: FileText,
                  iconBg: 'bg-brand-light',
                  iconColor: 'text-brand',
              },
              {
                  name: 'Total Quotations',
                  value: stats.totalQuotations ?? 0,
                  icon: ClipboardList,
                  iconBg: 'bg-sky-50',
                  iconColor: 'text-sky-600',
              },
              {
                  name: 'Total Clients',
                  value: stats.totalClients,
                  icon: Users,
                  iconBg: 'bg-violet-50',
                  iconColor: 'text-violet-600',
              },
              {
                  name: 'Revenue (Paid)',
                  value: formatCurrency(stats.paidRevenue),
                  icon: Wallet,
                  iconBg: 'bg-green-50',
                  iconColor: 'text-green-600',
              },
              {
                  name: 'Pending Revenue',
                  value: formatCurrency(stats.pendingRevenue),
                  icon: Clock,
                  iconBg: 'bg-amber-50',
                  iconColor: 'text-amber-600',
              },
          ]
        : [];

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const openDocument = (doc) => {
        const id = doc.id || doc._id;
        if (isQuotationDocument(doc) || doc.documentType === 'quotation') {
            navigate(`/quotations/${id}`);
            return;
        }
        navigate(`/invoices/${id}`);
    };

    if (loading && !data) {
        return <DashboardSkeleton />;
    }

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
            <PageHeader title="Dashboard" subtitle="Your business overview" />
            {!premium && usageLabel ? (
                <InvoiceUsageBanner label={usageLabel} className="mb-4" />
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 mb-6">
                {statCards.map((stat) => {
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
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-primary w-full"
                    >
                        <Plus size={16} />
                        Create
                    </button>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => navigate('/clients')} className="btn-secondary">
                            <Users size={16} />
                            Clients
                        </button>
                        <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary">
                            <TrendingUp size={16} />
                            Invoices
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/quotations')}
                            className="btn-secondary"
                        >
                            <ClipboardList size={16} />
                            Quotations
                        </button>
                        <button type="button" onClick={() => navigate('/statements')} className="btn-secondary">
                            <FileBarChart size={16} />
                            Statements
                            {!premium ? <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden /> : null}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-950 mb-3">Recent documents</h2>
                    {recentDocuments.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                icon={FileText}
                                title="No documents yet"
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
                                            <span className="font-medium text-zinc-950 truncate">
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
                                        <StatusBadge status={doc.status} />
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
                                            key={invoice.id || invoice._id}
                                            onClick={() =>
                                                navigate(`/invoices/${invoice.id || invoice._id}`)
                                            }
                                        >
                                            <DataTableCell>
                                                <p className="font-medium text-zinc-950">
                                                    {getDisplayNumber(invoice)}
                                                </p>
                                                <p className="text-xs text-zinc-500">
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
        </div>
    );
};

export default Dashboard;
