import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Search } from 'lucide-react';
import ListSummaryStats from '../components/ListSummaryStats';
import AlertModal from '../components/AlertModal';
import ProductFormModal, { EMPTY_PRODUCT } from '../components/ProductFormModal';
import ProductStockStatusBadge from '../components/ProductStockStatusBadge';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useListSummaryQuery } from '../hooks/useListSummaryQuery';
import { useListMonthFilter } from '../hooks/useListMonthFilter';
import ListMonthToolbarFilter from '../components/ListMonthToolbarFilter';
import ListExportButton from '../components/ListExportButton';
import { ListPageSkeleton, ListSummaryStatsSkeleton, ToolbarSkeleton } from '../components/Skeleton';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { formatCurrency } from '../utils/currency';
import { formatMarginPercent, computeCatalogMargin } from '../utils/margin';

const mapProduct = (p) => ({
    ...p,
    id: p._id || p.id,
    trackInventory: Boolean(p.trackInventory),
});

const TABLE_COLUMNS = [
    { key: 'product', label: 'Product' },
    { key: 'price', label: 'Price', className: 'text-right' },
    { key: 'margin', label: 'Margin', className: 'text-right' },
    { key: 'inStock', label: 'In stock', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

export default function Products() {
    const navigate = useNavigate();
    const { addProduct } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });

    const {
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        isCurrentPeriod,
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

    const fetcher = useCallback(
        ({ page, limit, search, period, startDate, endDate }) =>
            apiFetch(
                `/products?${buildListQuery({
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

    const { summary, summaryLoading, refreshSummary } = useListSummaryQuery(
        'products',
        summaryYear,
        summaryMonth
    );

    const {
        setPage,
        search,
        setSearch,
        debouncedSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedQuery({
        queryKeyBase: 'products',
        fetcher,
        extraParams: listQueryParams,
    });

    const products = data.map(mapProduct);

    useEffect(() => {
        setPage(1);
    }, [listQueryParams, setPage]);

    const handleSubmit = async (formData) => {
        try {
            await addProduct(formData);
            showToast('Product added successfully', 'success');
            setIsModalOpen(false);
            await refresh();
            await refreshSummary();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save product.',
                type: 'error',
            });
            throw err;
        }
    };

    const hasNoProductsAtAll =
        !loading && !search && isDefaultListPeriod && (summary ? summary.totalProducts === 0 : pagination.total === 0);
    const showProductStats = !(loading && products.length === 0 && !search && !summary);
    const totalProducts = summary?.totalProducts;
    const newInPeriod = summary?.newInPeriod ?? summary?.newThisMonth;

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ProductFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                editingProduct={null}
                initialData={EMPTY_PRODUCT}
            />

            <PageHeader title="Products" subtitle="Catalog items for quick line entries on any document">
                <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add product
                </button>
            </PageHeader>

            {showProductStats ? (
                <ListSummaryStats
                    visible
                    totalLabel="Total products"
                    total={totalProducts}
                    newInPeriod={newInPeriod}
                    newComparison={summary?.comparison?.newInPeriod}
                    comparisonLabel={isCurrentPeriod ? 'vs last month' : 'vs previous month'}
                    periodPrefix="Added this"
                    periodLabel={periodLabel}
                    monthInputValue={monthInputValue}
                    onPeriodChange={setMonthInputValue}
                    summaryLoading={summaryLoading}
                />
            ) : loading && products.length === 0 && !search ? (
                <ListSummaryStatsSkeleton />
            ) : null}

            {loading && products.length === 0 && !search ? (
                <>
                    <ToolbarSkeleton />
                    <ListPageSkeleton rows={8} columns={4} withAction={false} />
                </>
            ) : hasNoProductsAtAll ? (
                <div className="card">
                    <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Build your catalog once, then pick items in seconds when creating documents."
                        action={
                            <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary">
                                Add product
                            </button>
                        }
                    />
                </div>
            ) : (
                <>
                    <Toolbar className="mb-4">
                        <ToolbarSearch
                            icon={Search}
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products..."
                            aria-label="Search products"
                            action={
                                <ListExportButton
                                    path="/products/export"
                                    resource="products"
                                    companyName={businessInfo?.name}
                                    filters={{
                                        search: debouncedSearch,
                                        ...listQueryParams,
                                    }}
                                    disabled={pagination.total === 0}
                                    onExported={() => showToast('Products exported successfully.', 'success')}
                                    onError={(err) => showToast(err.message || 'Export failed.', 'error')}
                                />
                            }
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

                    {products.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                title="No matches"
                                description={
                                    search || !isDefaultListPeriod
                                        ? 'Try a different search term or month filter.'
                                        : 'Try a different search term.'
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <DataTable columns={TABLE_COLUMNS}>
                                {products.map((product) => (
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
                                        <DataTableCell className="text-right">
                                            <span className="font-medium tabular-nums text-foreground">
                                                {formatCurrency(product.unitPrice || 0)}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="tabular-nums text-foreground-muted">
                                                {formatMarginPercent(
                                                    computeCatalogMargin(
                                                        product.unitPrice,
                                                        product.unitCost
                                                    ).marginPercent
                                                )}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="tabular-nums text-foreground-muted">
                                                {product.trackInventory
                                                    ? (product.quantityOnHand ?? 0)
                                                    : '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <ProductStockStatusBadge product={product} />
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
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
                </>
            )}

            <p className="mt-6 text-xs text-foreground-muted">
                Products appear when creating invoices, receipts, and quotations for one-click line
                items. Enable inventory tracking to deduct stock when linked items are issued.
            </p>
        </>
    );
}
