import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { APP_CURRENCY, CURRENCY_INFO, formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';

const CreateInvoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { clients, addInvoice, updateInvoice, invoices } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        clientId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        items: [{ description: '', quantity: 1, rate: 0 }],
        notes: '',
        status: 'pending',
        currency: APP_CURRENCY,
        taxRate: businessInfo.taxRate ?? 10,
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
    });

    useEffect(() => {
        if (!id) {
            setFormData((prev) => ({
                ...prev,
                currency: APP_CURRENCY,
                taxRate: businessInfo.taxRate ?? prev.taxRate,
            }));
        }
    }, [id, businessInfo.taxRate]);

    useEffect(() => {
        if (id) {
            const invoice = invoices.find(inv => inv.id === id);
            if (invoice) {
                setFormData(invoice);
            }
        }
    }, [id, invoices]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, rate: 0 }],
        });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (Number(item.quantity) * Number(item.rate));
        }, 0);
    };

    const calculateTax = () => {
        const taxRate = Number(formData.taxRate);
        if (isNaN(taxRate) || taxRate <= 0) return 0;
        return calculateSubtotal() * (taxRate / 100);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const calculateBalance = () => {
        return calculateTotal();
    };

    // Removed partial payment logic

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.clientId) {
            showToast('Please select a client', 'error');
            return;
        }

        const invoiceData = {
            ...formData,
            currency: APP_CURRENCY,
            subtotal: calculateSubtotal(),
            tax: calculateTax(),
            total: calculateTotal(),
            balance: calculateBalance(),
        };

        setSaving(true);
        try {
            if (id) {
                await updateInvoice(id, invoiceData);
                showToast('Invoice updated successfully', 'success');
            } else {
                await addInvoice(invoiceData);
                showToast('Invoice created successfully', 'success');
            }
            navigate('/invoices');
        } catch (err) {
            showToast(err.message || 'Failed to save invoice', 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectedClient = clients.find(c => c.id === formData.clientId);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/invoices')}
                    className="btn-secondary mb-4"
                >
                    <ArrowLeft size={18} />
                    Back to Invoices
                </button>
                <h1 className="page-title">
                    {id ? 'Edit invoice' : 'Create invoice'}
                </h1>
                <p className="page-subtitle">Fill in the details below</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invoice Details Card */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        className="input-field bg-gray-100 cursor-not-allowed"
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="overdue">Overdue</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="taxRate"
                                        value={formData.taxRate}
                                        onChange={handleChange}
                                        className="input-field"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Issue Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Due Date</label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Recurring Invoice Card */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recurring Invoice</h2>
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={e => setFormData({ ...formData, isRecurring: e.target.checked })}
                                    className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="isRecurring" className="text-base font-medium text-gray-700 select-none">Make this a recurring invoice</label>
                            </div>
                            {formData.isRecurring && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Frequency</label>
                                        <select
                                            name="recurringFrequency"
                                            value={formData.recurringFrequency}
                                            onChange={handleChange}
                                            className="input-field"
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">End Date</label>
                                        <input
                                            type="date"
                                            name="recurringEndDate"
                                            value={formData.recurringEndDate}
                                            onChange={handleChange}
                                            className="input-field"
                                            min={formData.date}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave blank for no end date (infinite recurrence)</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Client Selection Card */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
                                <Link
                                    to="/clients"
                                    className="text-primary-600 text-sm font-medium hover:underline whitespace-nowrap"
                                >
                                    + Add New Client
                                </Link>
                            </div>
                            <div>
                                <label className="label">Select Client</label>
                                <select
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Choose a client...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}{getClientBusiness(client) ? ` — ${getClientBusiness(client)}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {clients.length === 0 && (
                                    <p className="mt-2 text-sm text-amber-600">
                                        No clients found. Please add a client first.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="btn-secondary text-sm py-2 px-3"
                                >
                                    <Plus size={16} />
                                    Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-5">
                                                <label className="label">Description</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    className="input-field"
                                                    placeholder="Service or product description"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="label">Quantity</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="input-field"
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="label">Rate ({CURRENCY_INFO.symbol})</label>
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                    className="input-field"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                            {/* Removed Amount Paid field for partial payment */}
                                            <div className={'md:col-span-2'} >
                                                <div className="flex flex-col justify-end h-full">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {formatCurrency(item.quantity * item.rate)}
                                                        </span>
                                                        {formData.items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="text-red-600 hover:text-red-800 p-2"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes Card */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="input-field resize-none"
                                rows="4"
                                placeholder="Add any additional information or payment terms..."
                                style={{ resize: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="card sticky top-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>

                            {selectedClient && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Bill To</p>
                                    <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                                    {getClientBusiness(selectedClient) && (
                                        <p className="text-sm text-gray-600">{getClientBusiness(selectedClient)}</p>
                                    )}
                                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                                </div>
                            )}

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax ({formData.taxRate}%):</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(calculateTax())}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                                        <span className="text-2xl font-bold text-brand">
                                            {formatCurrency(calculateTotal())}
                                        </span>
                                    </div>
                                    {/* Removed partial payment summary */}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Saving...' : id ? 'Update Invoice' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
