import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch } from '../components/Toolbar';

function safeReturnPath(path) {
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    return path;
}

function filterClients(clients, query) {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
        (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.business?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.address?.toLowerCase().includes(q)
    );
}

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'business', label: 'Business' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'actions', label: '', className: 'text-right w-24' },
];

const Clients = () => {
    const { clients, addClient, updateClient, deleteClient, loading } = useInvoice();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = safeReturnPath(searchParams.get('returnTo'));
    const shouldOpenAdd = searchParams.get('add') === '1';
    const openedAddModal = useRef(false);

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_CLIENT);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, clientId: null });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (shouldOpenAdd && !openedAddModal.current) {
            openedAddModal.current = true;
            setEditingClient(null);
            setModalInitialData(EMPTY_CLIENT);
            setIsModalOpen(true);
        }
    }, [shouldOpenAdd]);

    const filteredClients = useMemo(
        () => filterClients(clients, search),
        [clients, search]
    );

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setModalInitialData({
                name: client.name || '',
                business: client.business || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
            });
        } else {
            setEditingClient(null);
            setModalInitialData(EMPTY_CLIENT);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setModalInitialData(EMPTY_CLIENT);
    };

    const handleSubmit = async (formData, editing) => {
        try {
            if (editing) {
                await updateClient(editing.id, formData);
                showToast('Client updated successfully', 'success');
                closeModal();
            } else {
                const newClient = await addClient(formData);
                showToast('Client added successfully', 'success');
                closeModal();
                if (returnTo) {
                    const join = returnTo.includes('?') ? '&' : '?';
                    navigate(`${returnTo}${join}clientId=${encodeURIComponent(newClient.id)}`);
                }
            }
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save client.',
                type: 'error',
            });
            throw err;
        }
    };

    const handleDelete = (id) => setConfirm({ open: true, clientId: id });

    const confirmDelete = async () => {
        const id = confirm.clientId;
        setDeleting(true);
        try {
            await deleteClient(id);
            showToast('Client deleted successfully', 'success');
            setConfirm({ open: false, clientId: null });
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to delete client.',
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
                title="Delete client?"
                description="This client will be removed from your database. Existing invoices linked to them will not be deleted."
                confirmLabel="Delete client"
                cancelLabel="Keep client"
                variant="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => !deleting && setConfirm({ open: false, clientId: null })}
            />
            <ClientFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingClient={editingClient}
                initialData={modalInitialData}
            />

            <PageHeader title="Clients" subtitle="Manage contacts for your invoices">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add client
                </button>
            </PageHeader>

            {loading && clients.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">Loading clients…</p>
            ) : clients.length === 0 ? (
                <div className="data-table-wrap">
                    <EmptyState
                        icon={Users}
                        title="No clients yet"
                        description="Add your first client to start creating invoices with their contact details pre-filled."
                        action={
                            <button type="button" onClick={() => openModal()} className="btn-primary">
                                <Plus size={16} aria-hidden />
                                Add client
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
                            placeholder="Search clients..."
                            aria-label="Search clients"
                        />
                    </Toolbar>

                    {filteredClients.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                title="No clients match your search"
                                action={
                                    <button type="button" onClick={() => setSearch('')} className="btn-secondary">
                                        Clear search
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <DataTable columns={COLUMNS}>
                            {filteredClients.map((client) => (
                                <DataTableRow key={client.id}>
                                    <DataTableCell>
                                        <span className="font-medium text-zinc-950">{client.name}</span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-zinc-600 truncate max-w-[160px] block">
                                            {client.business || '—'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className="text-zinc-600 truncate max-w-[180px] block">
                                            {client.email || '—'}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell>
                                        {client.phone || '—'}
                                    </DataTableCell>
                                    <DataTableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openModal(client)}
                                                className="btn-ghost text-xs py-1 px-2"
                                                aria-label="Edit client"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(client.id)}
                                                className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                                                aria-label="Delete client"
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
        </>
    );
};

export default Clients;
