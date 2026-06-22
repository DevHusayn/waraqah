import { useState, useMemo } from 'react';
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

function filterProducts(products, query) {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
        (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
    );
}

function ProductCard({ product, onEdit, onDelete }) {
    return (
        <article className="card hover:shadow-card-md transition-shadow duration-200 flex flex-col h-full">
            <div className="flex items-start gap-3 mb-3">
                <div className="h-11 w-11 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                    <Package size={20} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                    <p className="text-sm font-medium text-brand mt-0.5">
                        {formatCurrency(product.unitPrice || 0)}
                    </p>
                </div>
            </div>
            {product.description ? (
                <p className="text-sm text-slate-600 line-clamp-3 flex-1">{product.description}</p>
            ) : (
                <p className="text-xs text-slate-400 italic flex-1">No description</p>
            )}
            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => onEdit(product)} className="btn-secondary flex-1 text-sm py-2">
                    <Edit size={15} aria-hidden />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={15} aria-hidden />
                    Delete
                </button>
            </div>
        </article>
    );
}

export default function Products() {
    const { products, addProduct, updateProduct, deleteProduct, loading } = useInvoice();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_PRODUCT);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, productId: null });
    const [deleting, setDeleting] = useState(false);

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

    if (loading) return <Spinner />;

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

            <PageHeader
                title="Products"
                subtitle="Save products and services to add them quickly when creating invoices"
            >
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={18} aria-hidden />
                    Add product
                </button>
            </PageHeader>

            <div className="mb-6 relative">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden
                />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="input-field pl-10"
                />
            </div>

            {filteredProducts.length === 0 ? (
                <div className="card text-center py-16">
                    <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" aria-hidden />
                    <h3 className="text-lg font-semibold text-slate-900">
                        {products.length === 0 ? 'No products yet' : 'No matches'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        {products.length === 0
                            ? 'Build your catalog once, then pick items in seconds when invoicing.'
                            : 'Try a different search term.'}
                    </p>
                    {products.length === 0 && (
                        <button type="button" onClick={() => openModal()} className="btn-primary mt-6">
                            <Plus size={18} aria-hidden />
                            Add your first product
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={openModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <p className="mt-8 text-sm text-slate-500 text-center">
                Products appear in the{' '}
                <Link to="/invoices/create" className="text-brand font-medium hover:underline">
                    invoice creator
                </Link>{' '}
                for one-click line items.
            </p>
        </>
    );
}
