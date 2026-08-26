import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Warehouse, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import FilterTabs from '../components/FilterTabs';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import ProductStockStatusBadge from '../components/ProductStockStatusBadge';
import StockMovementTable from '../components/StockMovementTable';
import ListMonthToolbarFilter from '../components/ListMonthToolbarFilter';
import AdaptiveStatValue from '../components/AdaptiveStatValue';
import { ListPageSkeleton, ToolbarSkeleton } from '../components/Skeleton';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useListMonthFilter } from '../hooks/useListMonthFilter';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { formatCurrency } from '../utils/currency';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

const VIEW_TABS = [
    { value: 'stock', label: 'Stock' },
    { value: 'movements', label: 'Movements' },
];

const STOCK_STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'in_stock', label: 'In stock' },
    { value: 'low_stock', label: 'Low stock' },
    { value: 'out_of_stock', label: 'Out of stock' },
];

const STOCK_COLUMNS = [
    { key: 'product', label: 'Product' },
    { key: 'inStock', label: 'In stock', className: 'text-right' },
    { key: 'reorderAt', label: 'Reorder at', className: 'text-right' },
    { key: 'status', label: 'Status' },
    { key: 'stockValue', label: 'Stock value', className: 'text-right' },
];

const mapStockRow = (entry) => ({
    ...entry,
    id: entry._id || entry.id,
    trackInventory: Boolean(entry.trackInventory),
});

const mapMovementRow = (entry) => ({
    ...entry,
    id: entry.id || entry._id,
});

function InventorySummaryCards({ summary, loading }) {
    const cards = [
        { label: 'Tracked products', value: summary?.trackedProducts },
        { label: 'Units on hand', value: summary?.totalUnitsOnHand },
        {
            label: 'Stock value',
            value: summary ? formatCurrency(summary.totalStockValue || 0) : '—',
        },
        {
            label: 'Potential sales value',
            value: summary ? formatCurrency(summary.totalPotentialSalesValue || 0) : '—',
        },
        { label: 'Low stock', value: summary?.lowStockCount },
        { label: 'Out of stock', value: summary?.outOfStockCount },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-6">
            {cards.map((card) => (
                <div key={card.label} className="stat-card stat-card-compact min-w-0">
                    <p className="text-xs text-foreground-muted font-medium leading-snug">{card.label}</p>
                    <AdaptiveStatValue
                        value={loading ? '—' : (card.value ?? '—')}
                        variant="compact"
                        aria-busy={loading}
                    />
                </div>
            ))}
        </div>
    );
}

