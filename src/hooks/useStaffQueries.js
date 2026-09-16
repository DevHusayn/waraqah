import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys, STALE_TIMES } from '../lib/queryKeys';

export const mapStaff = (entry) => ({ ...entry, id: entry._id || entry.id });

export function useStaffQuery({ enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    return useQuery({
        queryKey: queryKeys.staff(userId),
        queryFn: async () => {
            const payload = await apiFetch('/staff');
            const rows = Array.isArray(payload) ? payload : payload?.data || [];
            return rows.map(mapStaff);
        },
        enabled: enabled && isAuthenticated && Boolean(userId),
        staleTime: STALE_TIMES.lists,
    });
}

export function useStaffPayrollQuery(year, month, { enabled = true } = {}) {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;
    const ready = Number.isInteger(year) && Number.isInteger(month);

    return useQuery({
        queryKey: queryKeys.staffPayroll(userId, year, month),
        queryFn: () => apiFetch(`/staff/payroll?year=${year}&month=${month}`),
        enabled: enabled && isAuthenticated && Boolean(userId) && ready,
        staleTime: STALE_TIMES.lists,
    });
}
