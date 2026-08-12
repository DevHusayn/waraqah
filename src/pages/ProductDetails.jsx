import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Edit,
    History,
    Package,
    PackagePlus,
    Trash2,
    Users,
    TrendingUp,
    TrendingDown,
    ShoppingBag,
    Clock,
    FileText,
} from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ProductFormModal, { EMPTY_PRODUCT } from '../components/ProductFormModal';
import ProductStockAdjustModal from '../components/ProductStockAdjustModal';
import ProductStockStatusBadge from '../components/ProductStockStatusBadge';
import StatusBadge from '../components/StatusBadge';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import MonthPickerField from '../components/MonthPickerField';
import MonthComparisonTrend from '../components/MonthComparisonTrend';
import { useSettings } from '../context/SettingsContext';
import { isOversellingAllowed } from '@waraqah/shared';
import { useSummaryPeriod } from '../hooks/useSummaryPeriod';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { computeCatalogMargin, formatMarginPercent } from '../utils/margin';
import { getPaymentMethodLabel } from '../utils/receiptHelpers';
import { isPremiumUser } from '../utils/premium';
import { getSoldPeriodSummary } from '../utils/productSoldPeriod';
import ActionMenu from '../components/ActionMenu';
import PaginationBar from '../components/PaginationBar';
import { useClientPagedList } from '../hooks/useClientPagedList';
import {
    formatStockDelta,
    formatStockMovementDescription,
    getStockMovementLink,
} from '../utils/stockMovementLabels';

const ACTIVITY_COLUMNS = [
    { key: 'date', label: 'Date', width: '14%' },
    { key: 'document', label: 'Document', width: '18%' },
    { key: 'client', label: 'Client', width: '22%' },
    { key: 'qty', label: 'Qty', className: 'text-right', width: '10%' },
    { key: 'amount', label: 'Line total', className: 'text-right', width: '16%' },
    { key: 'status', label: 'Status', width: '12%' },
    { key: 'payment', label: 'Payment', width: '14%' },
];

const CLIENT_COLUMNS = [
    { key: 'client', label: 'Client', width: '34%' },
    { key: 'qty', label: 'Qty sold', className: 'text-right', width: '16%' },
    { key: 'revenue', label: 'Revenue', className: 'text-right', width: '20%' },
    { key: 'last', label: 'Last purchase', width: '18%' },
    { key: 'payment', label: 'Last payment', width: '16%' },
];

