import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from './AuthContext';
import { useInvoice } from './InvoiceContext';
import { shouldPrefetchUserData } from '../utils/authHint';
import { buildListQuery, PICKER_PAGE_SIZE, unwrapListResponse } from '../utils/pagination';
import { invalidateReceiptListQueries } from '../lib/queryClient';
import { ANALYTICS_EVENTS } from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';

const ReceiptContext = createContext();

export const useReceipt = () => {
    const context = useContext(ReceiptContext);
    if (!context) {
        throw new Error('useReceipt must be used within ReceiptProvider');
    }
    return context;
};

const mapReceipt = (r) => ({ ...r, id: r._id || r.id });

export const ReceiptProvider = ({ children }) => {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [receiptsLoading, setReceiptsLoading] = useState(false);
    const receiptsFetchedRef = useRef(false);
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const userId = user?.id;
    const { refreshMeta } = useInvoice();
    const shouldFetch = shouldPrefetchUserData(isAuthenticated);

    const invalidateListCaches = useCallback(() => {
        invalidateReceiptListQueries(userId);
    }, [userId]);

    const refreshReceipts = useCallback(async () => {
        const payload = await apiFetch(
            `/receipts?${buildListQuery({ page: 1, limit: PICKER_PAGE_SIZE })}`
        );
        const { data } = unwrapListResponse(payload);
        setReceipts(data.map(mapReceipt));
        receiptsFetchedRef.current = true;
        invalidateListCaches();
    }, [invalidateListCaches]);

    const fetchReceipts = useCallback(
        async ({ force = false, year, month, limit = PICKER_PAGE_SIZE } = {}) => {
            if (!shouldFetch && !isAuthenticated) return [];
            const forMonth = year != null && month != null;
            if (!forMonth && receiptsFetchedRef.current && !force) return receipts;

            setReceiptsLoading(true);
            try {
                const payload = await apiFetch(
                    `/receipts?${buildListQuery({
                        page: 1,
                        limit,
                        year: forMonth ? year : undefined,
                        month: forMonth ? month : undefined,
                    })}`
                );
                const { data } = unwrapListResponse(payload);
                const mapped = data.map(mapReceipt);
                if (!forMonth) {
                    setReceipts(mapped);
                    receiptsFetchedRef.current = true;
                }
                return mapped;
            } catch {
                if (!forMonth) setReceipts([]);
                return [];
            } finally {
                setReceiptsLoading(false);
            }
        },
        [shouldFetch, isAuthenticated, receipts]
    );

    useEffect(() => {
        if (!shouldFetch) {
            if (!authLoading && !isAuthenticated) {
                setReceipts([]);
                receiptsFetchedRef.current = false;
            }
            setLoading(false);
        }
    }, [shouldFetch, authLoading, isAuthenticated]);

    useEffect(() => {
        const onLogout = () => {
            setReceipts([]);
            setLoading(false);
            setReceiptsLoading(false);
            receiptsFetchedRef.current = false;
        };
        window.addEventListener('app-logout', onLogout);
        return () => window.removeEventListener('app-logout', onLogout);
    }, []);

    const addReceipt = async (receipt, options = {}) => {
        const created = await apiFetch('/receipts', {
            method: 'POST',
            body: JSON.stringify(receipt),
        });
        const mapped = mapReceipt(created);
        captureEvent(ANALYTICS_EVENTS.RECEIPT_CREATED);
        if (options.skipRefresh) {
            setReceipts((prev) => [mapped, ...prev.filter((r) => r.id !== mapped.id)]);
            receiptsFetchedRef.current = true;
            invalidateListCaches();
            if (refreshMeta) await refreshMeta();
            return mapped;
        }
        await refreshReceipts();
        if (refreshMeta) await refreshMeta();
        return mapped;
    };

    const updateReceipt = async (id, updatedReceipt) => {
        const updated = await apiFetch(`/receipts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedReceipt),
        });
        const mapped = mapReceipt(updated);
        setReceipts((prev) => {
            const exists = prev.some((r) => r.id === id);
            if (!exists) return [mapped, ...prev];
            return prev.map((r) => (r.id === id ? mapped : r));
        });
        if (refreshMeta) await refreshMeta();
        invalidateListCaches();
        return mapped;
    };

    const deleteReceipt = async (id) => {
        await apiFetch(`/receipts/${id}`, { method: 'DELETE' });
        setReceipts((prev) => prev.filter((r) => r.id !== id));
        invalidateListCaches();
        if (refreshMeta) await refreshMeta();
    };

    const sendReceiptEmailToClient = async (id) =>
        apiFetch(`/receipts/${id}/send-receipt`, { method: 'POST' });

    const recordReceiptPayment = useCallback(async (id, payment) => {
        const updated = await apiFetch(`/receipts/${id}/payments`, {
            method: 'POST',
            body: JSON.stringify({
                amount: payment.amount,
                method: payment.paymentMethod || payment.method,
                date: payment.datePaid || payment.date,
                note: payment.note || '',
            }),
        });
        const mapped = mapReceipt(updated);
        setReceipts((prev) => {
            const exists = prev.some((r) => r.id === id);
            if (!exists) return [mapped, ...prev];
            return prev.map((r) => (r.id === id ? mapped : r));
        });
        invalidateListCaches();
        if (refreshMeta) await refreshMeta();
        return mapped;
    }, [invalidateListCaches, refreshMeta]);

    const upsertReceipt = useCallback((record) => {
        if (!record) return;
        const { client: _client, ...rest } = record;
        const mapped = mapReceipt(rest);
        setReceipts((prev) => {
            const exists = prev.some((r) => String(r.id) === String(mapped.id));
            if (!exists) return [mapped, ...prev];
            return prev.map((r) => (String(r.id) === String(mapped.id) ? mapped : r));
        });
    }, []);

    const value = {
        receipts,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        sendReceiptEmailToClient,
        recordReceiptPayment,
        fetchReceipts,
        refreshReceipts,
        upsertReceipt,
        loading,
        receiptsLoading,
    };

    return <ReceiptContext.Provider value={value}>{children}</ReceiptContext.Provider>;
};
