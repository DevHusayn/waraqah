import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import { getToken } from '../api/storage';
import { isDraft } from '@waraqah/shared';
import { useAuth } from './AuthContext';
import { buildListQuery, PICKER_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';

const InvoiceContext = createContext(null);

export function InvoiceProvider({ children }) {
    const { sessionVersion, isAuthenticated } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoiceUsage, setInvoiceUsage] = useState(null);
    const [draftCount, setDraftCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [draftsLoading, setDraftsLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const productsFetchedRef = useRef(false);
    const invoicesFetchedRef = useRef(false);
    const draftsFetchedRef = useRef(false);

    const mapInvoice = (i) => ({ ...i, id: i._id || i.id });
    const mapClient = (c) => ({ ...c, id: c._id || c.id });
    const mapProduct = (p) => ({ ...p, id: p._id || p.id });

    const refreshMeta = useCallback(async () => {
        try {
            const meta = await apiFetch('/invoices/meta');
            setDraftCount(meta?.draftCount ?? 0);
        } catch {
            setDraftCount(0);
        }
    }, []);

    const refreshInvoices = useCallback(async () => {
        const [invPayload, usage] = await Promise.all([
            apiFetch(`/invoices?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`),
            apiFetch('/invoices/usage').catch(() => null),
        ]);
        const { data } = unwrapListResponse(invPayload);
        setInvoices(data.map(mapInvoice));
        invoicesFetchedRef.current = true;
        if (usage) setInvoiceUsage(usage);
        await refreshMeta();
    }, [refreshMeta]);

    const fetchInvoices = useCallback(async ({ force = false, year, month, limit = PICKER_PAGE_SIZE } = {}) => {
        const token = await getToken();
        if (!token) return [];
        const forMonth = year != null && month != null;
        if (!forMonth && invoicesFetchedRef.current && !force) return invoices;

        setInvoicesLoading(true);
        try {
            const query = buildListQuery({
                page: 1,
                limit,
                year: forMonth ? year : undefined,
                month: forMonth ? month : undefined,
            });
            const payload = await apiFetch(`/invoices?${query}`);
            const { data } = unwrapListResponse(payload);
            const mapped = data.map(mapInvoice);
            if (!forMonth) {
                setInvoices(mapped);
                invoicesFetchedRef.current = true;
            }
            return mapped;
        } catch {
            if (!forMonth) setInvoices([]);
            return [];
        } finally {
            setInvoicesLoading(false);
        }
    }, [invoices]);

    const fetchDrafts = useCallback(async ({ force = false } = {}) => {
        const token = await getToken();
        if (!token) return [];
        if (draftsFetchedRef.current && !force) return drafts;

        setDraftsLoading(true);
        try {
            const payload = await apiFetch(
                `/invoices/drafts?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`
            );
            const { data, pagination } = unwrapListResponse(payload);
            const mapped = data.map(mapInvoice);
            setDrafts(mapped);
            setDraftCount(pagination?.total ?? mapped.length);
            draftsFetchedRef.current = true;
            return mapped;
        } catch {
            setDrafts([]);
            return [];
        } finally {
            setDraftsLoading(false);
        }
    }, [drafts]);

    const fetchProducts = useCallback(async ({ force = false } = {}) => {
        const token = await getToken();
        if (!token) return [];
        if (productsFetchedRef.current && !force) return products;

        setProductsLoading(true);
        try {
            const payload = await apiFetch(
                `/products?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`
            );
            const { data } = unwrapListResponse(payload);
            const mapped = data.map(mapProduct);
            setProducts(mapped);
            productsFetchedRef.current = true;
            return mapped;
        } catch {
            setProducts([]);
            return [];
        } finally {
            setProductsLoading(false);
        }
    }, [products]);

    const fetchUserData = useCallback(async () => {
        const token = await getToken();
        if (!token) {
            setInvoices([]);
            setDrafts([]);
            setClients([]);
            setProducts([]);
            setInvoiceUsage(null);
            setDraftCount(0);
            productsFetchedRef.current = false;
            invoicesFetchedRef.current = false;
            draftsFetchedRef.current = false;
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [cliPayload, usage, meta] = await Promise.all([
                apiFetch(`/clients?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`),
                apiFetch('/invoices/usage').catch(() => null),
                apiFetch('/invoices/meta').catch(() => ({ draftCount: 0 })),
            ]);
            const { data } = unwrapListResponse(cliPayload);
            setInvoiceUsage(usage);
            setClients(data.map(mapClient));
            setDraftCount(meta?.draftCount ?? 0);
        } catch {
            setClients([]);
            setInvoiceUsage(null);
            setDraftCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchUserData();
        else {
            setInvoices([]);
            setDrafts([]);
            setClients([]);
            setProducts([]);
            setInvoiceUsage(null);
            setDraftCount(0);
            productsFetchedRef.current = false;
            invoicesFetchedRef.current = false;
            draftsFetchedRef.current = false;
            setLoading(false);
        }
    }, [sessionVersion, isAuthenticated, fetchUserData]);

    const resetAll = () => {
        setInvoices([]);
        setDrafts([]);
        setClients([]);
        setProducts([]);
        setInvoiceUsage(null);
        setDraftCount(0);
        productsFetchedRef.current = false;
        invoicesFetchedRef.current = false;
        draftsFetchedRef.current = false;
    };

    const addInvoice = async (invoice, options = {}) => {
        const newInvoice = await apiFetch('/invoices', {
            method: 'POST',
            body: JSON.stringify(invoice),
        });
        const mapped = mapInvoice(newInvoice);
        if (options.skipRefresh) {
            if (isDraft(mapped)) {
                setDrafts((prev) => [mapped, ...prev.filter((inv) => inv.id !== mapped.id)]);
                setDraftCount((count) => count + 1);
            } else {
                setInvoices((prev) => [mapped, ...prev.filter((inv) => inv.id !== mapped.id)]);
                invoicesFetchedRef.current = true;
            }
            await refreshMeta();
            return mapped;
        }
        await refreshInvoices();
        draftsFetchedRef.current = false;
        return mapped;
    };

    const updateInvoice = async (id, updatedInvoice) => {
        const updated = await apiFetch(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedInvoice),
        });
        const mapped = mapInvoice(updated);
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
        setDrafts((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
        return mapped;
    };

    const deleteInvoice = async (id) => {
        const wasDraft = drafts.some((inv) => inv.id === id);
        await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        setDrafts((prev) => prev.filter((inv) => inv.id !== id));
        if (wasDraft) {
            setDraftCount((count) => Math.max(0, count - 1));
            await refreshMeta();
        }
    };

    const addClient = async (client) => {
        const created = await apiFetch('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
        const mapped = mapClient(created);
        setClients((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
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
        const body = {
            name: product.name,
            description: product.description || '',
            unitPrice: Number(product.unitPrice ?? product.price ?? 0),
        };
        const created = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        const mapped = mapProduct(created);
        setProducts((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
        return mapped;
    };

    const updateProduct = async (id, product) => {
        const body = {
            name: product.name,
            description: product.description || '',
            unitPrice: Number(product.unitPrice ?? product.price ?? 0),
        };
        const updated = await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(body),
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
            drafts.length > 0
                ? [...drafts].sort(
                      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                  )
                : [...invoices]
                      .filter(isDraft)
                      .sort(
                          (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
                      ),
        [drafts, invoices]
    );

    return (
        <InvoiceContext.Provider
            value={{
                invoices,
                draftInvoices,
                draftCount,
                clients,
                products,
                invoiceUsage,
                loading,
                invoicesLoading,
                draftsLoading,
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
                fetchInvoices,
                fetchDrafts,
                fetchProducts,
                refreshInvoices,
                refreshMeta,
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
