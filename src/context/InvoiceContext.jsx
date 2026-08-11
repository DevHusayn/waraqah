import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { isDraft } from '../utils/invoiceHelpers';
import { buildListQuery, PICKER_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';
import { ANALYTICS_EVENTS } from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';
import {
    invalidateClientListQueries,
    invalidateDashboardQueries,
    invalidateInvoiceListQueries,
    invalidateProductListQueries,
} from '../lib/queryClient';

const InvoiceContext = createContext();

export const useInvoice = () => {
    const context = useContext(InvoiceContext);
    if (!context) {
        throw new Error('useInvoice must be used within InvoiceProvider');
    }
    return context;
};

export const InvoiceProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [invoices, setInvoices] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [draftsLoading, setDraftsLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const productsFetchedRef = useRef(false);
    const invoicesFetchedRef = useRef(false);
    const draftsFetchedRef = useRef(false);
    const invoicesRef = useRef(invoices);
    const draftsRef = useRef(drafts);
    const productsRef = useRef(products);
    invoicesRef.current = invoices;
    draftsRef.current = drafts;
    productsRef.current = products;
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const userId = user?.id;
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const { data: invoiceUsage = null } = useQuery({
        queryKey: queryKeys.invoiceUsage(userId),
        queryFn: () => apiFetch('/invoices/usage'),
        enabled: shouldFetch && Boolean(userId),
        staleTime: STALE_TIMES.meta,
    });

    const { data: invoiceMeta } = useQuery({
        queryKey: queryKeys.invoiceMeta(userId),
        queryFn: () => apiFetch('/invoices/meta'),
        enabled: shouldFetch && Boolean(userId),
        staleTime: STALE_TIMES.meta,
    });

    const draftCount = invoiceMeta?.draftCount ?? 0;

    const mapInvoice = (i) => ({ ...i, id: i._id || i.id });
    const mapClient = (c) => ({ ...c, id: c._id || c.id });
    const mapProduct = (p) => ({
        ...p,
        id: p._id || p.id,
        trackInventory: Boolean(p.trackInventory),
    });

    const refreshMeta = useCallback(async () => {
        if (!userId) return;
        await queryClient.invalidateQueries({ queryKey: queryKeys.invoiceMeta(userId) });
        invalidateDashboardQueries(userId);
    }, [queryClient, userId]);

    const invalidateListCaches = useCallback(() => {
        invalidateInvoiceListQueries(userId);
    }, [userId]);

    const refreshInvoices = useCallback(async () => {
        const [invPayload] = await Promise.all([
            apiFetch(`/invoices?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`),
            userId
                ? queryClient.invalidateQueries({ queryKey: queryKeys.invoiceUsage(userId) })
                : Promise.resolve(),
        ]);
        const { data } = unwrapListResponse(invPayload);
        setInvoices(data.map(mapInvoice));
        invoicesFetchedRef.current = true;
        invalidateListCaches();
        await refreshMeta();
    }, [refreshMeta, queryClient, userId, invalidateListCaches]);

    const fetchInvoices = useCallback(async ({ force = false, year, month, limit = PICKER_PAGE_SIZE } = {}) => {
        if (!shouldFetch && !isAuthenticated) return [];
        const forMonth = year != null && month != null;
        if (!forMonth && invoicesFetchedRef.current && !force) return invoicesRef.current;

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
    }, [shouldFetch, isAuthenticated]);

    const fetchDrafts = useCallback(async ({ force = false } = {}) => {
        if (!shouldFetch && !isAuthenticated) return [];
        if (draftsFetchedRef.current && !force) return draftsRef.current;

        setDraftsLoading(true);
        try {
            const payload = await apiFetch(
                `/invoices/drafts?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`
            );
            const { data, pagination } = unwrapListResponse(payload);
            const mapped = data.map(mapInvoice);
            setDrafts(mapped);
            draftsFetchedRef.current = true;
            await refreshMeta();
            return mapped;
        } catch {
            setDrafts([]);
            return [];
        } finally {
            setDraftsLoading(false);
        }
    }, [shouldFetch, isAuthenticated, refreshMeta]);

    const fetchProducts = useCallback(async ({ force = false } = {}) => {
        if (!shouldFetch && !isAuthenticated) return [];
        if (productsFetchedRef.current && !force) return productsRef.current;

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
    }, [shouldFetch, isAuthenticated]);

    const fetchUserData = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                setInvoices([]);
                setDrafts([]);
                setClients([]);
                setProducts([]);
                productsFetchedRef.current = false;
                invoicesFetchedRef.current = false;
                draftsFetchedRef.current = false;
            }
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const cliPayload = await apiFetch(`/clients?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`);
            const { data } = unwrapListResponse(cliPayload);
            setClients(data.map(mapClient));
        } catch {
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, [shouldFetch, authLoading, isAuthenticated]);

    useEffect(() => {
        fetchUserData();
        const onLogin = () => fetchUserData();
        const onLogout = () => {
            setInvoices([]);
            setDrafts([]);
            setClients([]);
            setProducts([]);
            setLoading(false);
            setInvoicesLoading(false);
            setDraftsLoading(false);
            setProductsLoading(false);
            productsFetchedRef.current = false;
            invoicesFetchedRef.current = false;
            draftsFetchedRef.current = false;
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchUserData]);

    const resetAll = useCallback(() => {
        setInvoices([]);
        setDrafts([]);
        setClients([]);
        setProducts([]);
        productsFetchedRef.current = false;
        invoicesFetchedRef.current = false;
        draftsFetchedRef.current = false;
    }, []);

    const addInvoice = useCallback(async (invoice, options = {}) => {
        const newInvoice = await apiFetch('/invoices', {
            method: 'POST',
            body: JSON.stringify(invoice),
        });
        const mapped = mapInvoice(newInvoice);
        if (!isDraft(mapped)) {
            captureEvent(ANALYTICS_EVENTS.INVOICE_CREATED);
        }
        if (options.skipRefresh) {
            if (isDraft(mapped)) {
                setDrafts((prev) => [mapped, ...prev.filter((inv) => inv.id !== mapped.id)]);
            } else {
                setInvoices((prev) => [mapped, ...prev.filter((inv) => inv.id !== mapped.id)]);
                invoicesFetchedRef.current = true;
            }
            await refreshMeta();
            invalidateListCaches();
            return mapped;
        }
        await refreshInvoices();
        draftsFetchedRef.current = false;
        return mapped;
    }, [refreshInvoices, refreshMeta, invalidateListCaches]);

    const updateInvoice = useCallback(async (id, updatedInvoice) => {
        const updated = await apiFetch(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedInvoice),
        });
        const mapped = mapInvoice(updated);
        const stillDraft = isDraft(mapped);

        if (stillDraft) {
            setDrafts((prev) => {
                const exists = prev.some((inv) => inv.id === id);
                if (!exists) return [mapped, ...prev];
                return prev.map((inv) => (inv.id === id ? mapped : inv));
            });
            setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        } else {
            // Finalized (or non-draft) — leave the drafts list entirely.
            setDrafts((prev) => prev.filter((inv) => inv.id !== id));
            setInvoices((prev) => {
                const exists = prev.some((inv) => inv.id === id);
                if (!exists) return [mapped, ...prev];
                return prev.map((inv) => (inv.id === id ? mapped : inv));
            });
        }

        await refreshMeta();
        invalidateListCaches();
        return mapped;
    }, [refreshMeta, invalidateListCaches]);

    const recordInvoicePayment = useCallback(async (id, payment) => {
        const updated = await apiFetch(`/invoices/${id}/payments`, {
            method: 'POST',
            body: JSON.stringify({
                amount: payment.amount,
                method: payment.paymentMethod || payment.method,
                date: payment.datePaid || payment.date,
                note: payment.note || '',
            }),
        });
        const mapped = mapInvoice(updated);
        setDrafts((prev) => prev.filter((inv) => inv.id !== id));
        setInvoices((prev) => {
            const exists = prev.some((inv) => inv.id === id);
            if (!exists) return [mapped, ...prev];
            return prev.map((inv) => (inv.id === id ? mapped : inv));
        });
        await refreshMeta();
        invalidateListCaches();
        return mapped;
    }, [refreshMeta, invalidateListCaches]);

    const deleteInvoice = useCallback(async (id) => {
        const wasDraft = drafts.some((inv) => inv.id === id) || invoices.some((inv) => inv.id === id && isDraft(inv));
        await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        setDrafts((prev) => prev.filter((inv) => inv.id !== id));
        invalidateListCaches();
        if (wasDraft) {
            await refreshMeta();
        }
    }, [drafts, invoices, refreshMeta, invalidateListCaches]);

    const sendInvoiceEmailToClient = useCallback(async (id) =>
        apiFetch(`/invoices/${id}/send-email`, { method: 'POST' }), []);

    const sendPaymentReminderToClient = useCallback(async (id) =>
        apiFetch(`/invoices/${id}/send-reminder`, { method: 'POST' }), []);

    const markInvoiceReminderSent = useCallback((id, lastPaymentReminderAt) => {
        const sentAt = lastPaymentReminderAt || new Date().toISOString();
        const patch = (prev) =>
            prev.map((inv) =>
                String(inv.id) === String(id) || String(inv._id) === String(id)
                    ? { ...inv, lastPaymentReminderAt: sentAt }
                    : inv
            );
        setInvoices(patch);
        setDrafts(patch);
        return sentAt;
    }, []);

    const sendReceiptEmailToClient = useCallback(async (id) =>
        apiFetch(`/invoices/${id}/send-receipt`, { method: 'POST' }), []);

    const invalidateProductCaches = useCallback(() => {
        invalidateProductListQueries(userId);
    }, [userId]);

    const invalidateClientCaches = useCallback(() => {
        invalidateClientListQueries(userId);
    }, [userId]);

    const addClient = useCallback(async (client) => {
        const newClient = await apiFetch('/clients', {
            method: 'POST',
            body: JSON.stringify(client),
        });
        const mapped = mapClient(newClient);
        setClients((prev) => [...prev, mapped]);
        invalidateClientCaches();
        return mapped;
    }, [invalidateClientCaches]);

    const updateClient = useCallback(async (id, updatedClient) => {
        const updated = await apiFetch(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedClient),
        });
        const mapped = mapClient(updated);
        setClients((prev) => prev.map((client) => (String(client.id) === String(id) ? mapped : client)));
        invalidateClientCaches();
        return mapped;
    }, [invalidateClientCaches]);

    const deleteClient = useCallback(async (id) => {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        setClients((prev) => prev.filter((client) => client.id !== id));
        invalidateClientCaches();
    }, [invalidateClientCaches]);

    const addProduct = useCallback(async (product) => {
        const newProduct = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        });
        const mapped = mapProduct(newProduct);
        setProducts((prev) => [...prev, mapped]);
        productsFetchedRef.current = true;
        invalidateProductCaches();
        return mapped;
    }, [invalidateProductCaches]);

    const updateProduct = useCallback(async (id, updatedProduct) => {
        const updated = await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedProduct),
        });
        const mapped = mapProduct(updated);
        setProducts((prev) => prev.map((product) => (product.id === id ? mapped : product)));
        invalidateProductCaches();
        return mapped;
    }, [invalidateProductCaches]);

    const deleteProduct = useCallback(async (id) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
        setProducts((prev) => prev.filter((product) => product.id !== id));
        invalidateProductCaches();
    }, [invalidateProductCaches]);

    const adjustProductStock = useCallback(async (id, delta) => {
        const updated = await apiFetch(`/products/${id}/adjust-stock`, {
            method: 'POST',
            body: JSON.stringify({ delta }),
        });
        const mapped = mapProduct(updated);
        setProducts((prev) => prev.map((product) => (product.id === id ? mapped : product)));
        invalidateProductCaches();
        return mapped;
    }, [invalidateProductCaches]);

    const draftInvoices = useMemo(() => {
        const source =
            drafts.length > 0 ? drafts : invoices.filter(isDraft);
        return [...source]
            .filter(isDraft)
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            );
    }, [drafts, invoices]);

    const upsertInvoice = useCallback((record) => {
        if (!record) return;
        const mapped = mapInvoice(record);
        if (isDraft(mapped)) {
            setDrafts((prev) => {
                const exists = prev.some((inv) => inv.id === mapped.id);
                if (!exists) return [mapped, ...prev];
                return prev.map((inv) => (inv.id === mapped.id ? mapped : inv));
            });
            setInvoices((prev) => prev.filter((inv) => inv.id !== mapped.id));
            return;
        }

        setDrafts((prev) => prev.filter((inv) => inv.id !== mapped.id));
        setInvoices((prev) => {
            const exists = prev.some((inv) => inv.id === mapped.id);
            if (!exists) return [mapped, ...prev];
            return prev.map((inv) => (inv.id === mapped.id ? mapped : inv));
        });
    }, []);

    const value = useMemo(() => ({
        invoices,
        draftInvoices,
        draftCount,
        clients,
        products,
        invoiceUsage,
        addInvoice,
        updateInvoice,
        recordInvoicePayment,
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
        adjustProductStock,
        fetchUserData,
        fetchInvoices,
        fetchDrafts,
        fetchProducts,
        refreshInvoices,
        refreshMeta,
        upsertInvoice,
        resetAll,
        loading,
        invoicesLoading,
        draftsLoading,
        productsLoading,
    }), [
        invoices,
        draftInvoices,
        draftCount,
        clients,
        products,
        invoiceUsage,
        addInvoice,
        updateInvoice,
        recordInvoicePayment,
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
        adjustProductStock,
        fetchUserData,
        fetchInvoices,
        fetchDrafts,
        fetchProducts,
        refreshInvoices,
        refreshMeta,
        upsertInvoice,
        resetAll,
        loading,
        invoicesLoading,
        draftsLoading,
        productsLoading,
    ]);

    return (
        <InvoiceContext.Provider value={value}>
            {children}
        </InvoiceContext.Provider>
    );
};
