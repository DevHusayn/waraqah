import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { useInvoice } from './InvoiceContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildListQuery, PICKER_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';

const QuotationContext = createContext();

export const useQuotation = () => {
    const context = useContext(QuotationContext);
    if (!context) {
        throw new Error('useQuotation must be used within QuotationProvider');
    }
    return context;
};

const mapQuotation = (q) => ({ ...q, id: q._id || q.id });

export const QuotationProvider = ({ children }) => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [quotationsLoading, setQuotationsLoading] = useState(false);
    const quotationsFetchedRef = useRef(false);
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { refreshMeta } = useInvoice();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const refreshQuotations = useCallback(async () => {
        const payload = await apiFetch(
            `/quotations?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`
        );
        const { data } = unwrapListResponse(payload);
        setQuotations(data.map(mapQuotation));
        quotationsFetchedRef.current = true;
    }, []);

    const fetchQuotations = useCallback(
        async ({ force = false, limit = PICKER_PAGE_SIZE } = {}) => {
            if (!shouldFetch && !isAuthenticated) return [];
            if (quotationsFetchedRef.current && !force) return quotations;

            setQuotationsLoading(true);
            try {
                const payload = await apiFetch(
                    `/quotations?${buildListQuery({ page: 1, limit })}`
                );
                const { data } = unwrapListResponse(payload);
                const mapped = data.map(mapQuotation);
                setQuotations(mapped);
                quotationsFetchedRef.current = true;
                return mapped;
            } catch {
                setQuotations([]);
                return [];
            } finally {
                setQuotationsLoading(false);
            }
        },
        [shouldFetch, isAuthenticated, quotations]
    );

    const fetchUserData = useCallback(async () => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                setQuotations([]);
                quotationsFetchedRef.current = false;
            }
            setLoading(false);
            return;
        }
        setLoading(false);
    }, [shouldFetch, authLoading, isAuthenticated]);

    useEffect(() => {
        fetchUserData();
        const onLogin = () => fetchUserData();
        const onLogout = () => {
            setQuotations([]);
            setLoading(false);
            setQuotationsLoading(false);
            quotationsFetchedRef.current = false;
        };
        window.addEventListener('app-login', onLogin);
        window.addEventListener('app-logout', onLogout);
        return () => {
            window.removeEventListener('app-login', onLogin);
            window.removeEventListener('app-logout', onLogout);
        };
    }, [fetchUserData]);

    const resetAll = () => {
        setQuotations([]);
        quotationsFetchedRef.current = false;
    };

    const addQuotation = async (quotation, options = {}) => {
        const created = await apiFetch('/quotations', {
            method: 'POST',
            body: JSON.stringify(quotation),
        });
        const mapped = mapQuotation(created);
        if (options.skipRefresh) {
            setQuotations((prev) => [mapped, ...prev.filter((q) => q.id !== mapped.id)]);
            quotationsFetchedRef.current = true;
            if (refreshMeta) await refreshMeta();
            return mapped;
        }
        await refreshQuotations();
        if (refreshMeta) await refreshMeta();
        return mapped;
    };

    const updateQuotation = async (id, updatedQuotation) => {
        const updated = await apiFetch(`/quotations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedQuotation),
        });
        const mapped = mapQuotation(updated);
        setQuotations((prev) => {
            const exists = prev.some((q) => q.id === id);
            if (!exists) return [mapped, ...prev];
            return prev.map((q) => (q.id === id ? mapped : q));
        });
        if (refreshMeta) await refreshMeta();
        return mapped;
    };

    const deleteQuotation = async (id) => {
        await apiFetch(`/quotations/${id}`, { method: 'DELETE' });
        setQuotations((prev) => prev.filter((q) => q.id !== id));
        if (refreshMeta) await refreshMeta();
    };

    const sendQuotationEmailToClient = async (id) =>
        apiFetch(`/quotations/${id}/send-email`, { method: 'POST' });

    const convertQuotation = async (id) => {
        const result = await apiFetch(`/quotations/${id}/convert`, { method: 'POST' });
        const quotation = mapQuotation(result.quotation);
        const invoice = { ...result.invoice, id: result.invoice._id || result.invoice.id };
        setQuotations((prev) => prev.map((q) => (q.id === id ? quotation : q)));
        return { quotation, invoice };
    };

    const upsertQuotation = useCallback((record) => {
        if (!record) return;
        const mapped = mapQuotation(record);
        setQuotations((prev) => {
            const exists = prev.some((q) => q.id === mapped.id);
            if (!exists) return [mapped, ...prev];
            return prev.map((q) => (q.id === mapped.id ? mapped : q));
        });
    }, []);

    const value = {
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        sendQuotationEmailToClient,
        convertQuotation,
        fetchQuotations,
        refreshQuotations,
        upsertQuotation,
        resetAll,
        loading,
        quotationsLoading,
    };

    return (
        <QuotationContext.Provider value={value}>
            {children}
        </QuotationContext.Provider>
    );
};
