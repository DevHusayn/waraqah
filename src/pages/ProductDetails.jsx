import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Edit,
    Package,
    PackagePlus,
    Trash2,
    Users,
    TrendingUp,
    ShoppingBag,
    ClipboardList,
} from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ProductFormModal, { EMPTY_PRODUCT } from '../components/ProductFormModal';
import ProductStockAdjustModal from '../components/ProductStockAdjustModal';
import LowStockBadge from '../components/LowStockBadge';
import StatusBadge from '../components/StatusBadge';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import MonthPickerField from '../components/MonthPickerField';
import MonthComparisonTrend from '../components/MonthComparisonTrend';
import { useSummaryPeriod } from '../hooks/useSummaryPeriod';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { getPaymentMethodLabel } from '../utils/receiptHelpers';
import { isLowStock } from '../utils/stockWarnings';
import { getSoldPeriodSummary } from '../utils/productSoldPeriod';

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

function StatCard({ title, value, icon: Icon, iconBg, iconColor, detail, className = '' }) {
    return (
        <div className={`stat-card stat-card-compact ${className}`.trim()}>
            <div className="flex items-center gap-2">
                <div className={`stat-card-icon shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden />
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-snug">{title}</p>
            </div>
            <p className="stat-card-value">{value}</p>
            {detail ? <p className="text-[11px] text-zinc-500 leading-snug">{detail}</p> : null}
        </div>
    );
}

function SoldInPeriodStatCard({
    quantity,
    revenue,
    comparison,
    comparisonLabel,
    monthInputValue,
    onPeriodChange,
    periodLabel,
    isCurrentPeriod,
    icon: Icon,
    iconBg,
    iconColor,
    className = '',
}) {
    return (
        <div className={`stat-card stat-card-compact overflow-visible ${className}`.trim()}>
            <div className="flex items-center gap-2">
                <div className={`stat-card-icon shrink-0 ${iconBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden />
                </div>
                <p className="text-xs text-zinc-500 font-medium leading-snug">
                    <span>{isCurrentPeriod ? 'Sold this ' : 'Sold in '}</span>
                    <MonthPickerField
                        variant="inline"
                        portal
                        value={monthInputValue}
                        onChange={onPeriodChange}
                        displayLabel={periodLabel}
                        triggerAriaLabel={`Sold in ${periodLabel}. Change month.`}
                    />
                </p>
            </div>
            <p className="stat-card-value">{quantity}</p>
            <div className="flex flex-col gap-0.5 min-h-[1rem]">
                <MonthComparisonTrend comparison={comparison} label={comparisonLabel} />
                <p className="text-[11px] text-zinc-500">{formatCurrency(revenue || 0)}</p>
            </div>
        </div>
    );
}

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateProduct, deleteProduct, adjustProductStock } = useInvoice();
    const { showToast } = useToast();

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
    const lowStock = product ? isLowStock(product) : false;

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

    const modalInitialData = useMemo(() => {
        if (!product) return EMPTY_PRODUCT;
        return {
            name: product.name || '',
            description: product.description || '',
            unitPrice: product.unitPrice ?? '',
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
                onSubmit={handleAdjustStock}
            />

            <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
            >
                <ArrowLeft size={16} aria-hidden />
                Back to products
            </Link>

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 break-words">
                            {product.name}
                        </h1>
                        {lowStock ? <LowStockBadge /> : null}
                    </div>
                    {product.description ? (
                        <p className="text-sm leading-relaxed text-zinc-500 max-w-2xl">
                            {product.description}
                        </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-600">
                        <span>
                            <span className="text-zinc-400">Price · </span>
                            <span className="font-semibold tabular-nums text-zinc-900">
                                {formatCurrency(product.unitPrice || 0)}
                            </span>
                        </span>
                        <span>
                            <span className="text-zinc-400">In stock · </span>
                            <span className="font-semibold tabular-nums text-zinc-900">
                                {product.trackInventory ? (product.quantityOnHand ?? 0) : 'Not tracked'}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {product.trackInventory ? (
                        <button
                            type="button"
                            onClick={() => setStockAdjustOpen(true)}
                            className="btn-secondary"
                        >
                            <PackagePlus size={16} aria-hidden />
                            Adjust stock
                        </button>
                    ) : null}
                    <button type="button" onClick={() => setIsModalOpen(true)} className="btn-secondary">
                        <Edit size={16} aria-hidden />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirm(true)}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                    >
                        <Trash2 size={16} aria-hidden />
                        Delete
                    </button>
                </div>
            </div>

            <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-3 overflow-x-auto scroll-x-touch pb-0.5 lg:grid lg:max-w-4xl lg:grid-cols-4 lg:gap-3 lg:overflow-visible">
                    <StatCard
                        className="shrink-0 snap-start w-max min-w-[8.75rem] lg:w-auto lg:min-w-0"
                        title="Total sold"
                        value={summary?.totalQuantitySold ?? 0}
                        icon={ShoppingBag}
                        iconBg="bg-brand-light"
                        iconColor="text-brand"
                        detail={formatCurrency(summary?.totalRevenue || 0)}
                    />
                    <StatCard
                        className="shrink-0 snap-start w-max min-w-[8.75rem] lg:w-auto lg:min-w-0"
                        title="Unique clients"
                        value={summary?.uniqueClients ?? 0}
                        icon={Users}
                        iconBg="bg-sky-50"
                        iconColor="text-sky-600"
                    />
                    <SoldInPeriodStatCard
                        className="shrink-0 snap-start w-max min-w-[11rem] lg:w-auto lg:min-w-0"
                        quantity={soldInPeriod.quantity}
                        revenue={soldInPeriod.revenue}
                        comparison={soldInPeriod.comparison}
                        comparisonLabel={isCurrentPeriod ? 'vs last month' : 'vs previous month'}
                        monthInputValue={monthInputValue}
                        onPeriodChange={setMonthInputValue}
                        periodLabel={periodLabel}
                        isCurrentPeriod={isCurrentPeriod}
                        icon={TrendingUp}
                        iconBg="bg-violet-50"
                        iconColor="text-violet-600"
                    />
                    <StatCard
                        className="shrink-0 snap-start w-max min-w-[8.75rem] lg:w-auto lg:min-w-0"
                        title="Quoted (open)"
                        value={summary?.quotedQuantity ?? 0}
                        icon={ClipboardList}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-700"
                        detail="Unconverted quotations"
                    />
                </div>
            </div>

            <p className="mb-6 text-xs text-zinc-500">
                Sales history includes catalog-linked line items on invoices and receipts. Open
                quotations show separately and are excluded once converted.
            </p>

            <section className="mb-8">
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Clients who bought this</h2>
                {activity?.byClient?.length ? (
                    <DataTable
                        columns={CLIENT_COLUMNS}
                        fixedLayout
                        minWidth={640}
                        className="scroll-x-touch"
                    >
                        {activity.byClient.map((row) => (
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
                    <DataTable
                        columns={ACTIVITY_COLUMNS}
                        fixedLayout
                        minWidth={840}
                        className="scroll-x-touch"
                    >
                        {activity.transactions.map((row) => (
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
                                    {formatCurrency(row.lineTotal || 0)}
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
                        ))}
                    </DataTable>
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
