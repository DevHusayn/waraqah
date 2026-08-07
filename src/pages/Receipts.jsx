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
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import InvoiceUsageBanner from '../components/InvoiceUsageBanner';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import StatusBadge from '../components/StatusBadge';
import { ListPageSkeleton } from '../components/Skeleton';
import PaginationBar from '../components/PaginationBar';
import { usePagedQuery } from '../hooks/usePagedQuery';
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

const mapReceipt = (r) => ({ ...r, id: r._id || r.id });

const Receipts = () => {
    const navigate = useNavigate();
    const { invoiceUsage, limitModalOpen, setLimitModalOpen, tryNavigateToCreate } =
        useReceiptCreateGuard();
    const { businessInfo } = useSettings();
    const [sortBy, setSortBy] = useState('newest');

    const fetcher = useCallback(
        ({ page, limit, search, sort }) =>
            apiFetch(
                `/receipts?${buildListQuery({
                    page,
                    limit,
                    search,
                    sort,
                })}`
            ),
        []
    );

    const { page, setPage, search, setSearch, data, pagination, loading } = usePagedQuery({
        queryKeyBase: 'receipts',
        fetcher,
        extraParams: { sort: sortBy },
    });

    const receipts = useMemo(() => data.map(mapReceipt), [data]);

    useEffect(() => {
        setPage(1);
    }, [sortBy, setPage]);

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
                <PageHeader title="Receipts" subtitle="Payment records issued without an invoice">
                    <button type="button" onClick={tryNavigateToCreate} className="btn-primary">
                        <Plus size={18} aria-hidden />
                        New receipt
                    </button>
                </PageHeader>

                {!premium && invoiceUsage && !invoiceUsage.unlimited ? (
                    <InvoiceUsageBanner usage={invoiceUsage} className="mb-4" />
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
                        <CustomSelect
                            value={sortBy}
                            onChange={setSortBy}
                            options={SORT_OPTIONS}
                            icon={ArrowUpDown}
                            ariaLabel="Sort receipts"
                        />
                    </ToolbarActions>
                </Toolbar>

                {loading ? (
                    <ListPageSkeleton rows={8} columns={6} withAction={false} />
                ) : receipts.length === 0 ? (
                    <EmptyState
                        icon={Receipt}
                        title="No receipts yet"
                        description="Issue a receipt when you've received payment and don't need an invoice."
                        actionLabel="Create receipt"
                        onAction={tryNavigateToCreate}
                    />
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
                            onPageChange={setPage}
                            summary={
                                pagination?.total != null
                                    ? `${pagination.total} receipt${pagination.total === 1 ? '' : 's'}`
                                    : usageLabel
                            }
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default Receipts;
