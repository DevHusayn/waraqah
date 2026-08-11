import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Truck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AlertModal from '../components/AlertModal';
import SupplierFormModal, { EMPTY_SUPPLIER } from '../components/SupplierFormModal';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import { ListPageSkeleton } from '../components/Skeleton';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';

function safeReturnPath(path) {
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    return path;
}

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
];

const mapSupplier = (entry) => ({ ...entry, id: entry._id || entry.id });

export default function Suppliers() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = safeReturnPath(searchParams.get('returnTo'));
    const shouldOpenAdd = searchParams.get('add') === '1';
    const openedAddModal = useRef(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_SUPPLIER);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/suppliers?${buildListQuery({ page, limit, search })}`),
        []
    );

    const {
        setPage,
        search,
        setSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedQuery({
        queryKeyBase: 'suppliers',
        fetcher,
    });

    const suppliers = data.map(mapSupplier);

    useEffect(() => {
        if (shouldOpenAdd && !openedAddModal.current) {
            openedAddModal.current = true;
            setEditingSupplier(null);
            setModalInitialData(EMPTY_SUPPLIER);
            setIsModalOpen(true);
        }
    }, [shouldOpenAdd]);

    const openModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setModalInitialData({
                name: supplier.name || '',
                business: supplier.company || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
            });
        } else {
            setEditingSupplier(null);
            setModalInitialData(EMPTY_SUPPLIER);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setModalInitialData(EMPTY_SUPPLIER);
    };

    const handleSubmit = async (formData, editing) => {
        const payload = {
            name: formData.name,
            company: formData.business,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
        };
        try {
            if (editing) {
                await apiFetch(`/suppliers/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                showToast('Supplier updated successfully', 'success');
                closeModal();
                await refresh();
            } else {
                const created = await apiFetch('/suppliers', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                showToast('Supplier added successfully', 'success');
                closeModal();
                if (returnTo) {
                    const join = returnTo.includes('?') ? '&' : '?';
                    navigate(`${returnTo}${join}supplierId=${encodeURIComponent(created._id || created.id)}`);
                } else {
                    await refresh();
                }
            }
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save supplier.',
                type: 'error',
            });
            throw err;
        }
    };

    if (loading && suppliers.length === 0 && !search) {
        return <ListPageSkeleton rows={8} columns={4} withAction={false} />;
    }

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <SupplierFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingSupplier={editingSupplier}
                initialData={modalInitialData}
            />

            <PageHeader title="Suppliers" subtitle="Vendors you order stock from">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add supplier
                </button>
            </PageHeader>

            <Toolbar className="mb-4">
                <ToolbarSearch
                    value={search}
                    onChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    placeholder="Search suppliers…"
                    icon={Search}
                />
            </Toolbar>

            {suppliers.length === 0 && !loading ? (
                <EmptyState
                    icon={Truck}
                    title={search ? 'No suppliers found' : 'No suppliers yet'}
                    description={
                        search
                            ? 'Try a different search term.'
                            : 'Add suppliers to attach them to purchase orders.'
                    }
                    action={
                        !search ? (
                            <button type="button" onClick={() => openModal()} className="btn-primary">
                                <Plus size={16} aria-hidden />
                                Add supplier
                            </button>
                        ) : null
                    }
                />
            ) : (
                <>
                    <DataTable columns={COLUMNS} loading={loading}>
                        {suppliers.map((supplier) => (
                            <DataTableRow
                                key={supplier.id}
                                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                                className="cursor-pointer"
                            >
                                <DataTableCell>
                                    <span className="font-medium text-zinc-950">{supplier.name}</span>
                                </DataTableCell>
                                <DataTableCell>{supplier.company || '—'}</DataTableCell>
                                <DataTableCell>{supplier.email || '—'}</DataTableCell>
                                <DataTableCell>{supplier.phone || '—'}</DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                    <PaginationBar pagination={pagination} onPageChange={setPage} className="mt-4" />
                </>
            )}
        </>
    );
}
