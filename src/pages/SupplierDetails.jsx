import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Truck,
    ShoppingCart,
    PackageCheck,
    Clock,
    Package,
    Plus,
} from 'lucide-react';
import { PageSpinner } from '../components/Spinner';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import SupplierFormModal, { EMPTY_SUPPLIER } from '../components/SupplierFormModal';
import StatusBadge from '../components/StatusBadge';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import PaginationBar from '../components/PaginationBar';
import { useClientPagedList } from '../hooks/useClientPagedList';

const PO_COLUMNS = [
    { key: 'number', label: 'PO #' },
    { key: 'date', label: 'Order date' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total', className: 'text-right' },
];

const PRODUCT_COLUMNS = [
    { key: 'product', label: 'Product' },
    { key: 'ordered', label: 'Qty ordered', className: 'text-right' },
    { key: 'received', label: 'Qty received', className: 'text-right' },
    { key: 'value', label: 'Order value', className: 'text-right' },
    { key: 'last', label: 'Last order' },
];

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
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

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadActivity = useCallback(async () => {
        setLoading(true);
        try {
            const payload = await apiFetch(`/suppliers/${id}/activity`);
            setActivity(payload);
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to load supplier details.',
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

    const supplier = activity?.supplier;
    const summary = activity?.summary;

    const purchaseOrdersPage = useClientPagedList(activity?.purchaseOrders, { resetKey: id });
    const productsPage = useClientPagedList(activity?.byProduct, { resetKey: id });

    const modalInitialData = useMemo(() => {
        if (!supplier) return EMPTY_SUPPLIER;
        return {
            name: supplier.name || '',
            business: supplier.company || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
        };
    }, [supplier]);

    const handleSubmit = async (formData) => {
        const payload = {
            name: formData.name,
            company: formData.business,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
        };
        try {
            await apiFetch(`/suppliers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            showToast('Supplier updated successfully', 'success');
            setIsModalOpen(false);
            await loadActivity();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to update supplier.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
            showToast('Supplier deleted successfully', 'success');
            navigate('/suppliers', { replace: true });
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete supplier.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
            setConfirm(false);
        }
    };

    if (loading) {
        return <PageSpinner label="Loading supplier…" />;
    }

    if (!supplier) {
        return (
            <EmptyState
                icon={Truck}
                title="Supplier not found"
                description="This supplier may have been deleted."
                action={
                    <Link to="/suppliers" className="btn-primary">
                        Back to suppliers
                    </Link>
                }
            />
        );
    }

    const currency = activity?.purchaseOrders?.[0]?.currency || 'NGN';

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
                title="Delete supplier?"
                description="This supplier will be removed. Existing purchase orders linked to them will not be deleted."
                confirmLabel="Delete supplier"
                cancelLabel="Keep supplier"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => !deleting && setConfirm(false)}
            />
            <SupplierFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                editingSupplier={supplier}
                initialData={modalInitialData}
            />

            <div className="mb-4">
                <Link
                    to="/suppliers"
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to suppliers
                </Link>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <Truck className="h-6 w-6 text-brand" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-zinc-950 truncate">{supplier.name}</h1>
                        {supplier.company ? (
                            <p className="text-sm text-zinc-600 mt-0.5">{supplier.company}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                            {supplier.email ? <span>{supplier.email}</span> : null}
                            {supplier.phone ? <span>{supplier.phone}</span> : null}
                        </div>
                        {supplier.address ? (
                            <p className="mt-1 text-sm text-zinc-500 whitespace-pre-wrap">{supplier.address}</p>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                            navigate(`/purchase-orders/create?supplierId=${encodeURIComponent(id)}`)
                        }
                    >
                        <Plus size={16} aria-hidden />
                        New purchase order
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(true)}>
                        <Edit size={16} aria-hidden />
                        Edit
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setConfirm(true)}>
                        <Trash2 size={16} aria-hidden />
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    title="Open orders"
                    value={String(summary?.openOrders ?? 0)}
                    icon={Clock}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                    detail="Sent or partially received"
                />
                <StatCard
                    title="Received"
                    value={String(summary?.receivedOrders ?? 0)}
                    icon={PackageCheck}
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                    detail="Fully received POs"
                />
                <StatCard
                    title="Total ordered"
                    value={formatCurrency(summary?.totalOrderedValue ?? 0, currency)}
                    icon={ShoppingCart}
                    iconBg="bg-sky-50"
                    iconColor="text-sky-600"
                    detail={`${summary?.totalOrders ?? 0} purchase orders`}
                />
                <StatCard
                    title="Products bought"
                    value={String(summary?.uniqueProducts ?? 0)}
                    icon={Package}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                    detail="Across all orders"
                />
            </div>

            <section className="card mb-6">
                <h2 className="text-sm font-semibold text-zinc-950 mb-4">Purchase orders</h2>
                {activity.purchaseOrders?.length ? (
                    <>
                    <DataTable columns={PO_COLUMNS}>
                        {purchaseOrdersPage.data.map((order) => (
                            <DataTableRow
                                key={order.id}
                                onClick={() => navigate(`/purchase-orders/${order.id}`)}
                                className="cursor-pointer"
                            >
                                <DataTableCell className="font-medium text-zinc-950">
                                    {order.purchaseOrderNumber}
                                </DataTableCell>
                                <DataTableCell>{formatDisplayDate(order.date)}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={order.status} />
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {formatCurrency(order.total || 0, order.currency || currency)}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <PaginationBar
                        pagination={purchaseOrdersPage.pagination}
                        onPageChange={purchaseOrdersPage.setPage}
                    />
                    </>
                ) : (
                    <EmptyState
                        icon={ShoppingCart}
                        title="No purchase orders yet"
                        description="Create a purchase order to start tracking what you buy from this supplier."
                        action={
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() =>
                                    navigate(`/purchase-orders/create?supplierId=${encodeURIComponent(id)}`)
                                }
                            >
                                <Plus size={16} aria-hidden />
                                New purchase order
                            </button>
                        }
                    />
                )}
            </section>

            <section className="card">
                <h2 className="text-sm font-semibold text-zinc-950 mb-4">Products bought</h2>
                {activity.byProduct?.length ? (
                    <>
                    <DataTable columns={PRODUCT_COLUMNS}>
                        {productsPage.data.map((row) => (
                            <DataTableRow key={row.key}>
                                <DataTableCell>
                                    {row.productId ? (
                                        <Link
                                            to={`/products/${row.productId}`}
                                            className="font-medium text-brand hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {row.displayName}
                                        </Link>
                                    ) : (
                                        <span className="font-medium text-zinc-950">{row.displayName}</span>
                                    )}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {row.quantityOrdered}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {row.quantityReceived}
                                </DataTableCell>
                                <DataTableCell className="text-right tabular-nums">
                                    {formatCurrency(row.lineTotal || 0, currency)}
                                </DataTableCell>
                                <DataTableCell>{formatDisplayDate(row.lastOrderDate)}</DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <PaginationBar
                        pagination={productsPage.pagination}
                        onPageChange={productsPage.setPage}
                    />
                    </>
                ) : (
                    <p className="text-sm text-zinc-500 py-4 text-center">
                        Products will appear here once you place purchase orders with line items.
                    </p>
                )}
            </section>
        </>
    );
}
