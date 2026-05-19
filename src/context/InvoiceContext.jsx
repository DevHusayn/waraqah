import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken } from '../utils/api';
import { invoicesNeedingOverdueSync } from '../utils/invoiceHelpers';

const InvoiceContext = createContext();

export const useInvoice = () => {
    const context = useContext(InvoiceContext);
    if (!context) {
        throw new Error('useInvoice must be used within InvoiceProvider');
    }
    return context;
};

export const InvoiceProvider = ({ children }) => {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [invoiceUsage, setInvoiceUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const mapInvoice = (i) => ({ ...i, id: i._id || i.id });
    const mapClient = (c) => ({ ...c, id: c._id || c.id });

    const syncOverdueStatuses = async (invoiceList) => {
        const toUpdate = invoicesNeedingOverdueSync(invoiceList);
        if (toUpdate.length === 0) return invoiceList;

        await Promise.all(
            toUpdate.map((inv) =>
                apiFetch(`/invoices/${inv.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...inv, status: 'overdue' }),
                })
            )
        );
        const refreshed = await apiFetch('/invoices');
        return refreshed.map(mapInvoice);
    };

    const fetchUserData = useCallback(async () => {
        if (!getToken()) {
            setInvoices([]);
            setClients([]);
            setInvoiceUsage(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [inv, cli, usage] = await Promise.all([
                apiFetch('/invoices'),
                apiFetch('/clients'),
                apiFetch('/invoices/usage').catch(() => null),
            ]);
            setInvoiceUsage(usage);
            let mappedInvoices = inv.map(mapInvoice);
            mappedInvoices = await syncOverdueStatuses(mappedInvoices);
            setInvoices(mappedInvoices);
            setClients(cli.map(mapClient));
        } catch {
            setInvoices([]);
            setClients([]);
            setInvoiceUsage(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
        const onLogin = () => fetchUserData();
        const onLogout = () => {
            setInvoices([]);
            setClients([]);
            setInvoiceUsage(null);
            setLoading(false);
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchUserData]);

    const resetAll = () => {
        setInvoices([]);
        setClients([]);
        setInvoiceUsage(null);
    };

    const addInvoice = async (invoice) => {
        const newInvoice = await apiFetch('/invoices', {
            method: 'POST',
            body: JSON.stringify(invoice),
        });
        await fetchUserData();
        return { ...newInvoice, id: newInvoice._id };
    };

    const updateInvoice = async (id, updatedInvoice) => {
        const updated = await apiFetch(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedInvoice),
        });
        const mapped = { ...updated, id: updated._id };
        setInvoices(invoices.map((inv) => (inv.id === id ? mapped : inv)));
    };

    const deleteInvoice = async (id) => {
        await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
        setInvoices(invoices.filter((inv) => inv.id !== id));
    };

    const addClient = async (client) => {
        const newClient = await apiFetch('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
        await fetchUserData();
        return { ...newClient, id: newClient._id };
    };

    const updateClient = async (id, updatedClient) => {
        const updated = await apiFetch(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedClient),
        });
        const mapped = { ...updated, id: updated._id };
        setClients(clients.map((client) => (client.id === id ? mapped : client)));
    };

    const deleteClient = async (id) => {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        setClients(clients.filter((client) => client.id !== id));
    };

    const value = {
        invoices,
        clients,
        invoiceUsage,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addClient,
        updateClient,
        deleteClient,
        fetchUserData,
        resetAll,
        loading,
    };

    return (
        <InvoiceContext.Provider value={value}>
            {children}
        </InvoiceContext.Provider>
    );
};
