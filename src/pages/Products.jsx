import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ProductFormModal, { EMPTY_PRODUCT } from '../components/ProductFormModal';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import Spinner from '../components/Spinner';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';

function filterProducts(products, query) {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
        (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
    );
}

const COLUMNS = [
    { key: 'name', label: 'Product' },
    { key: 'price', label: 'Price', className: 'text-right' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: '', className: 'text-right w-24' },
];

export default function Products() {
    const { products, addProduct, updateProduct, deleteProduct, loading, productsLoading, fetchProducts } = useInvoice();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_PRODUCT);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, productId: null });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    const filteredProducts = useMemo(
        () => filterProducts(products, search),
        [products, search]
    );

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setModalInitialData({
                name: product.name || '',
                description: product.description || '',
                unitPrice: product.unitPrice ?? '',
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

    const confirmDelete = async () => {
        const id = confirm.productId;
        setDeleting(true);
        try {
            await deleteProduct(id);
            showToast('Product deleted successfully', 'success');
            setConfirm({ open: false, productId: null });
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

            <PageHeader title="Products" subtitle="Catalog items for quick invoice line entries">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add product
                </button>
            </PageHeader>

            {productsLoading && products.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">Loading products…</p>
            ) : products.length === 0 ? (
                <div className="data-table-wrap">
                    <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Build your catalog once, then pick items in seconds when invoicing."
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

                    {filteredProducts.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState title="No matches" description="Try a different search term." />
                        </div>
                    ) : (
                        <DataTable columns={COLUMNS}>
                            {filteredProducts.map((product) => (
                                <DataTableRow key={product.id}>
                                    <DataTableCell>
                                        <span className="font-medium text-zinc-950">{product.name}</span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <span className="font-medium tabular-nums">
                                            {formatCurrency(product.unitPrice || 0)}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-zinc-500 truncate max-w-[280px] block">
                                            {product.description || '—'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
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
                    )}
                </>
            )}

            <p className="mt-6 text-xs text-zinc-500">
                Products appear in the{' '}
                <Link to="/invoices/create" className="text-zinc-950 font-medium hover:underline">
                    invoice creator
                </Link>{' '}
                for one-click line items.
            </p>
        </>
    );
}