const STOCK_HISTORY_COLUMNS = [
    { key: 'date', label: 'Date', width: '18%' },
    { key: 'change', label: 'Change', className: 'text-right', width: '14%' },
    { key: 'balance', label: 'Balance', className: 'text-right', width: '14%' },
    { key: 'source', label: 'Source', width: '54%' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

function documentTypeLabel(type) {
    if (type === 'receipt') return 'Receipt';
    if (type === 'quotation') return 'Quotation';
    return 'Invoice';
}

function documentHref(type, id) {
    if (type === 'receipt') return `/receipts/${id}`;
    if (type === 'quotation') return `/quotations/${id}`;
    return `/invoices/${id}`;
}

function formatActivityLineAmount(row) {
    if (row.countsAsSale && (row.saleLineTotal ?? 0) > 0) {
        return {
            amount: row.saleLineTotal,
            detail:
                (row.pendingLineTotal ?? 0) > 0
                    ? `${formatCurrency(row.pendingLineTotal)} unpaid on invoice`
                    : null,
        };
    }

    if ((row.pendingLineTotal ?? 0) > 0) {
        return {
            amount: row.pendingLineTotal,
            detail: 'Awaiting payment',
        };
    }

    return {
        amount: row.adjustedLineTotal ?? row.lineTotal ?? 0,
        detail: null,
    };
}

function PeriodStatCard({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    comparison,
    comparisonLabel,
    valueClassName = '',
    className = '',
}) {
    return (
        <div className={`stat-card stat-card-compact min-w-0 ${className}`.trim()}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-zinc-500 font-medium leading-snug">{title}</p>
                <div className={`stat-card-icon shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden />
                </div>
            </div>
            <p className={`stat-card-value ${valueClassName}`.trim()}>{value}</p>
            {comparison ? (
                <div className="min-h-[1rem]">
                    <MonthComparisonTrend comparison={comparison} label={comparisonLabel} />
                </div>
            ) : null}
        </div>
    );
}

function CatalogMetric({ label, value }) {
    return (
        <div className="rounded-lg border border-zinc-200/60 bg-zinc-50/50 px-3 py-2.5 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950 truncate">{value}</p>
        </div>
    );
}

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateProduct, deleteProduct, adjustProductStock } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const premium = isPremiumUser(businessInfo);

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stockAdjustOpen, setStockAdjustOpen] = useState(false);

    const {
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        timezone,
        isCurrentPeriod,
    } = useSummaryPeriod();

    const loadActivity = useCallback(async () => {
        setLoading(true);
        try {
            const payload = await apiFetch(`/products/${id}/activity`);
            setActivity(payload);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to load product details.',
                type: 'error',
            });
            setActivity(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadActivity();
    }, [loadActivity]);

    const product = activity?.product;
    const summary = activity?.summary;
    const soldInPeriod = useMemo(
        () =>
            getSoldPeriodSummary(
                activity?.transactions,
                summaryYear,
                summaryMonth,
                timezone
            ),
        [activity?.transactions, summaryYear, summaryMonth, timezone]
    );

    const catalogMargin = useMemo(
        () => computeCatalogMargin(product?.unitPrice, product?.unitCost),
        [product?.unitPrice, product?.unitCost]
    );

    const grossProfit = soldInPeriod.grossProfit || 0;
    const profitPositive = grossProfit >= 0;
    const pendingQuantity = summary?.pendingQuantity ?? 0;
    const comparisonLabel = isCurrentPeriod ? 'vs last month' : 'vs previous month';

    const productMenuItems = useMemo(
        () => [
            {
                id: 'delete-product',
                label: 'Delete product',
                icon: Trash2,
                onClick: () => setConfirm(true),
                destructive: true,
                disabled: deleting,
            },
        ],
        [deleting]
    );

    const stockHistoryPage = useClientPagedList(activity?.stockHistory, { resetKey: id });
    const clientsPage = useClientPagedList(activity?.byClient, { resetKey: id });
    const transactionsPage = useClientPagedList(activity?.transactions, { resetKey: id });

    const modalInitialData = useMemo(() => {
        if (!product) return EMPTY_PRODUCT;
        return {
            name: product.name || '',
            description: product.description || '',
            unitPrice: product.unitPrice ?? '',
            unitCost: product.unitCost ?? '',
            trackInventory: Boolean(product.trackInventory),
            quantityOnHand: product.trackInventory ? (product.quantityOnHand ?? 0) : '',
            lowStockThreshold:
                product.lowStockThreshold == null ? '' : product.lowStockThreshold,
        };
    }, [product]);

    const handleSubmit = async (formData) => {
        try {
            await updateProduct(id, formData);
            showToast('Product updated successfully', 'success');
            setIsModalOpen(false);
            await loadActivity();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to update product.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleAdjustStock = async (delta) => {
        try {
            await adjustProductStock(id, delta);
            showToast('Stock updated successfully', 'success');
            setStockAdjustOpen(false);
            await loadActivity();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to adjust stock.',
                type: 'error',
            });
            throw err;
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteProduct(id);
            showToast('Product deleted successfully', 'success');
            navigate('/products');
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete product.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
            setConfirm(false);
        }
    };

    if (loading) {
        return <PageSpinner label="Loading product" />;
    }

    if (!product) {
        return (
            <div className="card">
                <EmptyState
                    title="Product not found"
                    description="This product may have been deleted."
                    action={
                        <Link to="/products" className="btn-secondary">
                            Back to products
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ConfirmModal
                open={confirm}
                title="Delete product?"
                description="This product will be removed from your catalog. Existing documents are not affected."
                confirmLabel="Delete product"
                cancelLabel="Keep product"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm(false)}
            />
            <ProductFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                editingProduct={{ id, name: product.name }}
                initialData={modalInitialData}
            />
            <ProductStockAdjustModal
                open={stockAdjustOpen}
                onClose={() => setStockAdjustOpen(false)}
                product={product}
                allowOverselling={isOversellingAllowed(businessInfo)}
                onSubmit={handleAdjustStock}
            />

            <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
            >
                <ArrowLeft size={16} aria-hidden />
                Back to products
            </Link>

            <header className="card mb-8 overflow-hidden !p-0">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                            <Package className="h-6 w-6 text-brand" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 break-words">
                                    {product.name}
                                </h1>
                                <ProductStockStatusBadge product={product} />
                            </div>
                            {product.description ? (
                                <p className="mt-1 text-sm leading-relaxed text-zinc-500 max-w-2xl">
                                    {product.description}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {product.trackInventory ? (
                            <button
                                type="button"
                                onClick={() => setStockAdjustOpen(true)}
                                className="btn-primary"
                            >
                                <PackagePlus size={16} aria-hidden />
                                Adjust stock
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className={product.trackInventory ? 'btn-secondary' : 'btn-primary'}
                        >
                            <Edit size={16} aria-hidden />
                            Edit
                        </button>
                        <ActionMenu
                            items={productMenuItems}
                            disabled={deleting}
                            ariaLabel="Product actions"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
                    <CatalogMetric label="Price" value={formatCurrency(product.unitPrice || 0)} />
                    <CatalogMetric
                        label="Cost"
                        value={
                            product.unitCost > 0 ? formatCurrency(product.unitCost) : 'Not set'
                        }
                    />
                    <CatalogMetric
                        label="Margin"
                        value={formatMarginPercent(catalogMargin.marginPercent)}
                    />
                    <CatalogMetric
                        label="In stock"
                        value={
                            product.trackInventory
                                ? String(product.quantityOnHand ?? 0)
                                : 'Not tracked'
                        }
                    />
                </div>

                <div className="border-t border-zinc-200/60 bg-zinc-50/30 px-5 py-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900">
                                {isCurrentPeriod ? 'This month' : periodLabel}
                            </h2>
                            <p className="mt-0.5 text-xs text-zinc-500">Paid and partial sales only</p>
                        </div>
                        <MonthPickerField
                            variant="compact"
                            portal
                            value={monthInputValue}
                            onChange={setMonthInputValue}
                            triggerAriaLabel={`Change period from ${periodLabel}`}
                        />
                    </div>
                    <div
                        className={`grid grid-cols-2 gap-3 ${premium ? 'sm:grid-cols-3' : 'max-w-lg'}`}
                    >
                        <PeriodStatCard
                            title="Sold"
                            value={soldInPeriod.quantity}
                            icon={ShoppingBag}
                            iconBg="bg-brand-light"
                            iconColor="text-brand"
                            comparison={soldInPeriod.comparison}
                            comparisonLabel={comparisonLabel}
                        />
                        <PeriodStatCard
                            title="Revenue"
                            value={formatCurrency(soldInPeriod.revenue || 0)}
                            icon={FileText}
                            iconBg="bg-sky-50"
                            iconColor="text-sky-600"
                        />
                        {premium ? (
                            <PeriodStatCard
                                title="Gross profit"
                                value={formatCurrency(grossProfit)}
                                icon={profitPositive ? TrendingUp : TrendingDown}
                                iconBg={profitPositive ? 'bg-emerald-50' : 'bg-red-50'}
                                iconColor={profitPositive ? 'text-emerald-600' : 'text-red-600'}
                                valueClassName={profitPositive ? '' : 'text-red-600'}
                                className="col-span-2 sm:col-span-1"
                            />
                        ) : null}
                    </div>
                </div>

                <div className="border-t border-zinc-200/60 px-5 py-3 text-sm text-zinc-600">
                    <span className="text-zinc-400">All time · </span>
                    <span className="tabular-nums">{summary?.totalQuantitySold ?? 0}</span> sold
                    <span className="mx-2 text-zinc-300">·</span>
                    <span className="font-medium tabular-nums text-zinc-800">
                        {formatCurrency(summary?.totalRevenue || 0)}
                    </span>{' '}
                    revenue
                    <span className="mx-2 text-zinc-300">·</span>
                    <span className="tabular-nums">{summary?.uniqueClients ?? 0}</span> customer
                    {(summary?.uniqueClients ?? 0) === 1 ? '' : 's'}
                </div>
            </header>

            {pendingQuantity > 0 ? (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                    <div className="text-sm">
                        <p className="font-medium text-amber-950">Awaiting payment</p>
                        <p className="text-amber-900/90">
                            {pendingQuantity} unit{pendingQuantity === 1 ? '' : 's'} ·{' '}
                            {formatCurrency(summary?.pendingRevenue || 0)} on unpaid and partial
                            invoices
                        </p>
                    </div>
                </div>
            ) : null}

            {product.trackInventory ? (
                <section className="mb-8">
                    <h2 className="text-sm font-semibold text-zinc-900 mb-3">Stock history</h2>
                    {activity?.stockHistory?.length ? (
                        <>
                        <DataTable
                            columns={STOCK_HISTORY_COLUMNS}
                            fixedLayout
                            minWidth={640}
                            className="scroll-x-touch"
                        >
                            {stockHistoryPage.data.map((row) => {
                                const href = getStockMovementLink(row);
                                const description = formatStockMovementDescription(row);
                                const delta = Number(row.delta) || 0;
                                const deltaClass =
                                    delta > 0
                                        ? 'text-green-700 font-medium'
                                        : delta < 0
                                          ? 'text-red-600 font-medium'
                                          : 'text-zinc-700';

                                return (
                                    <DataTableRow key={row.id}>
                                        <DataTableCell>
                                            {formatDisplayDate(row.date?.slice(0, 10))}
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums">
                                            <span className={deltaClass}>{formatStockDelta(delta)}</span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right tabular-nums text-zinc-900">
                                            {row.balanceAfter ?? '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {href ? (
                                                <Link
                                                    to={href}
                                                    className="font-medium text-brand hover:underline"
                                                >
                                                    {description}
                                                </Link>
                                            ) : (
                                                <span className="text-zinc-700">{description}</span>
                                            )}
                                        </DataTableCell>
                                    </DataTableRow>
                                );
                            })}
                        </DataTable>
                        <PaginationBar
                            pagination={stockHistoryPage.pagination}
                            onPageChange={stockHistoryPage.setPage}
                        />
                        </>
                    ) : (
                        <div className="card">
                            <EmptyState
                                icon={History}
                                title="No stock movements yet"
                                description="Manual adjustments and sales from issued invoices or receipts will appear here."
                            />
                        </div>
                    )}
                </section>
            ) : null}

            <section className="mb-8">
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Customers</h2>
                {activity?.byClient?.length ? (
                    <>
                    <DataTable
                        columns={CLIENT_COLUMNS}
                        fixedLayout
                        minWidth={640}
                        className="scroll-x-touch"
                    >
                        {clientsPage.data.map((row) => (
                            <DataTableRow key={row.clientId}>
                                <DataTableCell>
                                    <span className="font-medium text-zinc-950">{row.clientName}</span>
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {row.quantitySold}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums font-medium">
                                    {formatCurrency(row.revenue || 0)}
                                </DataTableCell>
                                <DataTableCell>{formatDisplayDate(row.lastPurchaseDate)}</DataTableCell>
                                <DataTableCell>
                                    {row.lastPaymentMethod
                                        ? getPaymentMethodLabel(row.lastPaymentMethod)
                                        : '—'}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <PaginationBar
                        pagination={clientsPage.pagination}
                        onPageChange={clientsPage.setPage}
                    />
                    </>
                ) : (
                    <div className="card">
                        <EmptyState
                            icon={Users}
                            title="No client sales yet"
                            description="Sales appear here when this product is added from your catalog on an invoice or receipt."
                        />
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Activity</h2>
                {activity?.transactions?.length ? (
                    <>
                    <DataTable
                        columns={ACTIVITY_COLUMNS}
                        fixedLayout
                        minWidth={840}
                        className="scroll-x-touch"
                    >
                        {transactionsPage.data.map((row) => {
                            const lineAmount = formatActivityLineAmount(row);
                            return (
                            <DataTableRow key={`${row.documentType}-${row.id}`}>
                                <DataTableCell>{formatDisplayDate(row.date)}</DataTableCell>
                                <DataTableCell>
                                    <Link
                                        to={documentHref(row.documentType, row.id)}
                                        className="font-medium text-brand hover:underline"
                                    >
                                        {documentTypeLabel(row.documentType)} {row.documentNumber}
                                    </Link>
                                </DataTableCell>
                                <DataTableCell>{row.clientName}</DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {row.quantity}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums font-medium">
                                    <span>{formatCurrency(lineAmount.amount || 0)}</span>
                                    {lineAmount.detail ? (
                                        <p className="text-[11px] font-normal text-zinc-500 mt-0.5">
                                            {lineAmount.detail}
                                        </p>
                                    ) : null}
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={row.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {row.paymentMethod
                                        ? getPaymentMethodLabel(row.paymentMethod)
                                        : '—'}
                                </DataTableCell>
                            </DataTableRow>
                            );
                        })}
                    </DataTable>
                    <PaginationBar
                        pagination={transactionsPage.pagination}
                        onPageChange={transactionsPage.setPage}
                    />
                    </>
                ) : (
                    <div className="card">
                        <EmptyState
                            icon={Package}
                            title="No activity yet"
                            description="Create a quotation, invoice, or receipt using this product from your catalog."
                        />
                    </div>
                )}
            </section>
        </>
    );
}