export default function Inventory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id;
    const [view, setView] = useState('stock');
    const [stockStatus, setStockStatus] = useState('all');

    const {
        listQueryParams,
        listPeriodMode,
        setListPeriodMode,
        listPeriodLabel,
        listCustomDraftStartDate,
        listCustomDraftEndDate,
        setListCustomDraftRange,
        applyListCustomRange,
        listMaxDate,
        isDefaultListPeriod,
    } = useListMonthFilter();

    const stockFetcher = useCallback(
        ({ page, limit, search, status }) =>
            apiFetch(
                `/inventory/stock?${buildListQuery({
                    page,
                    limit,
                    search,
                    status: status === 'all' ? undefined : status,
                })}`
            ),
        []
    );

    const movementsFetcher = useCallback(
        ({ page, limit, search, period, startDate, endDate }) =>
            apiFetch(
                `/inventory/movements?${buildListQuery({
                    page,
                    limit,
                    search,
                    period,
                    startDate,
                    endDate,
                })}`
            ),
        []
    );

    const {
        setPage: setStockPage,
        search: stockSearch,
        setSearch: setStockSearch,
        debouncedSearch: debouncedStockSearch,
        data: stockData,
        pagination: stockPagination,
        loading: stockLoading,
        statusCounts: stockStatusCounts,
    } = usePagedQuery({
        queryKeyBase: 'inventoryStock',
        fetcher: stockFetcher,
        extraParams: { status: stockStatus },
        enabled: view === 'stock',
    });

    const {
        setPage: setMovementsPage,
        search: movementsSearch,
        setSearch: setMovementsSearch,
        debouncedSearch: debouncedMovementsSearch,
        data: movementsData,
        pagination: movementsPagination,
        loading: movementsLoading,
    } = usePagedQuery({
        queryKeyBase: 'inventoryMovements',
        fetcher: movementsFetcher,
        extraParams: listQueryParams,
        enabled: view === 'movements',
    });

    const { data: summary, isPending: summaryLoading } = useQuery({
        queryKey: queryKeys.inventorySummary(userId),
        queryFn: () => apiFetch('/inventory/summary'),
        enabled: Boolean(userId) && view === 'stock',
        staleTime: STALE_TIMES.lists,
    });

    const stockRows = stockData.map(mapStockRow);
    const movementRows = movementsData.map(mapMovementRow);

    useEffect(() => {
        setMovementsPage(1);
    }, [listQueryParams, setMovementsPage]);

    const stockTabs = STOCK_STATUS_TABS.map((tab) => ({
        ...tab,
        count: stockStatusCounts?.[tab.value],
    }));

    const isInitialLoading =
        view === 'movements'
            ? movementsLoading && movementRows.length === 0 && !movementsSearch
            : stockLoading && stockRows.length === 0 && !stockSearch;

    if (isInitialLoading) {
        return (
            <>
                <PageHeader
                    title="Inventory"
                    subtitle="Track your stock levels and inventory movements"
                />
                {view === 'stock' ? <InventorySummaryCards loading /> : null}
                <ToolbarSkeleton />
                <ListPageSkeleton rows={8} columns={view === 'stock' ? 5 : 5} withAction={false} />
            </>
        );
    }

    const hasNoTrackedStock =
        view === 'stock' &&
        !stockLoading &&
        !stockSearch &&
        stockStatus === 'all' &&
        (summary?.trackedProducts === 0 || stockPagination.total === 0);

    return (
        <>
            <PageHeader
                title="Inventory"
                subtitle="Track your stock levels and inventory movements"
            />

            <FilterTabs
                tabs={VIEW_TABS}
                value={view}
                onChange={(nextView) => {
                    setView(nextView);
                    if (nextView === 'stock') setStockPage(1);
                    if (nextView === 'movements') setMovementsPage(1);
                }}
                className="mb-4"
            />

            {view === 'stock' ? (
                <>
                    <InventorySummaryCards summary={summary} loading={summaryLoading} />

                    <FilterTabs
                        tabs={stockTabs}
                        value={stockStatus}
                        onChange={(value) => {
                            setStockStatus(value);
                            setStockPage(1);
                        }}
                        className="mb-4"
                    />

                    <Toolbar className="mb-4">
                        <ToolbarSearch
                            icon={Search}
                            type="search"
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            placeholder="Search tracked products..."
                            aria-label="Search tracked products"
                        />
                    </Toolbar>

                    {hasNoTrackedStock ? (
                        <div className="card">
                            <EmptyState
                                icon={Warehouse}
                                title="No tracked inventory yet"
                                description="Enable inventory tracking on catalog products to monitor stock here."
                                action={
                                    <Link to="/products" className="btn-primary">
                                        Go to products
                                    </Link>
                                }
                            />
                        </div>
                    ) : stockRows.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                title="No matches"
                                description={
                                    stockSearch
                                        ? 'Try a different search term or stock filter.'
                                        : 'Try a different stock filter.'
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <DataTable columns={STOCK_COLUMNS}>
                                {stockRows.map((product) => (
                                    <DataTableRow
                                        key={product.id}
                                        onClick={() => navigate(`/products/${product.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <DataTableCell>
                                            <span className="font-medium text-foreground">
                                                {product.name}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-foreground">
                                            {product.quantityOnHand ?? 0}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-foreground-muted">
                                            {product.lowStockThreshold == null
                                                ? '—'
                                                : product.lowStockThreshold}
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ProductStockStatusBadge product={product} />
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-foreground">
                                            {formatCurrency(
                                                (Number(product.quantityOnHand) || 0) *
                                                    (Number(product.unitCost) || 0)
                                            )}
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                            <PaginationBar
                                pagination={stockPagination}
                                onPageChange={setStockPage}
                            />
                        </>
                    )}
                </>
            ) : (
                <>
                    <Toolbar className="mb-4">
                        <ToolbarSearch
                            icon={Search}
                            type="search"
                            value={movementsSearch}
                            onChange={(e) => setMovementsSearch(e.target.value)}
                            placeholder="Search by product..."
                            aria-label="Search movements by product"
                        />
                        <ToolbarActions>
                            <ListMonthToolbarFilter
                                periodMode={listPeriodMode}
                                onPeriodModeChange={setListPeriodMode}
                                periodLabel={listPeriodLabel}
                                customDraftStartDate={listCustomDraftStartDate}
                                customDraftEndDate={listCustomDraftEndDate}
                                onCustomDraftRangeChange={setListCustomDraftRange}
                                onCustomApply={applyListCustomRange}
                                maxDate={listMaxDate}
                            />
                        </ToolbarActions>
                    </Toolbar>

                    {movementRows.length === 0 && !movementsLoading ? (
                        <StockMovementTable
                            rows={[]}
                            showProductColumn
                            emptyTitle="No stock movements found"
                            emptyDescription={
                                movementsSearch || !isDefaultListPeriod
                                    ? 'Try a different search term or date filter.'
                                    : 'Manual adjustments, sales, and purchase order receipts will appear here.'
                            }
                        />
                    ) : (
                        <StockMovementTable
                            rows={movementRows}
                            showProductColumn
                            pagination={movementsPagination}
                            onPageChange={setMovementsPage}
                            emptyTitle="No stock movements found"
                            emptyDescription="Manual adjustments, sales, and purchase order receipts will appear here."
                        />
                    )}
                </>
            )}
        </>
    );
}
