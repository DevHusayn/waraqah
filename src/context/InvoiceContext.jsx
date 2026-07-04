import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { isDraft } from '../utils/invoiceHelpers';

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
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const productsFetchedRef = useRef(false);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const mapInvoice = (i) => ({ ...i, id: i._id || i.id });
    const mapClient = (c) => ({ ...c, id: c._id || c.id });
    const mapProduct = (p) => ({ ...p, id: p._id || p.id });

    const refreshInvoices = useCallback(async () => {
        const [inv, usage] = await Promise.all([
            apiFetch('/invoices'),
            apiFetch('/invoices/usage').catch(() => null),
        ]);
        setInvoices(inv.map(mapInvoice));
        if (usage) setInvoiceUsage(usage);
    }, []);

    const fetchProducts = useCallback(async ({ force = false } = {}) => {
        if (!shouldFetch && !isAuthenticated) return [];
        if (productsFetchedRef.current && !force) return;

        setProductsLoading(true);
        try {
            const pro = await apiFetch('/products');
            const mapped = pro.map(mapProduct);
            setProducts(mapped);
            productsFetchedRef.current = true;
            return mapped;
        } catch {
            setProducts([]);
            return [];
        } finally {
            setProductsLoading(false);
        }
    }, [shouldFetch, isAuthenticated]);

    const fetchUserData = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                setInvoices([]);
                setClients([]);
                setProducts([]);
                setInvoiceUsage(null);
                productsFetchedRef.current = false;
            }
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
            setInvoices(inv.map(mapInvoice));
            setClients(cli.map(mapClient));
        } catch {
            setInvoices([]);
            setClients([]);
            setInvoiceUsage(null);
        } finally {
            setLoading(false);
        }
    }, [shouldFetch, authLoading, isAuthenticated]);

    useEffect(() => {
        fetchUserData();
        const onLogin = () => fetchUserData();
        const onLogout = () => {
            setInvoices([]);
            setClients([]);
            setProducts([]);
            setInvoiceUsage(null);
            setLoading(false);
            setProductsLoading(false);
            productsFetchedRef.current = false;
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
        productsFetchedRef.current = false;
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
        await refreshInvoices();
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
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    };

    const sendInvoiceEmailToClient = async (id) =>
        apiFetch(`/invoices/${id}/send-email`, { method: 'POST' });

    const sendPaymentReminderToClient = async (id) =>
        apiFetch(`/invoices/${id}/send-reminder`, { method: 'POST' });

    const markInvoiceReminderSent = (id, lastPaymentReminderAt) => {
        const sentAt = lastPaymentReminderAt || new Date().toISOString();
        setInvoices((prev) =>
            prev.map((inv) =>
                String(inv.id) === String(id) || String(inv._id) === String(id)
                    ? { ...inv, lastPaymentReminderAt: sentAt }
                    : inv
            )
        );
        return sentAt;
    };

    const sendReceiptEmailToClient = async (id) =>
        apiFetch(`/invoices/${id}/send-receipt`, { method: 'POST' });

    const addClient = async (client) => {
        const newClient = await apiFetch('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
        const mapped = mapClient(newClient);
        setClients((prev) => [...prev, mapped]);
        return mapped;
    };

    const updateClient = async (id, updatedClient) => {
        const updated = await apiFetch(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedClient),
        });
        const mapped = mapClient(updated);
        setClients((prev) => prev.map((client) => (client.id === id ? mapped : client)));
        return mapped;
    };

    const deleteClient = async (id) => {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        setClients((prev) => prev.filter((client) => client.id !== id));
    };

    const addProduct = async (product) => {
        const newProduct = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        });
        const mapped = mapProduct(newProduct);
        setProducts((prev) => [...prev, mapped]);
        productsFetchedRef.current = true;
        return mapped;
    };

    const updateProduct = async (id, updatedProduct) => {
        const updated = await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedProduct),
        });
        const mapped = mapProduct(updated);
        setProducts((prev) => prev.map((product) => (product.id === id ? mapped : product)));
        return mapped;
    };

    const deleteProduct = async (id) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        setProducts((prev) => prev.filter((product) => product.id !== id));
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
        sendInvoiceEmailToClient,
        sendPaymentReminderToClient,
        markInvoiceReminderSent,
        sendReceiptEmailToClient,
        addClient,
        updateClient,
        deleteClient,
        addProduct,
        updateProduct,
        deleteProduct,
        fetchUserData,
        fetchProducts,
        refreshInvoices,
        resetAll,
        loading,
        productsLoading,
    };

    return (
        <InvoiceContext.Provider value={value}>
            {children}
        </InvoiceContext.Provider>
    );
};
