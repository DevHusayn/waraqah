import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch, getToken } from '../utils/api';
import { invoicesNeedingOverdueSync, isDraft } from '../utils/invoiceHelpers';

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
    const [products, setProducts] = useState([]);
    const [invoiceUsage, setInvoiceUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    const mapInvoice = (i) => ({ ...i, id: i._id || i.id });
    const mapClient = (c) => ({ ...c, id: c._id || c.id });
    const mapProduct = (p) => ({ ...p, id: p._id || p.id });

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
            setProducts([]);
            setInvoiceUsage(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [inv, cli, pro, usage] = await Promise.all([
                apiFetch('/invoices'),
                apiFetch('/clients'),
                apiFetch('/products').catch(() => []),
                apiFetch('/invoices/usage').catch(() => null),
            ]);
            setInvoiceUsage(usage);
            let mappedInvoices = inv.map(mapInvoice);
            mappedInvoices = await syncOverdueStatuses(mappedInvoices);
            setInvoices(mappedInvoices);
            setClients(cli.map(mapClient));
            setProducts(pro.map(mapProduct));
        } catch {
            setInvoices([]);
            setClients([]);
            setProducts([]);
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
            setProducts([]);
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
        setProducts([]);
        setInvoiceUsage(null);
    };

    const addInvoice = async (invoice, options = {}) => {
        const newInvoice = await apiFetch('/invoices', {
            method: 'POST',
            body: JSON.stringify(invoice),
        });
        const mapped = mapInvoice(newInvoice);
        if (options.skipRefresh) {
            setInvoices((prev) => [mapped, ...prev.filter((inv) => inv.id !== mapped.id)]);
            return mapped;
        }
        await fetchUserData();
        return mapped;
    };

    const updateInvoice = async (id, updatedInvoice) => {
        const updated = await apiFetch(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedInvoice),
        });
        const mapped = { ...updated, id: updated._id || id };
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
        return mapped;
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

    const addProduct = async (product) => {
        const newProduct = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        });
        await fetchUserData();
        return { ...newProduct, id: newProduct._id };
    };

    const updateProduct = async (id, updatedProduct) => {
        const updated = await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedProduct),
        });
        const mapped = { ...updated, id: updated._id };
        setProducts(products.map((product) => (product.id === id ? mapped : product)));
    };

    const deleteProduct = async (id) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        setProducts(products.filter((product) => product.id !== id));
    };

    const draftInvoices = useMemo(
        () =>
            [...invoices]
                .filter(isDraft)
                .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
        [invoices]
    );

    const value = {
        invoices,
        draftInvoices,
        clients,
        products,
        invoiceUsage,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addClient,
        updateClient,
        deleteClient,
        addProduct,
        updateProduct,
        deleteProduct,
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
