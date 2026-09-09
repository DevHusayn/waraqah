import { useQuery } from '@tanstack/react-query';
import { uniqueVendorNames } from '@waraqah/shared';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

export function useExpenseVendorsQuery({ enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.expenseVendors(userId),
        queryFn: async () => {
            const payload = await apiFetch('/expenses/vendors');
            return uniqueVendorNames(Array.isArray(payload) ? payload : []);
        },
        enabled: enabled && isAuthenticated && Boolean(userId),
        staleTime: STALE_TIMES.lists,
    });
}
