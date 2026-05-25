import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Edit,
    Trash2,
    Building2,
    Mail,
    Phone,
    MapPin,
    Search,
    Users,
} from 'lucide-react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { getBusinessInitials } from '../utils/premium';
import Spinner from '../components/Spinner';

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

function ClientCard({ client, onEdit, onDelete }) {
    const initials = getBusinessInitials(client.name);

    return (
        <article className="card hover:shadow-card-md transition-shadow duration-200 flex flex-col h-full">
            <div className="flex items-start gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-brand-light text-brand flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
                    {client.business ? (
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                            <Building2 size={13} className="shrink-0" aria-hidden />
                            {client.business}
                        </p>
                    ) : null}
                </div>
            </div>

            <dl className="space-y-2 text-sm flex-1">
                {client.email ? (
                    <div className="flex items-start gap-2 text-slate-600">
                        <Mail size={14} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
                        <dd className="break-all">{client.email}</dd>
                    </div>
                ) : null}
                {client.phone ? (
                    <div className="flex items-start gap-2 text-slate-600">
                        <Phone size={14} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
                        <dd>{client.phone}</dd>
                    </div>
                ) : null}
                {client.address ? (
                    <div className="flex items-start gap-2 text-slate-600">
                        <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
                        <dd className="line-clamp-2">{client.address}</dd>
                    </div>
                ) : null}
                {!client.email && !client.phone && !client.address ? (
                    <p className="text-xs text-slate-400 italic">No contact details yet</p>
                ) : null}
            </dl>

            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => onEdit(client)}
                    className="btn-secondary flex-1 text-sm py-2"
                >
                    <Edit size={15} aria-hidden />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={15} aria-hidden />
                    Delete
                </button>
            </div>
        </article>
    );
}

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

            <div className="max-w-7xl mx-auto">
                <PageHeader title="Clients" subtitle="Manage contacts for your invoices">
                    <button type="button" onClick={() => openModal()} className="btn-primary">
                        <Plus size={20} aria-hidden />
                        Add client
                    </button>
                </PageHeader>

                {loading ? (
                    <div className="py-24 flex justify-center">
                        <Spinner />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="card text-center py-16 px-6 max-w-lg mx-auto">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
                            <Users className="h-7 w-7" aria-hidden />
                        </div>
                        <h3 className="mt-5 text-xl font-semibold text-slate-900">No clients yet</h3>
                        <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
                            Add your first client to start creating invoices with their contact details
                            pre-filled.
                        </p>
                        <button type="button" onClick={() => openModal()} className="btn-primary mt-8 mx-auto">
                            <Plus size={20} aria-hidden />
                            Add your first client
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="card !p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Users size={16} className="text-slate-400" aria-hidden />
                                <span>
                                    <strong className="text-slate-900">{clients.length}</strong> client
                                    {clients.length === 1 ? '' : 's'}
                                    {search ? (
                                        <>
                                            {' '}
                                            · <strong className="text-slate-900">{filteredClients.length}</strong>{' '}
                                            shown
                                        </>
                                    ) : null}
                                </span>
                            </p>
                            <div className="relative w-full sm:max-w-xs">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                                    aria-hidden
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search clients…"
                                    className="input-field pl-9"
                                    aria-label="Search clients"
                                />
                            </div>
                        </div>

                        {filteredClients.length === 0 ? (
                            <div className="card text-center py-12">
                                <p className="text-slate-600 font-medium">No clients match your search</p>
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="btn-secondary mt-4 mx-auto text-sm"
                                >
                                    Clear search
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredClients.map((client) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        onEdit={openModal}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Clients;
