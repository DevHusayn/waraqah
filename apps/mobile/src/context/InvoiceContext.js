import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { getToken } from '../api/storage';
import { invoicesNeedingOverdueSync } from '@waraqah/shared';
import { useAuth } from './AuthContext';

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
    const { sessionVersion, isAuthenticated } = useAuth();
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
        const token = await getToken();
        if (!token) {
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
        if (isAuthenticated) fetchUserData();
        else {
            setInvoices([]);
            setClients([]);
            setInvoiceUsage(null);
            setLoading(false);
        }
    }, [sessionVersion, isAuthenticated, fetchUserData]);

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
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
        return mapped;
    };

    const deleteInvoice = async (id) => {
        await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
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
        setClients((prev) => prev.map((c) => (c.id === id ? mapped : c)));
        return mapped;
    };

    const deleteClient = async (id) => {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        setClients((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <InvoiceContext.Provider
            value={{
                invoices,
                clients,
                invoiceUsage,
                loading,
                addInvoice,
                updateInvoice,
                deleteInvoice,
                addClient,
                updateClient,
                deleteClient,
                fetchUserData,
                resetAll,
            }}
        >
            {children}
        </InvoiceContext.Provider>
    );
}

export function useInvoice() {
    const ctx = useContext(InvoiceContext);
    if (!ctx) throw new Error('useInvoice must be used within InvoiceProvider');
    return ctx;
}
