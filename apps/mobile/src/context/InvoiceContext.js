import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import { getToken } from '../api/storage';
import { isDraft } from '@waraqah/shared';
import { useAuth } from './AuthContext';

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
    const { sessionVersion, isAuthenticated } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoiceUsage, setInvoiceUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const productsFetchedRef = useRef(false);

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
        const token = await getToken();
        if (!token) return [];
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
    }, []);

    const fetchUserData = useCallback(async () => {
        const token = await getToken();
        if (!token) {
            setInvoices([]);
            setClients([]);
            setProducts([]);
            setInvoiceUsage(null);
            productsFetchedRef.current = false;
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
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchUserData();
        else {
            setInvoices([]);
            setClients([]);
            setProducts([]);
            setInvoiceUsage(null);
            productsFetchedRef.current = false;
            setLoading(false);
        }
    }, [sessionVersion, isAuthenticated, fetchUserData]);

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
        setClients((prev) => prev.map((c) => (c.id === id ? mapped : c)));
        return mapped;
    };

    const deleteClient = async (id) => {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        setClients((prev) => prev.filter((c) => c.id !== id));
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
        setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
        return mapped;
    };

    const deleteProduct = async (id) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        setProducts((prev) => prev.filter((p) => p.id !== id));
    };

    const draftInvoices = useMemo(
        () =>
            [...invoices]
                .filter(isDraft)
                .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
        [invoices]
    );

    return (
        <InvoiceContext.Provider
            value={{
                invoices,
                draftInvoices,
                clients,
                products,
                invoiceUsage,
                loading,
                productsLoading,
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
                fetchProducts,
                refreshInvoices,
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
