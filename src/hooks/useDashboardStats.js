import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * Loads aggregated dashboard data without fetching the full invoice list.
 */
export function useDashboardStats() {
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!isAuthenticated) {
            setData(null);
            setLoading(false);
            return null;
        }

        setLoading(true);
        try {
            const dashboard = await apiFetch('/invoices/dashboard');
            setData(dashboard);
            return dashboard;
        } catch {
            setData(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, refresh };
}
