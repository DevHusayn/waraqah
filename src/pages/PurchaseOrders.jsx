import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, Search } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import FilterTabs from '../components/FilterTabs';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import StatusBadge from '../components/StatusBadge';
import { ListPageSkeleton } from '../components/Skeleton';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { formatCurrency } from '../utils/currency';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

const TABLE_COLUMNS = [
    { key: 'number', label: 'PO #' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'date', label: 'Order date' },
    { key: 'amount', label: 'Total', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partial' },
    { value: 'received', label: 'Received' },
    { value: 'cancelled', label: 'Cancelled' },
];

const mapOrder = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');

    const fetcher = useCallback(
        ({ page, limit, search, status }) =>
            apiFetch(
                `/purchase-orders?${buildListQuery({
                    page,
                    limit,
                    search,
                    status: status === 'all' ? undefined : status,
                })}`
            ),
        []
    );

    const {
        page,
        setPage,
        search,
        setSearch,
        data,
        pagination,
        loading,
        statusCounts,
    } = usePagedQuery({
        queryKeyBase: 'purchaseOrders',
        fetcher,
        extraParams: { status: filter },
    });

    const orders = data.map(mapOrder);

    const tabs = STATUS_TABS.map((tab) => ({
        ...tab,
        count: statusCounts?.[tab.value],
    }));

    if (loading && orders.length === 0 && !search) {
        return <ListPageSkeleton rows={8} columns={5} withAction={false} />;
    }

    return (
        <>
            <PageHeader title="Purchase orders" subtitle="Order and receive stock from suppliers">
                <button
                    type="button"
                    onClick={() => navigate('/purchase-orders/create')}
                    className="btn-primary"
                >
                    <Plus size={16} aria-hidden />
                    New purchase order
                </button>
            </PageHeader>

            <FilterTabs
                tabs={tabs}
                value={filter}
                onChange={(value) => {
                    setFilter(value);
                    setPage(1);
                }}
                className="mb-4"
            />

            <Toolbar className="mb-4">
                <ToolbarSearch
                    value={search}
                    onChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    placeholder="Search by PO number or supplier…"
                    icon={Search}
                />
            </Toolbar>

            {orders.length === 0 && !loading ? (
                <EmptyState
                    icon={ShoppingCart}
                    title={search || filter !== 'all' ? 'No purchase orders found' : 'No purchase orders yet'}
                    description="Create a purchase order to track stock you are buying from suppliers."
                    action={
                        !search && filter === 'all' ? (
                            <button
                                type="button"
                                onClick={() => navigate('/purchase-orders/create')}
                                className="btn-primary"
                            >
                                <Plus size={16} aria-hidden />
                                New purchase order
                            </button>
                        ) : null
                    }
                />
            ) : (
                <>
                    <DataTable columns={TABLE_COLUMNS} loading={loading}>
                        {orders.map((order) => (
                            <DataTableRow
                                key={order.id}
                                onClick={() => navigate(`/purchase-orders/${order.id}`)}
                                className="cursor-pointer"
                            >
                                <DataTableCell className="font-medium text-zinc-950">
                                    {order.purchaseOrderNumber || '—'}
                                </DataTableCell>
                                <DataTableCell>{order.supplierName || '—'}</DataTableCell>
                                <DataTableCell>
                                    {order.date ? format(new Date(order.date), 'MMM d, yyyy') : '—'}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {formatCurrency(order.total || 0, order.currency)}
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={order.status} />
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <PaginationBar pagination={pagination} onPageChange={setPage} className="mt-4" />
                </>
            )}
        </>
    );
}
