import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PackageCheck, Pencil, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PageSpinner } from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import PurchaseReceiveModal from '../components/PurchaseReceiveModal';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { useInvoice } from '../context/InvoiceContext';

const mapOrder = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function PurchaseOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { fetchProducts } = useInvoice();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const loadOrder = async () => {
        const data = await apiFetch(`/purchase-orders/${id}`);
        setOrder(mapOrder(data));
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/purchase-orders/${id}`);
                if (!cancelled) setOrder(mapOrder(data));
            } catch {
                if (!cancelled) navigate('/purchase-orders', { replace: true });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, navigate]);

    const receivableLines = useMemo(() => {
        if (!order?.items) return [];
        return order.items
            .map((item, lineIndex) => {
                const ordered = Number(item.quantity) || 0;
                const received = Number(item.quantityReceived) || 0;
                const remaining = Math.max(0, ordered - received);
                return {
                    lineIndex,
                    description: item.description,
                    ordered,
                    received,
                    remaining,
                    rate: item.rate,
                    productId: item.productId,
                };
            })
            .filter((line) => line.remaining > 0);
    }, [order]);

    const canReceive = order && ['sent', 'partial'].includes(order.status) && receivableLines.length > 0;
    const canEdit = order?.status === 'draft';
    const canCancel = order && ['draft', 'sent', 'partial'].includes(order.status);

    const handleReceive = async (receiveLines) => {
        try {
            const updated = await apiFetch(`/purchase-orders/${id}/receive`, {
                method: 'POST',
                body: JSON.stringify({ lines: receiveLines }),
            });
            setOrder(mapOrder(updated));
            setReceiveOpen(false);
            fetchProducts({ force: true }).catch(() => {});
            showToast('Stock received successfully', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to receive stock', 'error');
            throw err;
        }
    };

    const handleCancel = async () => {
        setActionLoading(true);
        try {
            const updated = await apiFetch(`/purchase-orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'cancelled' }),
            });
            setOrder(mapOrder(updated));
            setCancelOpen(false);
            showToast('Purchase order cancelled', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to cancel purchase order', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !order) {
        return <PageSpinner label="Loading purchase order…" />;
    }

    return (
        <>
            <ConfirmModal
                open={cancelOpen}
                title="Cancel purchase order?"
                description="This order will be marked cancelled. You can still view it for your records."
                confirmLabel="Cancel order"
                cancelLabel="Keep order"
                variant="danger"
                loading={actionLoading}
                onConfirm={handleCancel}
                onCancel={() => !actionLoading && setCancelOpen(false)}
            />
            <PurchaseReceiveModal
                open={receiveOpen}
                onClose={() => setReceiveOpen(false)}
                lines={receivableLines}
                currency={order.currency}
                onSubmit={handleReceive}
            />

            <div className="mb-4">
                <Link
                    to="/purchase-orders"
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft size={16} aria-hidden />
                    Back to purchase orders
                </Link>
            </div>

            <PageHeader
                title={order.purchaseOrderNumber || 'Purchase order'}
                subtitle={
                    order.supplierId ? (
                        <Link
                            to={`/suppliers/${order.supplierId}`}
                            className="hover:text-zinc-900 hover:underline"
                        >
                            {order.supplierName || 'View supplier'}
                        </Link>
                    ) : (
                        order.supplierName || 'Supplier not set'
                    )
                }
            >
                <div className="flex flex-wrap gap-2">
                    {canEdit ? (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(`/purchase-orders/edit/${order.id}`)}
                        >
                            <Pencil size={16} aria-hidden />
                            Edit draft
                        </button>
                    ) : null}
                    {canReceive ? (
                        <button type="button" className="btn-primary" onClick={() => setReceiveOpen(true)}>
                            <PackageCheck size={16} aria-hidden />
                            Receive stock
                        </button>
                    ) : null}
                    {canCancel ? (
                        <button type="button" className="btn-secondary" onClick={() => setCancelOpen(true)}>
                            <XCircle size={16} aria-hidden />
                            Cancel
                        </button>
                    ) : null}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="card lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-zinc-950">Line items</h2>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-zinc-400 border-b border-zinc-200">
                                    <th className="py-2 pr-4 font-medium">Item</th>
                                    <th className="py-2 px-4 font-medium text-right">Ordered</th>
                                    <th className="py-2 px-4 font-medium text-right">Received</th>
                                    <th className="py-2 pl-4 font-medium text-right">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order.items || []).map((item, index) => (
                                    <tr key={index} className="border-b border-zinc-100 last:border-0">
                                        <td className="py-3 pr-4 text-zinc-800">{item.description || '—'}</td>
                                        <td className="py-3 px-4 text-right tabular-nums">{item.quantity ?? 0}</td>
                                        <td className="py-3 px-4 text-right tabular-nums">
                                            {item.quantityReceived ?? 0}
                                        </td>
                                        <td className="py-3 pl-4 text-right tabular-nums">
                                            {formatCurrency(item.rate || 0, order.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card space-y-3 text-sm">
                    <div>
                        <p className="text-zinc-500">Order date</p>
                        <p className="font-medium text-zinc-950">
                            {order.date ? format(new Date(order.date), 'MMM d, yyyy') : '—'}
                        </p>
                    </div>
                    {order.expectedDate ? (
                        <div>
                            <p className="text-zinc-500">Expected delivery</p>
                            <p className="font-medium text-zinc-950">
                                {format(new Date(order.expectedDate), 'MMM d, yyyy')}
                            </p>
                        </div>
                    ) : null}
                    <div>
                        <p className="text-zinc-500">Estimated total</p>
                        <p className="text-lg font-bold text-zinc-950">
                            {formatCurrency(order.total || 0, order.currency)}
                        </p>
                    </div>
                    {order.notes ? (
                        <div>
                            <p className="text-zinc-500">Notes</p>
                            <p className="text-zinc-800 whitespace-pre-wrap">{order.notes}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
