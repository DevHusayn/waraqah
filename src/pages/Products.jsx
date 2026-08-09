import { useCallback, useState } from 'react';
import { Plus, Edit, Trash2, Package, Search, PackagePlus } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ProductFormModal, { EMPTY_PRODUCT } from '../components/ProductFormModal';
import ProductStockAdjustModal from '../components/ProductStockAdjustModal';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { ListPageSkeleton } from '../components/Skeleton';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { isLowStock } from '../utils/stockWarnings';

const COLUMNS = [
    { key: 'name', label: 'Product', width: '22%' },
    { key: 'price', label: 'Price', className: 'text-right', width: '18%' },
    { key: 'stock', label: 'In stock', className: 'text-right', width: '14%' },
    { key: 'description', label: 'Description', width: '36%' },
    { key: 'actions', label: '', className: 'text-right', width: '10%' },
];

const mapProduct = (p) => ({ ...p, id: p._id || p.id });

export default function Products() {
    const { addProduct, updateProduct, deleteProduct, adjustProductStock } = useInvoice();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_PRODUCT);
    const [stockAdjustProduct, setStockAdjustProduct] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, productId: null });
    const [deleting, setDeleting] = useState(false);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/products?${buildListQuery({ page, limit, search })}`),
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
        refresh,
    } = usePagedQuery({ queryKeyBase: 'products', fetcher });

    const products = data.map(mapProduct);
    const hasNoProductsAtAll = !loading && pagination.total === 0 && !search;

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setModalInitialData({
                name: product.name || '',
                description: product.description || '',
                unitPrice: product.unitPrice ?? '',
                trackInventory: Boolean(product.trackInventory),
                quantityOnHand: product.trackInventory ? (product.quantityOnHand ?? 0) : '',
                lowStockThreshold:
                    product.lowStockThreshold == null ? '' : product.lowStockThreshold,
            });
        } else {
            setEditingProduct(null);
            setModalInitialData(EMPTY_PRODUCT);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setModalInitialData(EMPTY_PRODUCT);
    };

    const handleSubmit = async (formData, editing) => {
        try {
            if (editing) {
                await updateProduct(editing.id, formData);
                showToast('Product updated successfully', 'success');
            } else {
                await addProduct(formData);
                showToast('Product added successfully', 'success');
            }
            closeModal();
            await refresh();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save product.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleDelete = (id) => setConfirm({ open: true, productId: id });

    const handleAdjustStock = async (delta) => {
        if (!stockAdjustProduct) return;
        try {
            await adjustProductStock(stockAdjustProduct.id, delta);
            showToast('Stock updated successfully', 'success');
            setStockAdjustProduct(null);
            await refresh();
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
        const id = confirm.productId;
        setDeleting(true);
        try {
            await deleteProduct(id);
            showToast('Product deleted successfully', 'success');
            setConfirm({ open: false, productId: null });
            await refresh();
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete product.',
                type: 'error',
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ConfirmModal
                open={confirm.open}
                title="Delete product?"
                description="This product will be removed from your catalog. Existing invoices are not affected."
                confirmLabel="Delete product"
                cancelLabel="Keep product"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, productId: null })}
            />
            <ProductFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingProduct={editingProduct}
                initialData={modalInitialData}
            />
            <ProductStockAdjustModal
                open={Boolean(stockAdjustProduct)}
                onClose={() => setStockAdjustProduct(null)}
                product={stockAdjustProduct}
                onSubmit={handleAdjustStock}
            />

            <PageHeader title="Products" subtitle="Catalog items for quick line entries on any document">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add product
                </button>
            </PageHeader>

            {loading && products.length === 0 && !search ? (
                <ListPageSkeleton rows={8} columns={5} />
            ) : hasNoProductsAtAll ? (
                <div className="data-table-wrap">
                    <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Build your catalog once, then pick items in seconds when creating documents."
                        action={
                            <button type="button" onClick={() => openModal()} className="btn-primary">
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
                        />
                    </Toolbar>

                    {products.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState title="No matches" description="Try a different search term." />
                        </div>
                    ) : (
                        <>
                            <DataTable columns={COLUMNS} fixedLayout>
                                {products.map((product) => (
                                    <DataTableRow key={product.id}>
                                        <DataTableCell>
                                            <span className="font-medium text-zinc-950">
                                                {product.name}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <span className="font-medium tabular-nums">
                                                {formatCurrency(product.unitPrice || 0)}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            {product.trackInventory ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-medium tabular-nums">
                                                        {product.quantityOnHand ?? 0}
                                                    </span>
                                                    {isLowStock(product) ? (
                                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                            Low stock
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400">—</span>
                                            )}
                                        </DataTableCell>
                                        <DataTableCell className="max-w-0">
                                            <span className="text-zinc-500 truncate block">
                                                {product.description || '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {product.trackInventory ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setStockAdjustProduct(product)}
                                                        className="btn-ghost text-xs py-1 px-2"
                                                        aria-label="Adjust stock"
                                                    >
                                                        <PackagePlus size={14} />
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => openModal(product)}
                                                    className="btn-ghost text-xs py-1 px-2"
                                                    aria-label="Edit product"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(product.id)}
                                                    className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                                                    aria-label="Delete product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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

            <p className="mt-6 text-xs text-zinc-500">
                Products appear when creating invoices, receipts, and quotations for one-click line
                items. Enable inventory tracking to deduct stock when linked items are issued.
            </p>
        </>
    );
}
