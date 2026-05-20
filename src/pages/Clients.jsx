import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import FieldValidationMessage from '../components/FieldValidationMessage';
import RequiredLabel from '../components/RequiredLabel';
import {
    validateRequired,
    validateOptionalEmail,
    firstFieldError,
    appendFieldErrorClass,
    focusFieldById,
    clearFieldError,
} from '../utils/formFieldValidation';
import { Plus, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';

const CLIENT_FIELD_ORDER = ['name', 'email'];
const CLIENT_INPUT =
    'block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50';

function buildClientFieldErrors(formData) {
    const errors = {
        name: validateRequired(formData.name, 'Please enter the client\'s full name.'),
        email: validateOptionalEmail(formData.email, 'Please enter a valid email address.'),
    };
    return errors;
}

function safeReturnPath(path) {
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    return path;
}

const Clients = () => {
    const { clients, addClient, updateClient, deleteClient, loading } = useInvoice();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = safeReturnPath(searchParams.get('returnTo'));
    const shouldOpenAdd = searchParams.get('add') === '1';
    const openedAddModal = useRef(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        business: '',
        email: '',
        phone: '',
        address: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const [confirm, setConfirm] = useState({ open: false, clientId: null });

    useEffect(() => {
        if (shouldOpenAdd && !openedAddModal.current) {
            openedAddModal.current = true;
            setEditingClient(null);
            setFormData({
                name: '',
                business: '',
                email: '',
                phone: '',
                address: '',
            });
            setIsModalOpen(true);
        }
    }, [shouldOpenAdd]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        clearFieldError(setFieldErrors, name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = buildClientFieldErrors(formData);
        const firstInvalid = firstFieldError(errors, CLIENT_FIELD_ORDER);
        if (firstInvalid) {
            setFieldErrors(errors);
            focusFieldById(firstInvalid === 'name' ? 'client-name' : 'client-email');
            return;
        }
        setFieldErrors({});
        try {
            if (editingClient) {
                await updateClient(editingClient.id, formData);
                showToast('Client updated successfully', 'success');
            } else {
                const newClient = await addClient(formData);
                showToast('Client added successfully', 'success');
                closeModal();
                if (returnTo) {
                    const join = returnTo.includes('?') ? '&' : '?';
                    navigate(`${returnTo}${join}clientId=${encodeURIComponent(newClient.id)}`);
                    return;
                }
            }
            closeModal();
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to save client.', type: 'error' });
        }
    };

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData(client);
        } else {
            setEditingClient(null);
            setFormData({
                name: '',
                business: '',
                email: '',
                phone: '',
                address: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFieldErrors({});
        setFormData({
            name: '',
            business: '',
            email: '',
            phone: '',
            address: '',
        });
    };

    const handleDelete = (id) => {
        setConfirm({ open: true, clientId: id });
    };

    const confirmDelete = async () => {
        const id = confirm.clientId;
        try {
            await deleteClient(id);
            showToast('Client deleted successfully', 'success');
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to delete client.', type: 'error' });
        }
        setConfirm({ open: false, clientId: null });
    };

    return (
        <>
            <AlertModal open={alert.open} message={alert.message} type={alert.type} onClose={() => setAlert({ open: false, message: '', type: 'error' })} />
            <ConfirmModal
                open={confirm.open}
                message={"Are you sure you want to delete this client?"}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, clientId: null })}
            />
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="page-title">Clients</h1>
                        <p className="page-subtitle">Manage your client database</p>
                    </div>
                    <button onClick={() => openModal()} className="btn-primary">
                        <Plus size={20} />
                        Add Client
                    </button>
                </div>

                {loading ? (
                    <div className="py-20"><Spinner /></div>
                ) : clients.length === 0 ? (
                    <div className="card text-center py-12">
                        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No clients yet</h3>
                        <p className="mt-2 text-gray-500">Get started by adding your first client</p>
                        <button onClick={() => openModal()} className="btn-primary mt-6">
                            <Plus size={20} />
                            Add Your First Client
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map((client) => (
                            <div key={client.id} className="card hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                                            <Building2 size={14} className="mr-1" />
                                            {client.business}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(client)}
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-600 flex items-center">
                                        <Mail size={14} className="mr-2 text-gray-400" />
                                        {client.email}
                                    </p>
                                    {client.phone && (
                                        <p className="text-gray-600 flex items-center">
                                            <Phone size={14} className="mr-2 text-gray-400" />
                                            {client.phone}
                                        </p>
                                    )}
                                    {client.address && (
                                        <p className="text-gray-600 flex items-start">
                                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <span>{client.address}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
                            <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h2>
                            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <RequiredLabel htmlFor="client-name">Full name</RequiredLabel>
                                        <input
                                            id="client-name"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={appendFieldErrorClass(CLIENT_INPUT, Boolean(fieldErrors.name))}
                                            aria-invalid={Boolean(fieldErrors.name)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.name} />
                                    </div>
                                    <div>
                                        <label className="label">Business name</label>
                                        <input
                                            type="text"
                                            name="business"
                                            value={formData.business}
                                            onChange={handleChange}
                                            className={CLIENT_INPUT}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="client-email" className="label">Email address</label>
                                        <input
                                            id="client-email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={appendFieldErrorClass(CLIENT_INPUT, Boolean(fieldErrors.email))}
                                            aria-invalid={Boolean(fieldErrors.email)}
                                        />
                                        <FieldValidationMessage message={fieldErrors.email} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition placeholder-gray-400 bg-gray-50 resize-none"
                                            rows="3"
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button type="button" onClick={closeModal} className="w-1/2 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary w-1/2 py-3">
                                        {editingClient ? 'Update' : 'Add'} Client
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Clients;
